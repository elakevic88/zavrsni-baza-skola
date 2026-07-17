SELECT s.Naziv AS Škola, z.Naziv AS Županija,
    COUNT(u.ID_Ucenik) AS Broj_učenika
FROM SKOLE s
INNER JOIN RAZREDI r ON s.ID_Skola = r.SKOLE_ID_Skola
INNER JOIN UCENICI u ON r.ID_Razred = u.RAZREDI_ID_Razred
INNER JOIN POSTE po ON u.POSTE_ID_Posta = po.ID_Posta
INNER JOIN ZUPANIJE z ON po.ZUPANIJE_ID_Zupanija = z.ID_Zupanija
GROUP BY s.Naziv, z.Naziv
ORDER BY s.Naziv, z.Naziv;