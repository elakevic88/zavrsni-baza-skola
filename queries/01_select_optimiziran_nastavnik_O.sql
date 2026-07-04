SELECT n.Ime, n.Prezime, COUNT(np.PREDMETI_ID_Predmet) AS Broj_predmeta
FROM NASTAVNICI n
JOIN N_PREDMET np ON n.ID_Nastavnik = np.NASTAVNICI_ID_Nastavnik
GROUP BY n.Ime, n.Prezime
ORDER BY Broj_predmeta DESC;