const Database = require('better-sqlite3');
const path = require('path');
const { procitajCsv, ocisti } = require('../scripts/utils/csvLoader');

const baza = new Database(path.join(__dirname, '../databases/dbs/02_schema_normalized.db'));
baza.pragma('foreign_keys = ON');

const zupanije = procitajCsv('province.csv');
baza.transaction(() => {
    const stmt = baza.prepare('INSERT INTO ZUPANIJE (ID_Zupanija, Naziv) VALUES (?, ?)');
    for (let i = 0; i < zupanije.length; i++) {
        const [id, naziv] = zupanije[i];
        if (!id) continue;
        stmt.run(parseInt(id), ocisti(naziv));
    }
})();
console.log('Uspješno unesene županije');

const gradovi = procitajCsv('city.csv');
baza.transaction(() => {
    const stmt = baza.prepare('INSERT INTO POSTE (ID_Posta, Postanski_broj, Mjesto, ZUPANIJE_ID_Zupanija) VALUES (?, ?, ?, ?)');
    for (let i = 0; i < gradovi.length; i++) {
        const [zupanijaId, gradId, naziv, zip] = gradovi[i];
        if (!zupanijaId) continue;
        const idPoste = parseInt(zupanijaId) * 1000 + parseInt(gradId);
        stmt.run(idPoste, parseInt(zip) || 0, ocisti(naziv), parseInt(zupanijaId));
    }
})();
console.log('Uspješno unešene pošte');

const adreseZaSkole = procitajCsv('address.csv');
const listaAdresa = [];
for (let i = 0; i < adreseZaSkole.length; i++) {
    const red = adreseZaSkole[i];
    if (!red || red.length < 2) continue;
    listaAdresa.push(ocisti(red[1]));
}

const zgrade = procitajCsv('bldg.csv');
baza.transaction(() => {
    const stmt = baza.prepare('INSERT INTO SKOLE (ID_Skola, Naziv, Adresa) VALUES (?, ?, ?)');
    for (let i = 0; i < zgrade.length; i++) {
        const [id, , naziv] = zgrade[i];
        if (!id) continue;
        const adresa = listaAdresa[i % listaAdresa.length];
        stmt.run(parseInt(id), ocisti(naziv), adresa);
    }
})();
console.log('Uspješno unesene škole');

const nastavniciCsv = procitajCsv('registrar.csv');
baza.transaction(() => {
    const stmt = baza.prepare('INSERT OR IGNORE INTO ZVANJA (Naziv) VALUES (?)');
    for (let i = 0; i < nastavniciCsv.length; i++) {
        const zvanje = ocisti(nastavniciCsv[i][6] || '');
        if (zvanje) {
            stmt.run(zvanje);
        }
    }
})();
console.log('Uspješno unesena zvanja');

const svaZvanja = baza.prepare('SELECT ID_Zvanje, Naziv FROM ZVANJA').all();
const zvanjeMap = {};
for (const z of svaZvanja) zvanjeMap[z.Naziv] = z.ID_Zvanje;

const sveSkole = baza.prepare('SELECT ID_Skola, Naziv FROM SKOLE').all();
const razredi = procitajCsv('classsection.csv');

baza.transaction(() => {
    const stmt = baza.prepare('INSERT INTO RAZREDI (ID_Razred, Broj_razreda, Slovo_razreda, SKOLE_ID_Skola) VALUES (?, ?, ?, ?)');
    for (let i = 0; i < razredi.length; i++) {
        const [idStr, , razredStr, , , imeRazreda] = razredi[i];
        if (!idStr) continue;
        const id = parseInt(idStr);
        const razred = parseInt(razredStr);
        const skolaId = sveSkole.length > 0 ? sveSkole[i % sveSkole.length].ID_Skola : 1;
        stmt.run(id, razred, ocisti(imeRazreda).charAt(0), skolaId);
    }
})();
console.log('Uspješno uneseni razredi');

