// Pre-publish sanity check: manifest references resolve and every JS file parses.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
const errors = [];
const need = (path, what) => existsSync(path) || errors.push(`${what}: missing ${path}`);

need(manifest.background.service_worker, 'service_worker');
need(manifest.action.default_popup, 'popup');
need(manifest.options_page, 'options_page');
Object.values(manifest.icons).forEach((p) => need(p, 'icon'));
manifest.content_scripts.forEach((cs) => [...cs.js, ...(cs.css ?? [])].forEach((p) => need(p, 'content_script')));

const walk = (dir) => readdirSync(dir).flatMap((f) => {
    const p = `${dir}/${f}`;
    return statSync(p).isDirectory() ? walk(p) : [p];
});
const wars = manifest.web_accessible_resources.flatMap((r) => r.resources);
// manifest globs here contain at most one '*'
const matchesGlob = (glob, path) => {
    const [head, tail = ''] = glob.split('*');
    return glob.includes('*')
        ? path.startsWith(head) && path.endsWith(tail) && path.length >= head.length + tail.length
        : path === glob;
};
const matchesWar = (p) => wars.some((w) => matchesGlob(w, p));

// every web_accessible_resources entry must exist (globs must match at least one file)
const allFiles = [...walk('src'), 'common_words.txt'];
for (const w of wars) {
    if (!allFiles.some((f) => matchesGlob(w, f))) errors.push(`web_accessible_resources: nothing matches ${w}`);
}

// relative imports (static and dynamic) must resolve to real files
const importRe = /\bimport\s*(?:[^'"()]*?\bfrom\s*)?\(?\s*['"](\.{1,2}\/[^'"]+)['"]/g;
const resolveImports = (file) => {
    const dir = file.slice(0, file.lastIndexOf('/'));
    for (const [, spec] of readFileSync(file, 'utf8').matchAll(importRe)) {
        const target = new URL(spec, `file:///${dir}/`).pathname.slice(1);
        if (!existsSync(target)) errors.push(`import: ${file} -> ${spec} does not exist`);
    }
};

for (const file of [...walk('src'), 'background.js', 'content.js']) {
    if (!file.endsWith('.js')) continue;
    if (file.startsWith('src/')) resolveImports(file);
    try {
        execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
    } catch (e) {
        errors.push(`syntax: ${file}\n${e.stderr}`);
    }
    // everything imported by the content script must be web-accessible
    if (!/^src\/(popup|options)\//.test(file) && file.startsWith('src/') && !matchesWar(file)) {
        errors.push(`not web_accessible: ${file}`);
    }
}

if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
}
console.log('check ok');
