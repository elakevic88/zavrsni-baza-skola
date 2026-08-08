const fs = require('fs');
const path = require("path");

class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }
    next() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
    randint(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
    choice(array) {
        return array[Math.floor(this.next() * array.length)];
    }
    choices(population, weights, k = 1) {
        const results = [];
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        for (let i = 0; i < k; i++) {
            let r = this.next() * totalWeight;
            for (let j = 0; j < population.length; j++) {
                if (r < weights[j]) {
                    results.push(population[j]);
                    break;
                }
                r -= weights[j];
            }
        }
        return results;
    }
    sample(population, k) {
        const result = [];
        const pool = [...population];
        for (let i = 0; i < k; i++) {
            const index = Math.floor(this.next() * pool.length);
            result.push(pool.splice(index, 1)[0]);
        }
        return result;
    }
}

const random = new SeededRandom(42);

const BROJ_UCENIKA = 200;
const PREDMETA_PO_UCENIKU = 5;

function randDate(start, end) {
    const startTime = start.getTime();
    const endTime = end.getTime();
    const deltaDays = Math.floor((endTime - startTime) / (1000 * 60 * 60 * 24));
    const randomDays = random.randint(0, deltaDays);
    const result = new Date(startTime);
    result.setDate(result.getDate() + randomDays);
    return result;
}

const mjesta = [
    [1, 10000, "Zagreb", "Grad Zagreb"],
    [2, 21000, "Split", "Splitsko-dalmatinska"],
    [3, 31000, "Osijek", "Osječko-baranjska"],
    [4, 51000, "Rijeka", "Primorsko-goranska"],
    [5, 42000, "Varaždin", "Varaždinska"],
    [6, 23000, "Zadar", "Zadarska"],
    [7, 35000, "Slavonski Brod", "Brodsko-posavska"],
    [8, 47000, "Karlovac", "Karlovačka"],
    [9, 44000, "Sisak", "Sisačko-moslavačka"],
    [10, 20000, "Dubrovnik", "Dubrovačko-neretvanska"]
];

const dfMjesta = mjesta.map(row => ({
    ID_Mjesto: row[0],
    Postanski_broj: row[1],
    Mjesto: row[2],
    Naziv_zupanije: row[3]
}));

const skole = [
    [1, "Gimnazija Središte", "Ulica škole 1, Zagreb"],
    [2, "Ekonomska škola Jadran", "Ulica škole 2, Split"],
    [3, "Tehnička škola Drava", "Ulica škole 3, Osijek"],
    [4, "Gimnazija Kvarner", "Ulica škole 4, Rijeka"],
    [5, "Srednja škola Sjever", "Ulica škole 5, Varaždin"]
];

const dfSkole = skole.map(row => ({
    ID_Skola: row[0],
    Naziv_skole: row[1],
    Adresa_skole: row[2]
}));

const predmeti = [
    [1, "Hrvatski jezik", 4],
    [2, "Matematika", 4],
    [3, "Engleski jezik", 3],
    [4, "Fizika", 2],
    [5, "Kemija", 2],
    [6, "Biologija", 2],
    [7, "Povijest", 2],
    [8, "Geografija", 2],
    [9, "Informatika", 2],
    [10, "Tjelesna i zdravstvena kultura", 2]
];

const dfPredmeti = predmeti.map(row => ({
    ID_Predmet: row[0],
    Naziv_predmeta: row[1],
    Broj_sati_tjedno: row[2]
}));

const imenaUcenika = [
    "Ana", "Ivan", "Petra", "Marko", "Dora",
    "Luka", "Mia", "Nikola", "Sara", "Filip",
    "Ema", "Matej", "Iva", "Karlo", "Nina",
    "Dino", "Lea", "Toni", "Marija", "Tin"
];

const prezimenaUcenika = [
    "Horvat", "Kovač", "Babić", "Marić", "Novak",
    "Jurić", "Knežević", "Božić", "Radić", "Perić",
    "Pavić", "Lijić", "Matić", "Bilić", "Franić",
    "Tomić", "Lukić", "Marković", "Vidović", "Stipić"
];

const imenaOceva = [
    "Ivan", "Marko", "Josip", "Tomislav", "Ante",
    "Mario", "Zoran", "Davor", "Nikola", "Petar"
];