baza.transaction(() => {
    const stmt = baza.prepare(`
    INSERT INTO NASTAVNICI (ID_Nastavnik, Ime, Prezime, Datum_rodjenja, Pocetak_rada, Kraj_rada, ZVANJA_ID_Zvanje)
    VALUES (?, ?, ?, ?, ?, ?, ?)`);
    for (let i = 0; i < nastavniciCsv.length; i++) {
        const [id, ime, , prezime, datumRodjenja, , zvanjeStr, , pocetakRadaStr] = nastavniciCsv[i];
        if (!id) continue;
        const zvanje = ocisti(zvanjeStr || '');
        const zvanjeId = zvanjeMap[zvanje] || 1;
        const pocetakRada = ocisti(pocetakRadaStr || '') || '2015-09-01';

        stmt.run(parseInt(id), ocisti(ime), ocisti(prezime), ocisti(datumRodjenja), pocetakRada, null, zvanjeId);
    }
})();
console.log('Uspješno uneseni nastavnici');

const sviNastavnici = baza.prepare('SELECT ID_Nastavnik FROM NASTAVNICI').all();
const skoleMap = {};
for (const s of sveSkole) skoleMap[s.ID_Skola] = s.Naziv;

const sviRazrediBaza = baza.prepare('SELECT ID_Razred, SKOLE_ID_Skola FROM RAZREDI').all();

baza.transaction(() => {
    const stmt = baza.prepare('INSERT OR IGNORE INTO NASTAVNIK_SKOLE (ID, NASTAVNICI_ID_Nastavnik, Naziv_skole) VALUES (?, ?, ?)');
    let nastavnikSkolaId = 1;
    for (let i = 0; i < sviRazrediBaza.length; i++) {
        const skolaId = sviRazrediBaza[i].SKOLE_ID_Skola;
        const nastavnikId = sviNastavnici[i % sviNastavnici.length].ID_Nastavnik;
        const nazivSkole = skoleMap[skolaId] || sveSkole[0].Naziv;
        stmt.run(nastavnikSkolaId++, nastavnikId, nazivSkole);
    }
})();
console.log('Uspješno unesene škole nastavnika');

const predmeti = procitajCsv('subjects.csv');
baza.transaction(() => {
    const stmt = baza.prepare('INSERT INTO PREDMETI (ID_Predmet, Naziv, Broj_sati_tjedno) VALUES (?, ?, ?)');
    for (let i = 0; i < predmeti.length; i++) {
        const [id, naziv] = predmeti[i];
        if (!id) continue;
        const brojSati = (i % 2 === 0) ? 2 : 3;
        stmt.run(parseInt(id), ocisti(naziv), brojSati);
    }
})();
console.log('Uspješno uneseni predmeti');

const sviPredmetiId = predmeti.filter(p => p[0]).map(p => parseInt(p[0]));

const adrese = procitajCsv('address.csv');
const adresaMap = {};
for (let i = 0; i < adrese.length; i++) {
    const [adresaId, adresaTekst] = adrese[i];
    if (!adresaId) continue;
    adresaMap[parseInt(adresaId)] = ocisti(adresaTekst);
}
const sveAdrese = Object.values(adresaMap);

const upisi = procitajCsv('enroll.csv');
const ucenikURazredu = {};
for (let i = 0; i < upisi.length; i++) {
    const [, ucenikId, razredId] = upisi[i];
    if (!ucenikId) continue;
    ucenikURazredu[parseInt(ucenikId)] = parseInt(razredId);
}

const dodjele = procitajCsv('classSectionAssignment.csv');
const razredPredmeti = {};
for (let i = 0; i < dodjele.length; i++) {
    const [, razredId, predmetId] = dodjele[i];
    if (!razredId) continue;
    const rId = parseInt(razredId);
    if (!razredPredmeti[rId]) razredPredmeti[rId] = [];
    razredPredmeti[rId].push(parseInt(predmetId));
}

const ucenici = procitajCsv('student.csv', false);
const imeOcaRedovi = procitajCsv('ime_oca.csv');
const svePoste = baza.prepare('SELECT ID_Posta FROM POSTE').all();

