const Database = require('better-sqlite3');
const path = require('path');
const { procitajCsv, ocisti, ispravakDatuma } = require('../scripts/utils/csvLoader');

const db = new Database(path.join(__dirname, '../databases/dbs/03_schema_denormalized.db'));
db.pragma('foreign_keys = ON');

const zupanije = procitajCsv('province.csv');
db.transaction(() => {
    const stmt = db.prepare('INSERT INTO ZUPANIJE (ID_Zupanija, Naziv) VALUES (?, ?)');
    for (let i = 0; i < zupanije.length; i++) {
        const [id, naziv] = zupanije[i];
        if (!id) continue;
        stmt.run(parseInt(id), ocisti(naziv));
    }
})();
console.log('Uspješno unesene županije');

const gradovi = procitajCsv('city.csv');
db.transaction(() => {
    const stmt = db.prepare('INSERT INTO POSTE (ID_Posta, Postanski_broj, Mjesto, ZUPANIJE_ID_Zupanija) VALUES (?, ?, ?, ?)');
    for (let i = 0; i < gradovi.length; i++) {
        const [zupanijaId, gradId, naziv, zip] = gradovi[i];
        if (!zupanijaId) continue;
        const idPoste = parseInt(zupanijaId) * 1000 + parseInt(gradId);
        stmt.run(idPoste, parseInt(zip) || 0, ocisti(naziv), parseInt(zupanijaId));
    }
})();
console.log('Uspješno unešene pošte');

const adreseZaSkole = procitajCsv('address.csv');
const listaAdresaSkole = [];
for (let i = 0; i < adreseZaSkole.length; i++) {
    const red = adreseZaSkole[i];
    if (!red || red.length < 2) continue;
    listaAdresaSkole.push(ocisti(red[1]));
}

const zgrade = procitajCsv('bldg.csv');
db.transaction(() => {
    const stmt = db.prepare('INSERT INTO SKOLE (ID_Skola, Naziv, Adresa) VALUES (?, ?, ?)');
    for (let i = 0; i < zgrade.length; i++) {
        const [id, , nazivSkole] = zgrade[i];
        if (!id) continue;
        const adresaSkole = listaAdresaSkole[i % listaAdresaSkole.length];
        stmt.run(parseInt(id), ocisti(nazivSkole), adresaSkole);
    }
})();
console.log('Uspješno unesene škole');

const sveSkole = db.prepare('SELECT ID_Skola, Naziv FROM SKOLE').all();

const nastavnici = procitajCsv('registrar.csv');
db.transaction(() => {
    const stmt = db.prepare('INSERT OR IGNORE INTO ZVANJA (Naziv) VALUES (?)');
    for (let i = 0; i < nastavnici.length; i++) {
        const zvanje = ocisti(nastavnici[i][6] || '');
        if (zvanje) {
            stmt.run(zvanje);
        }
    }
})();
console.log('Uspješno unesena zvanja');

const svaZvanja = db.prepare('SELECT ID_Zvanje, Naziv FROM ZVANJA').all();
const zvanjeMap = {};
for (const z of svaZvanja) zvanjeMap[ocisti(z.Naziv)] = z.ID_Zvanje;

db.transaction(() => {
    const stmt = db.prepare('INSERT INTO NASTAVNICI (ID_Nastavnik, Ime, Prezime, Datum_rodjenja, Pocetak_rada, Kraj_rada, ZVANJA_ID_Zvanje) VALUES (?, ?, ?, ?, ?, ?, ?)');
    for (let i = 0; i < nastavnici.length; i++) {
        const [idNastavnik, ime, , prezime, datumRodjenja, , zvanjeStr, , pocetakRada] = nastavnici[i];
        if (!idNastavnik) continue;
        const zvanje = ocisti(zvanjeStr || '');
        const zvanjeId = zvanjeMap[zvanje] || 1;
        stmt.run(parseInt(idNastavnik), ocisti(ime), ocisti(prezime), ispravakDatuma(ocisti(datumRodjenja)), ispravakDatuma(ocisti(pocetakRada)) || '2015-09-01', null, zvanjeId);
    }
})();
console.log('Uspješno uneseni nastavnici');

const sviNastavnici = db.prepare('SELECT ID_Nastavnik FROM NASTAVNICI').all();
const razredi = procitajCsv('classsection.csv');

db.transaction(() => {
    const stmt = db.prepare('INSERT INTO RAZREDI (ID_Razred, Broj_razreda, Slovo_razreda, SKOLE_ID_Skola) VALUES (?, ?, ?, ?)');
    for (let i = 0; i < razredi.length; i++) {
        const [id, , razredBroj, , , naziv] = razredi[i];
        if (!id) continue;
        const skolaObj = sveSkole[i % sveSkole.length];
        const sId = skolaObj ? skolaObj.ID_Skola : 1;
        stmt.run(parseInt(id), parseInt(razredBroj), ocisti(naziv).charAt(0), sId);
    }
})();
console.log('Uspješno uneseni razredi');

