import pandas as pd
import random
from datetime import date, timedelta
import os

random.seed(42)

BROJ_UCENIKA = 200
PREDMETA_PO_UCENIKU = 5

def rand_date(start, end):
    delta = (end - start).days
    return start + timedelta(days=random.randint(0, delta))

mjesta = [
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
]

df_mjesta = pd.DataFrame(
    mjesta,
    columns=[
        "ID_Mjesto",
        "Postanski_broj",
        "Mjesto",
        "Naziv_zupanije"
    ]
)

skole = [
    [1, "Gimnazija Središte", "Ulica škole 1, Zagreb"],
    [2, "Ekonomska škola Jadran", "Ulica škole 2, Split"],
    [3, "Tehnička škola Drava", "Ulica škole 3, Osijek"],
    [4, "Gimnazija Kvarner", "Ulica škole 4, Rijeka"],
    [5, "Srednja škola Sjever", "Ulica škole 5, Varaždin"]
]

df_skole = pd.DataFrame(
    skole,
    columns=[
        "ID_Skola",
        "Naziv_skole",
        "Adresa_skole"
    ]
)

predmeti = [
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
]

df_predmeti = pd.DataFrame(
    predmeti,
    columns=[
        "ID_Predmet",
        "Naziv_predmeta",
        "Broj_sati_tjedno"
    ]
)

imena_ucenika = [
    "Ana", "Ivan", "Petra", "Marko", "Dora",
    "Luka", "Mia", "Nikola", "Sara", "Filip",
    "Ema", "Matej", "Iva", "Karlo", "Nina",
    "Dino", "Lea", "Toni", "Marija", "Tin"
]

prezimena_ucenika = [
    "Horvat", "Kovač", "Babić", "Marić", "Novak",
    "Jurić", "Knežević", "Božić", "Radić", "Perić",
    "Pavić", "Lijić", "Matić", "Bilić", "Franić",
    "Tomić", "Lukić", "Marković", "Vidović", "Stipić"
]

imena_oceva = [
    "Ivan", "Marko", "Josip", "Tomislav", "Ante",
    "Mario", "Zoran", "Davor", "Nikola", "Petar"
]

ulice = [
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
]

ucenici = []

