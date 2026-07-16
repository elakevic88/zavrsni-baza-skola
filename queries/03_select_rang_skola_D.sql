SELECT s.Naziv AS Skola,
    COUNT(u.ID_Ucenik) AS Broj_ucenika
FROM UCENICI u
JOIN RAZREDI r
    ON u.RAZREDI_ID_Razred = r.ID_Razred
JOIN SKOLE s
    ON r.SKOLE_ID_Skola = s.ID_Skola
GROUP BY s.ID_Skola;