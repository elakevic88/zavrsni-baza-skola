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

const podaci = [];
for (let i = 0; i < redovi.length; i++) {
    const stupci = redovi[i];
    podaci.push({
        baza: stupci[0],
        upit: stupci[1],
        prosjekMs: parseFloat(stupci[2]),
        medijanMs: parseFloat(stupci[3]),
        minMs: parseFloat(stupci[4]),
        maxMs: parseFloat(stupci[5]),
        stdDevMs: parseFloat(stupci[6]),
        p5Ms: parseFloat(stupci[7]),
        p95Ms: parseFloat(stupci[8]),
        throughput: parseInt(stupci[9]),
        hopovi: parseInt(stupci[10]),
        brojTablica: parseInt(stupci[11]),
        skeniranja: parseInt(stupci[12]),
        pretrazivanja: parseInt(stupci[13])
    });
}

const boje = {
    'Originalna': '#e74c3c',
    'Normalizirana': '#3498db',
    'Denormalizirana': '#2ecc71'
};

const sheme = [
    {
        naziv: 'Originalna',
        filter: r => r.baza === 'Originalna'
    },
    {
        naziv: 'Normalizirana',
        filter: r => r.baza === 'Normalizirana'
    },
    {
        naziv: 'Denormalizirana',
        filter: r => r.baza === 'Denormalizirana'
    }
];

const jedinstveniUpiti = [
    {
        naslov: 'Opterećenje nastavnika',
        upiti: ['Opterećenje nastavnika']
    },
    {
        naslov: 'Rang škola po broju učenika',
        upiti: ['Rang škola po broju učenika']
    },
    {
        naslov: 'Optimizirani upit nastavnika',
        upiti: ['Optimizirani upit nastavnika']
    },
    {
        naslov: 'Podaci učenika s lokacijom',
        upiti: ['Podaci učenika s lokacijom']
    }
];

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function wrapUpitName(str) {
    if (str === 'Rang škola po broju učenika') {
        return 'Rang škola po<br/>broju učenika';
    }
    if (str === 'Podaci učenika s lokacijom') {
        return 'Podaci učenika<br/>s lokacijom';
    }
    if (str === 'Optimizirani upit nastavnika') {
        return 'Optimizirani upit<br/>nastavnika';
    }
    return str;
}