for i in range(1, BROJ_UCENIKA + 1):

    id_skola = ((i - 1) % 5) + 1
    id_mjesto = ((i * 7) % 10) + 1

    broj_razreda = ((i - 1) % 4) + 1
    slovo_razreda = ["A", "B", "C"][((i - 1) // 4) % 3]

    godina_rodjenja = {
        1: 2010,
        2: 2009,
        3: 2008,
        4: 2007
    }[broj_razreda]

    datum_rodjenja = rand_date(
        date(godina_rodjenja, 1, 1),
        date(godina_rodjenja, 12, 31)
    )

    oib = str(99000000000 + i)

    ucenici.append([
        i,
        random.choice(imena_ucenika),
        random.choice(prezimena_ucenika),
        datum_rodjenja.isoformat(),
        oib,
        random.choice(imena_oceva),
        f"{random.choice(ulice)} {random.randint(1, 200)}",
        id_mjesto,
        id_skola,
        broj_razreda,
        slovo_razreda
    ])

df_ucenici = pd.DataFrame(
    ucenici,
    columns=[
        "Id",
        "Ime_ucenika",
        "Prezime_ucenika",
        "Datum_rodjenja_ucenika",
        "OIB",
        "Ime_oca",
        "Adresa_ucenika",
        "ID_Mjesto",
        "ID_Skola",
        "Broj_razreda",
        "Slovo_razreda"
    ]
)

imena_nastavnika = [
    "Ana","Ivan","Petra","Marko","Marina",
    "Davor","Ivana","Tomislav","Katarina","Hrvoje",
    "Maja","Zoran","Martina","Goran","Jelena",
    "Robert","Sanja","Damir","Kristina","Boris",
    "Vedrana","Igor","Mirna","Nenad","Tihana"
]

prezimena_nastavnika = [
    "Horvat","Marić","Kovač","Babić","Novak",
    "Jurić","Pavić","Tomić","Perić","Radić",
    "Stanić","Matić","Ladić","Bilić","Lukić",
    "Marković","Božić","Knežević","Vidović","Krstić",
    "Barišić","Lončar","Rukavina","Miletić","Đurić"
]

zvanja = [
    "profesor",
    "profesor mentor",
    "profesor savjetnik"
]

parovi_predmeta = [
    ["Hrvatski jezik", "Povijest"],
    ["Matematika", "Fizika"],
    ["Engleski jezik", "Geografija"],
    ["Kemija", "Biologija"],
    ["Informatika", "Tjelesna i zdravstvena kultura"]
]

nastavnici = []

id_nastavnik = 1

for id_skola in range(1, 6):

    for par in parovi_predmeta:

        datum_rodjenja = rand_date(
            date(1968, 1, 1),
            date(1988, 12, 31)
        )

        najraniji_pocetak = date(datum_rodjenja.year + 23, 9, 1)

        pocetak_rada = rand_date(
            max(date(1995, 9, 1), najraniji_pocetak),
            date(2018, 9, 1)
        )

        kraj_rada = ""

        if random.random() < 0.12:
            kraj_rada = rand_date(
                date(2022, 6, 1),
                date(2025, 8, 31)
            ).isoformat()

        zvanje = random.choices(
            zvanja,
            weights=[60, 25, 15],
            k=1
        )[0]

        for predmet in par:

            nastavnici.append([
                id_nastavnik,
                id_skola,
                predmet,
                imena_nastavnika[id_nastavnik - 1],
                prezimena_nastavnika[id_nastavnik - 1],
                datum_rodjenja.isoformat(),
                pocetak_rada.isoformat(),
                kraj_rada,
                zvanje
            ])

        id_nastavnik += 1

df_nastavnici = pd.DataFrame(
    nastavnici,
    columns=[
        "ID_Nastavnik",
        "ID_Skola",
        "Naziv_predmeta",
        "Ime_nastavnika",
        "Prezime_nastavnika",
        "Datum_rodjenja_nastavnika",
        "Pocetak_rada",
        "Kraj_rada",
        "Naziv_zvanja"
    ]
)

obavezni_predmeti = [
    "Hrvatski jezik",
    "Matematika",
    "Engleski jezik"
]

dodatni_predmeti = [
    "Fizika",
    "Kemija",
    "Biologija",
    "Povijest",
    "Geografija",
    "Informatika",
    "Tjelesna i zdravstvena kultura"
]

retci = []

for _, ucenik in df_ucenici.iterrows():

    dodatna_dva = random.sample(dodatni_predmeti, 2)

    predmeti_ucenika = obavezni_predmeti + dodatna_dva

    for predmet in predmeti_ucenika:

        retci.append({
            "Id": ucenik["Id"],
            "Ime_ucenika": ucenik["Ime_ucenika"],
            "Prezime_ucenika": ucenik["Prezime_ucenika"],
            "Datum_rodjenja_ucenika": ucenik["Datum_rodjenja_ucenika"],
            "OIB": ucenik["OIB"],
            "Ime_oca": ucenik["Ime_oca"],
            "Adresa_ucenika": ucenik["Adresa_ucenika"],
            "ID_Mjesto": ucenik["ID_Mjesto"],
            "ID_Skola": ucenik["ID_Skola"],
            "Broj_razreda": ucenik["Broj_razreda"],
            "Slovo_razreda": ucenik["Slovo_razreda"],
            "Naziv_predmeta": predmet
        })

df = pd.DataFrame(retci)

df = df.merge(
    df_mjesta,
    on="ID_Mjesto",
    how="left"
)

df = df.merge(
    df_skole,
    on="ID_Skola",
    how="left"
)

df = df.merge(
    df_predmeti[
        ["Naziv_predmeta", "Broj_sati_tjedno"]
    ],
    on="Naziv_predmeta",
    how="left"
)

df = df.merge(
    df_nastavnici[
        [
            "ID_Skola",
            "Naziv_predmeta",
            "Ime_nastavnika",
            "Prezime_nastavnika",
            "Datum_rodjenja_nastavnika",
            "Pocetak_rada",
            "Kraj_rada",
            "Naziv_zvanja"
        ]
    ],
    on=["ID_Skola", "Naziv_predmeta"],
    how="left"
)

df["Broj_ocjene"] = random.choices(
    population=[1, 2, 3, 4, 5],
    weights=[5, 10, 25, 35, 25],
    k=len(df)
)

df = df.drop(
    columns=[
        "ID_Mjesto",
        "ID_Skola"
    ]
)

stupci = [
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
]

df = df[stupci]

print("======================================")
print("PROVJERA DATASETA")
print("======================================")

print("Ukupno redaka:", len(df))
print("Broj učenika:", df["Id"].nunique())
print("Broj škola:", df["Naziv_skole"].nunique())
print("Broj predmeta:", df["Naziv_predmeta"].nunique())

broj_nastavnika = (
    df[
        [
            "Ime_nastavnika",
            "Prezime_nastavnika",
            "Datum_rodjenja_nastavnika"
        ]
    ]
    .drop_duplicates()
    .shape[0]
)

print("Broj nastavnika:", broj_nastavnika)
print("Broj mjesta:", df["Mjesto"].nunique())
print("Broj županija:", df["Naziv_zupanije"].nunique())

broj_predmeta_po_uceniku = (
    df.groupby("Id")["Naziv_predmeta"]
      .nunique()
)

print("\nBroj predmeta po učeniku:")
print(broj_predmeta_po_uceniku.value_counts())

provjera_skola = (
    df.groupby("Naziv_skole")["Adresa_skole"]
      .nunique()
)

print("\nBroj adresa po školi:")
print(provjera_skola)

provjera_posta = (
    df.groupby("Postanski_broj")
      .agg(
          broj_mjesta=("Mjesto", "nunique"),
          broj_zupanija=("Naziv_zupanije", "nunique")
      )
)

print("\nProvjera poštanskih brojeva:")
print(provjera_posta)

assert len(df) == 1000, "Dataset nema 1000 redaka!"

assert df["Id"].nunique() == 200, \
    "Dataset nema 200 različitih učenika!"

assert (broj_predmeta_po_uceniku == 5).all(), \
    "Neki učenik nema točno 5 različitih predmeta!"

assert provjera_skola.max() == 1, \
    "Ista škola ima više različitih adresa!"

assert provjera_posta["broj_mjesta"].max() == 1, \
    "Isti poštanski broj pripada različitim mjestima!"

assert provjera_posta["broj_zupanija"].max() == 1, \
    "Isti poštanski broj pripada različitim županijama!"

assert df.isnull().sum().sum() == 0, \
    "Postoje neočekivane NULL vrijednosti!"

print("\nSve provjere su uspješno prošle.")

naziv_datoteke = os.path.join(
    os.path.dirname(__file__),
    "srednja_skola.csv"
)

df.to_csv(
    naziv_datoteke,
    index=False,
    encoding="utf-8-sig"
)

print(f"\nDatoteka '{naziv_datoteke}' uspješno je spremljena.")