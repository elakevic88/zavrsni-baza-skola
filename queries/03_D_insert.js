const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const db = new Database(path.join(__dirname, '../databases/dbs/03_schema_denormalized.db'));
const putanja = path.join(__dirname, '../data');
db.pragma('foreign_keys = ON');

function procitajCsv(imeDatoteke) {
    return fs.readFileSync(path.join(putanja, imeDatoteke), 'utf8')
        .replace(/^\uFEFF/, '')
        .split('\n');
}

function ocisti(tekst) {
    return String(tekst || '').trim().replace(/\r/g, '');
}

const zupanije = procitajCsv('province.csv');
for (let i = 1; i < zupanije.length; i++) {
    const red = ocisti(zupanije[i]);
    if (!red) continue;
    const [id, naziv] = red.split(',');
    db.prepare('INSERT INTO ZUPANIJE (ID_Zupanija, Naziv) VALUES (?, ?)').run(parseInt(id), ocisti(naziv));
}
console.log('Uspješno unesene županije');

const gradovi = procitajCsv('city.csv');
for (let i = 1; i < gradovi.length; i++) {
    const red = ocisti(gradovi[i]);
    if (!red) continue;
    const [zupanijaId, gradId, naziv, zip] = red.split(',');
    const idPoste = parseInt(zupanijaId) * 1000 + parseInt(gradId);
    db.prepare('INSERT INTO POSTE (ID_Posta, Postanski_broj, Mjesto, ZUPANIJE_ID_Zupanija) VALUES (?, ?, ?, ?)').run(
        idPoste,
        parseInt(zip),
        ocisti(naziv),
        parseInt(zupanijaId)
    );
}
console.log('Uspješno unešene pošte');

const zgrade = procitajCsv('bldg.csv');
const listaAdresaSkole = [];
const adreseZaSkole = procitajCsv('address.csv');
for (let i = 1; i < adreseZaSkole.length; i++) {
    const red = ocisti(adreseZaSkole[i]);
    if (!red) continue;
    const zarez = red.indexOf(',');
    listaAdresaSkole.push(ocisti(red.substring(zarez + 1)));
}

for (let i = 1; i < zgrade.length; i++) {
    const red = ocisti(zgrade[i]);
    if (!red) continue;
    const [id, , nazivSkole] = red.split(',');
    const adresaSkole = listaAdresaSkole[(i - 1) % listaAdresaSkole.length];
    db.prepare('INSERT INTO SKOLE (ID_Skola, Naziv, Adresa) VALUES (?, ?, ?)').run(parseInt(id), ocisti(nazivSkole), adresaSkole);
}
console.log('Uspješno unesene škole');

const sveSkole = db.prepare('SELECT ID_Skola, Naziv FROM SKOLE').all();

const nastavnici = procitajCsv('registrar.csv');
for (let i = 1; i < nastavnici.length; i++) {
    const red = ocisti(nastavnici[i]);
    if (!red) continue;
    const stupci = red.split(',');
    const zvanje = ocisti(stupci[6]);
    if (zvanje) {
        db.prepare('INSERT OR IGNORE INTO ZVANJA (Naziv) VALUES (?)').run(zvanje);
    }
}
console.log('Uspješno unesena zvanja');

const svaZvanja = db.prepare('SELECT ID_Zvanje, Naziv FROM ZVANJA').all();
const zvanjeMap = {};
for (const z of svaZvanja) zvanjeMap[ocisti(z.Naziv)] = z.ID_Zvanje;

