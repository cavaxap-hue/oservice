const fs = require('fs')
let c = fs.readFileSync('src/Logo.jsx', 'utf8')

c = c.replace("const azul = modo === 'dark' ? '#5BA3E8' : '#185FA5'", "const azul = modo === 'dark' ? '#FFC266' : '#C9861F'")
c = c.replace("const barra = modo === 'dark' ? '#378ADD' : '#185FA5'", "const barra = modo === 'dark' ? '#F2A93B' : '#C9861F'")
c = c.replace('fill="#9BB5D4"', 'fill="#FFC266"')
c = c.replace('fontWeight="700" fill="white">S</text>', 'fontWeight="700" fill="#1B1305">S</text>')

fs.writeFileSync('src/Logo.jsx', c, 'utf8')
console.log('dourado:', c.includes('#F2A93B'))
console.log('letra S escura:', c.includes('#1B1305'))