function buildTableDot(podaci) {
    let dot = 'digraph G {\n';
    dot += 'rankdir=LR;\n';
    dot += 'graph [pad="0.2", nodesep="0.2", ranksep="0.2", dpi=300];\n';
    dot += 'node [shape=plain, fontname="Helvetica", fontsize=10];\n\n';

    const grupirano = {};
    podaci.forEach(r => {
        if (!grupirano[r.baza]) grupirano[r.baza] = [];
        grupirano[r.baza].push(r);
    });

    let htmlRedovi = '';

    for (const [shemaNaziv, redoviSheme] of Object.entries(grupirano)) {
        const bojaBaze = boje[shemaNaziv] || '#333333';

        redoviSheme.forEach((r, idx) => {
            const isFirst = idx === 0;
            const hopKlasa = r.hopovi === 0 ? 'color="#27ae60"' : 'color="#000000"';

            htmlRedovi += '<tr>\n';

            if (isFirst) {
                htmlRedovi += `  <td rowspan="${redoviSheme.length}" align="center" valign="middle" bgcolor="${bojaBaze}" width="110">
                    <font color="white" point-size="11"><b>${escapeHtml(shemaNaziv)}</b></font>
                </td>\n`;
            }

            const prelomljeniUpit = wrapUpitName(escapeHtml(r.upit));

            htmlRedovi += `  <td align="center" valign="middle" width="180"><font point-size="10">${prelomljeniUpit}</font></td>\n`;
            htmlRedovi += `  <td align="center" valign="middle" width="120"><font point-size="10"><b>${r.prosjekMs.toFixed(3)} ms</b></font></td>\n`;
            htmlRedovi += `  <td align="center" valign="middle" width="110"><font point-size="10">${r.medijanMs.toFixed(3)} ms</font></td>\n`;
            htmlRedovi += `  <td align="center" valign="middle" width="100"><font point-size="10">${r.minMs.toFixed(3)} ms</font></td>\n`;
            htmlRedovi += `  <td align="center" valign="middle" width="100"><font point-size="10">${r.maxMs.toFixed(3)} ms</font></td>\n`;
            htmlRedovi += `  <td align="center" valign="middle" width="100"><font point-size="10">${r.stdDevMs.toFixed(3)}</font></td>\n`;
            htmlRedovi += `  <td align="center" valign="middle" width="100"><font point-size="10">${r.p5Ms.toFixed(3)} ms</font></td>\n`;
            htmlRedovi += `  <td align="center" valign="middle" width="100"><font point-size="10">${r.p95Ms.toFixed(3)} ms</font></td>\n`;
            htmlRedovi += `  <td align="center" valign="middle" width="120"><font point-size="10"><b>${r.throughput.toLocaleString('hr-HR')}</b></font></td>\n`;
            htmlRedovi += `  <td align="center" valign="middle" width="90"><font point-size="10" ${hopKlasa}><b>${r.hopovi}</b></font></td>\n`;
            htmlRedovi += `  <td align="center" valign="middle" width="90"><font point-size="10">${r.brojTablica}</font></td>\n`;
            htmlRedovi += `  <td align="center" valign="middle" width="100"><font point-size="10">${r.skeniranja}</font></td>\n`;
            htmlRedovi += `  <td align="center" valign="middle" width="100"><font point-size="10">${r.pretrazivanja}</font></td>\n`;
            htmlRedovi += '</tr>\n';
        });
    }

    const zBoja = '#1c2d42'; 

    dot += `tablica [label=<
    <table border="1" cellborder="1" cellspacing="0" cellpadding="8" bgcolor="white">
        <tr>
            <td align="center" valign="middle" bgcolor="${zBoja}" width="110"><font color="white" point-size="10"><b>Shema baze<br/>(model)</b></font></td>
            <td align="center" valign="middle" bgcolor="${zBoja}" width="180"><font color="white" point-size="10"><b>Naziv upita<br/>(opis)</b></font></td>
            <td align="center" valign="middle" bgcolor="${zBoja}" width="120"><font color="white" point-size="10"><b>Prosječno<br/>vrijeme<br/>izvršavanja (ms)</b></font></td>
            <td align="center" valign="middle" bgcolor="${zBoja}" width="110"><font color="white" point-size="10"><b>Medijan<br/>vremena<br/>izvršavanja (ms)</b></font></td>
            <td align="center" valign="middle" bgcolor="${zBoja}" width="100"><font color="white" point-size="10"><b>Minimalno<br/>vrijeme (ms)</b></font></td>
            <td align="center" valign="middle" bgcolor="${zBoja}" width="100"><font color="white" point-size="10"><b>Maksimalno<br/>vrijeme (ms)</b></font></td>
            <td align="center" valign="middle" bgcolor="${zBoja}" width="100"><font color="white" point-size="10"><b>Standardna<br/>devijacija<br/>(ms)</b></font></td>
            <td align="center" valign="middle" bgcolor="${zBoja}" width="100"><font color="white" point-size="10"><b>5. percentil<br/>(ms)</b></font></td>
            <td align="center" valign="middle" bgcolor="${zBoja}" width="100"><font color="white" point-size="10"><b>95. percentil<br/>(ms)</b></font></td>
            <td align="center" valign="middle" bgcolor="${zBoja}" width="120"><font color="white" point-size="10"><b>Broj izvršenih<br/>upita u sekundi<br/>(throughput)</b></font></td>
            <td align="center" valign="middle" bgcolor="${zBoja}" width="90"><font color="white" point-size="10"><b>Broj JOIN<br/>operacija<br/>(HOP)</b></font></td>
            <td align="center" valign="middle" bgcolor="${zBoja}" width="90"><font color="white" point-size="10"><b>Broj korištenih<br/>tablica<br/>(count)</b></font></td>
            <td align="center" valign="middle" bgcolor="${zBoja}" width="100"><font color="white" point-size="10"><b>Potpuno<br/>skeniranje<br/>tablica (SCAN)</b></font></td>
            <td align="center" valign="middle" bgcolor="${zBoja}" width="100"><font color="white" point-size="10"><b>Pretraživanje<br/>pomoću indeksa<br/>(SEARCH)</b></font></td>
        </tr>

        ${htmlRedovi}

    </table>>];\n`;

    dot += '}\n';
    return dot;
}

