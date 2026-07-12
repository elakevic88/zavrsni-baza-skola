SELECT s.Naziv AS Skola, 
COUNT(zo.OCJENE_ID_Ocjena) AS Ukupno_Ocjena,
AVG(o.Broj_ocjene) AS Prosjecni_Uspjeh
FROM ŠKOLE s
INNER JOIN RAZREDI r ON s.ID_Škola = r.ŠKOLE_ID_Škola
INNER JOIN UČENICI u ON r.ID_Razred = u.RAZREDI_ID_Razred
INNER JOIN ZAVRŠNA_O zo ON u.ID_Učenik = zo.UČENICI_ID_Učenik
INNER JOIN OCJENE o ON zo.OCJENE_ID_Ocjena = o.ID_Ocjena
GROUP BY s.Naziv
HAVING COUNT(zo.OCJENE_ID_Ocjena) > 0
ORDER BY Prosjecni_Uspjeh DESC;