SELECT Naziv_skole,
    COUNT(ID_Ucenik) AS Broj_ucenika
FROM UCENIK_PREGLED
GROUP BY Naziv_skole;