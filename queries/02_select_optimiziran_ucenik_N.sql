SELECT s.Naziv AS Škola, COUNT(u.ID_Ucenik) AS Broj_učenika
FROM SKOLE s
INNER JOIN RAZREDI r ON s.ID_Skola = r.SKOLE_ID_Skola
INNER JOIN UCENICI u ON r.ID_Razred = u.RAZREDI_ID_Razred
INNER JOIN POSTE po ON u.POSTE_ID_Posta = po.ID_Posta
GROUP BY s.Naziv;