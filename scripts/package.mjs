// Builds dist/smart-virtual-keyboard-<version>.zip from committed files (see .gitattributes export-ignore).
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';

// git archive packages HEAD only, so uncommitted work would silently be left out.
const dirty = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim();
if (dirty) {
    console.error(`Refusing to package: commit or stash these changes first (only HEAD is zipped):\n${dirty}`);
    process.exit(1);
}

const { version } = JSON.parse(readFileSync('manifest.json', 'utf8'));
mkdirSync('dist', { recursive: true });
const out = `dist/smart-virtual-keyboard-${version}.zip`;
execFileSync('git', ['archive', '--format=zip', `--output=${out}`, 'HEAD'], { stdio: 'inherit' });
console.log(`wrote ${out}`);
