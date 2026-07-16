const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const baza = new Database(path.join(__dirname, '../databases/dbs/01_schema_original.db'));
const podaci = path.join(__dirname, '../data');
baza.pragma('foreign_keys = ON');

function procitajCsv(imeDatoteke) {
  return fs.readFileSync(path.join(podaci, imeDatoteke), 'utf8')
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
  baza.prepare('INSERT INTO ZUPANIJE (ID_Zupanija, Naziv) VALUES (?, ?)').run(parseInt(id), ocisti(naziv));
}
console.log('Uspješno unesene županije');

const gradovi = procitajCsv('city.csv');
for (let i = 1; i < gradovi.length; i++) {
  const red = ocisti(gradovi[i]);
  if (!red) continue;
  const [zupanijaId, gradId, naziv, zip] = red.split(',');
  const idPoste = parseInt(zupanijaId) * 1000 + parseInt(gradId);
  baza.prepare('INSERT INTO POSTE (ID_Posta, Postanski_broj, Mjesto, ZUPANIJE_ID_Zupanija) VALUES (?, ?, ?, ?)').run(idPoste, parseInt(zip) || 0, ocisti(naziv), parseInt(zupanijaId));
}
console.log('Uspješno unešene pošte');

const adreseZaSkole = procitajCsv('address.csv');
const listaAdresa = [];
for (let i = 1; i < adreseZaSkole.length; i++) {
  const red = ocisti(adreseZaSkole[i]);
  if (!red) continue;
  const zarez = red.indexOf(',');
  listaAdresa.push(ocisti(red.substring(zarez + 1)));
}

const zgrade = procitajCsv('bldg.csv');
for (let i = 1; i < zgrade.length; i++) {
  const red = ocisti(zgrade[i]);
  if (!red) continue;
  
  const [id, , nazivSkole] = red.split(',');
  const adresa = listaAdresa[(i - 1) % listaAdresa.length];
  
  baza.prepare('INSERT INTO SKOLE (ID_Skola, Naziv, Adresa) VALUES (?, ?, ?)').run(parseInt(id), ocisti(nazivSkole), adresa);
}
console.log('Uspješno unesene škole');

const registrari = procitajCsv('registrar.csv');
for (let i = 1; i < registrari.length; i++) {
  const red = ocisti(registrari[i]);
  if (!red) continue;
  const stupci = red.split(',');
  const zvanje = ocisti(stupci[6] || '');
  if (zvanje) {
    baza.prepare('INSERT OR IGNORE INTO ZVANJA (Naziv) VALUES (?)').run(zvanje);
  }
}
console.log('Uspješno unesena zvanja');

const svaZvanja = baza.prepare('SELECT ID_Zvanje, Naziv FROM ZVANJA').all();
const zvanjeMap = {};
for (const z of svaZvanja) zvanjeMap[z.Naziv] = z.ID_Zvanje;

const sveSkole = baza.prepare('SELECT ID_Skola FROM SKOLE').all();

const razredi = procitajCsv('classsection.csv');
for (let i = 1; i < razredi.length; i++) {
  const red = ocisti(razredi[i]);
  if (!red) continue;
  const stupci = red.split(',');
  const id = parseInt(stupci[0]);
  const razred = parseInt(stupci[2]);
  const imeRazreda = ocisti(stupci[5]);
  
  const skolaId = sveSkole.length > 0 ? sveSkole[(i - 1) % sveSkole.length].ID_Skola : 1;

  baza.prepare('INSERT INTO RAZREDI (ID_Razred, Broj_razreda, Slovo_razreda, SKOLE_ID_Skola) VALUES (?, ?, ?, ?)').run(id, razred, imeRazreda.charAt(0), skolaId);
}
console.log('Uspješno uneseni razredi');

