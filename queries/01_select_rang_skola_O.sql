SELECT s.Naziv AS Skola,
    COUNT(u.ID_Ucenik) AS Broj_ucenika
FROM SKOLE s
INNER JOIN RAZREDI r ON s.ID_Skola = r.SKOLE_ID_Skola
INNER JOIN UCENICI u ON r.ID_Razred = u.RAZREDI_ID_Razred
GROUP BY s.Naziv
ORDER BY Broj_ucenika DESC;