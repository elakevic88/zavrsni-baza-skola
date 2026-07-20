const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

function procitajCsv(imeDatoteke, imaHeader = true) {
    const putanja = path.join(__dirname, '../../data', imeDatoteke);
    const sadrzaj = fs.readFileSync(putanja, 'utf8').replace(/^\uFEFF/, '');
    return parse(sadrzaj, {
        columns: false,
        skip_empty_lines: true,
        from_line: imaHeader ? 2 : 1
    });
}

function ocisti(tekst) {
    return String(tekst || '').trim();
}

function ispravakDatuma(date) {
  if (!date) return null;
  if (date.includes('-')) return ocisti(date);
  const [month, day, year] = date.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

module.exports = { procitajCsv, ocisti, ispravakDatuma };