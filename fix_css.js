import fs from 'fs';

// 1. Read index.css
let css = fs.readFileSync('./src/index.css', 'utf-8');

// Replace `--color: oklch(A B C);` with `--color: A B C;`
// Handle optional slash and percentage like `oklch(1 0 0 / 10%)`
css = css.replace(/oklch\((.*?)\)/g, '$1');
fs.writeFileSync('./src/index.css', css, 'utf-8');

// 2. Read tailwind.config.js
let tw = fs.readFileSync('./tailwind.config.js', 'utf-8');

// Replace "var(--color)" with "oklch(var(--color) / <alpha-value>)"
tw = tw.replace(/"var\((--.*?)\)"/g, '"oklch(var($1) / <alpha-value>)"');
fs.writeFileSync('./tailwind.config.js', tw, 'utf-8');

console.log('Fixed CSS variables and tailwind config.');