function buildChartDot(naslov, metrikiKljuc, maxVal) {
    let dot = 'digraph G {\n';
    dot += '  compound=true;\n';
    dot += '  rankdir=TB;\n';
    dot += '  newrank=true;\n';
    dot += '  graph [splines=false, nodesep=0.5, ranksep=0.4, pad="0.4", dpi=300, bgcolor="white"];\n';
    dot += '  node [fontname="Helvetica", fontsize=11];\n\n';

    const jedinica = metrikiKljuc === 'prosjekMs' ? 'ms' : '';
    const maxVisinaPx = 170;

    jedinstveniUpiti.forEach((grupa, i) => {
        dot += `  subgraph cluster_${i} {\n`;
        dot += '    style="rounded,filled";\n';
        dot += '    color="#d1d5db";\n';
        dot += '    fillcolor="#fafafa";\n';
        dot += '    margin=16;\n';

        const naslovHtml = `<table border="0" cellborder="0" cellspacing="0" cellpadding="6" bgcolor="#e5e7eb">
            <tr><td align="center"><b><font color="#1f2937" point-size="11">${escapeHtml(grupa.naslov)}</font></b></td></tr>
        </table>`;
        dot += `    label=<${naslovHtml}>;\n`;
        dot += '    labeljust="c";\n';
        dot += '    labelloc="t";\n\n';

        let prevBarId = null;

        sheme.forEach((shema, j) => {
            const barId = `bar_${i}_${j}`;
            const match = podaci.find(r => shema.filter(r) && grupa.upiti.includes(r.upit));
            const boja = boje[shema.naziv] || '#95a5a6';

            let valText = 'N/A';
            let visinaPx = 5;

            if (match) {
                const val = match[metrikiKljuc];
                valText = metrikiKljuc === 'prosjekMs' 
                    ? `${val.toFixed(3)} ${jedinica}`.trim()
                    : val.toLocaleString('hr-HR');
                
                visinaPx = Math.max(5, Math.round((val / maxVal) * maxVisinaPx));
            }

            const barLabel = `<table border="0" cellborder="0" cellspacing="0" cellpadding="2">
                <tr><td align="center"><b><font color="#000000" point-size="11">${valText}</font></b></td></tr>
                <tr><td bgcolor="${boja}" width="65" height="${visinaPx}"></td></tr>
                <tr><td align="center"><font color="#333333" point-size="10"><b>${escapeHtml(shema.naziv)}</b></font></td></tr>
            </table>`;

            dot += `    ${barId} [shape=plain, label=<${barLabel}>];\n`;

            if (prevBarId) {
                dot += `    ${prevBarId} -> ${barId} [style=invis];\n`;
            }
            prevBarId = barId;
        });

        dot += `    { rank=same; ${sheme.map((_, j) => `bar_${i}_${j}`).join('; ')} }\n`;
        dot += '  }\n\n';
    });

    const glavniNaslovHtml = `<table border="0" cellborder="0" cellspacing="0" cellpadding="8">
        <tr><td align="center"><b><font color="#111827" point-size="14">${escapeHtml(naslov)}</font></b></td></tr>
    </table>`;
    
    dot += `  glavni_naslov [shape=plain, label=<${glavniNaslovHtml}>];\n`;
    dot += '}\n';

    return dot;
}

