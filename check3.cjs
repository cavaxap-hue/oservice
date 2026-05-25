const fs = require('fs')
const src = fs.readFileSync('src/Dashboard.jsx','utf8')
const tags=['div','span','button','p','h1','h2','h3','pre','table','thead','tbody','tr','th','td','label','select','option','textarea','nav','ul','li','strong','small']
for(const tag of tags){
  const abre=(src.match(new RegExp('<'+tag+'[\\s>]','g'))||[]).length
  const selfClose=(src.match(new RegExp('<'+tag+'[^>]*/>','g'))||[]).length
  const fecha=(src.match(new RegExp('</'+tag+'>','g'))||[]).length
  const real=abre-selfClose
  if(real!==fecha)console.log(tag+': abre '+real+' fecha '+fecha+' DIFF '+(real-fecha))
}
console.log('fim')