for (let i = 1; i < nastavnici.length; i++) {
    const red = ocisti(nastavnici[i]);
    if (!red) continue;
    const stupci = red.split(',');
    const idNastavnik = parseInt(stupci[0]);
    const ime = ocisti(stupci[1]);
    const prezime = ocisti(stupci[3]);
    const datumRodjenja = ocisti(stupci[4]);
    const zvanje = ocisti(stupci[6]);
    const pocetakRada = ocisti(stupci[8]);
    const zvanjeId = zvanjeMap[zvanje] || 1;

    db.prepare('INSERT INTO NASTAVNICI (ID_Nastavnik, Ime, Prezime, Datum_rodjenja, Pocetak_rada, Kraj_rada, ZVANJA_ID_Zvanje) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        idNastavnik, ime, prezime, datumRodjenja, pocetakRada, null, zvanjeId
    );
}
console.log('Uspješno uneseni nastavnici');

const sviNastavnici = db.prepare('SELECT ID_Nastavnik FROM NASTAVNICI').all();

const razredi = procitajCsv('classsection.csv');
for (let i = 1; i < razredi.length; i++) {
    const red = ocisti(razredi[i]);
    if (!red) continue;
    const [id, , razredBroj, , , naziv] = red.split(',');
    const skolaObj = sveSkole[(i - 1) % sveSkole.length];
    db.prepare('INSERT INTO RAZREDI (ID_Razred, Broj_razreda, Slovo_razreda, SKOLE_ID_Skola) VALUES (?, ?, ?, ?)').run(
        parseInt(id), parseInt(razredBroj), ocisti(naziv).charAt(0), skolaObj.ID_Skola
    );
}
console.log('Uspješno uneseni razredi');

const sviRazredi = db.prepare('SELECT R.ID_Razred, S.Naziv AS Naziv_skole FROM RAZREDI R JOIN SKOLE S ON R.SKOLE_ID_Skola = S.ID_Skola').all();

for (let i = 0; i < sviRazredi.length; i++) {
    const skolaNaziv = sviRazredi[i].Naziv_skole;
    const nastavnikId = sviNastavnici[i % sviNastavnici.length].ID_Nastavnik;
    db.prepare('INSERT OR IGNORE INTO NASTAVNIK_SKOLE (ID, NASTAVNICI_ID_Nastavnik, Naziv_skole) VALUES (?, ?, ?)').run(i + 1, nastavnikId, skolaNaziv);
}
console.log('Uspješno unesene škole nastavnika');

const predmeti = procitajCsv('subjects.csv');
for (let i = 1; i < predmeti.length; i++) {
    const red = ocisti(predmeti[i]);
    if (!red) continue;
    const [id, naziv] = red.split(',');
    const brojSati = ((i - 1) % 2 === 0) ? 2 : 3;
    db.prepare('INSERT INTO PREDMETI (ID_Predmet, Naziv, Broj_sati_tjedno) VALUES (?, ?, ?)').run(parseInt(id), ocisti(naziv), brojSati);
}
console.log('Uspješno uneseni predmeti');

const sviPredmetiId = [];
for (let i = 1; i < predmeti.length; i++) {
    const red = ocisti(predmeti[i]);
    if (!red) continue;
    const [id] = red.split(',');
    sviPredmetiId.push(parseInt(id));
}

const ucenici = procitajCsv('student.csv');
const ocevi = procitajCsv('ime_oca.csv').slice(1).map(ocisti).filter(Boolean);

const adreseUcenici = procitajCsv('address.csv');
const adresaMap = {};
for (let i = 1; i < adreseUcenici.length; i++) {
    const red = ocisti(adreseUcenici[i]);
    if (!red) continue;
    const zarez = red.indexOf(',');
    const adresaId = parseInt(red.substring(0, zarez));
    const adresaTekst = ocisti(red.substring(zarez + 1));
    adresaMap[adresaId] = adresaTekst;
}
const sveAdreseUcenikaLista = Object.values(adresaMap);

const upisi = procitajCsv('enroll.csv');
const ucenikURazredu = {};
for (let i = 1; i < upisi.length; i++) {
    const red = ocisti(upisi[i]);
    if (!red) continue;
    const [, idStudenta, idRazreda] = red.split(',');
    ucenikURazredu[parseInt(idStudenta)] = parseInt(idRazreda);
}

