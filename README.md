# Usporedba nenormalizirane, normalizirane i denormalizirane baze podataka

## Opis projekta
Ovaj projekt izrađen je u sklopu završnog rada. Cilj projekta je usporediti performanse nenormalizirane, normalizirane i denormalizirane baze podataka 
koristeći iste skupove podataka i iste SQL upite.

U projektu se mjeri:

- prosječno vrijeme izvršavanja upita
- minimalno i maksimalno vrijeme izvršavanja
- throughput (broj upita u sekundi)
- HOP metrika
- Query Plan (SCAN i SEARCH operacije)


## Pokretanje
1. Instalirati potrebne pakete:
npm install

2. Pokrenuti benchmark:
node scripts/main.js

3. Generirati grafove:
node scripts/visualise.js

Rezultati se spremaju u datoteku **rezultati.csv**, dok se grafovi spremaju u mapu **results**.

## U ovom projektu se koriste:
- Node.js
- SQLite
- better-sqlite3
- Graphviz
- Sharp
- CSV Parser
