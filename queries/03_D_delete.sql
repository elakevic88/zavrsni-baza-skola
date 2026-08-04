DELETE FROM GODISNJI_USPJEH
WHERE NASTAVA_ID_Nastava IN (
    SELECT ID_Nastava
    FROM NASTAVA
    WHERE NASTAVNICI_ID_Nastavnik = (
        SELECT ID_Nastavnik
        FROM NASTAVNICI
        WHERE Ime='Derrik' AND Prezime='Tregust'
    )
);

UPDATE UCENIK_INFO
SET Broj_upisanih_predmeta = Broj_upisanih_predmeta - 1
WHERE ID_Ucenik IN (
    SELECT UCENICI_ID_Ucenik
    FROM P_UCENIK
    WHERE NASTAVA_ID_Nastava IN (
        SELECT ID_Nastava
        FROM NASTAVA
        WHERE NASTAVNICI_ID_Nastavnik = (
            SELECT ID_Nastavnik
            FROM NASTAVNICI
            WHERE Ime='Derrik' AND Prezime='Tregust'
        )
    )
);

DELETE FROM P_UCENIK
WHERE NASTAVA_ID_Nastava IN (
    SELECT ID_Nastava
    FROM NASTAVA
    WHERE NASTAVNICI_ID_Nastavnik = (
        SELECT ID_Nastavnik
        FROM NASTAVNICI
        WHERE Ime='Derrik' AND Prezime='Tregust'
    )
);

DELETE FROM NASTAVA
WHERE NASTAVNICI_ID_Nastavnik = (
    SELECT ID_Nastavnik
    FROM NASTAVNICI
    WHERE Ime='Derrik' AND Prezime='Tregust'
);

DELETE FROM N_SKOLE
WHERE NASTAVNICI_ID_Nastavnik = (
    SELECT ID_Nastavnik
    FROM NASTAVNICI
    WHERE Ime='Derrik' AND Prezime='Tregust'
);

DELETE FROM NASTAVNIK_INFO
WHERE ID_Nastavnik = (
    SELECT ID_Nastavnik
    FROM NASTAVNICI
    WHERE Ime='Derrik' AND Prezime='Tregust'
);

DELETE FROM NASTAVNICI
WHERE Ime='Derrik' AND Prezime='Tregust';