const sviRazredi = db.prepare('SELECT R.ID_Razred, S.Naziv AS Naziv_skole FROM RAZREDI R JOIN SKOLE S ON R.SKOLE_ID_Skola = S.ID_Skola').all();

db.transaction(() => {
    const stmt = db.prepare('INSERT OR IGNORE INTO NASTAVNIK_SKOLE (ID, NASTAVNICI_ID_Nastavnik, Naziv_skole) VALUES (?, ?, ?)');
    for (let i = 0; i < sviRazredi.length; i++) {
        const skolaNaziv = sviRazredi[i].Naziv_skole;
        const nastavnikId = sviNastavnici[i % sviNastavnici.length].ID_Nastavnik;
        stmt.run(i + 1, nastavnikId, skolaNaziv);
    }
})();
console.log('Uspješno unesene škole nastavnika');

const predmeti = procitajCsv('subjects.csv');
db.transaction(() => {
    const stmt = db.prepare('INSERT INTO PREDMETI (ID_Predmet, Naziv, Broj_sati_tjedno) VALUES (?, ?, ?)');
    for (let i = 0; i < predmeti.length; i++) {
        const [id, naziv] = predmeti[i];
        if (!id) continue;
        const brojSati = (i % 2 === 0) ? 2 : 3;
        stmt.run(parseInt(id), ocisti(naziv), brojSati);
    }
})();
console.log('Uspješno uneseni predmeti');

const sviPredmetiId = predmeti.filter(p => p[0]).map(p => parseInt(p[0]));
const ucenici = procitajCsv('student.csv', false);
const ocevi = procitajCsv('ime_oca.csv').map(row => ocisti(row[0])).filter(Boolean);

const adreseUcenici = procitajCsv('address.csv');
const adresaMap = {};
for (let i = 0; i < adreseUcenici.length; i++) {
    const [adresaId, adresaTekst] = adreseUcenici[i];
    if (!adresaId) continue;
    adresaMap[parseInt(adresaId)] = ocisti(adresaTekst);
}
const sveAdreseUcenikaLista = Object.values(adresaMap);

const upisi = procitajCsv('enroll.csv');
const ucenikURazredu = {};
for (let i = 0; i < upisi.length; i++) {
    const [, idStudenta, idRazreda] = upisi[i];
    if (!idStudenta) continue;
    ucenikURazredu[parseInt(idStudenta)] = parseInt(idRazreda);
}

const raspodjelaPredmeta = procitajCsv('classSectionAssignment.csv');
const razredPredmeti = {};
for (let i = 0; i < raspodjelaPredmeta.length; i++) {
    const [, idRazreda, idPredmeta] = raspodjelaPredmeta[i];
    if (!idRazreda) continue;
    const idRazred = parseInt(idRazreda);
    if (!razredPredmeti[idRazred]) razredPredmeti[idRazred] = [];
    razredPredmeti[idRazred].push(parseInt(idPredmeta));
}

const svePoste = db.prepare('SELECT ID_Posta FROM POSTE').all();

db.transaction(() => {
    const stmt = db.prepare('INSERT INTO UCENICI (ID_Ucenik, Ime, Prezime, Datum_rodjenja, OIB, Ime_oca, Adresa, Broj_upisanih_predmeta, RAZREDI_ID_Razred, POSTE_ID_Posta) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (let i = 0; i < ucenici.length; i++) {
        const [idStr, ime, , prezime, datumRodjenja, , , adresaIdStr] = ucenici[i];
        if (!idStr) continue;
        const id = parseInt(idStr);
        const adresaId = parseInt(adresaIdStr);
        const razredId = ucenikURazredu[id] || 1701;
        const brojPredmeta = (razredPredmeti[razredId] || []).length;
        const imeOca = ocevi[i % ocevi.length] || '';
        const adresa = adresaMap[adresaId] ?? sveAdreseUcenikaLista[Math.floor(Math.random() * sveAdreseUcenikaLista.length)];
        const postaId = svePoste.length > 0 ? svePoste[i % svePoste.length].ID_Posta : 1000;
        const oib = String(id).padStart(11, '0');

        stmt.run(id, ocisti(ime), ocisti(prezime), ispravakDatuma(ocisti(datumRodjenja)), oib, imeOca, adresa, brojPredmeta, razredId, postaId);
    }
})();
console.log('Uspješno uneseni učenici');

const ocjene = [['Nedovoljan', 1], ['Dovoljan', 2], ['Dobar', 3], ['Vrlo dobar', 4], ['Odličan', 5]];
db.transaction(() => {
    const stmt = db.prepare('INSERT INTO OCJENE (ID_Ocjena, Ocjena, Broj_ocjene) VALUES (?, ?, ?)');
    for (const [naziv, broj] of ocjene) {
        stmt.run(broj, naziv, broj);
    }
})();
console.log('Uspješno unesene ocjene');

