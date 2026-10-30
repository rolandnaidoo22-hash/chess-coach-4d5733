// v64b: turn chess notation into plain piece-and-place words (used by the coach worker AND the app).
function plainChess(t){ if(typeof t!=="string") return t;
  const PN={K:"king",Q:"queen",R:"rook",B:"bishop",N:"knight"};
  const area=f=>"abc".includes(f)?"the queen side":"de".includes(f)?"the centre":"the king side";
  let s=t.replace(/\b(eval(uation)?|score)\s*(of\s*)?[+-−]?\d+(\.\d+)?/gi,"").replace(/\(\s*[+-−]?\d+(\.\d+)?\s*\)/g,"").replace(/(^|\s)[+-−]\d+\.\d+\b/g,"$1")
    .replace(/\b\d{1,3}\s*\.(\.\.)?\s*(?=[KQRBNa-hO0])/g,"")                       // move numbers 12. / 12...
    .replace(/\b(O-O-O|0-0-0)\b[+#]?/g,"castling on the queen side").replace(/\b(O-O|0-0)\b[+#]?/g,"castling on the king side")
    .replace(/\b([KQRBN])([a-h])?([1-8])?(x)?([a-h])([1-8])(=[QRBN])?([+#])?(?![\w])/g,(m,p,_f,_r,x,f)=>`the ${PN[p]} ${x?"capture":"move"} on ${area(f)}${m.endsWith("#")?" (checkmate)":m.endsWith("+")?" with check":""}`)
    .replace(/\b(on|to|from|at|onto|into|of|near|towards?|behind)\s+(?:the\s+)?([a-h])([1-8])\b(\s+square)?/gi,(m,w,f,r)=>`${w} ${("ah".includes(f)&&"18".includes(r))?"the corner on "+area(f):area(f)}`)
    .replace(/\b([a-h])x([a-h])([1-8])(=[QRBN])?([+#])?(?![\w])/g,(m,a,f)=>`the pawn capture on ${area(f)}${m.endsWith("+")?" with check":""}`)
    .replace(/\b([a-h])([1-8])=([QRBN])[+#]?/g,(m,f,r,q)=>`the pawn becoming a ${PN[q]}`)
    .replace(/\b([a-h])([2-7])([+#])?(?=[\s,.;:!?)\]*]|$)/g,(m,f)=>`a pawn move in ${area(f)}`) // e4 (pawn move or square)
    .replace(/\b([a-h])([18])\b/g,(m,f)=>`a back-row square on ${area(f)}`)
    .replace(/\b[a-h]-?file\b/gi,"column").replace(/\bcentipawns?\b/gi,"").replace(/\s{2,}/g," ").replace(/\ba a\b/g,"a");
  return s; }
const NOTATION=/\b(O-O|0-0)\b|\b[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8]\b|\b\d+\.\s*[KQRBNa-h]/;
if(typeof module!=="undefined") module.exports={plainChess,NOTATION}; else { window.plainChess=plainChess; window.CR_NOTATION=NOTATION; }
