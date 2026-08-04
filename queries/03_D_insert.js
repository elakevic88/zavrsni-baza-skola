const Database = require('better-sqlite3');
const path = require('path');
const { procitajCsv, ocisti, ispravakDatuma } = require('../scripts/utils/csvLoader');

function insertDenormalizirana(baza, podaci) {
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

  const brojPredmeta = {};
  for (let i = 0; i < podaci.length; i++) {
    const id = parseInt(podaci[i][0]);
    if (!brojPredmeta[id]) brojPredmeta[id] = 0;
    brojPredmeta[id]++;
  }

  baza.transaction(() => {
    const stmt = baza.prepare(`INSERT OR IGNORE INTO UCENICI (ID_Ucenik, Ime, Prezime, Datum_rodjenja, OIB, Ime_oca, Adresa, Broj_upisanih_predmeta, RAZREDI_ID_Razred, POSTE_ID_Posta)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    for (let i = 0; i < podaci.length; i++) {
      const red = podaci[i];
      const skolaId = mapaSkola[ocisti(red[10]) + "|" + ocisti(red[11])];
      const kljucRazreda = parseInt(red[12]) + "|" + ocisti(red[13]) + "|" + skolaId;
      stmt.run(parseInt(red[0]), ocisti(red[1]), ocisti(red[2]), ispravakDatuma(ocisti(red[3])), ocisti(red[4]), ocisti(red[5]), ocisti(red[6]), brojPredmeta[parseInt(red[0])],
      mapaRazreda[kljucRazreda], mapaPosta[parseInt(red[7])]);
    }
  })();

  baza.transaction(() => {
    const stmt = baza.prepare(`INSERT OR IGNORE INTO N_SKOLE (NASTAVNICI_ID_Nastavnik, Naziv_skole, Adresa_skole) VALUES (?, ?, ?)`);
    for (let i = 0; i < podaci.length; i++) {
      const red = podaci[i];
      const nastavnikId = mapaNastavnika[ocisti(red[16]) + "|" + ocisti(red[17]) + "|" + ispravakDatuma(ocisti(red[18]))];
      stmt.run(nastavnikId, ocisti(red[10]), ocisti(red[11]));
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
    const ocjene = [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]];
    for (let i = 0; i < ocjene.length; i++) {
      stmt.run(ocjene[i][0], ocjene[i][1]);
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

  baza.prepare(`INSERT OR IGNORE INTO UCENIK_INFO (ID_Ucenik, Ime, Prezime, Datum_rodjenja, OIB, Adresa, Ime_oca, Broj_razreda,
  Slovo_razreda, Naziv_skole, Adresa_skole, Postanski_broj, Mjesto, Naziv_zupanije, Broj_upisanih_predmeta)
  SELECT u.ID_Ucenik, u.Ime, u.Prezime, u.Datum_rodjenja, u.OIB, u.Adresa, u.Ime_oca, r.Broj_razreda, r.Slovo_razreda, s.Naziv,
  s.Adresa, p.Postanski_broj, p.Mjesto, z.Naziv, u.Broj_upisanih_predmeta
  FROM UCENICI u
  JOIN RAZREDI r ON u.RAZREDI_ID_Razred = r.ID_Razred
  JOIN SKOLE s ON r.SKOLE_ID_Skola = s.ID_Skola
  JOIN POSTE p ON u.POSTE_ID_Posta = p.ID_Posta
  JOIN ZUPANIJE z ON p.ZUPANIJE_ID_Zupanija = z.ID_Zupanija`).run();

  const brojPredmetaNastavnika = {};
  for (let i = 0; i < podaci.length; i++) {
    const red = podaci[i];
    const kljuc = ocisti(red[16]) + "|" + ocisti(red[17]) + "|" + ispravakDatuma(ocisti(red[18]));
    if (!brojPredmetaNastavnika[kljuc]) brojPredmetaNastavnika[kljuc] = new Set();
    brojPredmetaNastavnika[kljuc].add(ocisti(red[14]));
  }

  const stmtInfo = baza.prepare(`INSERT OR IGNORE INTO NASTAVNIK_INFO (ID_Nastavnik, Ime, Prezime, Datum_rodjenja, Pocetak_rada, Kraj_rada,
  Naziv_zvanja, Broj_predmeta) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const stmtPodaciNastavnika = baza.prepare(`SELECT n.Pocetak_rada, n.Kraj_rada, z.Naziv
  FROM NASTAVNICI n
  JOIN ZVANJA z ON n.ZVANJA_ID_Zvanje = z.ID_Zvanje
  WHERE n.ID_Nastavnik = ?`);

  baza.transaction(() => {
    for (let i = 0; i < nastavnici.length; i++) {
      const nastavnik = nastavnici[i];
      const kljuc = nastavnik.Ime + "|" + nastavnik.Prezime + "|" + nastavnik.Datum_rodjenja;
      const podaciNastavnika = stmtPodaciNastavnika.get(nastavnik.ID_Nastavnik);

      stmtInfo.run(nastavnik.ID_Nastavnik, nastavnik.Ime, nastavnik.Prezime, nastavnik.Datum_rodjenja, podaciNastavnika.Pocetak_rada,
      podaciNastavnika.Kraj_rada, podaciNastavnika.Naziv, brojPredmetaNastavnika[kljuc] ? brojPredmetaNastavnika[kljuc].size : 0);
    }
  })();
}

module.exports = { insertDenormalizirana };

if (require.main === module) {
  const baza = new Database(path.join(__dirname, '../databases/dbs/03_schema_denormalized.db'));
  baza.pragma('foreign_keys = ON');
  const podaci = procitajCsv('srednja_skola.csv');
  insertDenormalizirana(baza, podaci);
  console.log('Gotovo!');
  baza.close();
}