db.transaction(() => {
    const stmt = db.prepare('INSERT OR IGNORE INTO N_PREDMET(PREDMETI_ID_Predmet, NASTAVNICI_ID_Nastavnik) VALUES (?, ?)');
    for (const nastavnik of sviNastavnici) {
        const brojPredmeta = Math.floor(Math.random() * 3) + 3;
        const dodijeljeni = new Set();
        while (dodijeljeni.size < brojPredmeta) {
            const predmetId = sviPredmetiId[Math.floor(Math.random() * sviPredmetiId.length)];
            if (!dodijeljeni.has(predmetId)) {
                dodijeljeni.add(predmetId);
                stmt.run(predmetId, nastavnik.ID_Nastavnik);
            }
        }
    }
})();
console.log("Uspješno uneseni nastavnici i predmeti");

db.transaction(() => {
    const stmt = db.prepare('INSERT OR IGNORE INTO N_RAZRED (RAZREDI_ID_Razred, NASTAVNICI_ID_Nastavnik) VALUES (?, ?)');
    for (let i = 0; i < razredi.length; i++) {
        const [id] = razredi[i];
        if (!id) continue;
        const nastavnikId = sviNastavnici[i % sviNastavnici.length].ID_Nastavnik;
        stmt.run(parseInt(id), nastavnikId);
    }
})();
console.log('Uspješno unesen nastavnik razred');

db.transaction(() => {
    const stmt = db.prepare('INSERT OR IGNORE INTO P_UCENIK (UCENICI_ID_Ucenik, PREDMETI_ID_Predmet) VALUES (?, ?)');
    for (let i = 0; i < upisi.length; i++) {
        const [, idStudenta, idRazreda] = upisi[i];
        if (!idStudenta) continue;
        const idUcenik = parseInt(idStudenta);
        const predmetiRazreda = razredPredmeti[parseInt(idRazreda)] || [];
        for (const predmetId of predmetiRazreda) {
            stmt.run(idUcenik, predmetId);
        }
    }
})();
console.log('Uspješno unesen predmet učenik');

const upisMapa = {};
for (let i = 0; i < upisi.length; i++) {
    const [idUpisa, idStudenta] = upisi[i];
    if (!idUpisa) continue;
    upisMapa[parseInt(idUpisa)] = parseInt(idStudenta);
}

const moguceOcjene = [2, 3, 3, 4, 4, 4, 5, 5];
const ispiti = procitajCsv('studentexams.csv');
db.transaction(() => {
    const stmt = db.prepare('INSERT OR IGNORE INTO ZAVRSNA_O (UCENICI_ID_Ucenik, OCJENE_ID_Ocjena) VALUES (?, ?)');
    for (let i = 0; i < ispiti.length; i++) {
        const [, idUpisa] = ispiti[i];
        if (!idUpisa) continue;
        const ucenikId = upisMapa[parseInt(idUpisa)];
        if (!ucenikId) continue;
        const nasumicnaOcjena = moguceOcjene[Math.floor(Math.random() * moguceOcjene.length)];
        stmt.run(ucenikId, nasumicnaOcjena);
    }
})();
console.log('Uspješno unesena završna ocjena');

db.prepare(`INSERT INTO UCENIK_PREGLED (ID_Ucenik, Ime, Prezime, Datum_rodjenja, OIB, Adresa, Broj_razreda, Slovo_razreda, Naziv_skole, Adresa_skole, Postanski_broj, Mjesto, Naziv_zupanije, Broj_upisanih_predmeta)
SELECT
    u.ID_Ucenik, u.Ime, u.Prezime, u.Datum_rodjenja, u.OIB, u.Adresa, r.Broj_razreda, r.Slovo_razreda, s.Naziv, s.Adresa, p.Postanski_broj, p.Mjesto, z.Naziv, u.Broj_upisanih_predmeta
FROM UCENICI u
JOIN RAZREDI r ON u.RAZREDI_ID_Razred = r.ID_Razred
JOIN SKOLE s ON r.SKOLE_ID_Skola = s.ID_Skola
JOIN POSTE p ON u.POSTE_ID_Posta = p.ID_Posta
JOIN ZUPANIJE z ON p.ZUPANIJE_ID_Zupanija = z.ID_Zupanija`).run();
console.log('Uspješno popunjen UCENIK_PREGLED');

db.prepare(`INSERT INTO NASTAVNIK_INFO (ID_Nastavnik, Ime, Prezime, Datum_rodjenja, Pocetak_rada, Naziv_zvanja, Broj_predmeta)
SELECT
    n.ID_Nastavnik, n.Ime, n.Prezime, n.Datum_rodjenja, n.Pocetak_rada, z.Naziv, COUNT(np.PREDMETI_ID_Predmet)
FROM NASTAVNICI n
JOIN ZVANJA z ON n.ZVANJA_ID_Zvanje = z.ID_Zvanje
LEFT JOIN N_PREDMET np ON n.ID_Nastavnik = np.NASTAVNICI_ID_Nastavnik
GROUP BY n.ID_Nastavnik, n.Ime, n.Prezime, n.Datum_rodjenja, n.Pocetak_rada, z.Naziv`).run();
console.log('Uspješno popunjen NASTAVNIK_INFO');

db.close();
console.log('Denormalizirana baza je napunjena.');