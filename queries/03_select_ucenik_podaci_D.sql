SELECT Naziv_skole AS Škola, Naziv_zupanije AS Županija, COUNT(ID_Ucenik) AS Broj_učenika
FROM UCENIK_PREGLED
GROUP BY Naziv_skole, Naziv_zupanije
ORDER BY Naziv_skole, Naziv_zupanije;