SELECT Naziv_skole, Naziv_zupanije, COUNT(*) AS Broj_ucenika
FROM UCENIK_PREGLED
GROUP BY Naziv_skole, Naziv_zupanije;