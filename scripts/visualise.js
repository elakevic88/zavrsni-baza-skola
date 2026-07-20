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

function buildTableDot(podaci) {
    let dot = 'digraph G {\n';
    dot += 'rankdir=LR;\n';
    dot += 'node [shape=plain, fontname="Helvetica"];\n\n';

    let rows = podaci.map(r => {
        const oznaka = r.baza;
        const bojaBaze = boje[oznaka] || '#95a5a6';
        const hopKlasa = r.hopovi === 0 ? 'color="#27ae60" fontweight="bold"' : '';

        return `<tr>
        <td align="left" border="1" bgcolor="${bojaBaze}">
            <font color="white"><b>${escapeHtml(oznaka)}</b></font>
        </td>
        <td align="left" border="1">
            ${escapeHtml(r.upit)}
        </td>
        <td align="right" border="1"><b>${r.prosjekMs.toFixed(3)} ms</b></td>
        <td align="right" border="1">${r.medijanMs.toFixed(3)} ms</td>
        <td align="right" border="1">${r.minMs.toFixed(3)} ms</td>
        <td align="right" border="1">${r.maxMs.toFixed(3)} ms</td>
        <td align="right" border="1">${r.stdDevMs.toFixed(3)}</td>
        <td align="right" border="1">${r.p5Ms.toFixed(3)} ms</td>
        <td align="right" border="1">${r.p95Ms.toFixed(3)} ms</td>
        <td align="right" border="1" bgcolor="#f8f9fa">
            <b>${r.throughput.toLocaleString('hr-HR')}</b>
        </td>
        <td align="center" border="1">
            <font ${hopKlasa}><b>${r.hopovi}</b></font>
        </td>
        <td align="center" border="1">${r.brojTablica}</td>
        <td align="center" border="1">${r.skeniranja}</td>
        <td align="center" border="1">${r.pretrazivanja}</td>

        </tr>`;
    }).join('\n');

    dot += `tablica [label=<
    <table border="0" cellborder="1" cellspacing="0" cellpadding="10" bgcolor="white">

    <tr bgcolor="#2c3e50">
        <td align="center">
            <font color="white"><b>Baza</b></font><br/>
            <font color="white" point-size="9">Shema baze</font>
        </td>

        <td align="center">
            <font color="white"><b>Upit</b></font><br/>
            <font color="white" point-size="9">Naziv upita</font>
        </td>

        <td align="center">
            <font color="white"><b>Prosjek (ms)</b></font><br/>
            <font color="white" point-size="9">Prosječno vrijeme izvršavanja</font>
        </td>

        <td align="center">
            <font color="white"><b>Medijan (ms)</b></font><br/>
            <font color="white" point-size="9">Medijan vremena izvršavanja</font>
        </td>

        <td align="center">
            <font color="white"><b>Min (ms)</b></font><br/>
            <font color="white" point-size="9">Minimalno vrijeme</font>
        </td>

        <td align="center">
            <font color="white"><b>Max (ms)</b></font><br/>
            <font color="white" point-size="9">Maksimalno vrijeme</font>
        </td>

        <td align="center">
            <font color="white"><b>Std.dev</b></font><br/>
            <font color="white" point-size="9">Standardna devijacija</font>
        </td>

        <td align="center">
            <font color="white"><b>P5 (ms)</b></font><br/>
            <font color="white" point-size="9">5. percentil</font>
        </td>

        <td align="center">
            <font color="white"><b>P95 (ms)</b></font><br/>
            <font color="white" point-size="9">95. percentil</font>
        </td>

        <td align="center">
            <font color="white"><b>Throughput</b></font><br/>
            <font color="white" point-size="9">Broj upita u sekundi</font>
        </td>

        <td align="center">
            <font color="white"><b>HOP</b></font><br/>
            <font color="white" point-size="9">Broj skokova</font>
        </td>

        <td align="center">
            <font color="white"><b>Tablice</b></font><br/>
            <font color="white" point-size="9">Broj tablica</font>
        </td>

        <td align="center">
            <font color="white"><b>SCAN</b></font><br/>
            <font color="white" point-size="9">Potpuna skeniranja</font>
        </td>

        <td align="center">
            <font color="white"><b>SEARCH</b></font><br/>
            <font color="white" point-size="9">Pretraživanja indeksa</font>
        </td>

    </tr>

   <tr bgcolor="#ecf0f1">
    <td align="center"><font point-size="10"><b>Shema baze</b></font></td>
    <td align="center"><font point-size="10"><b>Naziv upita</b></font></td>
    <td align="center"><font point-size="10">Prosječno vrijeme izvršavanja</font></td>
    <td align="center"><font point-size="10">Medijan vremena izvršavanja</font></td>
    <td align="center"><font point-size="10">Minimalno vrijeme</font></td>
    <td align="center"><font point-size="10">Maksimalno vrijeme</font></td>
    <td align="center"><font point-size="10">Standardna devijacija</font></td>
    <td align="center"><font point-size="10">5. percentil</font></td>
    <td align="center"><font point-size="10">95. percentil</font></td>
    <td align="center"><font point-size="10">Broj izvršenih upita u sekundi</font></td>
    <td align="center"><font point-size="10">Broj JOIN operacija</font></td>
    <td align="center"><font point-size="10">Broj korištenih tablica</font></td>
    <td align="center"><font point-size="10">Potpuno skeniranje tablica</font></td>
    <td align="center"><font point-size="10">Pretraživanje pomoću indeksa</font></td>
    </tr>

    ${rows}

    </table>>];\n`;

    dot += '}\n';
    return dot;
}


