SELECT up.Naziv_skole AS Skola,
       COUNT(zo.OCJENE_ID_Ocjena) AS Ukupno_Ocjena,
       AVG(o.Broj_ocjene) AS Prosjecni_Uspjeh
FROM UCENIK_PREGLED up
INNER JOIN ZAVRŠNA_O zo ON up.ID_Učenik = zo.UČENICI_ID_Učenik
INNER JOIN OCJENE o ON zo.OCJENE_ID_Ocjena = o.ID_Ocjena
GROUP BY up.Naziv_skole
ORDER BY Prosjecni_Uspjeh DESC;