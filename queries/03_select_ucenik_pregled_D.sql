SELECT u.ID_Ucenik, u.Ime, u.Prezime, u.Datum_rodjenja, u.OIB, u.Adresa,
       r.Broj_razreda, r.Slovo_razreda,
       s.Naziv AS Naziv_skole, s.Adresa AS Adresa_skole,
       p.Postanski_broj, p.Mjesto,
       z.Naziv AS Naziv_zupanije,
       u.Broj_upisanih_predmeta
FROM UCENICI u
JOIN RAZREDI r ON u.RAZREDI_ID_Razred = r.ID_Razred
JOIN SKOLE s ON r.SKOLE_ID_Skola = s.ID_Skola
JOIN POSTE p ON u.POSTE_ID_Posta = p.ID_Posta
JOIN ZUPANIJE z ON p.ZUPANIJE_ID_Zupanija = z.ID_Zupanija;
