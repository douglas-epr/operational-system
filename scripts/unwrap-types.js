const fs = require('fs');
const src = String.raw`C:\Users\dougl\.claude\projects\C--Users-dougl-OneDrive--rea-de-Trabalho-blur-studio-internal-tools\b87f7979-cbff-4cbd-a504-875c34c26d86\tool-results\mcp-supabase-generate_typescript_types-1776909532340.txt`;
const dst = String.raw`C:\Users\dougl\OneDrive\Área de Trabalho\blur-studio-internal-tools\src\lib\supabase\types.ts`;
const raw = fs.readFileSync(src, 'utf8');
const d = JSON.parse(raw);
fs.writeFileSync(dst, d.types, 'utf8');
console.log('wrote', dst, 'len', d.types.length);
