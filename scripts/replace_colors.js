const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const replacements = {
  // Primary (blue to terracotta)
  '#26418F': '#8a6d4f',
  '#26418f': '#8a6d4f',
  '#1B3169': '#5f4630',
  '#1b3169': '#5f4630',

  // Accent (teal to gold)
  '#14B8A6': '#c9a26d',
  '#14b8a6': '#c9a26d',

  // Gradients
  '#1B2E6F': '#4a3620',
  '#1b2e6f': '#4a3620',
  '#17879A': '#8a6d4f',
  '#17879a': '#8a6d4f',
  '#22C08C': '#c9a26d',
  '#22c08c': '#c9a26d',

  // Text colors
  '#101828': '#3a2f22',
  '#8A94A6': '#a89880',
  '#8a94a6': '#a89880',
  '#A9B4C4': '#a89880', // muted on dark -> muted on light
  '#a9b4c4': '#a89880',

  // Backgrounds
  '#F7F9FC': '#faf6ef',
  '#f7f9fc': '#faf6ef',
  
  // Dashboard converting dark -> light
  '#0B1220': '#faf6ef',
  '#0b1220': '#faf6ef',
  '#16223A': '#f6efe3',
  '#16223a': '#f6efe3',

  // Other colors used in dark mode
  '#7DD3E8': '#8a6d4f',
  '#7dd3e8': '#8a6d4f',
  'text-[#0B1220]': 'text-[#3a2f22]',
};

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function processFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts') && !filePath.endsWith('.css') && !filePath.endsWith('.md')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Custom complex replacements first
  content = content.replace(/bg-white text-\[#0B1220\]/g, 'bg-[#8a6d4f] text-[#ffffff]');
  content = content.replace(/bg-white\/10 text-\[#A9B4C4\]/g, 'bg-[#f3ebdd] text-[#a89880]');
  content = content.replace(/text-\[#A9B4C4\] hover:text-white hover:bg-white\/5/g, 'text-[#a89880] hover:text-[#3a2f22] hover:bg-[#f3ebdd]');
  content = content.replace(/text-\[#A9B4C4\] hover:bg-white\/5 hover:text-white/g, 'text-[#a89880] hover:bg-[#f3ebdd] hover:text-[#3a2f22]');
  content = content.replace(/text-\[#A9B4C4\] hover:text-white/g, 'text-[#a89880] hover:text-[#3a2f22]');
  content = content.replace(/bg-\[#0B1220\] border-white\/10/g, 'bg-[#faf6ef] border-[#e6dcc8]');
  content = content.replace(/border-white\/10/g, 'border-[#e6dcc8]');
  
  // Specific dark-mode glassmorphism background classes
  content = content.replace(/bg-white\/5 text-white/g, 'bg-[#f6efe3] text-[#3a2f22]');
  content = content.replace(/bg-white\/5/g, 'bg-[#f6efe3]');
  content = content.replace(/bg-white\/10/g, 'bg-[#f3ebdd]');
  content = content.replace(/hover:bg-white\/10/g, 'hover:bg-[#e6dcc8]');
  content = content.replace(/hover:bg-white\/5/g, 'hover:bg-[#f3ebdd]');
  
  // Fix text-white inside converted dashboard components
  // Instead of a global 'text-white' replacement (which could break landing page buttons),
  // we look for specific dashboard layout/component dark mode text cases.
  // Many dashboard files use `text-white` when background was #0B1220.
  // Actually, we can just replace text-white with text-[#3a2f22] in dashboard files.
  
  if (filePath.includes('/dashboard/') || filePath.includes('\\dashboard\\') || filePath.includes('/(auth)/') || filePath.includes('\\(auth)\\')) {
      content = content.replace(/text-white/g, 'text-[#3a2f22]');
      // Also border-white
      content = content.replace(/border-white(?![\/\w])/g, 'border-[#3a2f22]');
      
      // Fix our earlier replacement of text-white inside buttons (bg-[#8a6d4f] text-[#ffffff] got replaced to text-[#3a2f22])
      content = content.replace(/bg-\[#8a6d4f\] text-\[#3a2f22\]/g, 'bg-[#8a6d4f] text-[#ffffff]');
  }

  // Then basic hex replacements
  for (const [oldVal, newVal] of Object.entries(replacements)) {
    if (oldVal.startsWith('#') || oldVal.startsWith('text-')) {
       const regex = new RegExp(escapeRegExp(oldVal), 'g');
       content = content.replace(regex, newVal);
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else {
      processFile(filePath);
    }
  }
}

walkDir(directoryPath);
processFile(path.join(__dirname, 'DESIGN.md'));