function buildChartDot(naslov, metrikiKljuc, maxVal) {
    let dot = 'digraph G {\n';
    dot += 'rankdir=BT;\n';
    dot += 'graph [fontname="Helvetica", bgcolor="white", nodesep=1.2, ranksep=1.2];\n';
    dot += 'node [shape=plain, fontname="Helvetica"];\n\n';

    dot += `naslov [shape=none, label="${escapeHtml(naslov)}", fontsize=22, fontname="Helvetica-Bold"];\n`;

    const maxVisinaStupca = 180;

    jedinstveniUpiti.forEach(grupa => {
        let stupciHtml = sheme.map(shema => {
            const match = podaci.find(r => {
                if (!shema.filter(r)) return false;

                return grupa.upiti.includes(r.upit);
            });
            const boja = boje[shema.naziv] || '#95a5a6';

            if (!match) {
                return `<td valign="bottom" border="0">
                <table border="0" cellspacing="0" cellpadding="2">
                <tr>
                    <td align="center" border="0">
                        <font point-size="16"><b>N/A</b></font>
                    </td>
                </tr>
                <tr>
                    <td height="5" width="55" border="0"></td>
                </tr>
                <tr>
                    <td align="center" border="0">
                    <font point-size="13" color="#7f8c8d">${escapeHtml(shema.naziv)}</font>
                </td>
                </tr>
                </table>
                </td>`;
            }
            const val = match[metrikiKljuc];
            let visina = Math.round((val / maxVal) * maxVisinaStupca);
            if (visina < 5) visina = 5;
            const ispisVrijednosti =
                metrikiKljuc === 'prosjekMs'
                    ? val.toFixed(3)
                    : val.toLocaleString('hr-HR');

            return `<td valign="bottom" border="0">
            <table border="0" cellspacing="0" cellpadding="2">
            <tr>
            <td align="center" border="0">
                <font point-size="16"><b>${ispisVrijednosti}</b></font>
            </td>
            </tr>
            <tr>
            <td bgcolor="${boja}" height="${visina}" width="55" border="0"></td>
            </tr>
            <tr>
                <td align="center" border="0">
                <font point-size="13" color="#7f8c8d">${escapeHtml(shema.naziv)}</font>
            </td>
            </tr>
            </table>
            </td>`;
        }).join('\n');

        const cvorId = grupa.naslov.replace(/[^a-zA-Z0-9]/g, '_');

        dot += `"${cvorId}" [label=<
        <table border="1" cellborder="0" cellspacing="8" cellpadding="10" bgcolor="#fafafa" style="border-radius: 4px;">
          <tr><td colspan="3" bgcolor="#e5e7eb" align="center"><b>${escapeHtml(grupa.naslov)}</b></td></tr>
          <tr>
            ${stupciHtml}
          </tr>
        </table>
      >];\n`;
    });

    for (const grupa of jedinstveniUpiti) {
        const cvorId = grupa.naslov.replace(/[^a-zA-Z0-9]/g, '_');
        dot += `naslov -> "${cvorId}" [style=invis];\n`;
    }

    dot += '}\n';
    return dot;
}

function buildAverageChartDot() {
    const prosjek = sheme.map(shema => {
        const redovi = podaci.filter(shema.filter);
        return {
            naziv: shema.naziv,
            prosjek:
                redovi.reduce((a, b) => a + b.prosjekMs, 0) /
                redovi.length
        };
    });

    const max = Math.max(...prosjek.map(x => x.prosjek));
    let dot = `digraph G{rankdir=BT;node[shape=plain];`;
    dot += `naslov[label="Prosječno vrijeme izvršavanja po shemi baze",shape=none,fontname="Helvetica-Bold",fontsize=22];`;
    prosjek.forEach(p => {
        const visina = Math.max(5, Math.round((p.prosjek / max) * 180));
        dot += `"${p.naziv}"[label=<<table border="0" cellborder="0">
        <tr><td align="center"><b>${p.prosjek.toFixed(3)}</b></td></tr>
        <tr><td bgcolor="${boje[p.naziv]}" width="70" height="${visina}"></td></tr>
        <tr><td align="center">${p.naziv}</td></tr>
        </table>
        >
    ];`;
        dot += `naslov->"${p.naziv}"[style=invis];`;

    });
    dot += "}";
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
            density: 200,
            limitInputPixels: false
        }).resize({
            width: 2600,
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