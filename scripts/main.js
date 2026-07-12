const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

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

// -> vrijeme ivršavanja
function izmjeriVrijeme(baza, sql, ponavljanja = 50) {
    const stmt = baza.prepare(sql);
    const vremena = [];
    for (let i = 0; i < ponavljanja; i++) {
        const pocetak = performance.now();
        stmt.all();
        vremena.push(performance.now() - pocetak);
    }
    const prosjek = vremena.reduce((a, b) => a + b, 0) / vremena.length;
    return {
        prosjek,
        min: Math.min(...vremena),
        max: Math.max(...vremena)
    };
}

// -> broj upita po sekundi
function izmjeriThroughput(baza, sql, trajanjeSek = 2) {
    const stmt = baza.prepare(sql);
    let brojac = 0;
    const pocetak = performance.now();
    while ((performance.now() - pocetak) < trajanjeSek * 1000) {
        stmt.all();
        brojac++;
    }
    return Math.round(brojac / trajanjeSek);
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
    const joinObrasc = /\bJOIN\b/gi;
    const pronadjeni = sql.match(joinObrasc);
    const brojJoinova = pronadjeni ? pronadjeni.length : 0;
    const brojTablica = brojJoinova + 1;
    const hopovi = brojJoinova;
    return { hopovi, brojTablica };
}

// -> ispisi
function ispisi(naziv, rezultati) {
    console.log(`\n${naziv}`);
    console.log(`Prosjek: ${rezultati.vrijeme.prosjek.toFixed(3)} ms`);
    console.log(`Min: ${rezultati.vrijeme.min.toFixed(3)} ms`);
    console.log(`Max: ${rezultati.vrijeme.max.toFixed(3)} ms`);
    console.log(`Throughput: ${rezultati.throughput} upita/s`);
    console.log(`HOP (skokova): ${rezultati.hop.hopovi} (spaja ${rezultati.hop.brojTablica} tablice)`);
    console.log(`SCAN: ${rezultati.plan.skeniranja}`);
    console.log(`SEARCH: ${rezultati.plan.pretrazivanja}`);
    console.log(`Plan: ${rezultati.plan.detalji}`);
}

// -> upiti - originalna baza
const upitiOriginalna = [
    {
        naziv: 'Opterećenje nastavnika',
        sql: `SELECT n.Ime, n.Prezime, COUNT(np.PREDMETI_ID_Predmet) AS Broj_predmeta
              FROM NASTAVNICI n
              JOIN N_PREDMET np ON n.ID_Nastavnik = np.NASTAVNICI_ID_Nastavnik
              GROUP BY n.Ime, n.Prezime
              ORDER BY Broj_predmeta DESC`
    },
    {
        naziv: 'Rang škola po broju učenika',
        sql: `SELECT s.Naziv AS Skola, COUNT(u.ID_Ucenik) AS Broj_ucenika
              FROM SKOLE s
              INNER JOIN RAZREDI r ON s.ID_Skola = r.SKOLE_ID_Skola
              INNER JOIN UCENICI u ON r.ID_Razred = u.RAZREDI_ID_Razred
              GROUP BY s.Naziv`
    },
    {
        naziv: 'Optimizirani upit nastavnika',
        sql: `SELECT n.Ime, n.Prezime, zv.Naziv AS Zvanje,
                     COUNT(DISTINCT np.PREDMETI_ID_Predmet) AS Broj_Predmeta
              FROM NASTAVNICI n
              INNER JOIN ZVANJA zv ON n.ZVANJA_ID_Zvanje = zv.ID_Zvanje
              INNER JOIN N_PREDMET np ON n.ID_Nastavnik = np.NASTAVNICI_ID_Nastavnik
              INNER JOIN N_RAZRED nr ON n.ID_Nastavnik = nr.NASTAVNICI_ID_Nastavnik
              INNER JOIN RAZREDI r ON nr.RAZREDI_ID_Razred = r.ID_Razred
              INNER JOIN SKOLE s ON r.SKOLE_ID_Skola = s.ID_Skola
              GROUP BY n.ID_Nastavnik`
    }
];

