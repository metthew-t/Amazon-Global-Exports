import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, 'src');

function refactorFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace db.prepare(...).get|all|run with await
  content = content.replace(/(?<!await\s+)(db\.prepare\([^)]+\)\.(get|all|run)\([^)]*\))/g, 'await $1');

  // SQLite transaction syntax: const tx = db.transaction(() => { ... }); tx();
  // We need to convert it to: await db.transaction(async (txDb) => { ... });
  content = content.replace(/const\s+tx\s*=\s*db\.transaction\(\s*\(\)\s*=>\s*{/g, 'const tx = async () => await db.transaction(async (db) => {');

  // Make route handlers async
  content = content.replace(/router\.(get|post|put|delete)\('([^']+)',\s*(protect,\s*adminOnly,\s*|protect,\s*|adminOnly,\s*)?\((req,\s*res)\)\s*=>\s*{/g, "router.$1('$2', $3async ($4) => {");

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Refactored ${filePath}`);
}

function walkDir(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.js')) {
      refactorFile(fullPath);
    }
  });
}

walkDir(path.join(srcDir, 'routes'));
walkDir(path.join(srcDir, 'middleware'));
refactorFile(path.join(srcDir, 'db', 'seed.js'));

console.log('Refactoring complete.');
