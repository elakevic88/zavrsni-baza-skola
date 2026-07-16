SELECT u.Ime, u.Prezime, r.Broj_razreda, r.Slovo_razreda, s.Naziv AS Naziv_skole, p.Mjesto, z.Naziv AS Naziv_zupanije
FROM UCENICI u
JOIN RAZREDI r
    ON u.RAZREDI_ID_Razred = r.ID_Razred
JOIN SKOLE s
    ON r.SKOLE_ID_Skola = s.ID_Skola
JOIN POSTE p
    ON u.POSTE_ID_Posta = p.ID_Posta
JOIN ZUPANIJE z
    ON p.ZUPANIJE_ID_Zupanija = z.ID_Zupanija;