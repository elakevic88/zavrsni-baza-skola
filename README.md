# Usporedba nenormalizirane, normalizirane i denormalizirane baze podataka

## Opis projekta

Ovaj projekt izrađen je u sklopu završnog rada s ciljem usporedbe performansi nenormalizirane, normalizirane i denormalizirane baze podataka. Sve tri baze koriste isti skup podataka, dok se usporedba provodi izvođenjem istih SQL upita nad svakim modelom.

Projekt mjeri sljedeće metrike:

- vrijeme izvršavanja SQL upita (INSERT, SELECT, UPDATE i DELETE)
- prosječno, medijalno, minimalno i maksimalno vrijeme izvršavanja
- standardnu devijaciju
- percentil
- throughput (broj izvršenih SELECT upita u sekundi)
- HOP metriku (broj JOIN operacija)
- broj tablica uključenih u izvršavanje upita
- plan izvršavanja SQL upita (SCAN i SEARCH operacije)
- veličinu baze podataka

## Pokretanje projekta

### 1. Instalacija ovisnosti

```bash
npm install
```

### 2. Pokretanje benchmarka

```bash
node scripts/main.js
```

### 3. Generiranje grafova

```bash
node scripts/visualise.js
```

Rezultati mjerenja spremaju se u datoteku **rezultati.csv**, dok se generirani grafovi spremaju u mapu **results**.

## Korištene tehnologije

- Node.js
- SQLite
- better-sqlite3
- Graphviz
- Sharp
- CSV Parser
