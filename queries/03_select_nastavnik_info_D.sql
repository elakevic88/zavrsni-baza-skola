SELECT n.ID_Nastavnik, n.Ime, n.Prezime, n.Datum_rodjenja, n.Pocetak_rada,
       z.Naziv AS Naziv_zvanja,
       COUNT(np.PREDMETI_ID_Predmet) AS Broj_predmeta
FROM NASTAVNICI n
JOIN ZVANJA z ON n.ZVANJA_ID_Zvanje = z.ID_Zvanje
LEFT JOIN N_PREDMET np ON n.ID_Nastavnik = np.NASTAVNICI_ID_Nastavnik
GROUP BY n.ID_Nastavnik;
