const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');
const { procitajCsv } = require('./utils/csvLoader');

const { insertOriginalna } = require('../queries/01_O_insert');
const { insertNormalizirana } = require('../queries/02_N_insert');
const { insertDenormalizirana } = require('../queries/03_D_insert');

const upiti_ponavljanja = 15;
const select_ponavljanja = 500;

const shemaDir = path.join(__dirname, '../databases/create_queries');
const queriesDir = path.join(__dirname, '../queries');
const tmpDir = path.join(__dirname, '../databases/tmp');
fs.mkdirSync(tmpDir, { recursive: true });

const podaci = procitajCsv('srednja_skola.csv');

const modeli = [
    {
        naziv: 'Originalna',
        shemaSql: '01_schema_original.sql',
        napuni: insertOriginalna,
        deleteSql: '01_O_delete.sql',
        updateSql: '01_O_update.sql',
        selectSql: '01_O_select.sql'
    },
    {
        naziv: 'Normalizirana',
        shemaSql: '02_schema_normalized.sql',
        napuni: insertNormalizirana,
        deleteSql: '02_N_delete.sql',
        updateSql: '02_N_update.sql',
        selectSql: '02_N_select.sql'
    },
    {
        naziv: 'Denormalizirana',
        shemaSql: '03_schema_denormalized.sql',
        napuni: insertDenormalizirana,
        deleteSql: '03_D_delete.sql',
        updateSql: '03_D_update.sql',
        selectSql: '03_D_select.sql'
    }
];

function ucitajUpit(imeDatoteke) {
    const putanja = path.join(queriesDir, imeDatoteke);
    return fs.readFileSync(putanja, 'utf8')
        .replace(/^\uFEFF/, '')
        .replace(/\r/g, '')
        .trim();
}

function statistika(vremena) {
    vremena.sort((a, b) => a - b);
    const medijan = vremena.length % 2 === 0 ? (vremena[vremena.length / 2 - 1] + vremena[vremena.length / 2]) / 2 : vremena[Math.floor(vremena.length / 2)];
    const p5 = vremena[Math.floor(vremena.length * 0.05)];
    const p95 = vremena[Math.floor(vremena.length * 0.95)];
    const prosjek = vremena.reduce((a, b) => a + b, 0) / vremena.length;
    const varijanca = vremena.reduce((s, v) => s + Math.pow(v - prosjek, 2), 0) / vremena.length;
    const stdDev = Math.sqrt(varijanca);

    return {
        prosjek,
        medijan,
        p5,
        p95,
        stdDev,
        min: vremena[0],
        max: vremena[vremena.length - 1]
    };
}

function kreirajPraznuBazu(shemaSqlDatoteka, oznaka) {
    const putanja = path.join(tmpDir, `prazna_${oznaka}.db`);
    if (fs.existsSync(putanja)) fs.unlinkSync(putanja);

    const sql = fs.readFileSync(path.join(shemaDir, shemaSqlDatoteka), 'utf8');
    const baza = new Database(putanja);
    baza.pragma('foreign_keys = ON');
    baza.exec(sql);
    baza.close();

    return putanja;
}

function izmjeriInsert(model, ponavljanja) {
    const vremena = [];

    for (let i = 0; i < ponavljanja; i++) {
        const praznaBaza = kreirajPraznuBazu(model.shemaSql, `${model.naziv}_insert_${i}`);
        const baza = new Database(praznaBaza);
        baza.pragma('foreign_keys = ON');

        const pocetak = performance.now();
        model.napuni(baza, podaci);
        vremena.push(performance.now() - pocetak);

        baza.close();
        fs.unlinkSync(praznaBaza);
    }

    return statistika(vremena);
}

function kreirajPocetnuBazu(model) {
    const putanja = path.join(tmpDir, `pocetna_${model.naziv}.db`);
    if (fs.existsSync(putanja)) fs.unlinkSync(putanja);

    const sql = fs.readFileSync(path.join(shemaDir, model.shemaSql), 'utf8');
    const baza = new Database(putanja);
    baza.pragma('foreign_keys = ON');
    baza.exec(sql);
    model.napuni(baza, podaci);
    baza.close();

    return putanja;
}

function izmjeriDeleteUpdate(pocetnaPutanja, sqlDatoteka, ponavljanja, oznaka) {
    const sql = ucitajUpit(sqlDatoteka);
    const vremena = [];

    for (let i = 0; i < ponavljanja; i++) {
        const privremenaPutanja = path.join(tmpDir, `privremena_${oznaka}_${i}.db`);
        fs.copyFileSync(pocetnaPutanja, privremenaPutanja);

        const baza = new Database(privremenaPutanja);
        baza.pragma('foreign_keys = ON');

        const pocetak = performance.now();
        baza.exec(sql);
        vremena.push(performance.now() - pocetak);

        baza.close();
        fs.unlinkSync(privremenaPutanja);
    }

    return statistika(vremena);
}

function izmjeriSelect(pocetnaPutanja, sqlDatoteka, ponavljanja) {
    const sql = ucitajUpit(sqlDatoteka);
    const baza = new Database(pocetnaPutanja, { readonly: true });
    const stmt = baza.prepare(sql);
    const vremena = [];

    for (let i = 0; i < 10; i++) {
        try { stmt.all(); } catch (e) { }
    }

    for (let i = 0; i < ponavljanja; i++) {
        const pocetak = performance.now();
        stmt.all();
        vremena.push(performance.now() - pocetak);
    }

    let brojac = 0;
    const pocetakThroughput = performance.now();
    let proteklo;
    do {
        stmt.all();
        brojac++;
        proteklo = performance.now() - pocetakThroughput;
    } while (proteklo < 2000);
    const throughput = Math.round(brojac / (proteklo / 1000));

    const plan = baza.prepare(`EXPLAIN QUERY PLAN ${sql}`).all();
    const skeniranja = plan.filter(r => r.detail.includes('SCAN')).length;
    const pretrazivanja = plan.filter(r => r.detail.includes('SEARCH')).length;
    const detalji = plan.map(r => r.detail).join(' | ');

    baza.close();

    return {
        vrijeme: statistika(vremena),
        throughput,
        plan: { skeniranja, pretrazivanja, detalji }
    };
}

