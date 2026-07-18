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

module.exports = { procitajCsv, ocisti };