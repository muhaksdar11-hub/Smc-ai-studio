import fs from 'fs';
import path from 'path';

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        // Exclude specific heavy directories
        if (file.includes('node_modules') || file.includes('dist') || file.includes('android')) return;
        
        if (stat && stat.isDirectory()) { 
            results = results.concat(walkDir(file));
        } else { 
            if (file.endsWith('.ts') || file.endsWith('.tsx')) results.push(file);
        }
    });
    return results;
}

const files = walkDir('./src');
for (const file of files) {
   let content = fs.readFileSync(file, 'utf8');
   content = content.replace(/\\`/g, '`');
   content = content.replace(/\\\$/g, '$');
   fs.writeFileSync(file, content);
}
console.log('Fixed backticks across all TS/TSX!');
