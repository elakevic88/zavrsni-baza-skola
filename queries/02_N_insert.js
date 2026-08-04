const Database = require('better-sqlite3');
const path = require('path');
const { procitajCsv, ocisti, ispravakDatuma } = require('../scripts/utils/csvLoader');

function insertNormalizirana(baza, podaci) {
  baza.transaction(() => {
    const stmt = baza.prepare(`INSERT OR IGNORE INTO ZUPANIJE (Naziv) VALUES (?)`);
    for (let i = 0; i < podaci.length; i++) {
      stmt.run(ocisti(podaci[i][9]));
    }
  })();

  const zupanije = baza.prepare(`SELECT ID_Zupanija, Naziv FROM ZUPANIJE`).all();
  const mapaZupanija = {};
  for (let i = 0; i < zupanije.length; i++) {
    mapaZupanija[zupanije[i].Naziv] = zupanije[i].ID_Zupanija;
  }

  baza.transaction(() => {
    const stmt = baza.prepare(`INSERT OR IGNORE INTO POSTE (Postanski_broj, Mjesto, ZUPANIJE_ID_Zupanija) VALUES (?, ?, ?)`);
    for (let i = 0; i < podaci.length; i++) {
      const red = podaci[i];
      stmt.run(parseInt(red[7]), ocisti(red[8]), mapaZupanija[ocisti(red[9])]);
    }
  })();

  baza.transaction(() => {
    const stmt = baza.prepare(`INSERT OR IGNORE INTO SKOLE (Naziv, Adresa) VALUES (?, ?)`);
    for (let i = 0; i < podaci.length; i++) {
      const red = podaci[i];
      stmt.run(ocisti(red[10]), ocisti(red[11]));
    }
  })();

  baza.transaction(() => {
    const stmt = baza.prepare(`INSERT OR IGNORE INTO ZVANJA (Naziv) VALUES (?)`);
    for (let i = 0; i < podaci.length; i++) {
      stmt.run(ocisti(podaci[i][21]));
    }
  })();

  const skole = baza.prepare(`SELECT ID_Skola, Naziv, Adresa FROM SKOLE`).all();
  const zvanja = baza.prepare(`SELECT ID_Zvanje, Naziv FROM ZVANJA`).all();
  const mapaSkola = {};
  const mapaZvanja = {};

  for (let i = 0; i < skole.length; i++) {
    mapaSkola[skole[i].Naziv + "|" + skole[i].Adresa] = skole[i].ID_Skola;
  }
  for (let i = 0; i < zvanja.length; i++) {
    mapaZvanja[zvanja[i].Naziv] = zvanja[i].ID_Zvanje;
  }

  baza.transaction(() => {
    const stmt = baza.prepare(`INSERT OR IGNORE INTO RAZREDI (Broj_razreda, Slovo_razreda, SKOLE_ID_Skola) VALUES (?, ?, ?)`);
    for (let i = 0; i < podaci.length; i++) {
      const red = podaci[i];
      stmt.run(parseInt(red[12]), ocisti(red[13]), mapaSkola[ocisti(red[10]) + "|" + ocisti(red[11])]);
    }
  })();

  const razredi = baza.prepare(`SELECT ID_Razred, Broj_razreda, Slovo_razreda, SKOLE_ID_Skola FROM RAZREDI`).all();
  const mapaRazreda = {};
  for (let i = 0; i < razredi.length; i++) {
    const kljuc = razredi[i].Broj_razreda + "|" + razredi[i].Slovo_razreda + "|" + razredi[i].SKOLE_ID_Skola;
    mapaRazreda[kljuc] = razredi[i].ID_Razred;
  }

  baza.transaction(() => {
    const stmt = baza.prepare(`INSERT OR IGNORE INTO NASTAVNICI (Ime, Prezime, Datum_rodjenja, Pocetak_rada, Kraj_rada, ZVANJA_ID_Zvanje) VALUES (?, ?, ?, ?, ?, ?)`);
    for (let i = 0; i < podaci.length; i++) {
      const red = podaci[i];
      stmt.run(ocisti(red[16]), ocisti(red[17]), ispravakDatuma(ocisti(red[18])), ispravakDatuma(ocisti(red[19])), red[20] ? ispravakDatuma(ocisti(red[20])) : null, mapaZvanja[ocisti(red[21])]);
    }
  })();

  const nastavnici = baza.prepare(`SELECT ID_Nastavnik, Ime, Prezime, Datum_rodjenja FROM NASTAVNICI`).all();
  const mapaNastavnika = {};
  for (let i = 0; i < nastavnici.length; i++) {
    const kljuc = nastavnici[i].Ime + "|" + nastavnici[i].Prezime + "|" + nastavnici[i].Datum_rodjenja;
    mapaNastavnika[kljuc] = nastavnici[i].ID_Nastavnik;
  }

  baza.transaction(() => {
    const stmt = baza.prepare(`INSERT OR IGNORE INTO PREDMETI (Naziv) VALUES (?)`);
    for (let i = 0; i < podaci.length; i++) {
      const red = podaci[i];
      stmt.run(ocisti(red[14]));
    }
  })();

  const predmeti = baza.prepare(`SELECT ID_Predmet, Naziv FROM PREDMETI`).all();
  const mapaPredmeta = {};
  for (let i = 0; i < predmeti.length; i++) {
    mapaPredmeta[predmeti[i].Naziv] = predmeti[i].ID_Predmet;
  }

  const poste = baza.prepare(`SELECT ID_Posta, Postanski_broj FROM POSTE`).all();
  const mapaPosta = {};
  for (let i = 0; i < poste.length; i++) {
    mapaPosta[poste[i].Postanski_broj] = poste[i].ID_Posta;
  }

  baza.transaction(() => {
    const stmt = baza.prepare(`INSERT OR IGNORE INTO UCENICI (ID_Ucenik, Ime, Prezime, Datum_rodjenja, OIB, Ime_oca, Adresa, RAZREDI_ID_Razred, POSTE_ID_Posta) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    for (let i = 0; i < podaci.length; i++) {
      const red = podaci[i];
      const skolaId = mapaSkola[ocisti(red[10]) + "|" + ocisti(red[11])];
      const kljucRazreda = parseInt(red[12]) + "|" + ocisti(red[13]) + "|" + skolaId;
      stmt.run(parseInt(red[0]), ocisti(red[1]), ocisti(red[2]), ispravakDatuma(ocisti(red[3])), ocisti(red[4]), ocisti(red[5]), ocisti(red[6]), mapaRazreda[kljucRazreda], mapaPosta[parseInt(red[7])]);
    }
  })();

  baza.transaction(() => {
    const stmt = baza.prepare(`INSERT OR IGNORE INTO N_SKOLE (NASTAVNICI_ID_Nastavnik, SKOLE_ID_Skola) VALUES (?, ?)`);
    for (let i = 0; i < podaci.length; i++) {
      const red = podaci[i];
      const nastavnikId = mapaNastavnika[ocisti(red[16]) + "|" + ocisti(red[17]) + "|" + ispravakDatuma(ocisti(red[18]))];
      const skolaId = mapaSkola[ocisti(red[10]) + "|" + ocisti(red[11])];
      stmt.run(nastavnikId, skolaId);
    }
  })();

  baza.transaction(() => {
    const stmt = baza.prepare(`INSERT OR IGNORE INTO NASTAVA (PREDMETI_ID_Predmet, NASTAVNICI_ID_Nastavnik, RAZREDI_ID_Razred, Broj_sati_tjedno) VALUES (?, ?, ?, ?)`);
    for (let i = 0; i < podaci.length; i++) {
      const red = podaci[i];
      const predmetId = mapaPredmeta[ocisti(red[14])];
      const nastavnikId = mapaNastavnika[ocisti(red[16]) + "|" + ocisti(red[17]) + "|" + ispravakDatuma(ocisti(red[18]))];
      const skolaId = mapaSkola[ocisti(red[10]) + "|" + ocisti(red[11])];
      const kljucRazreda = parseInt(red[12]) + "|" + ocisti(red[13]) + "|" + skolaId;
      stmt.run(predmetId, nastavnikId, mapaRazreda[kljucRazreda], parseInt(red[15]));
    }
  })();

  const nastava = baza.prepare(`SELECT ID_Nastava, PREDMETI_ID_Predmet, NASTAVNICI_ID_Nastavnik, RAZREDI_ID_Razred FROM NASTAVA`).all();
  const mapaNastave = {};
  for (let i = 0; i < nastava.length; i++) {
    const kljuc = nastava[i].PREDMETI_ID_Predmet + "|" + nastava[i].NASTAVNICI_ID_Nastavnik + "|" + nastava[i].RAZREDI_ID_Razred;
    mapaNastave[kljuc] = nastava[i].ID_Nastava;
  }

  baza.transaction(() => {
    const stmt = baza.prepare(`INSERT OR IGNORE INTO P_UCENIK (UCENICI_ID_Ucenik, NASTAVA_ID_Nastava) VALUES (?, ?)`);
    for (let i = 0; i < podaci.length; i++) {
      const red = podaci[i];
      const predmetId = mapaPredmeta[ocisti(red[14])];
      const nastavnikId = mapaNastavnika[ocisti(red[16]) + "|" + ocisti(red[17]) + "|" + ispravakDatuma(ocisti(red[18]))];
      const skolaId = mapaSkola[ocisti(red[10]) + "|" + ocisti(red[11])];
      const kljucRazreda = parseInt(red[12]) + "|" + ocisti(red[13]) + "|" + skolaId;
      const razredId = mapaRazreda[kljucRazreda];
      const kljucNastave = predmetId + "|" + nastavnikId + "|" + razredId;
      stmt.run(parseInt(red[0]), mapaNastave[kljucNastave]);
    }
  })();

  baza.transaction(() => {
    const stmt = baza.prepare(`INSERT OR IGNORE INTO OCJENE (ID_Ocjena, Ocjena) VALUES (?, ?)`);
    for (let i = 1; i <= 5; i++) {
      stmt.run(i, i);
    }
  })();

  baza.transaction(() => {
    const stmt = baza.prepare(`INSERT OR IGNORE INTO GODISNJI_USPJEH (UCENICI_ID_Ucenik, NASTAVA_ID_Nastava, OCJENE_ID_Ocjena) VALUES (?, ?, ?)`);
    for (let i = 0; i < podaci.length; i++) {
      const red = podaci[i];
      const predmetId = mapaPredmeta[ocisti(red[14])];
      const nastavnikId = mapaNastavnika[ocisti(red[16]) + "|" + ocisti(red[17]) + "|" + ispravakDatuma(ocisti(red[18]))];
      const skolaId = mapaSkola[ocisti(red[10]) + "|" + ocisti(red[11])];
      const kljucRazreda = parseInt(red[12]) + "|" + ocisti(red[13]) + "|" + skolaId;
      const razredId = mapaRazreda[kljucRazreda];
      const kljucNastave = predmetId + "|" + nastavnikId + "|" + razredId;
      stmt.run(parseInt(red[0]), mapaNastave[kljucNastave], parseInt(red[22]));
    }
  })();
}

module.exports = { insertNormalizirana };

if (require.main === module) {
  const baza = new Database(path.join(__dirname, '../databases/dbs/02_schema_normalized.db'));
  baza.pragma('foreign_keys = ON');
  const podaci = procitajCsv('srednja_skola.csv');
  insertNormalizirana(baza, podaci);
  console.log('Gotovo!');
  baza.close();
}