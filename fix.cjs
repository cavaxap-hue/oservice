const fs = require('fs')
let lines = fs.readFileSync('src/Dashboard.jsx', 'utf8').split(/\r?\n/)
// Remove a linha 102 (indice 101) que tem o } extra
lines.splice(101, 1)
fs.writeFileSync('src/Dashboard.jsx', lines.join('\r\n'), 'utf8')
const c = lines.join('\n')
console.log('removido! abre:', (c.match(/{/g)||[]).length, 'fecha:', (c.match(/}/g)||[]).length)