const ulice = [
    "Ilica",
    "Vukovarska",
    "Savska",
    "Držićeva",
    "Radićeva",
    "Zagrebačka",
    "Frankopanska",
    "Kolodvorska",
    "Trg mladosti",
    "Ulica lipa"
];

const ucenici = [];

for (let i = 1; i <= BROJ_UCENIKA; i++) {

    const idSkola = ((i - 1) % 5) + 1;
    const idMjesto = ((i * 7) % 10) + 1;

    const brojRazreda = ((i - 1) % 4) + 1;
    const slovoRazreda = ["A", "B", "C"][Math.floor(((i - 1) / 4) % 3)];

    const godinaRodjenjaMap = {
        1: 2010,
        2: 2009,
        3: 2008,
        4: 2007
    };
    const godinaRodjenja = godinaRodjenjaMap[brojRazreda];

    const datumRodjenja = randDate(
        new Date(godinaRodjenja, 0, 1),
        new Date(godinaRodjenja, 11, 31)
    );

    const oib = (99000000000n + BigInt(i)).toString();

    ucenici.push({
        Id: i,
        Ime_ucenika: random.choice(imenaUcenika),
        Prezime_ucenika: random.choice(prezimenaUcenika),
        Datum_rodjenja_ucenika: datumRodjenja.toISOString().split('T')[0],
        OIB: oib,
        Ime_oca: random.choice(imenaOceva),
        Adresa_ucenika: `${random.choice(ulice)} ${random.randint(1, 200)}`,
        ID_Mjesto: idMjesto,
        ID_Skola: idSkola,
        Broj_razreda: brojRazreda,
        Slovo_razreda: slovoRazreda
    });
}

const dfUcenici = ucenici;

const imenaNastavnika = [
    "Ana","Ivan","Petra","Marko","Marina",
    "Davor","Ivana","Tomislav","Katarina","Hrvoje",
    "Maja","Zoran","Martina","Goran","Jelena",
    "Robert","Sanja","Damir","Kristina","Boris",
    "Vedrana","Igor","Mirna","Nenad","Tihana"
];

const prezimenaNastavnika = [
    "Horvat","Marić","Kovač","Babić","Novak",
    "Jurić","Pavić","Tomić","Perić","Radić",
    "Stanić","Matić","Ladić","Bilić","Lukić",
    "Marković","Božić","Knežević","Vidović","Krstić",
    "Barišić","Lončar","Rukavina","Miletić","Đurić"
];

const zvanja = [
    "profesor",
    "profesor mentor",
    "profesor savjetnik"
];

const paroviPredmeta = [
    ["Hrvatski jezik", "Povijest"],
    ["Matematika", "Fizika"],
    ["Engleski jezik", "Geografija"],
    ["Kemija", "Biologija"],
    ["Informatika", "Tjelesna i zdravstvena kultura"]
];

const nastavnici = [];

let idNastavnik = 1;

for (let idSkola = 1; idSkola <= 5; idSkola++) {

    for (const par of paroviPredmeta) {

        const datumRodjenja = randDate(
            new Date(1968, 0, 1),
            new Date(1988, 11, 31)
        );

        const najranijiPocetak = new Date(datumRodjenja.getFullYear() + 23, 8, 1);

        const pocetakRada = randDate(
            new Date(Math.max(new Date(1995, 8, 1).getTime(), najranijiPocetak.getTime())),
            new Date(2018, 8, 1)
        );

        let krajRada = "";

        if (random.next() < 0.12) {
            krajRada = randDate(
                new Date(2022, 5, 1),
                new Date(2025, 7, 31)
            ).toISOString().split('T')[0];
        }

        const zvanje = random.choices(
            zvanja,
            [60, 25, 15],
            1
        )[0];

        for (const predmet of par) {

            nastavnici.push({
                ID_Nastavnik: idNastavnik,
                ID_Skola: idSkola,
                Naziv_predmeta: predmet,
                Ime_nastavnika: imenaNastavnika[idNastavnik - 1],
                Prezime_nastavnika: prezimenaNastavnika[idNastavnik - 1],
                Datum_rodjenja_nastavnika: datumRodjenja.toISOString().split('T')[0],
                Pocetak_rada: pocetakRada.toISOString().split('T')[0],
                Kraj_rada: krajRada,
                Naziv_zvanja: zvanje
            });
        }

        idNastavnik += 1;
    }
}

