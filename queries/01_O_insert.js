const Database = require('better-sqlite3');
const path = require('path');
const { procitajCsv, ocisti, ispravakDatuma } = require('../scripts/utils/csvLoader');

function insertOriginalna(baza, podaci) {
  baza.transaction(() => {
    const stmt = baza.prepare(`INSERT INTO SREDNJA_SKOLA (ID_Ucenik, Ime_ucenika, Prezime_ucenika, Datum_rodjenja_ucenika, OIB, Ime_oca, Adresa_ucenika,
    Broj_razreda, Slovo_razreda, Naziv_skole, Adresa_skole, Postanski_broj, Mjesto, Naziv_zupanije,
    Naziv_predmeta, Broj_sati_tjedno, Ime_nastavnika, Prezime_nastavnika, Datum_rodjenja_nastavnika,
    Pocetak_rada, Kraj_rada, Naziv_zvanja_nastavnika, Ocjena) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    for (let i = 0; i < podaci.length; i++) {
      const [id, imeUcenika, prezimeUcenika, datumRodjenja, oib, imeOca, adresaUcenika, postanskiBroj, mjesto, nazivZupanije, nazivSkole, adresaSkole,
      brojRazreda, slovoRazreda, nazivPredmeta, brojSatiTjedno,
      imeNastavnika, prezimeNastavnika, datumRodjenjaNastavnika,
      pocetakRada, krajRada, nazivZvanja, brojOcjene] = podaci[i];

      if (!id) continue;
      stmt.run(parseInt(id), ocisti(imeUcenika), ocisti(prezimeUcenika), ispravakDatuma(ocisti(datumRodjenja)),
        ocisti(oib), ocisti(imeOca), ocisti(adresaUcenika), parseInt(brojRazreda), ocisti(slovoRazreda),
        ocisti(nazivSkole), ocisti(adresaSkole), parseInt(postanskiBroj), ocisti(mjesto),
        ocisti(nazivZupanije), ocisti(nazivPredmeta), parseInt(brojSatiTjedno),
        ocisti(imeNastavnika), ocisti(prezimeNastavnika), ispravakDatuma(ocisti(datumRodjenjaNastavnika)),
        ispravakDatuma(ocisti(pocetakRada)), ispravakDatuma(ocisti(krajRada)),
        ocisti(nazivZvanja), parseInt(brojOcjene));
    }
  })();
}

module.exports = { insertOriginalna };

if (require.main === module) {
  const baza = new Database(path.join(__dirname, '../databases/dbs/01_schema_original.db'));
  baza.pragma('foreign_keys = ON');
  const podaci = procitajCsv('srednja_skola.csv');
  insertOriginalna(baza, podaci);
  baza.close();
  console.log('Gotovo!');
}