function ispisi(naziv, operacija, rez) {
    console.log(`\n[${operacija}] ${naziv}`);
    console.log(`Prosjek: ${rez.prosjek.toFixed(3)} ms`);
    console.log(`Medijan: ${rez.medijan.toFixed(3)} ms`);
    console.log(`5. percentil: ${rez.p5.toFixed(3)} ms`);
    console.log(`95. percentil: ${rez.p95.toFixed(3)} ms`);
    console.log(`Std.dev: ${rez.stdDev.toFixed(3)} ms`);
    console.log(`Min: ${rez.min.toFixed(3)} ms`);
    console.log(`Max: ${rez.max.toFixed(3)} ms`);
}

const rezultati = {};
const csvRedovi = ['Model,Operacija,ProsjekMs,MedijanMs,MinMs,MaxMs,StdDevMs,P5Ms,P95Ms'];

for (const model of modeli) {
    rezultati[model.naziv] = {};

    const rezInsert = izmjeriInsert(model, upiti_ponavljanja);
    rezultati[model.naziv].Insert = rezInsert;
    ispisi(model.naziv, 'INSERT', rezInsert);
    csvRedovi.push(`${model.naziv},Insert,${rezInsert.prosjek.toFixed(3)},${rezInsert.medijan.toFixed(3)},${rezInsert.min.toFixed(3)},${rezInsert.max.toFixed(3)},${rezInsert.stdDev.toFixed(3)},${rezInsert.p5.toFixed(3)},${rezInsert.p95.toFixed(3)}`);

    const pocetnaPutanja = kreirajPocetnuBazu(model);
    const velicinaMB = (fs.statSync(pocetnaPutanja).size / (1024 * 1024)).toFixed(2);
    console.log(`Veličina napunjene baze: ${velicinaMB} MB`);

    const rezDelete = izmjeriDeleteUpdate(pocetnaPutanja, model.deleteSql, upiti_ponavljanja, `${model.naziv}_delete`);
    rezultati[model.naziv].Delete = rezDelete;
    ispisi(model.naziv, 'DELETE', rezDelete);
    csvRedovi.push(`${model.naziv},Delete,${rezDelete.prosjek.toFixed(3)},${rezDelete.medijan.toFixed(3)},${rezDelete.min.toFixed(3)},${rezDelete.max.toFixed(3)},${rezDelete.stdDev.toFixed(3)},${rezDelete.p5.toFixed(3)},${rezDelete.p95.toFixed(3)}`);

    const rezUpdate = izmjeriDeleteUpdate(pocetnaPutanja, model.updateSql, upiti_ponavljanja, `${model.naziv}_update`);
    rezultati[model.naziv].Update = rezUpdate;
    ispisi(model.naziv, 'UPDATE', rezUpdate);
    csvRedovi.push(`${model.naziv},Update,${rezUpdate.prosjek.toFixed(3)},${rezUpdate.medijan.toFixed(3)},${rezUpdate.min.toFixed(3)},${rezUpdate.max.toFixed(3)},${rezUpdate.stdDev.toFixed(3)},${rezUpdate.p5.toFixed(3)},${rezUpdate.p95.toFixed(3)}`);

    const rezSelect = izmjeriSelect(pocetnaPutanja, model.selectSql, select_ponavljanja);
    rezultati[model.naziv].Select = rezSelect.vrijeme;
    ispisi(model.naziv, 'SELECT', rezSelect.vrijeme);
    console.log(`Throughput: ${rezSelect.throughput} upita/s`);
    console.log(`SCAN: ${rezSelect.plan.skeniranja} | SEARCH: ${rezSelect.plan.pretrazivanja}`);
    console.log(`Plan: ${rezSelect.plan.detalji}`);
    csvRedovi.push(`${model.naziv},Select,${rezSelect.vrijeme.prosjek.toFixed(3)},${rezSelect.vrijeme.medijan.toFixed(3)},${rezSelect.vrijeme.min.toFixed(3)},${rezSelect.vrijeme.max.toFixed(3)},${rezSelect.vrijeme.stdDev.toFixed(3)},${rezSelect.vrijeme.p5.toFixed(3)},${rezSelect.vrijeme.p95.toFixed(3)}`);

    fs.unlinkSync(pocetnaPutanja);
}

const upiti = ['Insert', 'Delete', 'Update', 'Select'];
console.log(`${'Model'.padEnd(18)} ${upiti.map(o => o.padEnd(14)).join('')}`);
for (const model of modeli) {
    const redak = upiti.map(op => `${rezultati[model.naziv][op].prosjek.toFixed(3)} ms`.padEnd(14)).join('');
    console.log(`${model.naziv.padEnd(18)} ${redak}`);
}

fs.writeFileSync(
    path.join(__dirname, '../rezultati.csv'),
    csvRedovi.join('\n'),
    'utf8'
);
console.log('\nSpremljeno u rezultati.csv');

fs.rmSync(tmpDir, { recursive: true, force: true });