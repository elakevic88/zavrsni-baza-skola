const fs = require('fs');
const path = require('path');
const { instance } = require('@viz-js/viz');
const sharp = require('sharp');
const { parse } = require('csv-parse/sync');

const csvPutanja = path.join(__dirname, '../rezultati.csv');
const csvSadrzaj = fs.readFileSync(csvPutanja, 'utf8').replace(/^\uFEFF/, '').replace(/\r/g, '').trim();

const redovi = parse(csvSadrzaj, {
    columns: false,
    skip_empty_lines: true,
    from_line: 2
});

const podaci = redovi.map(s => {
    let modelNaziv = s[0] ? s[0].trim() : '';
    // Ako u CSV-u piše "Originalna", preimenuj u "Nenormalizirana"
    if (modelNaziv === 'Originalna') {
        modelNaziv = 'Nenormalizirana';
    }

    return {
        model: modelNaziv,
        operacija: s[1],
        prosjekMs: parseFloat(s[2]),
        medijanMs: parseFloat(s[3]),
        minMs: parseFloat(s[4]),
        maxMs: parseFloat(s[5]),
        stdDevMs: parseFloat(s[6]),
        p5Ms: parseFloat(s[7]),
        p95Ms: parseFloat(s[8])
    };
});

const boje = {
    'Nenormalizirana': '#2563eb',
    'Normalizirana': '#059669',
    'Denormalizirana': '#d97706'
};

const bojaZaglavlja = '#1e293b';
const bojaRuba = '#cbd5e1';
const bojaZebra = '#f1f5f9';
const bojaTekst = '#0f172a';

const modeli = ['Nenormalizirana', 'Normalizirana', 'Denormalizirana'];
const operacije = ['Insert', 'Delete', 'Update', 'Select'];

const nazivOperacije = {
    Insert: 'INSERT (punjenje baze)',
    Delete: 'DELETE',
    Update: 'UPDATE',
    Select: 'SELECT'
};

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function buildResultsTableDot(podaci, stupci, naslov) {
    let dot = 'digraph G {\n';
    dot += 'graph [pad="0.6", margin="0", dpi=150, bgcolor="white"];\n';
    dot += 'node [shape=plain, fontname="Helvetica", fontsize=14];\n\n';

    const grupirano = {};
    podaci.forEach(r => {
        if (!grupirano[r.model]) grupirano[r.model] = [];
        grupirano[r.model].push(r);
    });

    const ukupnoStupaca = stupci.length + 1;

    let htmlRedovi = '';
    for (const model of modeli) {
        const retciModela = grupirano[model] || [];
        const bojaBaze = boje[model] || '#475569';

        retciModela.forEach((r, idx) => {
            const pozadinaRetka = idx % 2 === 0 ? '#ffffff' : bojaZebra;
            htmlRedovi += '<tr>\n';

            if (idx === 0) {
                htmlRedovi += `  <td rowspan="${retciModela.length}" align="center" valign="middle" bgcolor="${bojaBaze}" width="160">
                    <font color="white" point-size="15"><b>${escapeHtml(model)}</b></font>
                </td>\n`;
            }

            for (const stupac of stupci) {
                const sirovaVrijednost = r[stupac.key];
                const vrijednost = stupac.format ? stupac.format(sirovaVrijednost) : sirovaVrijednost;
                htmlRedovi += `  <td align="center" valign="middle" bgcolor="${pozadinaRetka}" color="${bojaRuba}" width="150"><font color="${bojaTekst}" point-size="13"><b>${vrijednost}</b></font></td>\n`;
            }
            htmlRedovi += '</tr>\n';
        });
    }

    let zaglavlje = `<td align="center" valign="middle" bgcolor="${bojaZaglavlja}" width="160"><font color="white" point-size="14"><b>Shema baze</b></font></td>\n`;
    for (const stupac of stupci) {
        zaglavlje += `<td align="center" valign="middle" bgcolor="${bojaZaglavlja}" color="${bojaRuba}" width="150"><font color="white" point-size="14"><b>${escapeHtml(stupac.naziv)}</b></font></td>\n`;
    }

    dot += `tablica [label=<
    <table border="1" cellborder="1" cellspacing="0" cellpadding="12" bgcolor="white" color="${bojaRuba}">
        <tr><td colspan="${ukupnoStupaca}" bgcolor="${bojaZaglavlja}" border="0"><font color="white" point-size="16"><b>${escapeHtml(naslov)}</b></font></td></tr>
        <tr>${zaglavlje}</tr>
        ${htmlRedovi}
    </table>>];\n`;
    dot += '}\n';
    return dot;
}