const dfNastavnici = nastavnici;

const obavezniPredmeti = [
    "Hrvatski jezik",
    "Matematika",
    "Engleski jezik"
];

const dodatniPredmeti = [
    "Fizika",
    "Kemija",
    "Biologija",
    "Povijest",
    "Geografija",
    "Informatika",
    "Tjelesna i zdravstvena kultura"
];

let retci = [];

for (const ucenik of dfUcenici) {

    const dodatnaDva = random.sample(dodatniPredmeti, 2);

    const predmetiUcenika = [...obavezniPredmeti, ...dodatnaDva];

    for (const predmet of predmetiUcenika) {

        retci.push({
            Id: ucenik.Id,
            Ime_ucenika: ucenik.Ime_ucenika,
            Prezime_ucenika: ucenik.Prezime_ucenika,
            Datum_rodjenja_ucenika: ucenik.Datum_rodjenja_ucenika,
            OIB: ucenik.OIB,
            Ime_oca: ucenik.Ime_oca,
            Adresa_ucenika: ucenik.Adresa_ucenika,
            ID_Mjesto: ucenik.ID_Mjesto,
            ID_Skola: ucenik.ID_Skola,
            Broj_razreda: ucenik.Broj_razreda,
            Slovo_razreda: ucenik.Slovo_razreda,
            Naziv_predmeta: predmet
        });
    }
}

let df = retci;

df = df.map(row => {
    const mjesto = dfMjesta.find(m => m.ID_Mjesto === row.ID_Mjesto);
    return { ...row, ...mjesto };
});

df = df.map(row => {
    const skola = dfSkole.find(s => s.ID_Skola === row.ID_Skola);
    return { ...row, ...skola };
});

df = df.map(row => {
    const predmet = dfPredmeti.find(p => p.Naziv_predmeta === row.Naziv_predmeta);
    return { ...row, Broj_sati_tjedno: predmet ? predmet.Broj_sati_tjedno : null };
});

df = df.map(row => {
    const nastavnik = dfNastavnici.find(n => n.ID_Skola === row.ID_Skola && n.Naziv_predmeta === row.Naziv_predmeta);
    if (nastavnik) {
        return {
            ...row,
            Ime_nastavnika: nastavnik.Ime_nastavnika,
            Prezime_nastavnika: nastavnik.Prezime_nastavnika,
            Datum_rodjenja_nastavnika: nastavnik.Datum_rodjenja_nastavnika,
            Pocetak_rada: nastavnik.Pocetak_rada,
            Kraj_rada: nastavnik.Kraj_rada,
            Naziv_zvanja: nastavnik.Naziv_zvanja
        };
    }
    return row;
});

const ocjenePop = [1, 2, 3, 4, 5];
const ocjeneWeights = [5, 10, 25, 35, 25];
const generatedOcjene = random.choices(ocjenePop, ocjeneWeights, df.length);

df = df.map((row, idx) => ({
    ...row,
    Broj_ocjene: generatedOcjene[idx]
}));

df = df.map(({ ID_Mjesto, ID_Skola, ...rest }) => rest);

const stupci = [
    "Id",
    "Ime_ucenika",
    "Prezime_ucenika",
    "Datum_rodjenja_ucenika",
    "OIB",
    "Ime_oca",
    "Adresa_ucenika",
    "Postanski_broj",
    "Mjesto",
    "Naziv_zupanije",
    "Naziv_skole",
    "Adresa_skole",
    "Broj_razreda",
    "Slovo_razreda",
    "Naziv_predmeta",
    "Broj_sati_tjedno",
    "Ime_nastavnika",
    "Prezime_nastavnika",
    "Datum_rodjenja_nastavnika",
    "Pocetak_rada",
    "Kraj_rada",
    "Naziv_zvanja",
    "Broj_ocjene"
];

df = df.map(row => {
    const orderedRow = {};
    stupci.forEach(col => {
        orderedRow[col] = row[col];
    });
    return orderedRow;
});

console.log("======================================");
console.log("PROVJERA DATASETA");
console.log("======================================");

console.log("Ukupno redaka:", df.length);

const uniqueIds = new Set(df.map(r => r.Id));
console.log("Broj učenika:", uniqueIds.size);

const uniqueSkole = new Set(df.map(r => r.Naziv_skole));
console.log("Broj škola:", uniqueSkole.size);

