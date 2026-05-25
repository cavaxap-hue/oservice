const fs = require('fs')
const lines = fs.readFileSync('src/Dashboard.jsx','utf8').split(/\r?\n/)
let p=0,c=0,b=0,s=null,tpl=0
for(let i=0;i<lines.length;i++){
  const L=lines[i]
  for(let j=0;j<L.length;j++){
    const ch=L[j],pv=L[j-1]
    if(s){if(ch===s&&pv!=='\\')s=null;continue}
    if(ch==='"'||ch==="'"||ch==='`'){s=ch;continue}
    if(ch==='(')p++;else if(ch===')')p--
    else if(ch==='{')c++;else if(ch==='}')c--
    else if(ch==='[')b++;else if(ch===']')b--
  }
}
console.log('paren:',p,'chave:',c,'colch:',b)