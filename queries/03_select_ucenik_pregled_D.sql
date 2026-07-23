SELECT Naziv_skole AS Skola, COUNT(ID_Ucenik) AS Broj_ucenika
FROM UCENIK_PREGLED
GROUP BY Naziv_skole
ORDER BY Broj_ucenika DESC, Skola;