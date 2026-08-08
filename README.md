# Usporedba nenormalizirane, normalizirane i denormalizirane baze podataka

## Opis projekta

Ovaj projekt izrađen je u sklopu završnog rada s ciljem usporedbe performansi nenormalizirane, normalizirane i denormalizirane baze podataka. Sve tri baze koriste isti skup podataka, dok se usporedba provodi izvođenjem istih SQL operacija nad svakim modelom.

U projektu se mjere sljedeće metrike:

- vrijeme izvršavanja SQL operacija (INSERT, SELECT, UPDATE i DELETE)
- prosječno vrijeme izvršavanja
- medijan
- minimalno i maksimalno vrijeme izvršavanja
- standardna devijacija
- 5. i 95. percentil
- veličina baze podataka

## Pokretanje projekta

### 1. Instalacija ovisnosti

```bash
npm install
```

### 2. Pokretanje benchmarka

```bash
node scripts/main.js
```

Benchmark izvršava INSERT, UPDATE, DELETE i SELECT operacije nad sva tri modela baze podataka te izračunava navedene metrike.

### 3. Generiranje grafova

```bash
node scripts/visualise.js
```

Rezultati mjerenja spremaju se u datoteku `rezultati.csv`, dok se generirani grafovi spremaju u mapu `results`.

## Korištene tehnologije

- Node.js
- JavaScript
- SQLite
- better-sqlite3
- Graphviz
- @viz-js/viz
- Sharp
- CSV Parser