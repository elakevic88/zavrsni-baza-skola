SELECT Naziv_skole AS Škola, Naziv_zupanije AS Županija, COUNT(ID_Učenik) AS Broj_učenika
FROM UCENIK_PREGLED
GROUP BY Naziv_skole, Naziv_zupanije;