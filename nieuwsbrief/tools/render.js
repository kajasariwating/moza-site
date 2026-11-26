// Rendert nieuwsbriefkaarten (600 css px breed, 2x) naar PNG.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const DIR = __dirname;
const F = (w) => 'data:font/woff2;base64,' + fs.readFileSync(path.join(process.env.FONTDIR||path.join(process.env.FONTDIR||path.join(DIR,'package/files')), `hanken-grotesk-latin-${w}-normal.woff2`)).toString('base64');
const FE = (w) => 'data:font/woff2;base64,' + fs.readFileSync(path.join(process.env.FONTDIR||path.join(process.env.FONTDIR||path.join(DIR,'package/files')), `hanken-grotesk-latin-ext-${w}-normal.woff2`)).toString('base64');
const fontCss = [400, 500, 700, 800, 900].map(w => `
@font-face{font-family:H;font-weight:${w};src:url(${F(w)}) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;}
@font-face{font-family:H;font-weight:${w};src:url(${FE(w)}) format('woff2');unicode-range:U+0100-02AF,U+1E00-1EFF,U+2020,U+20A0-20AB,U+20AD-20CF,U+2113,U+2C60-2C7F,U+A720-A7FF;}`).join('');

const FR='data:font/woff2;base64,'+fs.readFileSync(path.join(process.env.FONTDIR||path.join(DIR,'package/files'),'fraunces-latin-600-italic.woff2')).toString('base64');
const IMG=f=>'data:image/'+(f.endsWith('.png')?'png':'jpeg')+';base64,'+fs.readFileSync(path.join(DIR,f)).toString('base64');
const base = `${fontCss}@font-face{font-family:F;font-style:italic;font-weight:600;src:url(${FR})}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:600px;background:var(--pg,#fff);font-family:H,sans-serif;color:#111;-webkit-font-smoothing:antialiased}
#c{width:600px}
`;

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const T = {
  stand: d => `<style>
  #c{padding:12px 26px 26px 18px}
  .k{border:2.5px solid #111;background:#fff;box-shadow:9px 9px 0 #1F3BD1;padding:24px 24px 22px}
  .lab{color:#1F3BD1;font-weight:800;font-size:10px;letter-spacing:2px}
  .top{display:flex;align-items:center;gap:20px;margin-top:6px}
  .n{color:#1F3BD1;font-weight:900;font-size:68px;letter-spacing:-3px;line-height:1}
  .top b{display:block;font-weight:800;font-size:17px}.top span{display:block;font-size:13.5px;color:#444;margin-top:3px}
  p{font-size:12.5px;line-height:1.6;color:#222;margin-top:12px}
  .bar{display:flex;height:4px;margin:14px 0 14px}.bar i{display:block;height:4px}
  .g{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:9px}
  .o{border:2px solid #111;box-shadow:4px 4px 0 #111;padding:10px 10px 10px}
  .o b{display:block;font-weight:800;font-size:11.5px}.o strong{display:block;font-weight:900;font-size:19px;margin:7px 0 6px}.o span{font-weight:800;font-size:10.5px}
  .f{font-family:F;font-style:italic;font-weight:600;font-size:13px;margin-top:16px}</style>
  <div class="k"><div class="lab">WE ZOEKEN</div><div class="top"><div class="n">100</div><div><b>donateurs</b><span>die de website in de lucht houden</span></div></div>
  <p>${esc(d.text)}</p><div class="bar"><i style="width:45%;background:#1F3BD1"></i><i style="width:45%;background:#FF7AB6"></i><i style="width:10%;background:#FF4D2E"></i></div>
  <div class="lab">ZO KUN JE HELPEN</div><div class="g"><div class="o" style="background:#E9F25A"><b>Word vriend</b><strong>€ 20</strong><span>per jaar</span></div><div class="o" style="background:#FF7AB6"><b>Geef een klein bedrag</b><strong>€ 3 · 5 · 10</strong><span>eenmalig</span></div><div class="o"><b>Liever direct?</b><strong>bunq.me</strong><span>of overmaken</span></div></div>
  <div class="f">Je betaalt één keer. Er wordt niets automatisch afgeschreven.</div></div>`,

  tile: d => `<style>
  #c{padding:0 25px}
  .k{border:2px solid #111;background:#fff}
  .im{height:250px;background:url(${IMG(d.img)}) ${d.pos||'center'}/cover;position:relative;border-bottom:2px solid #111}
  .lv{position:absolute;left:16px;top:16px;background:#fff;border:2px solid #111;font-weight:800;font-size:12px;padding:6px 10px 5px;display:flex;align-items:center;gap:7px}
  .lv i{width:9px;height:9px;border-radius:50%;background:#FF4D2E;display:block}
  .st{position:absolute;right:20px;top:22px;width:92px;height:92px;border-radius:50%;background:#E9F25A;border:2.5px solid #111;transform:rotate(-10deg);display:flex;align-items:center;justify-content:center;text-align:center;font-weight:900;font-size:15px;line-height:1.05}
  .tt{position:absolute;left:18px;bottom:14px;right:18px;color:#fff;font-weight:900;font-size:34px;line-height:1.02;letter-spacing:-.8px;text-shadow:3px 3px 0 #111}
  .tt em{font-family:F;font-style:italic;font-weight:600;color:#E9F25A}
  .b{padding:16px 18px 16px}
  h2{font-weight:800;font-size:20px;line-height:1.2}
  p{font-size:14.5px;line-height:1.45;color:#444;margin-top:5px}
  </style>
  <div class="k"><div class="im"><span class="lv"><i></i>Live</span>${d.sticker?`<div class="st">${d.sticker}</div>`:''}${d.big?`<div class="tt">${d.big}</div>`:''}</div>
  <div class="b"><h2>${esc(d.title)}</h2><p>${esc(d.sub)}</p></div></div>`,
  peil: d => `<style>
  #c{padding:12px 18px 16px}
  .k{border:2.5px solid #111;background:#1F3BD1;box-shadow:8px 8px 0 #E9F25A;margin-right:8px;position:relative;padding:18px 18px 18px}
  .lab{display:inline-block;background:#fff;border:2.5px solid #111;font-weight:800;font-size:12px;padding:5px 9px 4px}
  .lr{position:absolute;right:16px;top:18px}
  h2{color:#fff;font-weight:900;font-size:30px;line-height:1.05;letter-spacing:-.8px;text-shadow:3px 3px 0 #111;margin-top:16px;max-width:470px}
  h2 em{font-family:F;font-style:italic;font-weight:600;color:#E9F25A}
  .blk{background:#fff;border:2.5px solid #111;padding:12px 14px 10px;margin-top:14px}
  .q{font-weight:800;font-size:12.5px;margin-bottom:8px}
  .r{display:flex;align-items:center;gap:8px;margin:6px 0}
  .r span{width:170px;flex:none;font-size:11.5px;font-weight:600;line-height:1.25}
  .bar{flex:1;height:16px;background:#F4F2EC;border:1.5px solid #111;position:relative}
  .bar i{position:absolute;left:0;top:0;bottom:0;background:var(--c,#1F3BD1)}
  .r b{width:38px;text-align:right;font-weight:900;font-size:13px}
  .foot{display:flex;justify-content:space-between;align-items:center;margin-top:14px}
  .foot p{color:#fff;font-size:11.5px;font-weight:600}
  .btn{background:#E9F25A;border:2.5px solid #111;font-weight:800;font-size:12.5px;padding:9px 12px}</style>
  <div class="k"><span class="lab">Tussenstand · ${esc(d.n)} reacties</span><span class="lab lr">Jullie zeiden</span>
  <h2>${d.title}</h2>
  ${d.blocks.map(b=>`<div class="blk"><div class="q">${esc(b.q)}</div>${b.rows.map(r=>`<div class="r"><span>${esc(r[0])}</span><div class="bar"><i style="width:${r[1]}%;--c:${r[2]||'#1F3BD1'}"></i></div><b>${r[1]}%</b></div>`).join('')}</div>`).join('')}
  <div class="foot"><p>${esc(d.foot)}</p>${d.btn?`<span class="btn">${esc(d.btn)} →</span>`:''}</div></div>`,

  split: d => `<style>
  #c{padding:10px 18px 12px}
  .k{border:2.5px solid #111;background:${d.hole?'transparent':'#fff'};display:flex;flex-direction:${d.rev?'row-reverse':'row'};box-shadow:${d.rev?'-':''}7px 7px 0 ${d.sh||'#1F3BD1'};margin-${d.rev?'left':'right'}:7px}
  .im{width:220px;flex:none;min-height:200px;${d.hole?'background:transparent;':`background-image:url(${IMG(d.img)});background-size:cover;background-position:${d.pos||'center'};`}border-${d.rev?'left':'right'}:2.5px solid #111;position:relative}
  .im span{position:absolute;left:8px;bottom:8px;background:#fff;border:2px solid #111;font-weight:800;font-size:10px;padding:3px 6px}
  .t{padding:16px 16px 14px;display:flex;flex-direction:column;background:#fff;flex:1}
  .lab{color:#1F3BD1;font-weight:800;font-size:9.5px;letter-spacing:1.8px}
  h2{font-weight:800;font-size:19px;line-height:1.22;margin-top:8px}
  h2 em{font-family:F;font-style:italic;font-weight:600;color:#1F3BD1}
  p{color:#555;font-size:12px;line-height:1.6;margin-top:8px}
  .l{font-weight:800;font-size:11.5px;margin-top:auto;padding-top:10px}
  .cr{color:#999;font-size:9.5px;margin-top:6px}</style>
  <div class="k"><div class="im">${d.tag?`<span>${esc(d.tag)}</span>`:''}</div><div class="t"><div class="lab">${esc(d.label)}</div><h2>${d.title}</h2><p>${esc(d.sub)}</p>${d.credit?`<div class="cr">${esc(d.credit)}</div>`:''}<div class="l">Lees verder →</div></div></div>`,

  social: d => `<style>
  #c{padding:12px 18px 14px}
  .k{border:2.5px solid #111;background:#fff}
  .k .ph:last-child{border-bottom:0}.ph{position:relative;height:${d.h||330}px;background:${d.bg||'#111'};${d.img?`background-image:url(${IMG(d.img)});background-size:cover;background-position:${d.pos||'center'};`:''}border-bottom:2.5px solid #111;overflow:hidden}
  .lab{position:absolute;top:16px;background:#fff;border:2.5px solid #111;font-weight:800;font-size:12px;padding:5px 9px 4px}
  .ll{left:16px}.lr{right:16px}
  .st{position:absolute;right:20px;top:${d.sty||66}px;width:92px;height:92px;border-radius:50%;background:#E9F25A;border:3px solid #111;transform:rotate(-10deg);display:flex;align-items:center;justify-content:center;text-align:center;font-weight:900;font-size:${d.sts||17}px;line-height:1.05}
  h2{position:absolute;left:18px;right:${d.hr||18}px;bottom:${d.hb||18}px;color:#fff;font-weight:900;font-size:${d.fs||40}px;line-height:1;letter-spacing:-1.2px;text-shadow:4px 4px 0 #111}
  h2 em{font-family:F;font-style:italic;font-weight:600;color:#E9F25A;letter-spacing:-.5px}
  .big{position:absolute;left:18px;top:62px;color:#E9F25A;font-weight:900;font-size:104px;line-height:1;letter-spacing:-4px;text-shadow:5px 5px 0 #111}
  .cv{position:absolute;left:0;right:0;top:${d.cvt||60}px;display:flex;justify-content:center;gap:22px}
  .cv img{height:${d.cvh||150}px;border:3px solid #111}
  .cr{position:absolute;right:10px;bottom:6px;font-size:9px;font-weight:700;color:#fff;text-shadow:1px 1px 0 #111}
  .b{padding:15px 16px 15px;display:flex;justify-content:space-between;align-items:flex-end;gap:16px}
  .s{font-size:13px;line-height:1.55;color:#333;font-weight:500}
  .l{flex:none;font-weight:800;font-size:12px;background:${d.btn||'#E9F25A'};border:2.5px solid #111;padding:8px 11px;white-space:nowrap}</style>
  <div class="k"><div class="ph">${d.big?`<div class="big">${d.big}</div>`:''}${d.covers?`<div class="cv">${d.covers.map((c,i)=>`<img src="${IMG(c)}" style="box-shadow:6px 6px 0 ${['#FF7AB6','#1F3BD1','#E9F25A'][i]}">`).join('')}</div>`:''}
  <span class="lab ll">${esc(d.l1)}</span><span class="lab lr">${esc(d.l2)}</span>${d.sticker?`<div class="st">${d.sticker}</div>`:''}
  <h2>${d.title}</h2>${d.credit?`<div class="cr">${esc(d.credit)}</div>`:''}</div>
  ${d.noband?'':`<div class="b"><div class="s">${esc(d.sub)}</div><span class="l">${esc(d.link||'Lees verder')} →</span></div>`}</div>`,

  head: d => `<style>
  .top{display:flex;justify-content:space-between;align-items:center;padding:19px 28px 0 28px;height:94px}
  .logo{width:58px;height:58px;border-radius:50%;background:#1F3BD1;color:#fff;font-weight:800;font-size:15px;display:flex;align-items:center;justify-content:center;letter-spacing:.2px}
  .r{text-align:right}.r b{display:block;font-weight:800;font-size:18.5px}.r span{display:block;font-weight:600;font-size:12px;color:#666;margin-top:9px}
  .bar{height:5px;background:#111;margin-top:0}
  .band{background:#E9F25A;height:39px;display:flex;align-items:center;padding:0 28px;font-size:13.5px}
  .band b{font-weight:800;margin-right:9px}</style>
  <div class="top"><div class="logo">MOZA</div><div class="r"><b>Nieuwsbrief</b><span>${d.date}</span></div></div>
  <div class="bar"></div><div class="band"><b>Voor en door Molukkers</b> Het belangrijkste nieuws van MOZA</div>`,

  hero: d => `<style>
  body{background:#111}#c{background:#111;padding:22px 28px 30px}
  .lab{display:inline-block;background:#E9F25A;color:#111;font-weight:800;font-size:10px;letter-spacing:1.3px;padding:6px 9px 5px}
  h1{color:#fff;font-weight:700;font-size:26px;line-height:1.3;margin-top:14px;max-width:420px}
  p{color:#d6d6d6;font-size:13.5px;line-height:1.65;margin-top:14px;max-width:490px}
  .l{color:#E9F25A;font-weight:700;font-size:13px;margin-top:20px}</style>
  <span class="lab">${esc(d.label)}</span><h1>${esc(d.title)}</h1><p>${esc(d.text)}</p><div class="l">${esc(d.link || 'Lees het artikel')} →</div>`,

  row: d => {
    const lab = d.box
      ? `<span class="box" style="background:${d.box}">${d.label.split('|').map(esc).join('<br>')}</span>`
      : `<span class="txt">${esc(d.label)}</span>`;
    return `<style>
  #c{display:flex;padding:${d.box ? '23' : '25'}px 28px 22px;border-bottom:3px solid #e8e8e8;min-height:${d.min || 0}px}
  .l{width:132px;flex:none;padding-top:${d.box ? 0 : 1}px}
  .txt{color:#1F3BD1;font-weight:800;font-size:9.5px;letter-spacing:1.9px;display:block;margin-top:2px}
  .box{display:inline-block;border:2.5px solid #111;font-weight:800;font-size:9px;letter-spacing:1.5px;line-height:1.45;padding:5px 8px 4px}
  .m{flex:1}
  h2{font-weight:500;font-size:18px;line-height:1.5;color:#111;max-width:320px}
  .s{color:#777;font-weight:600;font-size:11px;margin-top:8px}
  .c{color:#888;font-weight:400;font-size:10.5px;margin-top:5px}</style>
  <div class="l">${lab}</div><div class="m"><h2>${esc(d.title)}</h2>${d.sub ? `<div class="s">${esc(d.sub)}</div>` : ''}${d.credit ? `<div class="c">${esc(d.credit)}</div>` : ''}</div>`;
  },

  pop: d => `<style>
  #c{display:flex;padding:19px 28px 17px;border-bottom:3px solid #e8e8e8;align-items:flex-start}
  .n{width:22px;height:22px;flex:none;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:10px;margin-top:4px;margin-right:22px;${d.n == 1 ? 'background:#1F3BD1;color:#fff' : 'background:#E9F25A;border:2px solid #111'}}
  h2{font-weight:500;font-size:14.5px;line-height:1.6;max-width:380px}</style>
  <div class="n">${d.n}</div><h2>${esc(d.title)}</h2>`,

  ev: d => `<style>
  html,body{background:#F4F2EC}#c{padding:7px 18px 7px}
  .k{border:2.5px solid #111;background:#fff}
  .t{background:#E9F25A;border-bottom:2.5px solid #111;height:56px;display:flex;align-items:center;padding:0 14px}
  .t b{font-weight:800;font-size:22px;margin-right:9px}.t span{font-weight:800;font-size:10.5px;letter-spacing:1.8px;margin-top:3px}
  .b{padding:15px 14px 14px}
  .cat{color:#1F3BD1;font-weight:800;font-size:9.5px;letter-spacing:1.9px}
  h2{font-weight:700;font-size:15px;margin-top:8px}
  .w{color:#777;font-size:11px;margin-top:10px}</style>
  <div class="k"><div class="t"><b>${d.day}</b><span>${esc(d.mon)} · ${esc(d.wd)}</span></div>
  <div class="b"><div class="cat">${esc(d.cat)}</div><h2>${esc(d.title)}</h2><div class="w">${esc(d.where)}</div></div></div>`,

  wa: d => `<style>
  #c{padding:14px 28px 30px}
  .k{background:#1F3BD1;border:2.5px solid #111;box-shadow:12px 12px 0 #E9F25A;padding:24px 22px 26px;margin-right:12px}
  .lab{color:#E9F25A;font-weight:800;font-size:10px;letter-spacing:1.8px}
  h2{color:#E9F25A;font-weight:800;font-size:24px;line-height:1.25;margin-top:10px;max-width:440px}
  p{color:#fff;font-size:13px;line-height:1.65;margin-top:12px;max-width:450px}
  .b{display:inline-block;background:#E9F25A;color:#111;border:2.5px solid #111;font-weight:800;font-size:13px;padding:13px 18px;margin-top:20px}</style>
  <div class="k"><div class="lab">${esc(d.label)}</div><h2>${esc(d.title)}</h2><p>${esc(d.text)}</p><span class="b">${esc(d.btn)} →</span></div>`,

  kb: d => `<style>
  #c{padding:10px 18px 10px}
  .k{border:2.5px solid #111}
  .t{height:140px;position:relative;background:${d.bg};background-image:radial-gradient(${d.dot} 1px,transparent 1.3px);background-size:12px 12px;border-bottom:2.5px solid #111;display:flex;align-items:center;justify-content:center}
  .lab{position:absolute;left:12px;top:12px;background:#fff;border:2.5px solid #111;font-weight:800;font-size:9.5px;letter-spacing:1.3px;padding:5px 7px 4px}
  .b{padding:20px 14px 16px;background:#fff}
  h2{font-weight:800;font-size:17.5px}
  p{color:#555;font-size:12px;line-height:1.75;margin-top:10px}
  .l{font-weight:700;font-size:11px;margin-top:${d.text ? 12 : 14}px}</style>
  <div class="k"><div class="t"><span class="lab">${esc(d.label)}</span>${d.icon}</div>
  <div class="b"><h2>${esc(d.title)}</h2>${d.text ? `<p>${esc(d.text)}</p>` : ''}<div class="l">${esc(d.link)} →</div></div></div>`,
};

const jobs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const outDir = process.argv[3];
const RECTS={};
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 600, height: 400 }, deviceScaleFactor: 2 });
  for (const j of jobs) {
    const html = `<!doctype html><meta charset="utf-8"><style>${base}${j.hole?':root{--pg:transparent}':''}</style><div id="c">${T[j.t](j)}</div>`;
    await p.setContent(html, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    const el = await p.$('#c');
    await el.screenshot({ path: path.join(outDir, j.f + '.png'), omitBackground: !!j.hole });
    if(j.hole){const r=await p.evaluate(()=>{const c=document.querySelector('#c').getBoundingClientRect(),i=document.querySelector('.im').getBoundingClientRect();return {x:(i.left-c.left)*2,y:(i.top-c.top)*2,w:i.width*2,h:i.height*2,W:c.width*2,H:c.height*2}});RECTS[j.f]=r;}
    console.log(j.f);
  }
  await b.close();
  if(Object.keys(RECTS).length) fs.writeFileSync(path.join(outDir,'rects.json'),JSON.stringify(RECTS));
})();