const raspodjelaPredmeta = procitajCsv('classSectionAssignment.csv');
const razredPredmeti = {};
for (let i = 1; i < raspodjelaPredmeta.length; i++) {
    const red = ocisti(raspodjelaPredmeta[i]);
    if (!red) continue;
    const [, idRazreda, idPredmeta] = red.split(',');
    const idRazred = parseInt(idRazreda);
    const idPredmet = parseInt(idPredmeta);
    if (!razredPredmeti[idRazred]) razredPredmeti[idRazred] = [];
    razredPredmeti[idRazred].push(idPredmet);
}

const svePoste = db.prepare('SELECT ID_Posta FROM POSTE').all();

for (let i = 0; i < ucenici.length; i++) {
    const red = ocisti(ucenici[i]);
    if (!red) continue;
    const stupci = red.split(',');
    const id = parseInt(stupci[0]);
    const ime = ocisti(stupci[1]);
    const prezime = ocisti(stupci[3]);
    const datumRodjenja = ocisti(stupci[4]);
    const adresaId = parseInt(stupci[7]);
    const razredId = ucenikURazredu[id] || 1701;
    const brojPredmeta = (razredPredmeti[razredId] || []).length;
    const imeOca = ocevi[i % ocevi.length];
    const adresa = adresaMap[adresaId] ?? sveAdreseUcenikaLista[Math.floor(Math.random() * sveAdreseUcenikaLista.length)];
    const postaId = svePoste[i % svePoste.length].ID_Posta;
    const oib = String(id).padStart(11, '0');

    db.prepare('INSERT INTO UCENICI (ID_Ucenik, Ime, Prezime, Datum_rodjenja, OIB, Ime_oca, Adresa, Broj_upisanih_predmeta, RAZREDI_ID_Razred, POSTE_ID_Posta) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(id, ime, prezime, datumRodjenja, oib, imeOca, adresa, brojPredmeta, razredId, postaId);
}
console.log('Uspješno uneseni učenici');

const ocjene = [['Nedovoljan', 1], ['Dovoljan', 2], ['Dobar', 3], ['Vrlo dobar', 4], ['Odličan', 5]];
for (const [naziv, broj] of ocjene) {
    db.prepare('INSERT INTO OCJENE (ID_Ocjena, Ocjena, Broj_ocjene) VALUES (?, ?, ?)').run(broj, naziv, broj);
}
console.log('Uspješno unesene ocjene');

for (const nastavnik of sviNastavnici) {
    const brojPredmeta = Math.floor(Math.random() * 3) + 3;
    const dodijeljeni = new Set();
    while (dodijeljeni.size < brojPredmeta) {
        const predmetId = sviPredmetiId[
            Math.floor(Math.random() * sviPredmetiId.length)
        ];
        if (!dodijeljeni.has(predmetId)) {
            dodijeljeni.add(predmetId);

            db.prepare(`INSERT OR IGNORE INTO N_PREDMET(PREDMETI_ID_Predmet, NASTAVNICI_ID_Nastavnik)VALUES (?, ?)`).run(predmetId, nastavnik.ID_Nastavnik);
        }
    }
}
console.log("Uspješno uneseni nastavnici i predmeti");

for (let i = 1; i < razredi.length; i++) {
    const red = ocisti(razredi[i]);
    if (!red) continue;
    const [id] = red.split(',');
    const nastavnikId = sviNastavnici[(i - 1) % sviNastavnici.length].ID_Nastavnik;
    db.prepare('INSERT OR IGNORE INTO N_RAZRED (RAZREDI_ID_Razred, NASTAVNICI_ID_Nastavnik) VALUES (?, ?)').run(parseInt(id), nastavnikId);
}
console.log('Uspješno unesen nastavnik razred');

for (let i = 1; i < upisi.length; i++) {
    const red = ocisti(upisi[i]);
    if (!red) continue;
    const [, idStudenta, idRazreda] = red.split(',');
    const idUcenik = parseInt(idStudenta);
    const predmetiRazreda = razredPredmeti[parseInt(idRazreda)] || [];
    for (const predmetId of predmetiRazreda) {
        db.prepare('INSERT OR IGNORE INTO P_UCENIK (UCENICI_ID_Ucenik, PREDMETI_ID_Predmet) VALUES (?, ?)').run(idUcenik, predmetId);
    }
}
console.log('Uspješno unesen predmet učenik');

const upisMapa = {};
for (let i = 1; i < upisi.length; i++) {
    const red = ocisti(upisi[i]);
    if (!red) continue;
    const [idUpisa, idStudenta] = red.split(',');
    upisMapa[parseInt(idUpisa)] = parseInt(idStudenta);
}

const moguceOcjene = [2, 3, 3, 4, 4, 4, 5, 5];
const ispiti = procitajCsv('studentexams.csv');
for (let i = 1; i < ispiti.length; i++) {
    const red = ocisti(ispiti[i]);
    if (!red) continue;
    const [, idUpisa] = red.split(',');
    const ucenikId = upisMapa[parseInt(idUpisa)];
    if (!ucenikId) continue;
    const nasumicnaOcjena = moguceOcjene[Math.floor(Math.random() * moguceOcjene.length)];
    db.prepare('INSERT OR IGNORE INTO ZAVRSNA_O (UCENICI_ID_Ucenik, OCJENE_ID_Ocjena) VALUES (?, ?)').run(ucenikId, nasumicnaOcjena);
}
console.log('Uspješno unesena završna ocjena');


db.prepare(`INSERT INTO UCENIK_PREGLED (ID_Ucenik, Ime, Prezime, Datum_rodjenja, OIB, Adresa, Broj_razreda, Slovo_razreda, Naziv_skole, Adresa_skole, Postanski_broj, Mjesto, Naziv_zupanije, Broj_upisanih_predmeta)
SELECT
    u.ID_Ucenik,
    u.Ime,
    u.Prezime,
    u.Datum_rodjenja,
    u.OIB,
    u.Adresa,
    r.Broj_razreda,
    r.Slovo_razreda,
    s.Naziv,
    s.Adresa,
    p.Postanski_broj,
    p.Mjesto,
    z.Naziv,
    u.Broj_upisanih_predmeta
FROM UCENICI u
JOIN RAZREDI r ON u.RAZREDI_ID_Razred = r.ID_Razred
JOIN SKOLE s ON r.SKOLE_ID_Skola = s.ID_Skola
JOIN POSTE p ON u.POSTE_ID_Posta = p.ID_Posta
JOIN ZUPANIJE z ON p.ZUPANIJE_ID_Zupanija = z.ID_Zupanija`).run();

console.log('Uspješno popunjen UCENIK_PREGLED');

db.prepare(`INSERT INTO NASTAVNIK_INFO (ID_Nastavnik, Ime, Prezime, Datum_rodjenja, Pocetak_rada, Naziv_zvanja, Broj_predmeta)
SELECT
    n.ID_Nastavnik,
    n.Ime,
    n.Prezime,
    n.Datum_rodjenja,
    n.Pocetak_rada,
    z.Naziv,
    COUNT(np.PREDMETI_ID_Predmet)
FROM NASTAVNICI n
JOIN ZVANJA z
    ON n.ZVANJA_ID_Zvanje = z.ID_Zvanje
LEFT JOIN N_PREDMET np
    ON n.ID_Nastavnik = np.NASTAVNICI_ID_Nastavnik
GROUP BY
    n.ID_Nastavnik,
    n.Ime,
    n.Prezime,
    n.Datum_rodjenja,
    n.Pocetak_rada,
    z.Naziv`).run();

console.log('Uspješno popunjen NASTAVNIK_INFO');

db.close();
console.log('Denormalizirana baza je napunjena.');