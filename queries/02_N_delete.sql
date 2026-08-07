DELETE FROM GODISNJI_USPJEH
WHERE NASTAVA_ID_Nastava IN (
    SELECT ID_Nastava
    FROM NASTAVA
    WHERE NASTAVNICI_ID_Nastavnik = (
        SELECT ID_Nastavnik
        FROM NASTAVNICI
        WHERE Ime='Ivana' AND Prezime='Pavić'
    )
);

DELETE FROM P_UCENIK
WHERE NASTAVA_ID_Nastava IN (
    SELECT ID_Nastava
    FROM NASTAVA
    WHERE NASTAVNICI_ID_Nastavnik = (
        SELECT ID_Nastavnik
        FROM NASTAVNICI
        WHERE Ime='Ivana' AND Prezime='Pavić'
    )
);

DELETE FROM NASTAVA
WHERE NASTAVNICI_ID_Nastavnik = (
    SELECT ID_Nastavnik
    FROM NASTAVNICI
    WHERE Ime='Ivana' AND Prezime='Pavić'
);

DELETE FROM N_SKOLE
WHERE NASTAVNICI_ID_Nastavnik = (
    SELECT ID_Nastavnik
    FROM NASTAVNICI
    WHERE Ime='Ivana' AND Prezime='Pavić'
);

DELETE FROM NASTAVNICI
WHERE Ime='Ivana' AND Prezime='Pavić';
