const fs = require('fs');
const src = String.raw`C:\Users\dougl\.claude\projects\c--Users-dougl-OneDrive--rea-de-Trabalho-move37-operational-system\<session-id>\tool-results\<generate-types-result>.txt`;
const dst = String.raw`C:\Users\dougl\OneDrive\Área de Trabalho\move37-operational-system\src\lib\supabase\types.ts`;
const raw = fs.readFileSync(src, 'utf8');
const d = JSON.parse(raw);
fs.writeFileSync(dst, d.types, 'utf8');
console.log('wrote', dst, 'len', d.types.length);
