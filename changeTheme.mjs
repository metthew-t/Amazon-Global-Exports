import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseDir = path.join(__dirname, 'frontend');

const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === 'dist') continue;
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      filelist = walkSync(filepath, filelist);
    } else {
      if (filepath.endsWith('.jsx') || filepath.endsWith('.html') || filepath.endsWith('.js') || filepath.endsWith('.css')) {
        filelist.push(filepath);
      }
    }
  }
  return filelist;
};

const filesToProcess = walkSync(baseDir);

let count = 0;
for (const file of filesToProcess) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (content.includes('gold') || content.includes('Gold') || content.includes('GOLD')) {
    // Basic replacements
    content = content.replace(/text-gold-/g, 'text-sky-');
    content = content.replace(/bg-gold-/g, 'bg-sky-');
    content = content.replace(/border-gold-/g, 'border-sky-');
    content = content.replace(/ring-gold-/g, 'ring-sky-');
    content = content.replace(/from-gold-/g, 'from-sky-');
    content = content.replace(/to-gold-/g, 'to-sky-');
    content = content.replace(/via-gold-/g, 'via-sky-');
    content = content.replace(/shadow-gold-/g, 'shadow-sky-');
    content = content.replace(/fill-gold-/g, 'fill-sky-');
    content = content.replace(/stroke-gold-/g, 'stroke-sky-');
    
    // Tailwind config specific
    content = content.replace(/gold:/g, 'sky:');
    content = content.replace(/pulse-gold/g, 'pulse-sky');
    content = content.replace(/pulseGold/g, 'pulseSky');

    // Hex color in tailwind config (the pulse animation shadow)
    content = content.replace(/234,179,8/g, '14,165,233'); // sky-500 rgb

    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
    count++;
  }
}

console.log(`Done. Updated ${count} files to use Sky colors.`);