for (let i = 1; i < registrari.length; i++) {
  const red = ocisti(registrari[i]);
  if (!red) continue;
  const stupci = red.split(',');
  const id = parseInt(stupci[0]);
  const ime = ocisti(stupci[1]);
  const prezime = ocisti(stupci[3]);
  const datumRodjenja = ocisti(stupci[4]);
  const zvanje = ocisti(stupci[6] || '');
  const zvanjeId = zvanjeMap[zvanje] || 1;
  
  const zavrseniFakulteti = ocisti(stupci[7] || '');
  const pocetakRada = ocisti(stupci[8] || '') || '2015-09-01';

  baza.prepare(`
    INSERT INTO NASTAVNICI (ID_Nastavnik, Ime, Prezime, Datum_rodjenja, Pocetak_rada, Kraj_rada, Lista_zavrsenih_skola, ZVANJA_ID_Zvanje)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(id, ime, prezime, datumRodjenja, pocetakRada, null, zavrseniFakulteti, zvanjeId);
}
console.log('Uspješno uneseni nastavnici');

const predmeti = procitajCsv('subjects.csv');
for (let i = 1; i < predmeti.length; i++) {
  const red = ocisti(predmeti[i]);
  if (!red) continue;
  const [id, naziv] = red.split(',');
  baza.prepare('INSERT INTO PREDMETI (ID_Predmet, Naziv) VALUES (?, ?)').run(parseInt(id), ocisti(naziv));
}
console.log('Uspješno uneseni predmeti');

const sviPredmetiId = [];

for (let i = 1; i < predmeti.length; i++) {
  const red = ocisti(predmeti[i]);
  if (!red) continue;
  const [id] = red.split(',');
  sviPredmetiId.push(parseInt(id));
}

const sviNastavnici = baza.prepare('SELECT ID_Nastavnik FROM NASTAVNICI').all();
for (const nastavnik of sviNastavnici) {
  const brojPredmeta = Math.floor(Math.random() * 3) + 3;
  const dodijeljeni = new Set();
  while (dodijeljeni.size < brojPredmeta) {
    const predmetId = sviPredmetiId[Math.floor(Math.random() * sviPredmetiId.length)];
    if (!dodijeljeni.has(predmetId)) {
      dodijeljeni.add(predmetId);
      const brojSati = predmetId % 2 === 0 ? 2 : 3;
      baza.prepare(`
        INSERT OR IGNORE INTO N_PREDMET
        (PREDMETI_ID_Predmet, NASTAVNICI_ID_Nastavnik, Broj_sati_tjedno)
        VALUES (?, ?, ?)`).run(predmetId, nastavnik.ID_Nastavnik, brojSati);
    }
  }
}
console.log("Uspješno uneseni nastavnici i predmeti");

const adrese = procitajCsv('address.csv');
const adresaMap = {};
for (let i = 1; i < adrese.length; i++) {
  const red = ocisti(adrese[i]);
  if (!red) continue;
  const zarez = red.indexOf(',');
  const adresaId = parseInt(red.substring(0, zarez));
  const adresaTekst = ocisti(red.substring(zarez + 1));
  adresaMap[adresaId] = adresaTekst;
}

const sveAdrese = Object.values(adresaMap);

const upisi = procitajCsv('enroll.csv');
const ucenikURazredu = {};
for (let i = 1; i < upisi.length; i++) {
  const red = ocisti(upisi[i]);
  if (!red) continue;
  const [, ucenikId, razredId] = red.split(',');
  ucenikURazredu[parseInt(ucenikId)] = parseInt(razredId);
}

const dodjele = procitajCsv('classSectionAssignment.csv');
const razredPredmeti = {};
for (let i = 1; i < dodjele.length; i++) {
  const red = ocisti(dodjele[i]);
  if (!red) continue;
  const [, razredId, predmetId] = red.split(',');
  const rId = parseInt(razredId);
  if (!razredPredmeti[rId]) razredPredmeti[rId] = [];
  razredPredmeti[rId].push(parseInt(predmetId));
}

const ucenici = procitajCsv('student.csv');
const imeOcaRedovi = procitajCsv('ime_oca.csv');
const svePoste = baza.prepare('SELECT ID_Posta FROM POSTE').all();

for (let i = 0; i < ucenici.length; i++) {
  const red = ocisti(ucenici[i]);
  if (!red) continue;
  const stupci = red.split(',');
  const ucenikId = parseInt(stupci[0]);
  const ime = ocisti(stupci[1]);
  const prezime = ocisti(stupci[3]);
  const datumRodjenja = ocisti(stupci[4]);
  const adresaId = parseInt(stupci[7]);
  const razredId = ucenikURazredu[ucenikId] || 1701;
  const imeOca = ocisti(imeOcaRedovi[(i % (imeOcaRedovi.length - 1)) + 1]);
  const brojPredmeta = (razredPredmeti[razredId] || []).length;

  const adresaTekst = adresaMap[adresaId] ?? sveAdrese[Math.floor(Math.random() * sveAdrese.length)];
  const postaId = svePoste.length > 0 ? svePoste[i % svePoste.length].ID_Posta : 1000;

  const oib = String(ucenikId).padStart(11, '0');

  baza.prepare(`
    INSERT INTO UCENICI (ID_Ucenik, Ime, Prezime, Datum_rodjenja, OIB, Ime_oca, Adresa, Broj_upisanih_predmeta, RAZREDI_ID_Razred, POSTE_ID_Posta)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(ucenikId, ime, prezime, datumRodjenja, oib, imeOca, adresaTekst, brojPredmeta, razredId, postaId);
}
console.log('Uspješno uneseni učenici');

const ocjene = [['Nedovoljan', 1], ['Dovoljan', 2], ['Dobar', 3], ['Vrlo dobar', 4], ['Odličan', 5]];
for (const [naziv, broj] of ocjene) {
  baza.prepare('INSERT INTO OCJENE (Ocjena, Broj_ocjene) VALUES (?, ?)').run(naziv, broj);
}
console.log('Uspješno unesene ocjene');

for (let i = 1; i < razredi.length; i++) {
  const red = ocisti(razredi[i]);
  if (!red) continue;
  const [razredId] = red.split(',');
  const nastavnikId = sviNastavnici[(i - 1) % sviNastavnici.length].ID_Nastavnik;
  baza.prepare('INSERT INTO N_RAZRED (RAZREDI_ID_Razred, NASTAVNICI_ID_Nastavnik) VALUES (?, ?)').run(parseInt(razredId), nastavnikId);
}
console.log('Uspješno unesen nastavnik razred');

for (let i = 1; i < upisi.length; i++) {
  const red = ocisti(upisi[i]);
  if (!red) continue;
  const [, ucenikId, razredId] = red.split(',');
  const predmetiRazreda = razredPredmeti[parseInt(razredId)] || [];
  for (const predmetId of predmetiRazreda) {
    baza.prepare('INSERT OR IGNORE INTO P_UCENIK (UCENICI_ID_Ucenik, PREDMETI_ID_Predmet) VALUES (?, ?)').run(parseInt(ucenikId), predmetId);
  }
}
console.log('Uspješno unesen predmet učenik');

const upisMap = {};
for (let i = 1; i < upisi.length; i++) {
  const red = ocisti(upisi[i]);
  if (!red) continue;
  const [enrollId, ucenikId] = red.split(',');
  upisMap[parseInt(enrollId)] = parseInt(ucenikId);
}

const moguceOcjene = [2, 3, 3, 4, 4, 4, 5, 5];
const ispiti = procitajCsv('studentexams.csv');
for (let i = 1; i < ispiti.length; i++) {
  const red = ocisti(ispiti[i]);
  if (!red) continue;
  const [, enrollId] = red.split(',');
  const ucenikId = upisMap[parseInt(enrollId)];
  if (!ucenikId) continue;
  const ocjena = moguceOcjene[Math.floor(Math.random() * moguceOcjene.length)];
  baza.prepare('INSERT OR IGNORE INTO ZAVRSNA_O (UCENICI_ID_Ucenik, OCJENE_ID_Ocjena) VALUES (?, ?)').run(ucenikId, ocjena);
}
console.log('Uspješno unesena završna ocjena');

baza.close();
console.log('Originalna baza je napunjena.');