function buildAverageChartDot() {
    const prosjek = sheme.map(shema => {
        const redovi = podaci.filter(shema.filter);
        return {
            naziv: shema.naziv,
            prosjek: redovi.length > 0 
                ? redovi.reduce((a, b) => a + b.prosjekMs, 0) / redovi.length 
                : 0
        };
    });

    const max = Math.max(...prosjek.map(x => x.prosjek));
    let dot = 'digraph G {\n';
    dot += '  compound=true;\n';
    dot += '  rankdir=TB;\n';
    dot += '  graph [splines=false, nodesep=0.6, pad="0.4", dpi=300, bgcolor="white"];\n';
    dot += '  node [fontname="Helvetica", fontsize=11];\n\n';

    let prevBarId = null;

    prosjek.forEach((p, j) => {
        const barId = `avg_bar_${j}`;
        const visinaPx = Math.max(5, Math.round((p.prosjek / max) * 170));
        const boja = boje[p.naziv] || '#333333';

        const barLabel = `<table border="0" cellborder="0" cellspacing="0" cellpadding="2">
            <tr><td align="center"><b><font color="#000000" point-size="11">${p.prosjek.toFixed(3)} ms</font></b></td></tr>
            <tr><td bgcolor="${boja}" width="75" height="${visinaPx}"></td></tr>
            <tr><td align="center"><font color="#333333" point-size="10"><b>${escapeHtml(p.naziv)}</b></font></td></tr>
        </table>`;

        dot += `  ${barId} [shape=plain, label=<${barLabel}>];\n`;

        if (prevBarId) {
            dot += `  ${prevBarId} -> ${barId} [style=invis];\n`;
        }
        prevBarId = barId;
    });

    dot += `  { rank=same; ${prosjek.map((_, j) => `avg_bar_${j}`).join('; ')} }\n\n`;

    const glavniNaslovHtml = `<table border="0" cellborder="0" cellspacing="0" cellpadding="8">
        <tr><td align="center"><b><font color="#111827" point-size="14">Prosječno vrijeme izvršavanja po shemi baze</font></b></td></tr>
    </table>`;

    dot += `  glavni_naslov [shape=plain, label=<${glavniNaslovHtml}>];\n`;
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
            density: 300,
            limitInputPixels: false
        }).resize({
            width: 3400,
            withoutEnlargement: true
        }).png().toFile(outPng);

        console.log(`Spremljena slika: ${outPng}`);
    } catch (err) {
        console.error(`Greška pri spremanju ${outputIme}:`, err);
    }
}

async function main() {
    const tablicaDot = buildTableDot(podaci);
    await spremiSliku(tablicaDot, 'rezultati_tablica');

    const maxProsjek = Math.max(...podaci.map(d => d.prosjekMs));
    const maxThroughput = Math.max(...podaci.map(d => d.throughput));
    const maxHopovi = Math.max(...podaci.map(d => d.hopovi));

    const vrijemeDot = buildChartDot('Prosječno vrijeme izvršavanja (ms)', 'prosjekMs', maxProsjek);
    await spremiSliku(vrijemeDot, 'graf_vrijeme');

    const throughputDot = buildChartDot('Throughput (upita/sekundi)', 'throughput', maxThroughput);
    await spremiSliku(throughputDot, 'graf_throughput');

    const hopoviDot = buildChartDot('HOP metrika — broj skokova između tablica', 'hopovi', maxHopovi);
    await spremiSliku(hopoviDot, 'graf_hopovi');

    const prosjekDot = buildAverageChartDot();
    await spremiSliku(prosjekDot, 'graf_prosjek');

    console.log('Spremljeno');
}

main().catch(console.error);