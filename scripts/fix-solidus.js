const fs = require('fs');
const path = require('path');

const fixFile = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf-8');
    // Replace " / width..." with " width... />" or just remove the / and add it at the end
    content = content.replace(/ \/\s+(loading="[^"]+")?\s*width="([^"]+)"\s+height="([^"]+)"/g, ' $1 width="$2" height="$3" />');
    // Also handle cases where there was no loading attr injected after the solidus
    content = content.replace(/ \/\s+width="([^"]+)"\s+height="([^"]+)"/g, ' width="$1" height="$2" />');
    
    // Some might just have " / loading..."
    content = content.replace(/ \/\s+loading="([^"]+)"/g, ' loading="$1" />');

    // And make sure we don't have multiple />
    content = content.replace(/\/>\s*>/g, '/>');
    
    fs.writeFileSync(filePath, content);
};

fixFile(path.join(__dirname, '../index.html'));
fixFile(path.join(__dirname, '../ourstory.html'));
console.log("Fixed solidus");
