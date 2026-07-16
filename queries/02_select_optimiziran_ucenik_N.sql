SELECT s.Naziv AS Škola, COUNT(u.ID_Ucenik) AS Broj_učenika
FROM ŠKOLE s
INNER JOIN RAZREDI r ON s.ID_Skola = r.ŠKOLE_ID_Skola
INNER JOIN UČENICI u ON r.ID_Razred = u.RAZREDI_ID_Razred
INNER JOIN POŠTE po ON u.POŠTE_ID_Posta = po.ID_Posta
GROUP BY s.Naziv;