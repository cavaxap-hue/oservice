const fs = require('fs')
let c = fs.readFileSync('src/App.jsx', 'utf8')

c = c.replace(
  "const [mostrarLogin, setMostrarLogin] = useState(false)",
  "const [mostrarLogin, setMostrarLogin] = useState(false)\n  const veioDeRecovery = typeof window !== 'undefined' && window.location.hash.includes('type=recovery')"
)

c = c.replace(
  "if (_event === 'PASSWORD_RECOVERY') {",
  "if (_event === 'PASSWORD_RECOVERY' || (session && veioDeRecovery)) {"
)

fs.writeFileSync('src/App.jsx', c, 'utf8')
console.log('recovery na url:', c.includes('veioDeRecovery'))