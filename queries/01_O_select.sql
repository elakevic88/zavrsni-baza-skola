SELECT Naziv_skole AS Skola,
COUNT(DISTINCT ID_Ucenik) AS Broj_ucenika
FROM SREDNJA_SKOLA
GROUP BY Naziv_skole
ORDER BY Broj_ucenika DESC, Skola;