const fs = require('fs');
const aboutPath = 'c:/Users/ASUS/Music/SaaS/src/app/about/page.tsx';
let aboutContent = fs.readFileSync(aboutPath, 'utf8');

// For about/page.tsx: remove features sections
// From SECTION: 4 SALON PILLARS up to SECTION 8: CINEMATIC BANNER
aboutContent = aboutContent.replace(/\{\/\*\s*={10,}\s*\*\/}[\s\n]*\{\/\*\s*SECTION:\s*4\s*SALON\s*PILLARS[\s\S]*?(?=\{\/\*\s*={10,}\s*\*\/}[\s\n]*\{\/\*\s*SECTION\s*8:\s*CINEMATIC)/g, '');

fs.writeFileSync(aboutPath, aboutContent);

const featPath = 'c:/Users/ASUS/Music/SaaS/src/app/features/page.tsx';
let featContent = fs.readFileSync(featPath, 'utf8');

// For features/page.tsx: remove about sections
// From SECTION 1: HERO up to SECTION: 4 SALON PILLARS
featContent = featContent.replace(/\{\/\*\s*={10,}\s*\*\/}[\s\n]*\{\/\*\s*SECTION\s*1:\s*HERO[\s\S]*?(?=\{\/\*\s*={10,}\s*\*\/}[\s\n]*\{\/\*\s*SECTION:\s*4\s*SALON)/g, '');

// From SECTION 8: CINEMATIC BANNER up to </main>
featContent = featContent.replace(/\{\/\*\s*={10,}\s*\*\/}[\s\n]*\{\/\*\s*SECTION\s*8:\s*CINEMATIC[\s\S]*?(?=<\/main>)/g, '');

featContent = featContent.replace('export default function AboutPage()', 'export default function FeaturesPage()');

fs.writeFileSync(featPath, featContent);
console.log('Script done.');
