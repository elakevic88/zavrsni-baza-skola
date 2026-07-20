const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// -> povezivanje sve 3 baze
const originalDb = new Database(
    path.join(__dirname, '../databases/dbs/01_schema_original.db'),
    { readonly: true }
);
const normDb = new Database(
    path.join(__dirname, '../databases/dbs/02_schema_normalized.db'),
    { readonly: true }
);
const denormDb = new Database(
    path.join(__dirname, '../databases/dbs/03_schema_denormalized.db'),
    { readonly: true }
);

function ucitajSql(imeDatoteke) {
    const putanja = path.join(__dirname, '../queries', imeDatoteke);
    return fs.readFileSync(putanja, 'utf8')
        .replace(/^\uFEFF/, '')
        .replace(/\r/g, '')
        .trim();
}

// -> vrijeme ivršavanja
function izmjeriVrijeme(baza, sql, ponavljanja = 500) {
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

    vremena.sort((a, b) => a - b);

    const medijan = vremena.length % 2 === 0 ? (vremena[vremena.length / 2 - 1] + vremena[vremena.length / 2]) / 2 : vremena[Math.floor(vremena.length / 2)];
    const p5 = vremena[Math.floor(vremena.length * 0.05)];
    const p95 = vremena[Math.floor(vremena.length * 0.95)];
    const prosjek = vremena.reduce((a, b) => a + b, 0) / vremena.length;
    const varijanca = vremena.reduce((s, v) => s + Math.pow(v - prosjek, 2), 0) / vremena.length;
    const stdDev = Math.sqrt(varijanca);
    const rez = Math.floor(vremena.length * 0.1);
    const obrezano = vremena.slice(rez, vremena.length - rez);
    const trimmedProsjek = obrezano.reduce((a, b) => a + b, 0) / obrezano.length;

    return {
        prosjek: trimmedProsjek,
        medijan: medijan,
        p5,
        p95,
        stdDev,
        min: vremena[0],
        max: vremena[vremena.length - 1]
    };
}

// -> broj upita po sekundi
function izmjeriThroughput(baza, sql, trajanjeSek = 2) {
    const stmt = baza.prepare(sql);
    let brojac = 0;
    const pocetak = performance.now();
    let proteklo;

    do {
        stmt.all();
        brojac++;
        proteklo = performance.now() - pocetak;
    } while (proteklo < trajanjeSek * 1000);

    const stvarnoTrajanjeSek = proteklo / 1000;
    return Math.round(brojac / stvarnoTrajanjeSek);
}

// -> veličina baze na disku u megabajtima
function velicina(imeDatoteke) {
    const putanja = path.join(__dirname, '../databases/dbs', imeDatoteke);
    return (fs.statSync(putanja).size / (1024 * 1024)).toFixed(2);
}

// -> query plan
function analizaPlana(baza, sql) {
    const plan = baza.prepare(`EXPLAIN QUERY PLAN ${sql}`).all();
    const skeniranja = plan.filter(r => r.detail.includes('SCAN')).length;
    const pretrazivanja = plan.filter(r => r.detail.includes('SEARCH')).length;
    const detalji = plan.map(r => r.detail).join(' | ');
    return { skeniranja, pretrazivanja, detalji };
}

// -> hop
function prebrojHopove(sql) {
    const tekst = sql.toUpperCase();
    if (tekst.includes("FROM NASTAVNIK_INFO") ||
        tekst.includes("FROM UCENIK_PREGLED")) {
        return {
            hopovi: 0,
            brojTablica: 1
        };
    }
    const brojJoinova = (tekst.match(/\bJOIN\b/g) || []).length;
    return {
        hopovi: brojJoinova,
        brojTablica: brojJoinova + 1
    };
}

