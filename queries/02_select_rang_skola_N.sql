SELECT s.Naziv AS Skola, 
COUNT(zo.OCJENE_ID_Ocjena) AS Ukupno_Ocjena,
AVG(o.Broj_ocjene) AS Prosjecni_Uspjeh
FROM SKOLE s
INNER JOIN RAZREDI r ON s.ID_Skola = r.SKOLE_ID_Skola
INNER JOIN UCENICI u ON r.ID_Razred = u.RAZREDI_ID_Razred
INNER JOIN ZAVRSNA_O zo ON u.ID_Ucenik = zo.UCENICI_ID_Ucenik
INNER JOIN OCJENE o ON zo.OCJENE_ID_Ocjena = o.ID_Ocjena
GROUP BY s.Naziv
HAVING COUNT(zo.OCJENE_ID_Ocjena) > 0
ORDER BY Prosjecni_Uspjeh DESC;