const uniquePredmeti = new Set(df.map(r => r.Naziv_predmeta));
console.log("Broj predmeta:", uniquePredmeti.size);

const uniqueNastavnici = new Set(df.map(r => `${r.Ime_nastavnika}|${r.Prezime_nastavnika}|${r.Datum_rodjenja_nastavnika}`));
console.log("Broj nastavnika:", uniqueNastavnici.size);

const uniqueMjesta = new Set(df.map(r => r.Mjesto));
console.log("Broj mjesta:", uniqueMjesta.size);

const uniqueZupanije = new Set(df.map(r => r.Naziv_zupanije));
console.log("Broj županija:", uniqueZupanije.size);

const predmetiPoUceniku = {};
df.forEach(r => {
    if (!predmetiPoUceniku[r.Id]) predmetiPoUceniku[r.Id] = new Set();
    predmetiPoUceniku[r.Id].add(r.Naziv_predmeta);
});

const counts = {};
Object.values(predmetiPoUceniku).forEach(s => {
    const size = s.size;
    counts[size] = (counts[size] || 0) + 1;
});

console.log("\nBroj predmeta po učeniku:");
console.log(counts);

const adresePoSkoli = {};
df.forEach(r => {
    if (!adresePoSkoli[r.Naziv_skole]) adresePoSkoli[r.Naziv_skole] = new Set();
    adresePoSkoli[r.Naziv_skole].add(r.Adresa_skole);
});

console.log("\nBroj adresa po školi:");
const provjeraSkolaMax = Math.max(...Object.values(adresePoSkoli).map(s => s.size));
Object.keys(adresePoSkoli).forEach(k => console.log(`${k}: ${adresePoSkoli[k].size}`));

const postaAgg = {};
df.forEach(r => {
    if (!postaAgg[r.Postanski_broj]) {
        postaAgg[r.Postanski_broj] = { mjesta: new Set(), zupanije: new Set() };
    }
    postaAgg[r.Postanski_broj].mjesta.add(r.Mjesto);
    postaAgg[r.Postanski_broj].zupanije.add(r.Naziv_zupanije);
});

console.log("\nProvjera poštanskih brojeva:");
Object.keys(postaAgg).forEach(k => {
    console.log(`${k}: mjesta=${postaAgg[k].mjesta.size}, zupanije=${postaAgg[k].zupanije.size}`);
});

if (df.length !== 1000) throw new Error("Dataset nema 1000 redaka!");

if (uniqueIds.size !== 200) throw new Error("Dataset nema 200 različitih učenika!");

if (!Object.values(predmetiPoUceniku).every(s => s.size === 5)) {
    throw new Error("Neki učenik nema točno 5 različitih predmeta!");
}

if (provjeraSkolaMax !== 1) throw new Error("Ista škola ima više različitih adresa!");

const provjeraPostaMjestaMax = Math.max(...Object.values(postaAgg).map(v => v.mjesta.size));
if (provjeraPostaMjestaMax !== 1) throw new Error("Isti poštanski broj pripada različitim mjestima!");

const provjeraPostaZupanijaMax = Math.max(...Object.values(postaAgg).map(v => v.zupanije.size));
if (provjeraPostaZupanijaMax !== 1) throw new Error("Isti poštanski broj pripada različitim županijama!");

const hasNulls = df.some(row => Object.values(row).some(val => val === null || val === undefined));
if (hasNulls) throw new Error("Postoje neočekivane NULL vrijednosti!");

console.log("\nSve provjere su uspješno prošle.");

const nazivDatoteke = path.join(__dirname, "srednja_skola.csv");

function toCsv(data, columns) {
    const header = columns.join(",");
    const rows = data.map(row => {
        return columns.map(col => {
            let val = row[col];
            if (val === null || val === undefined) val = "";
            val = val.toString();
            if (val.includes(",") || val.includes('"') || val.includes("\n")) {
                val = `"${val.replace(/"/g, '""')}"`;
            }
            return val;
        }).join(",");
    });
    return "\ufeff" + [header, ...rows].join("\n");
}

const csvContent = toCsv(df, stupci);
fs.writeFileSync(nazivDatoteke, csvContent, "utf8");

console.log(`\nDatoteka '${nazivDatoteke}' uspješno je spremljena.`);