// -> ispisi
function ispisi(naziv, rezultati) {
    console.log(`\n ${naziv}`);
    console.log(`Prosjek: ${rezultati.vrijeme.prosjek.toFixed(3)} ms`);
    console.log(`Medijan: ${rezultati.vrijeme.medijan.toFixed(3)} ms`);
    console.log(`5. percentil: ${rezultati.vrijeme.p5.toFixed(3)} ms`);
    console.log(`95. percentil: ${rezultati.vrijeme.p95.toFixed(3)} ms`);
    console.log(`Std.dev: ${rezultati.vrijeme.stdDev.toFixed(3)} ms`);
    console.log(`Min: ${rezultati.vrijeme.min.toFixed(3)} ms`);
    console.log(`Max: ${rezultati.vrijeme.max.toFixed(3)} ms`);
    console.log(`Throughput: ${rezultati.throughput} upita/s`);
    console.log(`HOP (broj skokova): ${rezultati.hop.hopovi} (uključuje ${rezultati.hop.brojTablica} tablica)`);
    console.log(`SCAN: ${rezultati.plan.skeniranja}`);
    console.log(`SEARCH: ${rezultati.plan.pretrazivanja}`);
    console.log(`Plan: ${rezultati.plan.detalji}`);
}

// -> upiti - originalna baza
const upitiOriginalna = [
    {
        naziv: 'Opterećenje nastavnika',
        sql: ucitajSql('01_select_opterecenje_nastavnika_O.sql')
    },
    {
        naziv: 'Rang škola po broju učenika',
        sql: ucitajSql('01_select_rang_skola_O.sql')
    },
    {
        naziv: 'Optimizirani upit nastavnika',
        sql: ucitajSql('01_select_optimiziran_nastavnik_O.sql')
    },
    {
        naziv: 'Podaci učenika s lokacijom',
        sql: ucitajSql('01_select_optimiziran_ucenik_O.sql')
    }
];

// -> upiti - normalizirana baza
const upitiNormalizirana = [
    {
        naziv: 'Opterećenje nastavnika',
        sql: ucitajSql('02_select_opterecenje_nastavnika_N.sql')
    },
    {
        naziv: 'Rang škola po broju učenika',
        sql: ucitajSql('02_select_rang_skola_N.sql')
    },
    {
        naziv: 'Optimizirani upit nastavnika',
        sql: ucitajSql('02_select_optimiziran_nastavnik_N.sql')
    },
    {
        naziv: 'Podaci učenika s lokacijom',
        sql: ucitajSql('02_select_optimiziran_ucenik_N.sql')
    }
];

// -> upiti - denormalozirana 
const upitiDenormalizirana = [
    {
        naziv: 'Opterećenje nastavnika',
        sql: ucitajSql('03_select_opterecenje_nastavnika_D.sql')
    },
    {
        naziv: 'Rang škola po broju učenika',
        sql: ucitajSql('03_select_ucenik_pregled_D.sql')
    },
    {
        naziv: 'Optimizirani upit nastavnika',
        sql: ucitajSql('03_select_optimiziran_nastavnik_info_D.sql')
    },
    {
        naziv: 'Podaci učenika s lokacijom',
        sql: ucitajSql('03_select_ucenik_podaci_D.sql')
    }
];

const spremljeniRezultati = {};

// -> veličine baza
console.log(`Originalna: ${velicina('01_schema_original.db')} MB`);
console.log(`Normalizirana: ${velicina('02_schema_normalized.db')} MB`);
console.log(`Denormalizirana: ${velicina('03_schema_denormalized.db')} MB`);

// -> originalna baza
console.log('ORIGINALNA BAZA (nenormalizirana)');
for (const upit of upitiOriginalna) {
    const rezultati = {
        vrijeme: izmjeriVrijeme(originalDb, upit.sql),
        throughput: izmjeriThroughput(originalDb, upit.sql),
        hop: prebrojHopove(upit.sql),
        plan: analizaPlana(originalDb, upit.sql)
    };

    if (!spremljeniRezultati.Originalna)
        spremljeniRezultati.Originalna = {};
    spremljeniRezultati.Originalna[upit.naziv] = rezultati;
    ispisi(upit.naziv, rezultati);
}

// -> normalizirana baza
console.log('NORMALIZIRANA BAZA (3NF)');
for (const upit of upitiNormalizirana) {
    const rezultati = {
        vrijeme: izmjeriVrijeme(normDb, upit.sql),
        throughput: izmjeriThroughput(normDb, upit.sql),
        hop: prebrojHopove(upit.sql),
        plan: analizaPlana(normDb, upit.sql)
    };
    if (!spremljeniRezultati.Normalizirana)
        spremljeniRezultati.Normalizirana = {};
    spremljeniRezultati.Normalizirana[upit.naziv] = rezultati;
    ispisi(upit.naziv, rezultati);
}

