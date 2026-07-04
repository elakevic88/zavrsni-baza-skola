SELECT s.Naziv AS Škola, z.Naziv AS Županija, COUNT(u.ID_Učenik) AS Broj_učenika
FROM ŠKOLE s
INNER JOIN RAZREDI r ON s.ID_Škola = r.ŠKOLE_ID_Škola
INNER JOIN UČENICI u ON r.ID_Razred = u.RAZREDI_ID_Razred
INNER JOIN POŠTE po ON u.POŠTE_ID_Pošta = po.ID_Pošta
INNER JOIN ŽUPANIJE z ON po.ŽUPANIJE_ID_Županija = z.ID_Županija
GROUP BY s.Naziv, z.Naziv;