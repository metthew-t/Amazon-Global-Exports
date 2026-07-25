import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseDir = path.join(__dirname, 'frontend');

const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git') continue;
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      filelist = walkSync(filepath, filelist);
    } else {
      if (filepath.endsWith('.jsx') || filepath.endsWith('.html') || filepath.endsWith('.js') || filepath.endsWith('.json')) {
        filelist.push(filepath);
      }
    }
  }
  return filelist;
};

const frontendFiles = walkSync(path.join(__dirname, 'frontend'));
const backendFiles = walkSync(path.join(__dirname, 'backend'));
const filesToProcess = [...frontendFiles, ...backendFiles];

let count = 0;
for (const file of filesToProcess) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (content.includes('Gold Bar Exports') || content.includes('GOLD BAR EXPORTS') || content.includes('Gold Bar')) {
    content = content.replace(/Gold Bar Exports/gi, 'Amazon Global Exports');
    content = content.replace(/GOLD BAR EXPORTS/g, 'AMAZON GLOBAL EXPORTS');
    content = content.replace(/Gold Bar/gi, 'Amazon');
    changed = true;
  }
  if (content.includes('GBE') || content.includes('GBEs')) {
    content = content.replace(/GBEs/g, 'AGEs');
    content = content.replace(/GBE/g, 'AGE');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
    count++;
  }
}

console.log(`Done. Updated ${count} files.`);