// -> denormalizirana baza
console.log('DENORMALIZIRANA BAZA');
for (const upit of upitiDenormalizirana) {
    const rezultati = {
        vrijeme: izmjeriVrijeme(denormDb, upit.sql),
        throughput: izmjeriThroughput(denormDb, upit.sql),
        hop: prebrojHopove(upit.sql),
        plan: analizaPlana(denormDb, upit.sql)
    };
    if (!spremljeniRezultati.Denormalizirana)
        spremljeniRezultati.Denormalizirana = {};
    spremljeniRezultati.Denormalizirana[upit.naziv] = rezultati;
    ispisi(upit.naziv, rezultati);
}

// -> usporedba tablica
const usporedba = [
    {
        naziv: 'Opterećenje nastavnika',
        original: upitiOriginalna[0].sql,
        norm: upitiNormalizirana[0].sql,
        denorm: upitiDenormalizirana[0].sql
    },
    {
        naziv: 'Rang škola po broju učenika',
        original: upitiOriginalna[1].sql,
        norm: upitiNormalizirana[1].sql,
        denorm: upitiDenormalizirana[1].sql
    },
    {
        naziv: 'Optimizirani upit nastavnika',
        original: upitiOriginalna[2].sql,
        norm: upitiNormalizirana[2].sql,
        denorm: upitiDenormalizirana[2].sql
    },
    {
        naziv: 'Podaci učenika s lokacijom',
        original: upitiOriginalna[3].sql,
        norm: upitiNormalizirana[3].sql,
        denorm: upitiDenormalizirana[3].sql
    }
];

for (const u of usporedba) {
    console.log(`\n${u.naziv}`);
    console.log(`${'Baza'.padEnd(20)} ${'Prosjek (ms)'.padEnd(15)} ${'Throughput'.padEnd(15)} ${'HOP'.padEnd(6)}`);

    const redovi = [
        { naziv: 'Originalna' },
        { naziv: 'Normalizirana' },
        { naziv: 'Denormalizirana' }
    ];

    for (const red of redovi) {
        const vr = spremljeniRezultati[red.naziv][u.naziv].vrijeme;
        const th = spremljeniRezultati[red.naziv][u.naziv].throughput;
        const hp = spremljeniRezultati[red.naziv][u.naziv].hop;

        console.log(`${red.naziv.padEnd(20)} ${vr.prosjek.toFixed(3).padEnd(15)} ${th.toString().padEnd(15)} ${hp.hopovi}`);
    }
}

// -> spremamo u csv dadoteku
const csvRedovi = ['Baza,Upit,ProsjekMs,MedijanMs,MinMs,MaxMs,StdDevMs,P5Ms,P95Ms,ThroughputQs,Hopovi,BrojTablica,Skeniranja,Pretrazivanja'];
function dodajUCsv(nazivBaze, upiti) {
    for (const upit of upiti) {
        const rez = spremljeniRezultati[nazivBaze][upit.naziv];
        const vr = rez.vrijeme;
        const th = rez.throughput;
        const hp = rez.hop;
        const pl = rez.plan;
        csvRedovi.push(`${nazivBaze},"${upit.naziv}",${vr.prosjek.toFixed(3)},${vr.medijan.toFixed(3)},${vr.min.toFixed(3)},${vr.max.toFixed(3)},${vr.stdDev.toFixed(3)},${vr.p5.toFixed(3)},${vr.p95.toFixed(3)},${th},${hp.hopovi},${hp.brojTablica},${pl.skeniranja},${pl.pretrazivanja}`);
    }
}

dodajUCsv('Originalna', upitiOriginalna);
dodajUCsv('Normalizirana', upitiNormalizirana);
dodajUCsv('Denormalizirana', upitiDenormalizirana);

fs.writeFileSync(
    path.join(__dirname, '../rezultati.csv'),
    csvRedovi.join('\n'),
    'utf8'
);
console.log('\nSpremljeno u rezultati.csv');

originalDb.close();
normDb.close();
denormDb.close();