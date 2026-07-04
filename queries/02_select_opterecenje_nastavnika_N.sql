SELECT n.Ime, n.Prezime, zv.Naziv AS Zvanje, z.Naziv AS Zupanija,
       COUNT(DISTINCT np.PREDMETI_ID_Predmet) AS Broj_Predmeta
FROM NASTAVNICI n
INNER JOIN ZVANJA zv ON n.ZVANJA_ID_Zvanje = zv.ID_Zvanje
INNER JOIN N_PREDMET np ON n.ID_Nastavnik = np.NASTAVNICI_ID_Nastavnik
INNER JOIN N_RAZRED nr ON n.ID_Nastavnik = nr.NASTAVNICI_ID_Nastavnik
INNER JOIN RAZREDI r ON nr.RAZREDI_ID_Razred = r.ID_Razred
INNER JOIN ŠKOLE s ON r.ŠKOLE_ID_Škola = s.ID_Škola
GROUP BY n.ID_Nastavnik, z.Naziv;