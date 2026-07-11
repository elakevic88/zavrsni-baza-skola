const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const { instance } = require('@viz-js/viz');
const sharp = require('sharp');

// helper funkcija za dohvat sheme baze
function getSchema(db) {
    const tables = db
        .prepare(
            `SELECT name FROM sqlite_master
       WHERE type='table' AND name NOT LIKE 'sqlite_%'
       ORDER BY name`
        )
        .all()
        .map((r) => r.name);

    const schema = {};
    for (const table of tables) {
        const columns = db.prepare(`PRAGMA table_info("${table}")`).all();
        const fks = db.prepare(`PRAGMA foreign_key_list("${table}")`).all();
        schema[table] = { columns, fks };
    }
    return schema;
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function buildDot(schema) {
    let dot = 'digraph schema {\n';
    dot += '  rankdir=LR;\n';
    dot += '  graph [fontname="Helvetica", bgcolor="white", nodesep=0.6, ranksep=1.0];\n';
    dot += '  node [shape=plain, fontname="Helvetica"];\n';
    dot += '  edge [fontname="Helvetica", fontsize=10, color="#555555", arrowsize=0.7];\n\n';

    for (const [table, { columns, fks }] of Object.entries(schema)) {
        const fkCols = new Set(fks.map((fk) => fk.from));

        const rows = columns
            .map((col) => {
                const isPk = col.pk > 0;
                const isFk = fkCols.has(col.name);
                let badge = '';
                if (isPk) badge = ' <font color="#b8860b"><b>PK</b></font>';
                else if (isFk) badge = ' <font color="#4169e1"><b>FK</b></font>';
                const nameLabel = isPk ? `<b>${escapeHtml(col.name)}</b>` : escapeHtml(col.name);
                const bg = isPk ? ' bgcolor="#fff7e0"' : '';
                return `      <tr><td align="left" port="${escapeHtml(col.name)}"${bg}>${nameLabel}${badge}</td><td align="left"${bg}><font color="#666666">${escapeHtml(col.type || '')}</font></td></tr>`;
            })
            .join('\n');

        dot += `  "${table}" [label=<
    <table border="1" cellborder="0" cellspacing="0" cellpadding="6" bgcolor="white">
      <tr><td colspan="2" bgcolor="#2c3e50"><font color="white"><b>${escapeHtml(table)}</b></font></td></tr>
${rows}
    </table>
  >];\n\n`;
    }

    for (const [table, { fks }] of Object.entries(schema)) {
        for (const fk of fks) {
            dot += `  "${table}":"${fk.from}" -> "${fk.table}":"${fk.to}" [label="${fk.from} -> ${fk.to}"];\n`;
        }
    }

    dot += '}\n';
    return dot;
}

// helper funkcija za prikaz sheme baze
async function generateSchema(dbPath) {
    if (!fs.existsSync(dbPath)) {
        console.error(`Baza nije pronađena na putanji: ${dbPath}`);
        return;
    }

    const parsedPath = path.parse(dbPath);
    const outputDir = "";
    const baseName = parsedPath.name + '_shema';

    const outDot = path.join(outputDir, `${baseName}.dot`);
    const outSvg = path.join(outputDir, `${baseName}.svg`);
    const outPng = path.join(outputDir, `${baseName}.png`);

    const db = new Database(dbPath, { readonly: true, fileMustExist: true });
    const schema = getSchema(db);
    db.close();

    const tableCount = Object.keys(schema).length;
    if (tableCount === 0) {
        console.error('U bazi nije pronađena nijedna tablica.');
        return;
    }
    console.log(`Pronađeno ${tableCount} tablica: ${Object.keys(schema).join(', ')}`);

    const dot = buildDot(schema);
    fs.writeFileSync(outDot, dot);
    console.log(`DOT datoteka spremljena: ${outDot}`);

    const viz = await instance();
    const svg = viz.renderString(dot, { format: 'svg' });
    fs.writeFileSync(outSvg, svg);
    console.log(`SVG spremljen: ${outSvg}`);

    try {
        await sharp(Buffer.from(svg), { density: 200 }).png().toFile(outPng);
        console.log(`PNG spremljen: ${outPng}`);
    } catch (err) {
        console.warn(
            `Konverzija u PNG nije uspjela (sharp): ${err.message}. SVG datoteka je i dalje dostupna i može se otvoriti u pregledniku.`
        );
    }
}

// glavni dio programa
async function main() {
    const queries = path.join(__dirname, '..', 'databases', 'create_queries');
    const target = path.join(__dirname, '..', 'databases', 'dbs');
    if(!fs.existsSync(queries)) {
        console.error(`Ne postoji: ${queries}`);
        process.exit(1);
    }

    fs.mkdirSync(target, {recursive: true});

    const sqlFiles = fs.readdirSync(queries).filter(file => file.endsWith('.sql'));
    for(const file of sqlFiles) {
        const sqlPath = path.join(queries, file);
        const dbName = path.parse(file).name + '.db';
        const dbPath = path.join(target, dbName);

        if(fs.existsSync(dbPath)) {
            fs.unlinkSync(dbPath);
        }

        try {
            const sqlContent = fs.readFileSync(sqlPath, 'utf8');
            const db = new Database(dbPath);
            db.exec(sqlContent);
            db.close();

            console.log(`Stvorena baza podataka: ${dbPath}`);
            await generateSchema(dbPath);
        } catch (error) {
            console.error(`Greška prilikom procesiranja datoteke ${file}:`, error);
        }
    }
}

main().catch(console.error);