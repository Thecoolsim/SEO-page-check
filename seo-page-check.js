(function(){
const KEY='seo-check-v1';
const $=id=>document.getElementById(id);
const TEXT=['kp','title','slug','domain','desc','alt','tags'];
const EMPTY={kp:'',title:'',slug:'',domain:'',desc:'',body:'',alt:'',tags:'',img:null,tech:null};
let S=Object.assign({},EMPTY);
try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v)Object.assign(S,v);delete S.links}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){try{const c=Object.assign({},S,{img:S.img?Object.assign({},S.img,{src:null}):null});localStorage.setItem(KEY,JSON.stringify(c))}catch(e2){}}}

const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
const slugify=s=>norm(s).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const words=s=>(s||'').split(/\s+/).filter(w=>/[\p{L}\p{N}]/u.test(w));
const ctx=document.createElement('canvas').getContext('2d');
function px(t,font){ctx.font=font;return Math.round(ctx.measureText(t||'').width)}
const TF='20px Arial',DF='14px Arial',TMAX=600,DMAX=920;
function cut(t,font,max){if(px(t,font)<=max)return t;let lo=0,hi=t.length;while(lo<hi){const m=(lo+hi+1)>>1;if(px(t.slice(0,m)+'...',font)<=max)lo=m;else hi=m-1}return t.slice(0,lo).replace(/\s+\S*$/,'')+' ...'}
const kpRe=(needle,f)=>new RegExp('(?<![\\p{L}\\p{N}])'+needle.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?![\\p{L}\\p{N}])','u'+(f||''));
function count(hay,needle){if(!needle)return 0;return (norm(hay).match(kpRe(needle,'g'))||[]).length}
function has(hay,needle){return !!needle&&kpRe(needle).test(norm(hay))}
function kb(n){return n<1024?n+' B':n<1048576?Math.round(n/1024)+' KB':(n/1048576).toFixed(1)+' MB'}
function cleanDomain(d){return norm(d).replace(/^https?:\/\//,'').replace(/^www\./,'').replace(/\/.*$/,'')}

function bodyText(raw){
  if(!/<[a-z!\/]/i.test(raw))return raw;
  let s=raw.replace(/<(script|style)[\s\S]*?<\/\1>/gi,'')
    .replace(/<h[1-6][^>]*>/gi,'\n\n## ')
    .replace(/<\/(p|h[1-6]|li|div|section|blockquote|ul|ol)>/gi,'\n\n')
    .replace(/<br\s*\/?>/gi,'\n').replace(/<[^>]+>/g,' ');
  const t=document.createElement('textarea');t.innerHTML=s;return t.value;
}
function linksIn(raw,domain){
  const urls=[];
  raw.replace(/href\s*=\s*["']([^"']+)["']/gi,(m,u)=>{urls.push(u)});
  raw.replace(/\]\(([^)\s]+)\)/g,(m,u)=>{urls.push(u)});
  if(!/href\s*=/i.test(raw))raw.replace(/(^|\s)(https?:\/\/[^\s<>"')]+)/g,(m,a,u)=>{urls.push(u)});
  const d=cleanDomain(domain);let internal=0,outbound=0;
  for(const u of urls){
    if(/^(mailto:|tel:|javascript:|#)/i.test(u))continue;
    if(!/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(u)){internal++;continue}
    try{const h=new URL(u,'https://x.invalid').hostname.replace(/^www\./,'');if(d&&(h===d||h.endsWith('.'+d)))internal++;else outbound++}catch(e){outbound++}
  }
  return {internal,outbound,total:internal+outbound};
}

function analyse(){
  const G=[];const grp=(key,name)=>{const g={key,name,items:[]};G.push(g);return g};
  const add=(g,s,t)=>g.items.push({s,t});
  const kp=norm(S.kp);const kpWords=kp?kp.split(' ').length:0;

  const gk=grp('kp','Focus keyphrase');
  if(!kp)add(gk,'ok','No focus keyphrase set, so keyword placement is not checked.');
  else if(kpWords>4)add(gk,'ok','The keyphrase has '+kpWords+' words. Two to four words are easier to rank for.');
  else add(gk,'good','Keyphrase set ('+kpWords+' word'+(kpWords>1?'s':'')+').');

  const gt=grp('title','SEO title');
  const t=(S.title||'').trim();const tw=px(t,TF);
  if(!t)add(gt,'bad','Add an SEO title.');
  else{
    if(tw>TMAX)add(gt,'bad','Too long: about '+tw+' px. Google cuts titles off at around '+TMAX+' px.');
    else if(t.length<30)add(gt,'ok','Short: '+t.length+' characters. Titles of 30 to 60 characters use the space better.');
    else if(tw>570)add(gt,'ok','Close to the limit: about '+tw+' px of '+TMAX+' px.');
    else add(gt,'good','Length is good: '+t.length+' characters, about '+tw+' px.');
    if(kp){const n=norm(t);if(n.startsWith(kp)&&has(n.slice(0,kp.length+1),kp))add(gt,'good','Starts with the keyphrase.');else if(has(n,kp))add(gt,'ok','Contains the keyphrase, but not at the start.');else add(gt,'bad','Does not contain the keyphrase.')}
  }

  const gd=grp('desc','Meta description');
  const d=(S.desc||'').trim();const dl=d.length;
  if(!d)add(gd,'bad','Add a meta description. Without one, Google picks text from the page.');
  else{
    if(dl>=120&&dl<=158)add(gd,'good','Length is good: '+dl+' characters.');
    else if(dl>=70&&dl<120)add(gd,'ok','A little short: '+dl+' characters. Aim for 120 to 158.');
    else if(dl>158&&dl<=170)add(gd,'ok','May be cut off: '+dl+' characters. Aim for 120 to 158.');
    else if(dl<70)add(gd,'bad','Too short: '+dl+' characters. Aim for 120 to 158.');
    else add(gd,'bad','Too long: '+dl+' characters. Google will cut it off after about 158.');
    if(kp){if(has(d,kp))add(gd,'good','Contains the keyphrase.');else add(gd,'bad','Does not contain the keyphrase.')}
  }

  const gs=grp('slug','URL');
  const sl=(S.slug||'').trim().replace(/^https?:\/\/[^\/]+/,'').replace(/^\/+/,'');
  if(!sl)add(gs,'ok','Add the URL slug to check it.');
  else{
    if(/[^a-z0-9\-\/.]/.test(sl))add(gs,'ok','Use lowercase letters, numbers and hyphens only (no spaces, capitals, accents or underscores).');
    else add(gs,'good','Characters are clean.');
    const last=sl.replace(/\/$/,'').split('/').pop();
    if(last.length>75)add(gs,'ok','The last segment is long ('+last.length+' characters). Shorter URLs are easier to share.');
    if(kp){const ks=slugify(S.kp).split('-').filter(w=>w.length>2);const ss=norm(sl);if(!ks.length||ks.every(w=>ss.includes(w)))add(gs,'good','Contains the keyphrase words.');else add(gs,'ok','Does not contain all the keyphrase words.')}
  }

  const gb=grp('body','Content');
  const raw=S.body||'';const txt=bodyText(raw);
  const lines=txt.split('\n');
  const heads=lines.filter(l=>/^\s*#{1,6}\s/.test(l)).map(l=>l.replace(/^\s*#+\s*/,''));
  const plain=lines.filter(l=>!/^\s*#{1,6}\s/.test(l)).join('\n');
  const paras=plain.split(/\n\s*\n/).map(p=>p.trim()).filter(p=>words(p).length);
  const wc=words(txt.replace(/^\s*#+\s*/gm,'')).length;
  if(!wc)add(gb,'bad','Add body text to check the content.');
  else{
    if(wc>=300)add(gb,'good','Length is good: '+wc+' words.');
    else if(wc>=150)add(gb,'ok','Fairly short: '+wc+' words. 300 or more is better for search.');
    else add(gb,'bad','Thin content: '+wc+' words. Aim for at least 300.');
    if(kp){
      const first=paras[0]||'';
      if(has(first,kp))add(gb,'good','The keyphrase appears in the first paragraph.');
      else add(gb,'bad','The keyphrase does not appear in the first paragraph.');
      const occ=count(txt,kp);const dens=occ*kpWords/wc*100;
      if(occ===0)add(gb,'bad','The keyphrase does not appear in the body.');
      else if(dens<0.5)add(gb,'ok','Keyphrase density is low: '+dens.toFixed(1)+'% ('+occ+(occ>1?' times':' time')+'). Aim for 0.5% to 3%.');
      else if(dens<=3)add(gb,'good','Keyphrase density is good: '+dens.toFixed(1)+'% ('+occ+(occ>1?' times':' time')+').');
      else add(gb,'bad','Keyphrase density is too high: '+dens.toFixed(1)+'% ('+occ+(occ>1?' times':' time')+'). This can read as keyword stuffing.');
      if(heads.length){if(heads.some(h=>has(h,kp)))add(gb,'good','A subheading contains the keyphrase.');else add(gb,'ok','No subheading contains the keyphrase.')}
    }
    if(!heads.length){if(wc>300)add(gb,'ok','No subheadings found. Break long text up with subheadings.')}
    else add(gb,'good',heads.length+' subheading'+(heads.length>1?'s':'')+' found.');
    const longP=paras.filter(p=>words(p).length>150).length;
    if(longP)add(gb,'ok',longP+' paragraph'+(longP>1?'s are':' is')+' longer than 150 words.');
    const sents=plain.split(/(?<=[.!?\u2026])\s+/).map(s=>s.trim()).filter(s=>words(s).length);
    if(sents.length>=3){const lp=Math.round(sents.filter(s=>words(s).length>20).length/sents.length*100);
      if(lp<=25)add(gb,'good','Sentence length is good: '+lp+'% of sentences are over 20 words.');
      else if(lp<=35)add(gb,'ok',lp+'% of sentences are over 20 words. Try to keep this under 25%.');
      else add(gb,'bad',lp+'% of sentences are over 20 words. Shorten some of them.');}
    const L=linksIn(raw,S.domain);
    if(!L.internal)add(gb,'ok','No internal links found.'+(cleanDomain(S.domain)?'':' Set the site domain so absolute links are classified correctly.'));
    else add(gb,'good',L.internal+' internal link'+(L.internal>1?'s':'')+'.');
    if(!L.outbound)add(gb,'ok','No outbound links found.');
    else add(gb,'good',L.outbound+' outbound link'+(L.outbound>1?'s':'')+'.');
  }

  const gi=grp('image','Featured image');
  const im=S.img;
  if(!im)add(gi,'bad','Add a featured image. Social platforms use it when the page is shared.');
  else{
    if(im.w&&im.h){
      if(im.w>=1200&&im.h>=630)add(gi,'good','Size is good: '+im.w+' x '+im.h+' px.');
      else if(im.w>=600)add(gi,'ok','Size is acceptable ('+im.w+' x '+im.h+' px), but 1200 x 630 px or larger displays best.');
      else add(gi,'bad','Too small: '+im.w+' x '+im.h+' px. Use at least 1200 x 630 px.');
      const r=im.w/im.h;
      if(Math.abs(r-1.91)<=0.15)add(gi,'good','Aspect ratio is close to 1.91:1, so it will not be cropped much.');
      else add(gi,'ok','Aspect ratio is '+r.toFixed(2)+':1. Social cards use about 1.91:1, so it will be cropped.');
    }else add(gi,'ok','Image dimensions are unknown. Upload the file to check its size.');
    if(im.bytes){
      if(im.bytes<=300*1024)add(gi,'good','File size is good: '+kb(im.bytes)+'.');
      else if(im.bytes<=1024*1024)add(gi,'ok','File size is '+kb(im.bytes)+'. Under 300 KB loads faster.');
      else add(gi,'bad','File size is '+kb(im.bytes)+'. Compress it below 1 MB, ideally below 300 KB.');
    }
    if(im.type&&!/(jpe?g|png|webp|avif)/i.test(im.type))add(gi,'ok','Format is '+im.type+'. JPEG, PNG or WebP are safest.');
  }
  const alt=(S.alt||'').trim();
  if(!alt)add(gi,'bad','Add alt text for the image.');
  else{
    if(alt.length>125)add(gi,'ok','Alt text is long ('+alt.length+' characters). Screen readers handle 125 or fewer best.');
    else add(gi,'good','Alt text is present.');
    if(kp){if(has(alt,kp))add(gi,'good','Alt text contains the keyphrase.');else add(gi,'ok','Alt text does not contain the keyphrase.')}
  }

  const gg=grp('tags','Tags / keywords');
  const tags=(S.tags||'').split(/[,;]/).map(s=>s.trim()).filter(Boolean);
  if(!tags.length)add(gg,'ok','No tags. Three to eight relevant tags help related-content and site search.');
  else{
    if(tags.length<3)add(gg,'ok','Only '+tags.length+' tag'+(tags.length>1?'s':'')+'. Three to eight is a good range.');
    else if(tags.length<=8)add(gg,'good',tags.length+' tags.');
    else add(gg,'ok',tags.length+' tags. More than eight dilutes their value.');
    const seen={},dup=[];tags.forEach(x=>{const n=norm(x);if(seen[n])dup.push(x);seen[n]=1});
    if(dup.length)add(gg,'bad','Duplicate tags: '+dup.join(', ')+'.');
    const long=tags.filter(x=>words(x).length>4);if(long.length)add(gg,'ok','Some tags are long phrases: '+long.join(', ')+'.');
    if(kp){if(tags.some(x=>has(x,kp)))add(gg,'good','A tag matches the keyphrase.');else add(gg,'ok','No tag matches the keyphrase.')}
  }

  if(S.tech){
    const x=S.tech;const gx=grp('tech','Page tags (from source)');
    if(x.h1===1)add(gx,'good','Exactly one H1 heading.');else if(x.h1===0)add(gx,'bad','No H1 heading.');else add(gx,'ok',x.h1+' H1 headings. One is usual.');
    add(gx,x.canonical?'good':'ok',x.canonical?'Canonical URL is set.':'No canonical URL.');
    const og=[x.ogTitle,x.ogDesc,x.ogImage].filter(Boolean).length;
    if(og===3)add(gx,'good','Open Graph title, description and image are set.');
    else if(og)add(gx,'ok','Open Graph is incomplete: missing '+[!x.ogTitle&&'og:title',!x.ogDesc&&'og:description',!x.ogImage&&'og:image'].filter(Boolean).join(', ')+'.');
    else add(gx,'bad','No Open Graph tags.');
    add(gx,x.twitter?'good':'ok',x.twitter?'Twitter/X card tag is set.':'No twitter:card tag.');
    add(gx,x.lang?'good':'bad',x.lang?'Page language is declared ('+x.lang+').':'No lang attribute on the html element.');
    add(gx,x.hreflang?'good':'ok',x.hreflang?x.hreflang+' hreflang alternate'+(x.hreflang>1?'s':'')+' declared.':'No hreflang alternates. Add them to link language versions.');
    if(/noindex/i.test(x.robots||''))add(gx,'bad','The robots meta tag blocks indexing (noindex).');
    add(gx,x.viewport?'good':'bad',x.viewport?'Viewport tag is set.':'No viewport tag.');
    if(x.noAlt)add(gx,'ok',x.noAlt+' content image'+(x.noAlt>1?'s have':' has')+' no alt attribute.');
    else add(gx,'good','All content images have an alt attribute.');
  }
  return G;
}

const RANK={bad:0,ok:1,good:2};const LABEL={good:'Good',ok:'Medium',bad:'Bad'};
const worst=items=>items.reduce((w,i)=>RANK[i.s]<RANK[w]?i.s:w,'good');

function render(){
  const G=analyse();
  const all=G.flatMap(g=>g.items);
  const n={good:0,ok:0,bad:0};all.forEach(i=>n[i.s]++);
  const pct=all.length?Math.round((n.good+n.ok*0.5)/all.length*100):0;
  const band=pct>=80?'good':pct>=55?'ok':'bad';
  const sorted=all.slice().sort((a,b)=>RANK[b.s]-RANK[a.s]);
  const v=$('verdict');v.className='verdict '+band;
  v.innerHTML='<div class="big"><span class="word">'+LABEL[band]+'</span><span class="pct">'+pct+' / 100 overall</span></div>'+
    '<div class="strip" aria-hidden="true">'+sorted.map(i=>'<i class="'+i.s+'"></i>').join('')+'</div>'+
    '<div class="counts"><b class="good">'+n.good+' good</b>, <b class="ok">'+n.ok+' medium</b>, <b class="bad">'+n.bad+' bad</b></div>';

  $('groups').innerHTML=G.map(g=>{const w=worst(g.items);
    const items=g.items.slice().sort((a,b)=>RANK[a.s]-RANK[b.s]);
    return '<div class="group"><h3><span class="dot '+w+'"></span>'+esc(g.name)+'</h3><ul>'+
      items.map(i=>'<li><span class="tag '+i.s+'">'+LABEL[i.s]+'</span><span>'+esc(i.t)+'</span></li>').join('')+'</ul></div>'}).join('');

  const status={};G.forEach(g=>status[g.key]=worst(g.items));
  document.querySelectorAll('.dot[data-g]').forEach(el=>{const s=status[el.dataset.g];el.className='dot'+(s?' '+s:'')});

  const t=(S.title||'').trim(),tw=px(t,TF);
  $('titleHint').textContent=t?t.length+' characters, about '+tw+' of '+TMAX+' px':'';
  const tb=$('titleBar');tb.style.width=Math.min(tw/TMAX,1)*100+'%';tb.className=!t?'':tw>TMAX?'bad':(t.length<30||tw>570)?'ok':'good';
  const d=(S.desc||'').trim(),dl=d.length;
  $('descHint').textContent=d?dl+' of 158 characters':'';
  const db=$('descBar');db.style.width=Math.min(dl/158,1)*100+'%';db.className=!d?'':(dl>=120&&dl<=158)?'good':(dl>=70&&dl<=170)?'ok':'bad';
  const wc=words(bodyText(S.body||'').replace(/^\s*#+\s*/gm,'')).length;
  $('bodyHint').textContent=wc?wc+' words':'';

  const dom=cleanDomain(S.domain)||'example.org';
  const sl=(S.slug||'').trim().replace(/^https?:\/\/[^\/]+/,'').replace(/^\/+|\/+$/g,'');
  $('serp').innerHTML='<div class="serp-site"><span class="fav"></span><div><div class="serp-name">'+esc(dom)+'</div><div class="serp-url">https://'+esc(dom)+(sl?' \u203A '+esc(sl.split('/').join(' \u203A ')):'')+'</div></div></div>'+
    '<div class="serp-title">'+esc(t?cut(t,TF,TMAX):'Your SEO title appears here')+'</div>'+
    '<div class="serp-desc">'+esc(d?cut(d,DF,DMAX):'Your meta description appears here.')+'</div>';

  const im=S.img;let imgHtml;
  if(im&&im.src)imgHtml='<div class="img has"><img alt="" src="'+esc(im.src)+'"></div>';
  else if(im&&im.remote)imgHtml='<div class="img">Image set in page source:<br>'+esc(im.remote.split('/').pop())+'</div>';
  else imgHtml='<div class="img">No image</div>';
  $('social').innerHTML=imgHtml+'<div class="txt"><div class="d">'+esc(dom)+'</div><div class="t">'+esc(t||'Title')+'</div><div class="s">'+esc(d||'Description')+'</div></div>';

  const th=$('thumb');
  if(im&&im.src)th.innerHTML='<img alt="" src="'+esc(im.src)+'">';else th.textContent=im?'Remote':'None';
  $('imgInfo').innerHTML=im?esc([im.name||(im.remote||''),im.w&&im.h?im.w+' x '+im.h+' px':'',im.bytes?kb(im.bytes):''].filter(Boolean).join(', '))+' <button type="button" class="ghost" id="rmImg" style="padding:2px 8px;font-size:12px;margin-left:6px">Remove</button>':'';
  const rm=$('rmImg');if(rm)rm.onclick=()=>{S.img=null;$('imgFile').value='';save();render()};
}

let timer;const schedule=()=>{clearTimeout(timer);timer=setTimeout(()=>{save();render()},120)};
TEXT.forEach(k=>{const el=$(k);el.value=S[k]||'';el.addEventListener('input',()=>{S[k]=el.value;if(k==='domain')markLinks();schedule()})});

const ed=$('bodyEditor'),htmlBox=$('bodyHtml'),wrap=$('rteWrap');
try{document.execCommand('defaultParagraphSeparator',false,'p')}catch(e){}
const BLOCK={P:'p',H2:'h2',H3:'h3',H4:'h4',H1:'h2',H5:'h4',H6:'h4',BLOCKQUOTE:'blockquote',UL:'ul',OL:'ol',LI:'li'};
const INLINE={STRONG:'strong',B:'strong',EM:'em',I:'em'};
const escT=t=>t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\u00a0/g,' ');
const hasBlock=n=>[...n.childNodes].some(c=>c.nodeType===1&&(BLOCK[c.tagName]||c.tagName==='DIV'||c.tagName==='SECTION'||c.tagName==='ARTICLE'||c.tagName==='TABLE'));
function inl(n){
  let o='';
  for(const c of n.childNodes){
    if(c.nodeType===3){o+=escT(c.nodeValue);continue}
    if(c.nodeType!==1)continue;
    const t=c.tagName;
    if(/^(SCRIPT|STYLE|NOSCRIPT|IMG|SVG|IFRAME|BUTTON|INPUT|SELECT|TEXTAREA|FIGURE|META|LINK)$/.test(t))continue;
    if(t==='BR'){o+='<br>';continue}
    if(INLINE[t]){const x=inl(c);if(x.trim())o+='<'+INLINE[t]+'>'+x+'</'+INLINE[t]+'>';else o+=x;continue}
    if(t==='A'){const h=(c.getAttribute('href')||'').trim();const x=inl(c);
      if(!safeHref(h)){o+=x;continue}
      const blank=c.getAttribute('target')==='_blank';
      o+='<a href="'+h.replace(/"/g,'&quot;')+'"'+(blank?' target="_blank" rel="noopener"':'')+'>'+x+'</a>';continue}
    o+=inl(c);
  }
  return o;
}
function blocks(n){
  let o='',run='';
  const flush=()=>{const r=run.replace(/^(\s|<br>)+|(\s|<br>)+$/g,'');if(r.replace(/<[^>]+>/g,'').trim())o+='<p>'+r+'</p>\n';run=''};
  for(const c of n.childNodes){
    if(c.nodeType===3){run+=escT(c.nodeValue);continue}
    if(c.nodeType!==1)continue;
    const t=c.tagName;
    if(/^(SCRIPT|STYLE|NOSCRIPT|IMG|SVG|IFRAME|BUTTON|FORM|FIGURE|META|LINK|HEADER|FOOTER|NAV|ASIDE)$/.test(t))continue;
    if(t==='UL'||t==='OL'){flush();const items=[...c.children].filter(li=>li.tagName==='LI').map(li=>{const x=hasBlock(li)?blocks(li).replace(/<\/?p>/g,' ').replace(/\n/g,'').trim():inl(li).trim();return x?'  <li>'+x+'</li>\n':''}).join('');if(items)o+='<'+BLOCK[t]+'>\n'+items+'</'+BLOCK[t]+'>\n';continue}
    if(BLOCK[t]&&t!=='LI'){flush();
      if(hasBlock(c)&&t!=='BLOCKQUOTE'){o+=blocks(c);continue}
      const x=(t==='BLOCKQUOTE'&&hasBlock(c))?blocks(c).replace(/<\/?p>/g,' ').replace(/\n/g,'').trim():inl(c).replace(/^(\s|<br>)+|(\s|<br>)+$/g,'');
      if(x.replace(/<[^>]+>/g,'').trim())o+='<'+BLOCK[t]+'>'+x+'</'+BLOCK[t]+'>\n';continue}
    if(t==='LI'){flush();const x=inl(c).trim();if(x)o+='<p>'+x+'</p>\n';continue}
    if(t==='TABLE'){flush();c.querySelectorAll('tr').forEach(tr=>{const x=[...tr.children].map(td=>inl(td).trim()).filter(Boolean).join(' | ');if(x)o+='<p>'+x+'</p>\n'});continue}
    if(t==='DIV'||t==='SECTION'||t==='ARTICLE'||t==='MAIN'){
      if(hasBlock(c)){flush();o+=blocks(c)}else{flush();run+=inl(c);flush()}continue}
    run+=inl({childNodes:[c]});
  }
  flush();return o;
}
function cleanHtml(h){const d=new DOMParser().parseFromString('<body>'+(h||'')+'</body>','text/html');return blocks(d.body).trim()}
function textToHtml(t){
  return (t||'').split(/\n\s*\n/).map(b=>b.trim()).filter(Boolean).map(b=>{
    const m=b.match(/^(#{1,4})\s+(.*)$/s);if(m){const lv=Math.min(Math.max(m[1].length,2),4);return '<h'+lv+'>'+escT(m[2].trim())+'</h'+lv+'>'}
    const lines=b.split('\n');if(lines.every(l=>/^\s*[-*\u2022]\s+/.test(l)))return '<ul>\n'+lines.map(l=>'  <li>'+escT(l.replace(/^\s*[-*\u2022]\s+/,''))+'</li>').join('\n')+'\n</ul>';
    return '<p>'+lines.map(l=>escT(l.trim())).join('<br>')+'</p>'}).join('\n');
}
const safeHref=h=>!!h&&(!/^[^\/?#]*:/.test(h)||/^(https?|mailto|tel):/i.test(h.replace(/[\s\u0000-\u001f]/g,'')));
const isHtml=s=>/<(p|h[1-6]|ul|ol|li|a|br|div|strong|em|b|i|blockquote)[\s>\/]/i.test(s||'');
function kindOf(h){
  if(!h)return '';if(/^(mailto:|tel:)/i.test(h))return 'other';
  if(!/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(h))return 'internal';
  const d=cleanDomain(S.domain);try{const x=new URL(h,'https://x.invalid').hostname.replace(/^www\./,'');return d&&(x===d||x.endsWith('.'+d))?'internal':'external'}catch(e){return 'external'}
}
function markLinks(){let i=0,x=0;ed.querySelectorAll('a').forEach(a=>{const k=kindOf(a.getAttribute('href'));a.dataset.kind=k;a.title=a.getAttribute('href')||'';if(k==='internal')i++;else if(k==='external')x++});
  $('linkCounts').textContent=(i||x)?i+' internal, '+x+' external':''}
function syncFromEditor(){S.body=cleanHtml(ed.innerHTML);markLinks();schedule()}
function setEditor(h){ed.innerHTML=h||'';markLinks();if(wrap.classList.contains('html'))htmlBox.value=h||''}
if(S.body)S.body=isHtml(S.body)?cleanHtml(S.body):textToHtml(S.body);
setEditor(S.body);

ed.addEventListener('input',syncFromEditor);
ed.addEventListener('paste',e=>{
  e.preventDefault();const cd=e.clipboardData;const h=cd.getData('text/html');
  const out=h?cleanHtml(h.replace(/<!--[\s\S]*?-->/g,'')):textToHtml(cd.getData('text/plain'));
  document.execCommand('insertHTML',false,out);syncFromEditor();
});
ed.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openLink('external')}});

const bar=document.querySelector('.rte-bar');
bar.addEventListener('mousedown',e=>{if(e.target.closest('button'))e.preventDefault()});
bar.querySelectorAll('button[data-cmd]').forEach(b=>b.addEventListener('click',()=>{ed.focus();document.execCommand(b.dataset.cmd);syncFromEditor();updateBar()}));
$('blockSel').addEventListener('change',e=>{restore();ed.focus();document.execCommand('formatBlock',false,'<'+e.target.value+'>');syncFromEditor();updateBar()});
$('blockSel').addEventListener('mousedown',save_);
$('btnClean').addEventListener('click',()=>{ed.focus();document.execCommand('removeFormat');syncFromEditor()});
$('btnUnlink').addEventListener('click',()=>{ed.focus();const a=curLink();if(a){const r=document.createRange();r.selectNodeContents(a);const s=getSelection();s.removeAllRanges();s.addRange(r)}document.execCommand('unlink');syncFromEditor()});

let saved=null;
function save_(){const s=getSelection();if(s.rangeCount&&ed.contains(s.anchorNode))saved=s.getRangeAt(0).cloneRange()}
function restore(){if(!saved)return;const s=getSelection();s.removeAllRanges();s.addRange(saved)}
function curLink(){const s=getSelection();if(!s.rangeCount)return null;let n=s.anchorNode;if(n&&n.nodeType===3)n=n.parentNode;const a=n&&n.closest?n.closest('a'):null;return a&&ed.contains(a)?a:null}
function updateBar(){
  bar.querySelectorAll('button[data-cmd]').forEach(b=>{let v=false;try{v=document.queryCommandState(b.dataset.cmd)}catch(e){}b.setAttribute('aria-pressed',v?'true':'false')});
  const s=getSelection();if(!s.rangeCount||!ed.contains(s.anchorNode))return;
  let n=s.anchorNode.nodeType===3?s.anchorNode.parentNode:s.anchorNode;
  const blk=n.closest('h2,h3,h4,blockquote,p,li');const v=blk?blk.tagName.toLowerCase():'p';
  $('blockSel').value=['h2','h3','h4','blockquote'].includes(v)?v:'p';
}
document.addEventListener('selectionchange',()=>{if(ed.contains(getSelection().anchorNode)){save_();updateBar()}});

let linkMode='external',editing=null;
function openLink(mode){
  save_();linkMode=mode;editing=curLink();
  $('linkPanel').classList.add('open');
  $('linkLabel').textContent=mode==='internal'?'Internal link':'External link';
  const dom=cleanDomain(S.domain);
  $('linkUrl').placeholder=mode==='internal'?'/news/... or https://'+(dom||'your-site.org')+'/...':'https://example.org/page';
  $('linkUrl').value=editing?editing.getAttribute('href'):'';
  $('linkBlank').checked=editing?editing.getAttribute('target')==='_blank':mode==='external';
  $('linkApply').textContent=editing?'Update link':'Apply';
  checkUrl();$('linkUrl').focus();
}
function checkUrl(){
  const v=$('linkUrl').value.trim();let note='';
  if(v){const k=kindOf(/^[a-z][a-z0-9+.-]*:|^\/|^#/i.test(v)?v:'https://'+v);
    if(linkMode==='internal'&&k==='external')note='This address is on another site, so it will count as an external link.';
    else if(linkMode==='external'&&k==='internal')note='This address is on your own site, so it will count as an internal link.';
    else if(linkMode==='external'&&!/^[a-z][a-z0-9+.-]*:/i.test(v))note='https:// will be added.';}
  else if(!saved||saved.collapsed)note=editing?'':'No text is selected, so the address itself will be used as the link text.';
  if(linkMode==='internal'&&!cleanDomain(S.domain))note=(note?note+' ':'')+'Set the site domain above so full addresses on your site are recognised.';
  $('linkNote').textContent=note;
}
function closeLink(){$('linkPanel').classList.remove('open');restore();ed.focus()}
function applyLink(){
  let v=$('linkUrl').value.trim();if(!v){closeLink();return}
  if(linkMode==='external'&&!/^([a-z][a-z0-9+.-]*:|\/|#)/i.test(v))v='https://'+v;
  if(linkMode==='internal'&&!/^([a-z][a-z0-9+.-]*:|\/|#)/i.test(v)){if(/^[\w-]+(\.[\w-]+)+\//.test(v))v='https://'+v;else v='/'+v}
  const blank=$('linkBlank').checked;
  restore();ed.focus();
  let targets=[];
  if(editing){targets=[editing]}
  else if(!saved||saved.collapsed){const a=document.createElement('a');a.textContent=v;const sel=getSelection();let r;if(sel.rangeCount&&ed.contains(sel.anchorNode))r=sel.getRangeAt(0);else{r=document.createRange();r.selectNodeContents(ed);r.collapse(false)}r.insertNode(a);r.setStartAfter(a);r.collapse(true);targets=[a]}
  else{const tmp='https://tmp.invalid/'+Date.now();document.execCommand('createLink',false,tmp);targets=[...ed.querySelectorAll('a[href="'+tmp+'"]')]}
  targets.forEach(a=>{a.setAttribute('href',v);if(blank){a.setAttribute('target','_blank');a.setAttribute('rel','noopener')}else{a.removeAttribute('target');a.removeAttribute('rel')}});
  $('linkPanel').classList.remove('open');syncFromEditor();
}
$('btnInt').addEventListener('click',()=>openLink('internal'));
$('btnExt').addEventListener('click',()=>openLink('external'));
$('linkUrl').addEventListener('input',checkUrl);
$('linkUrl').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();applyLink()}else if(e.key==='Escape'){e.preventDefault();closeLink()}});
$('linkApply').addEventListener('click',applyLink);
$('linkCancel').addEventListener('click',closeLink);

$('btnHtml').addEventListener('click',()=>{
  const on=!wrap.classList.contains('html');
  if(on){htmlBox.value=S.body||'';wrap.classList.add('html');$('linkPanel').classList.remove('open');htmlBox.focus()}
  else{S.body=cleanHtml(htmlBox.value);setEditor(S.body);wrap.classList.remove('html');schedule();ed.focus()}
  $('btnHtml').setAttribute('aria-pressed',on?'true':'false');
});
htmlBox.addEventListener('input',()=>{S.body=htmlBox.value;schedule()});
$('btnCopy').addEventListener('click',async()=>{
  const h=wrap.classList.contains('html')?cleanHtml(htmlBox.value):S.body||'';let ok=false;
  try{await navigator.clipboard.writeText(h);ok=true}catch(e){try{const t=document.createElement('textarea');t.value=h;document.body.appendChild(t);t.select();ok=document.execCommand('copy');t.remove()}catch(e2){}}
  $('copyMsg').textContent=ok?'HTML copied.':'Copy failed. Use the HTML view and copy from there.';setTimeout(()=>{$('copyMsg').textContent=''},2500);
});


$('imgFile').addEventListener('change',e=>{
  const f=e.target.files&&e.target.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=()=>{const i=new Image();i.onload=()=>{S.img={src:r.result,w:i.naturalWidth,h:i.naturalHeight,bytes:f.size,type:(f.type||'').replace('image/',''),name:f.name};save();render()};i.onerror=()=>{S.img={src:null,bytes:f.size,type:f.type,name:f.name};render()};i.src=r.result};
  r.readAsDataURL(f);
});

$('importBtn').addEventListener('click',()=>{
  const html=$('src').value;const msg=$('importMsg');
  if(!/<(html|head|meta|title|body)/i.test(html)){msg.textContent='This does not look like an HTML page source.';return}
  const doc=new DOMParser().parseFromString(html,'text/html');
  const meta=sel=>{const e=doc.querySelector(sel);return e?(e.getAttribute('content')||'').trim():''};
  const canonical=(doc.querySelector('link[rel="canonical"]')||{getAttribute:()=>''}).getAttribute('href')||'';
  const pageUrl=canonical||meta('meta[property="og:url"]');
  let host='',path='';try{if(pageUrl){const u=new URL(pageUrl,'https://x.invalid');if(u.hostname!=='x.invalid')host=u.hostname.replace(/^www\./,'');path=u.pathname.replace(/^\/+/,'')}}catch(e){}
  Object.assign(S,{tags:'',alt:'',img:null});
  S.title=((doc.querySelector('title')||{}).textContent||meta('meta[property="og:title"]')).trim();
  S.desc=meta('meta[name="description"]')||meta('meta[property="og:description"]');
  if(host)S.domain=host;if(path)S.slug=path;
  const kw=meta('meta[name="keywords"]');const at=[...doc.querySelectorAll('meta[property="article:tag"]')].map(m=>m.getAttribute('content')).filter(Boolean);
  if(kw||at.length)S.tags=kw||at.join(', ');
  const root=(doc.querySelector('.field--name-body')||doc.querySelector('.field-name-body')||doc.querySelector('[property="schema:text"]')||doc.querySelector('article')||doc.querySelector('main')||doc.querySelector('[role="main"]')||doc.body).cloneNode(true);
  root.querySelectorAll('script,style,noscript,nav,header,footer,aside,form').forEach(n=>n.remove());
  root.querySelectorAll('h1').forEach(n=>n.remove());
  S.body=cleanHtml(root.innerHTML);setEditor(S.body);
  const og=meta('meta[property="og:image"]')||meta('meta[name="twitter:image"]');
  if(og){const w=parseInt(meta('meta[property="og:image:width"]'))||0,h=parseInt(meta('meta[property="og:image:height"]'))||0;S.img={src:null,remote:og,w,h,bytes:0,type:'',name:''};
    const fn=og.split('/').pop().split('?')[0];const match=[...doc.querySelectorAll('img')].find(i=>(i.getAttribute('src')||'').includes(fn));
    if(match&&match.getAttribute('alt'))S.alt=match.getAttribute('alt');}
  S.tech={h1:doc.querySelectorAll('h1').length,canonical:!!canonical,ogTitle:!!meta('meta[property="og:title"]'),ogDesc:!!meta('meta[property="og:description"]'),ogImage:!!meta('meta[property="og:image"]'),
    twitter:!!meta('meta[name="twitter:card"]'),lang:doc.documentElement.getAttribute('lang')||'',hreflang:doc.querySelectorAll('link[rel="alternate"][hreflang]').length,
    robots:meta('meta[name="robots"]'),viewport:!!doc.querySelector('meta[name="viewport"]'),noAlt:[...root.querySelectorAll('img')].filter(i=>!i.hasAttribute('alt')).length};
  TEXT.forEach(k=>{$(k).value=S[k]||''});
  msg.textContent='Fields filled from the source. Set the focus keyphrase to complete the checks.';
  save();render();
});

const EXAMPLE={kp:'rainwater harvesting',title:'Rainwater harvesting: a practical guide for small farms',domain:'example.org',slug:'guides/rainwater-harvesting-small-farms',
  desc:'Rainwater harvesting helps small farms get through dry spells. Learn how to size a tank, choose a catchment surface and keep stored water clean.',
  alt:'Rainwater harvesting tank beside a farmhouse roof',tags:'rainwater harvesting, water storage, farming, drought',
  body:'<p>Rainwater harvesting is one of the cheapest ways for a small farm to cope with irregular rainfall. A roof, a gutter and a tank can store enough water to keep livestock and a vegetable plot going through several dry weeks.</p>\n'+
  '<h2>How much water can you collect?</h2>\n<p>Every square metre of roof collects about one litre of water for each millimetre of rain. A 100 square metre roof in an area with 600 mm of rain a year can therefore collect around 60,000 litres, minus losses from evaporation and overflow. The <a href="https://www.fao.org/land-water/en/">FAO land and water pages</a> give regional rainfall data you can use for this estimate.</p>\n'+
  '<h2>Choosing a tank</h2>\n<p>Size the tank to cover the longest dry spell you expect, not the whole year. Plastic tanks are light and easy to install. Ferro-cement tanks cost less per litre and last longer, but they take more work to build. See our <a href="/guides/water-storage-tanks">guide to water storage tanks</a> for a comparison.</p>\n'+
  '<h2>Keeping the water clean</h2>\n<ul>\n  <li>Fit a first-flush diverter so the dirtiest water from the roof is not stored.</li>\n  <li>Cover every opening with mesh to keep out insects and leaves.</li>\n  <li>Clean gutters before the rainy season starts.</li>\n</ul>\n'+
  '<p>Rainwater harvesting works best as part of a wider plan that includes mulching, drip irrigation and drought-tolerant crops. Start small, measure how much you collect in the first season, and expand from there.</p>'};
$('exampleBtn').addEventListener('click',()=>{S=Object.assign({},EMPTY,EXAMPLE);setEditor(S.body);TEXT.forEach(k=>{$(k).value=S[k]||''});$('imgFile').value='';
  $('importMsg').textContent='Example loaded. Edit any field to see the checks change.';save();render()});

$('clearBtn').addEventListener('click',()=>{S=Object.assign({},EMPTY,{domain:S.domain||''});setEditor('');TEXT.forEach(k=>{$(k).value=S[k]||''});$('imgFile').value='';$('src').value='';$('importMsg').textContent='';save();render()});

render();
})();