// -> upiti - normalizirana baza
const upitiNormalizirana = [
    {
        naziv: 'Opterećenje nastavnika',
        sql: `SELECT n.Ime, n.Prezime, COUNT(np.PREDMETI_ID_Predmet) AS Broj_predmeta
              FROM NASTAVNICI n
              JOIN N_PREDMET np ON n.ID_Nastavnik = np.NASTAVNICI_ID_Nastavnik
              GROUP BY n.Ime, n.Prezime
              ORDER BY Broj_predmeta DESC`
    },
    {
        naziv: 'Rang škola po broju učenika',
        sql: `SELECT s.Naziv AS Skola, COUNT(u.ID_Ucenik) AS Broj_ucenika
              FROM SKOLE s
              INNER JOIN RAZREDI r ON s.ID_Skola = r.SKOLE_ID_Skola
              INNER JOIN UCENICI u ON r.ID_Razred = u.RAZREDI_ID_Razred
              GROUP BY s.Naziv`
    },
    {
        naziv: 'Optimizirani upit nastavnika',
        sql: `SELECT n.Ime, n.Prezime, zv.Naziv AS Zvanje,
                     COUNT(DISTINCT np.PREDMETI_ID_Predmet) AS Broj_Predmeta
              FROM NASTAVNICI n
              INNER JOIN ZVANJA zv ON n.ZVANJA_ID_Zvanje = zv.ID_Zvanje
              INNER JOIN N_PREDMET np ON n.ID_Nastavnik = np.NASTAVNICI_ID_Nastavnik
              INNER JOIN N_RAZRED nr ON n.ID_Nastavnik = nr.NASTAVNICI_ID_Nastavnik
              INNER JOIN RAZREDI r ON nr.RAZREDI_ID_Razred = r.ID_Razred
              INNER JOIN SKOLE s ON r.SKOLE_ID_Skola = s.ID_Skola
              GROUP BY n.ID_Nastavnik`
    },
    {
        naziv: 'Optimizirani upit učenika (5 JOINova)',
        sql: `SELECT u.Ime, u.Prezime, r.Broj_razreda, r.Slovo_razreda,
                     s.Naziv AS Naziv_skole, p.Mjesto, z.Naziv AS Naziv_zupanije
              FROM UCENICI u
              JOIN RAZREDI r ON u.RAZREDI_ID_Razred = r.ID_Razred
              JOIN SKOLE s ON r.SKOLE_ID_Skola = s.ID_Skola
              JOIN POSTE p ON u.POSTE_ID_Posta = p.ID_Posta
              JOIN ZUPANIJE z ON p.ZUPANIJE_ID_Zupanija = z.ID_Zupanija`
    }
];


// -> upiti - denormalozirana (flai i join)
const upitiDenormalizirana = [
    {
        naziv: 'Opterećenje nastavnika (JOIN)',
        sql: `SELECT n.Ime, n.Prezime, COUNT(np.PREDMETI_ID_Predmet) AS Broj_predmeta
              FROM NASTAVNICI n
              JOIN N_PREDMET np ON n.ID_Nastavnik = np.NASTAVNICI_ID_Nastavnik
              GROUP BY n.Ime, n.Prezime
              ORDER BY Broj_predmeta DESC`
    },
    {
        naziv: 'Opterećenje nastavnika (NASTAVNIK_INFO - 0 hopova)',
        sql: `SELECT Ime, Prezime, Naziv_zvanja AS Zvanje, Broj_predmeta
              FROM NASTAVNIK_INFO
              ORDER BY Broj_predmeta DESC`
    },
    {
        naziv: 'Rang škola po broju učenika (JOIN)',
        sql: `SELECT s.Naziv AS Skola, COUNT(u.ID_Ucenik) AS Broj_ucenika
              FROM SKOLE s
              INNER JOIN RAZREDI r ON s.ID_Skola = r.SKOLE_ID_Skola
              INNER JOIN UCENICI u ON r.ID_Razred = u.RAZREDI_ID_Razred
              GROUP BY s.Naziv`
    },
    {
        naziv: 'Rang škola po broju učenika (UCENIK_PREGLED - 0 hopova)',
        sql: `SELECT Naziv_skole AS Skola, Naziv_zupanije AS Zupanija, COUNT(ID_Ucenik) AS Broj_ucenika
              FROM UCENIK_PREGLED
              GROUP BY Naziv_skole, Naziv_zupanije`
    },
    {
        naziv: 'Podaci učenika s lokacijom (5 JOINova)',
        sql: `SELECT u.Ime, u.Prezime, r.Broj_razreda, r.Slovo_razreda,
                     s.Naziv AS Naziv_skole, p.Mjesto, z.Naziv AS Naziv_zupanije
              FROM UCENICI u
              JOIN RAZREDI r ON u.RAZREDI_ID_Razred = r.ID_Razred
              JOIN SKOLE s ON r.SKOLE_ID_Skola = s.ID_Skola
              JOIN POSTE p ON u.POSTE_ID_Posta = p.ID_Posta
              JOIN ZUPANIJE z ON p.ZUPANIJE_ID_Zupanija = z.ID_Zupanija`
    },
    {
        naziv: 'Podaci učenika s lokacijom (UCENIK_PREGLED - 0 hopova)',
        sql: `SELECT Ime, Prezime, Broj_razreda, Slovo_razreda,
                     Naziv_skole, Mjesto, Naziv_zupanije
              FROM UCENIK_PREGLED`
    }
];

