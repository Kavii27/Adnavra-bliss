const fs = require('fs');

const aboutPath = 'c:/Users/ASUS/Music/SaaS/src/app/about/page.tsx';
let aboutContent = fs.readFileSync(aboutPath, 'utf8');

// For about/page.tsx, we remove Sections 4 through 7
const aboutStartMarker = '{/* ============================================================ */}\n        {/* SECTION: 4 SALON PILLARS';
const aboutEndMarker = '{/* ============================================================ */}\n        {/* SECTION 8: CINEMATIC BANNER';

let startIdx = aboutContent.indexOf(aboutStartMarker);
let endIdx = aboutContent.indexOf(aboutEndMarker);

if (startIdx !== -1 && endIdx !== -1) {
  aboutContent = aboutContent.substring(0, startIdx) + aboutContent.substring(endIdx);
}

fs.writeFileSync(aboutPath, aboutContent);

const featuresPath = 'c:/Users/ASUS/Music/SaaS/src/app/features/page.tsx';
let featuresContent = fs.readFileSync(featuresPath, 'utf8');

// Rename component
featuresContent = featuresContent.replace('export default function AboutPage()', 'export default function FeaturesPage()');

// For features/page.tsx, remove Sections 1 to 3
const featHeroStart = '{/* ============================================================ */}\n        {/* SECTION 1: HERO';
const featHeroEnd = '{/* ============================================================ */}\n        {/* SECTION: 4 SALON PILLARS';

startIdx = featuresContent.indexOf(featHeroStart);
endIdx = featuresContent.indexOf(featHeroEnd);
if (startIdx !== -1 && endIdx !== -1) {
  featuresContent = featuresContent.substring(0, startIdx) + featuresContent.substring(endIdx);
}

// Remove Sections 8 to 10
const featCinematicStart = '{/* ============================================================ */}\n        {/* SECTION 8: CINEMATIC BANNER';
const featCinematicEnd = '</main>';

startIdx = featuresContent.indexOf(featCinematicStart);
endIdx = featuresContent.indexOf(featCinematicEnd);
if (startIdx !== -1 && endIdx !== -1) {
  featuresContent = featuresContent.substring(0, startIdx) + '\n      ' + featuresContent.substring(endIdx);
}

fs.writeFileSync(featuresPath, featuresContent);

console.log('Done modifying pages.');
