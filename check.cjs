const fs = require('fs')
const c = fs.readFileSync('src/Dashboard.jsx', 'utf8')
console.log('abre:', (c.match(/{/g)||[]).length)
console.log('fecha:', (c.match(/}/g)||[]).length)