const stupciTablica1 = [
    { key: 'operacija', naziv: 'Operacija' },
    { key: 'prosjekMs', naziv: 'Prosječno (ms)', format: v => v.toFixed(3) + ' ms' },
    { key: 'medijanMs', naziv: 'Medijan (ms)', format: v => v.toFixed(3) + ' ms' },
    { key: 'minMs', naziv: 'Min (ms)', format: v => v.toFixed(3) + ' ms' },
    { key: 'maxMs', naziv: 'Max (ms)', format: v => v.toFixed(3) + ' ms' }
];

const stupciTablica2 = [
    { key: 'operacija', naziv: 'Operacija' },
    { key: 'stdDevMs', naziv: 'Std. dev. (ms)', format: v => v.toFixed(3) },
    { key: 'p5Ms', naziv: '5. percentil (ms)', format: v => v.toFixed(3) + ' ms' },
    { key: 'p95Ms', naziv: '95. percentil (ms)', format: v => v.toFixed(3) + ' ms' }
];

function buildOperationChartDot(operacija) {
    const retci = modeli.map(model => podaci.find(r => r.model === model && r.operacija === operacija));
    const maxVal = Math.max(...retci.filter(Boolean).map(r => r.prosjekMs)) || 1;

    let dot = 'digraph G {\n';
    dot += '  compound=true;\n';
    dot += '  rankdir=TB;\n';
    dot += '  graph [pad="0.6", margin="0", dpi=150, bgcolor="white"];\n';
    dot += '  node [fontname="Helvetica", fontsize=14];\n\n';

    let prevBarId = null;
    modeli.forEach((model, j) => {
        const r = retci[j];
        const barId = `bar_${j}`;
        const boja = boje[model] || '#475569';

        let valText = 'N/A';
        let visinaPx = 12;
        if (r) {
            valText = `${r.prosjekMs.toFixed(3)} ms`;
            visinaPx = Math.max(12, Math.round((r.prosjekMs / maxVal) * 200));
        }

        const barLabel = `<table border="0" cellborder="0" cellspacing="0" cellpadding="4">
            <tr><td align="center"><font color="${bojaTekst}" point-size="14"><b>${valText}</b></font></td></tr>
            <tr><td bgcolor="${boja}" width="100" height="${visinaPx}"></td></tr>
            <tr><td height="8"></td></tr>
            <tr><td align="center"><font color="${bojaTekst}" point-size="14"><b>${escapeHtml(model)}</b></font></td></tr>
        </table>`;

        dot += `  ${barId} [shape=plain, label=<${barLabel}>];\n`;
        if (prevBarId) dot += `  ${prevBarId} -> ${barId} [style=invis];\n`;
        prevBarId = barId;
    });

    dot += `  { rank=same; ${modeli.map((_, j) => `bar_${j}`).join('; ')} }\n\n`;

    const naslovHtml = `<table border="0" cellborder="0" cellspacing="0" cellpadding="6">
        <tr><td align="center"><font color="${bojaTekst}" point-size="18"><b>${escapeHtml(nazivOperacije[operacija] || operacija)}</b></font></td></tr>
        <tr><td align="center"><font color="#475569" point-size="13"><b>Prosječno vrijeme izvršavanja po shemi baze</b></font></td></tr>
    </table>`;

    dot += `  glavni_naslov [shape=plain, label=<${naslovHtml}>];\n`;
    dot += '}\n';
    return dot;
}

async function spremiSliku(dot, outputIme) {
    const outputDir = path.join(__dirname, '../results');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    const outPng = path.join(outputDir, `${outputIme}.png`);
    try {
        const viz = await instance();
        const svg = viz.renderString(dot, { format: 'svg' });

        await sharp(Buffer.from(svg), { 
            density: 150,
            limitInputPixels: false 
        })
            .extend({
                top: 30, bottom: 30, left: 30, right: 30,
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            })
            .png({ quality: 100 })
            .toFile(outPng);

        console.log(`Spremljena slika: ${outPng}`);
    } catch (err) {
        console.error(`Greška pri spremanju ${outputIme}:`, err);
    }
}

async function main() {
    await spremiSliku(buildResultsTableDot(podaci, stupciTablica1, 'Rezultati mjerenja (1/2)'), 'rezultati_tablica_1');
    await spremiSliku(buildResultsTableDot(podaci, stupciTablica2, 'Rezultati mjerenja (2/2)'), 'rezultati_tablica_2');
    
    for (const operacija of operacije) {
        await spremiSliku(buildOperationChartDot(operacija), `graf_${operacija.toLowerCase()}`);
    }

    console.log('Gotovo!');
}

main().catch(console.error);