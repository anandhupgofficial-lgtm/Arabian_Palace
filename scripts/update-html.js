const fs = require('fs');
const path = require('path');
// Since sharp is installed, we can use it to read image dimensions
const sharp = require('sharp');

const indexHtmlPath = path.join(__dirname, '../index.html');
const ourStoryHtmlPath = path.join(__dirname, '../ourstory.html');
const imagesDir = path.join(__dirname, '../images');

async function getDims(imagePath) {
    try {
        const metadata = await sharp(imagePath).metadata();
        return { width: metadata.width, height: metadata.height };
    } catch (e) {
        return null;
    }
}

async function run() {
    let indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8');

    // 1. Replace Hero Image section with responsive picture and LCP fix
    const heroRegex = /<picture>\s*<source[^>]+>\s*<img[^>]+src="images\/mandi\.png\.png"[^>]+>\s*<\/picture>/g;
    const newHero = `<picture>
          <source media="(max-width: 768px)" type="image/webp"
                  srcset="images/hero-mobile-320.webp 320w,
                          images/hero-mobile-480.webp 480w,
                          images/hero-mobile-768.webp 768w"
                  sizes="(max-width: 768px) 100vw">
          <source media="(min-width: 769px)" type="image/webp"
                  srcset="images/hero-mandi-768.webp 768w,
                          images/hero-mandi-1024.webp 1024w,
                          images/hero-mandi-1536.webp 1536w"
                  sizes="50vw">
          <img
            src="images/hero-mandi.webp"
            alt="Authentic Arabian Mandi"
            class="mandi-img"
            loading="eager"
            fetchpriority="high"
            width="1536"
            height="1536"
            style="aspect-ratio: 1/1; height: auto;"
          />
        </picture>`;

    if (heroRegex.test(indexHtml)) {
        indexHtml = indexHtml.replace(heroRegex, newHero);
    } else {
        const oldHero = `<picture>
          <source media="(max-width: 768px)" srcset="images/mobile_mani.png">
          <img
            src="images/mandi.png.png"
            alt="Authentic Arabian Mandi"
            class="mandi-img"
            loading="lazy"
          />
        </picture>`;
        indexHtml = indexHtml.replace(oldHero, newHero);
    }

    // Process all images in index.html
    const imgRegex = /<img([^>]*)>/g;
    let match;
    let replacements = [];
    
    while ((match = imgRegex.exec(indexHtml)) !== null) {
        replacements.push({
            fullMatch: match[0],
            attrs: match[1],
            index: match.index
        });
    }

    // Go in reverse to not mess up indexes
    for (let i = replacements.length - 1; i >= 0; i--) {
        const rep = replacements[i];
        if (rep.attrs.includes('fetchpriority="high"')) continue; // Skip hero if processed

        let newAttrs = rep.attrs;

        // Replace .png with .webp
        newAttrs = newAttrs.replace(/src="images\/([^"]+)\.png\.png"/g, 'src="images/$1.webp"');
        newAttrs = newAttrs.replace(/src="images\/([^"]+)\.png"/g, 'src="images/$1.webp"');

        // Check if eager loading is appropriate
        // If it already has loading="eager" (like logo), preserve it.
        if (!newAttrs.includes('loading=')) {
            // If it's a logo or banner, maybe eager
            if (newAttrs.includes('logo') || newAttrs.includes('rider')) {
                newAttrs += ' loading="eager"';
            } else {
                newAttrs += ' loading="lazy"';
            }
        }

        // Try to inject exact width and height from the webp file if not present
        if (!newAttrs.includes('width=')) {
            const srcMatch = newAttrs.match(/src="([^"]+)"/);
            if (srcMatch && srcMatch[1]) {
                const imgPath = path.join(__dirname, '..', srcMatch[1]);
                if (fs.existsSync(imgPath)) {
                    const dims = await getDims(imgPath);
                    if (dims) {
                        newAttrs += ` width="${dims.width}" height="${dims.height}"`;
                    }
                }
            }
        }

        const newImg = `<img${newAttrs}>`;
        indexHtml = indexHtml.substring(0, rep.index) + newImg + indexHtml.substring(rep.index + rep.fullMatch.length);
    }

    // Replace CSS backgrounds
    indexHtml = indexHtml.replace(/url\('images\/(.*?)\.png'\)/g, "url('images/$1.webp')");
    fs.writeFileSync(indexHtmlPath, indexHtml);
    console.log("Updated index.html");

    // Update ourstory.html
    let ourStoryHtml = fs.readFileSync(ourStoryHtmlPath, 'utf-8');
    
    let storyReplacements = [];
    while ((match = imgRegex.exec(ourStoryHtml)) !== null) {
        storyReplacements.push({
            fullMatch: match[0],
            attrs: match[1],
            index: match.index
        });
    }

    for (let i = storyReplacements.length - 1; i >= 0; i--) {
        const rep = storyReplacements[i];
        let newAttrs = rep.attrs;
        newAttrs = newAttrs.replace(/src="images\/([^"]+)\.png\.png"/g, 'src="images/$1.webp"');
        newAttrs = newAttrs.replace(/src="images\/([^"]+)\.png"/g, 'src="images/$1.webp"');

        if (!newAttrs.includes('loading=')) {
            if (newAttrs.includes('logo')) {
                newAttrs += ' loading="eager"';
            } else {
                newAttrs += ' loading="lazy"';
            }
        }

        if (!newAttrs.includes('width=')) {
            const srcMatch = newAttrs.match(/src="([^"]+)"/);
            if (srcMatch && srcMatch[1]) {
                const imgPath = path.join(__dirname, '..', srcMatch[1]);
                if (fs.existsSync(imgPath)) {
                    const dims = await getDims(imgPath);
                    if (dims) {
                        newAttrs += ` width="${dims.width}" height="${dims.height}"`;
                    }
                }
            }
        }

        const newImg = `<img${newAttrs}>`;
        ourStoryHtml = ourStoryHtml.substring(0, rep.index) + newImg + ourStoryHtml.substring(rep.index + rep.fullMatch.length);
    }

    fs.writeFileSync(ourStoryHtmlPath, ourStoryHtml);
    console.log("Updated ourstory.html");
}

run().catch(console.error);
