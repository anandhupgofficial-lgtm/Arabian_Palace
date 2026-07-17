const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const IMAGES_DIR = path.join(__dirname, '../images');
const MENU_DIR = path.join(IMAGES_DIR, 'menu');

const filesToProcess = [];

function gatherFiles(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            // We only have menu directory we care about
            if (file === 'menu') gatherFiles(fullPath);
        } else {
            if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
                filesToProcess.push(fullPath);
            }
        }
    }
}

gatherFiles(IMAGES_DIR);

const CONFIG = {
    hero: { widths: [480, 768, 1024, 1536, 1920], quality: 90 }, // High quality for hero
    card: { width: 800, quality: 86 }, // Increased width for retina sharpness
    menu: { width: 800, quality: 88 }, // High quality, larger size for food details
    default: { width: 1200, quality: 82 } // Fallback max width 1200 for decorative
};

async function processImages() {
    for (const filePath of filesToProcess) {
        const filename = path.basename(filePath);
        const ext = path.extname(filename);
        const basename = path.basename(filename, ext).replace('.png', ''); // Handle .png.png cases
        const dir = path.dirname(filePath);

        console.log(`Processing: ${filename}`);

        try {
            // Hero Images
            if (filename.includes('mandi.png.png') || filename.includes('mobile_mani.png')) {
                const prefix = filename.includes('mobile') ? 'hero-mobile' : 'hero-mandi';
                for (const w of CONFIG.hero.widths) {
                    const outPath = path.join(dir, `${prefix}-${w}.webp`);
                    await sharp(filePath)
                        .resize({ width: w, withoutEnlargement: true })
                        .webp({ quality: CONFIG.hero.quality })
                        .toFile(outPath);
                    console.log(` -> ${outPath}`);
                }
                
                // create a default one
                const outPath = path.join(dir, `${prefix}.webp`);
                await sharp(filePath).webp({ quality: CONFIG.hero.quality }).toFile(outPath);
            }
            // Card Images
            else if (filename.includes('_card')) {
                const outPath = path.join(dir, `${basename}.webp`);
                await sharp(filePath)
                    .resize({ width: CONFIG.card.width, withoutEnlargement: true })
                    .webp({ quality: CONFIG.card.quality })
                    .toFile(outPath);
                console.log(` -> ${outPath}`);
            }
            // Menu Images
            else if (dir.includes('menu')) {
                const outPath = path.join(dir, `${basename}.webp`);
                await sharp(filePath)
                    .resize({ width: CONFIG.menu.width, withoutEnlargement: true })
                    .webp({ quality: CONFIG.menu.quality })
                    .toFile(outPath);
                console.log(` -> ${outPath}`);
            }
            // Everything Else (Logo, Camel, etc)
            else {
                let w = CONFIG.default.width;
                let q = CONFIG.default.quality;
                
                // Fine-tune specific decorative elements
                if (filename === 'logo.png' || filename === 'logo.png.png') {
                    w = 600; // Logos need to be sharp but not massive
                    q = 90;
                }
                if (filename === 'camel.png') {
                    w = 1000; 
                    q = 85;
                }
                if (filename === 'why_cutomers.png' || filename === 'our_mission.png' || filename === 'ourmission.png') {
                    w = 1200;
                    q = 86;
                }
                
                const outPath = path.join(dir, `${basename}.webp`);
                const pipeline = sharp(filePath);
                if (w) pipeline.resize({ width: w, withoutEnlargement: true });
                await pipeline.webp({ quality: q }).toFile(outPath);
                console.log(` -> ${outPath}`);
            }
        } catch (err) {
            console.error(`Error processing ${filename}:`, err);
        }
    }
    console.log('All images processed.');
}

processImages();