console.log('Usporedba performansi baza podataka');
 
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
    ispisi(upit.naziv, rezultati);
}
 
// -> normalizirana baza
console.log('NORMALIZIRANA BAZA (3NF)');
for (const upit of upitiNormalizirana) {
    const rezultati = {
        vrijeme:    izmjeriVrijeme(normDb, upit.sql),
        throughput: izmjeriThroughput(normDb, upit.sql),
        hop:        prebrojHopove(upit.sql),
        plan:       analizaPlana(normDb, upit.sql)
    };
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
    ispisi(upit.naziv, rezultati);
}
 
// -> usporedba tablica
console.log('USPOREDBA: isti upit na sve tri baze');
 
const usporedba = [
    {
        naziv: 'Rang škola po broju učenika',
        original: upitiOriginalna[1].sql,
        norm: upitiNormalizirana[1].sql,
        denormJoin: upitiDenormalizirana[2].sql,
        denormFlat: upitiDenormalizirana[3].sql
    },
    {
        naziv: 'Opterećenje nastavnika',
        original:  upitiOriginalna[0].sql,
        norm: upitiNormalizirana[0].sql,
        denormJoin: upitiDenormalizirana[0].sql,
        denormFlat: upitiDenormalizirana[1].sql
    }
];
 
for (const u of usporedba) {
    console.log(`\n${u.naziv}`);
    console.log(`${'Baza'.padEnd(35)} ${'Prosjek (ms)'.padEnd(14)} ${'Throughput'.padEnd(12)} ${'HOPovi'}`);
 
    const redovi = [
        { naziv: 'Originalna', sql: u.original, db: originalDb },
        { naziv: 'Normalizirana', sql: u.norm, db: normDb },
        { naziv: 'Denormalizirana (JOIN)', sql: u.denormJoin, db: denormDb },
        { naziv: 'Denormalizirana (flat tablica)', sql: u.denormFlat, db: denormDb }
    ];
 
    for (const red of redovi) {
        const vr = izmjeriVrijeme(red.db, red.sql, 20);
        const th = izmjeriThroughput(red.db, red.sql, 1);
        const hp = prebrojHopove(red.sql);
        console.log(`${red.naziv.padEnd(35)} ${vr.prosjek.toFixed(3).padEnd(14)} ${th.toString().padEnd(12)} ${hp.hopovi}`);
    }
}
 
// -> spremamo u csv dadoteku
const csvRedovi = [
    'Baza,Upit,ProsjekMs,MinMs,MaxMs,ThroughputQs,Hopovi,BrojTablica,Skeniranja,Pretrazivanja'
];
 
function dodajUCsv(nazivBaze, upiti, db) {
    for (const upit of upiti) {
        const vr = izmjeriVrijeme(db, upit.sql, 20);
        const th = izmjeriThroughput(db, upit.sql, 1);
        const hp = prebrojHopove(upit.sql);
        const pl = analizaPlana(db, upit.sql);
        csvRedovi.push(`${nazivBaze},"${upit.naziv}",${vr.prosjek.toFixed(3)},${vr.min.toFixed(3)},${vr.max.toFixed(3)},${th},${hp.hopovi},${hp.brojTablica},${pl.skeniranja},${pl.pretrazivanja}`);
    }
}
 
dodajUCsv('Originalna',    upitiOriginalna,    originalDb);
dodajUCsv('Normalizirana', upitiNormalizirana, normDb);
dodajUCsv('Denormalizirana', upitiDenormalizirana, denormDb);
 
fs.writeFileSync(
    path.join(__dirname, '../rezultati.csv'),
    csvRedovi.join('\n'),
    'utf8'
);
console.log('\nRezultati spremljeni u: rezultati.csv');
 
originalDb.close();
normDb.close();
denormDb.close();