baza.transaction(() => {
    const stmt = baza.prepare(`
    INSERT INTO UCENICI (ID_Ucenik, Ime, Prezime, Datum_rodjenja, OIB, Ime_oca, Adresa, RAZREDI_ID_Razred, POSTE_ID_Posta)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    for (let i = 0; i < ucenici.length; i++) {
        const [idStr, ime, , prezime, datumRodjenja, , , adresaIdStr] = ucenici[i];
        if (!idStr) continue;
        const ucenikId = parseInt(idStr);
        const adresaId = parseInt(adresaIdStr);
        const razredId = ucenikURazredu[ucenikId] || 1701;
        const imeOcaStr = imeOcaRedovi[i % imeOcaRedovi.length] ? imeOcaRedovi[i % imeOcaRedovi.length][0] : '';
        const imeOca = ocisti(imeOcaStr);
        const adresaTekst = adresaMap[adresaId] ?? sveAdrese[Math.floor(Math.random() * sveAdrese.length)];
        const postaId = svePoste.length > 0 ? svePoste[i % svePoste.length].ID_Posta : 1000;
        const oib = String(ucenikId).padStart(11, '0');

        stmt.run(ucenikId, ocisti(ime), ocisti(prezime), ocisti(datumRodjenja), oib, imeOca, adresaTekst, razredId, postaId);
    }
})();
console.log('Uspješno uneseni učenici');

const ocjene = [['Nedovoljan', 1], ['Dovoljan', 2], ['Dobar', 3], ['Vrlo dobar', 4], ['Odličan', 5]];
baza.transaction(() => {
    const stmt = baza.prepare('INSERT INTO OCJENE (ID_Ocjena, Ocjena, Broj_ocjene) VALUES (?, ?, ?)');
    for (const [naziv, broj] of ocjene) {
        stmt.run(broj, naziv, broj);
    }
})();
console.log('Uspješno unesene ocjene');

baza.transaction(() => {
    const stmt = baza.prepare('INSERT OR IGNORE INTO N_PREDMET(PREDMETI_ID_Predmet, NASTAVNICI_ID_Nastavnik) VALUES (?, ?)');
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

baza.transaction(() => {
    const stmt = baza.prepare('INSERT OR IGNORE INTO N_RAZRED (RAZREDI_ID_Razred, NASTAVNICI_ID_Nastavnik) VALUES (?, ?)');
    for (let i = 0; i < razredi.length; i++) {
        const [id] = razredi[i];
        if (!id) continue;
        const nastavnikId = sviNastavnici[i % sviNastavnici.length].ID_Nastavnik;
        stmt.run(parseInt(id), nastavnikId);
    }
})();
console.log('Uspješno unesen nastavnik razred');

baza.transaction(() => {
    const stmt = baza.prepare('INSERT OR IGNORE INTO P_UCENIK (UCENICI_ID_Ucenik, PREDMETI_ID_Predmet) VALUES (?, ?)');
    for (let i = 0; i < upisi.length; i++) {
        const [, ucenikIdStr, razredIdStr] = upisi[i];
        if (!ucenikIdStr) continue;
        const ucenikId = parseInt(ucenikIdStr);
        const predmetiRazreda = razredPredmeti[parseInt(razredIdStr)] || [];
        for (const predmetId of predmetiRazreda) {
            stmt.run(ucenikId, predmetId);
        }
    }
})();
console.log('Uspješno unesen predmet učenik');

const upisMap = {};
for (let i = 0; i < upisi.length; i++) {
    const [enrollId, ucenikId] = upisi[i];
    if (!enrollId) continue;
    upisMap[parseInt(enrollId)] = parseInt(ucenikId);
}

const moguceOcjene = [2, 3, 3, 4, 4, 4, 5, 5];
const ispiti = procitajCsv('studentexams.csv');
baza.transaction(() => {
    const stmt = baza.prepare('INSERT OR IGNORE INTO ZAVRSNA_O (UCENICI_ID_Ucenik, OCJENE_ID_Ocjena) VALUES (?, ?)');
    for (let i = 0; i < ispiti.length; i++) {
        const [, enrollIdStr] = ispiti[i];
        if (!enrollIdStr) continue;
        const ucenikId = upisMap[parseInt(enrollIdStr)];
        if (!ucenikId) continue;
        const ocjena = moguceOcjene[Math.floor(Math.random() * moguceOcjene.length)];
        stmt.run(ucenikId, ocjena);
    }
})();
console.log('Uspješno unesena završna ocjena');

baza.close();
console.log('Normalizirana baza je napunjena.');