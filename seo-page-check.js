(function(){
// A language file (for example fr/seo-page-check.fr.js) can set window.SEO_PAGE_CHECK_LANG
// before this script loads, to replace the messages, rules and examples below.
const LANG=window.SEO_PAGE_CHECK_LANG||{};
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[‘’]/g,"'").replace(/\s+/g,' ').trim();

const RULES=Object.assign({
  storageKey:'seo-check-v1',
  stopwords:[],      // function words: not counted in the keyphrase length, not required in the URL
  typography:false,  // French spacing before : ; ! ? and inside « »
  readability:null,  // reading ease formula: {base, perWord (sentence length), perSyllable}
  transitions:[],    // transition words and phrases; empty turns the check off
  sentenceMax:20,
  ltLanguage:'en-GB' // default LanguageTool language code
},LANG.rules);
const STOP=new Set(RULES.stopwords.map(norm));

const EN={
  g:{kp:'Focus keyphrase',title:'SEO title',desc:'Meta description',slug:'URL',video:'Video',vtrans:'Transcript',body:'Content',image:'Featured image',tags:'Tags / keywords',lang:'Grammar and spelling',tech:'Page tags (from source)'},
  fields:{kp:'Keyphrase',title:'SEO title',desc:'Meta description',body:'Body text',alt:'Alt text',tags:'Tags',vtitle:'Video title',vdesc:'Video description',vtrans:'Transcript'},
  ltKind:{misspelling:'Spelling',grammar:'Grammar',typographical:'Typography',style:'Style',other:'Other'},
  ltNone:'No grammar or spelling issues found.',
  ltField:(label,n)=>label+': '+n+' possible issue'+(n>1?'s':'')+'.',
  ltIssue:(snip,msg,sugg)=>'“'+snip+'”'+(sugg?' → '+sugg:'')+'. '+msg,
  ltMore:n=>'And '+n+' more.',
  ltChecking:'Checking…',
  ltChecked:'Checked.',
  ltTooLong:n=>'Checked the first '+n+' characters only (limit of the public service).',
  ltRate:'Too many checks in a short time. Wait a minute and try again.',
  ltFail:'Could not reach the LanguageTool server.',
  ltBadServer:'The server address must start with https://.',
  ltEmpty:'There is no text to check yet.',
  label:{good:'Good',ok:'Medium',bad:'Bad'},
  overall:p=>p+' / 100 overall',
  counts:n=>[n.good+' good',n.ok+' medium',n.bad+' bad'],
  kpNone:'No focus keyphrase set, so keyword placement is not checked.',
  kpLong:n=>'The keyphrase has '+n+' words. Two to four words are easier to rank for.',
  kpOk:n=>'Keyphrase set ('+n+' word'+(n>1?'s':'')+').',
  titleNone:'Add an SEO title.',
  titleLong:(w,max)=>'Too long: about '+w+' px. Google cuts titles off at around '+max+' px.',
  titleShort:n=>'Short: '+n+' characters. Titles of 30 to 60 characters use the space better.',
  titleNear:(w,max)=>'Close to the limit: about '+w+' px of '+max+' px.',
  titleGood:(n,w)=>'Length is good: '+n+' characters, about '+w+' px.',
  kpStart:'Starts with the keyphrase.',
  kpNotStart:'Contains the keyphrase, but not at the start.',
  kpMissing:'Does not contain the keyphrase.',
  kpIn:'Contains the keyphrase.',
  descNone:'Add a meta description. Without one, Google picks text from the page.',
  descGood:n=>'Length is good: '+n+' characters.',
  descShortish:n=>'A little short: '+n+' characters. Aim for 120 to 158.',
  descCut:n=>'May be cut off: '+n+' characters. Aim for 120 to 158.',
  descShort:n=>'Too short: '+n+' characters. Aim for 120 to 158.',
  descLong:n=>'Too long: '+n+' characters. Google will cut it off after about 158.',
  slugNone:'Add the URL slug to check it.',
  slugChars:'Use lowercase letters, numbers and hyphens only (no spaces, capitals, accents or underscores).',
  slugClean:'Characters are clean.',
  slugLong:n=>'The last segment is long ('+n+' characters). Shorter URLs are easier to share.',
  slugKp:'Contains the keyphrase words.',
  slugNoKp:'Does not contain all the keyphrase words.',
  slugStop:l=>'The URL contains function words ('+l+'). You can remove them to shorten it.',
  typo:'',
  vUrlNone:'Add the YouTube or Vimeo address or embed code.',
  vUrlNoId:p=>'No video ID found in this '+p+' address.',
  vUrlOther:'Only YouTube and Vimeo addresses are recognised.',
  vUrlOk:(p,id)=>p+' video '+id+' recognised.',
  vTitleNone:'Add a video title. It becomes the name in the structured data.',
  vTitleMax:n=>'The video title is '+n+' characters. YouTube allows 100.',
  vTitleLong:n=>'The video title is '+n+' characters. Video results cut titles off at about 70.',
  vTitleGood:n=>'Video title length is good: '+n+' characters.',
  vTitleKp:'The video title contains the keyphrase.',
  vTitleNoKp:'The video title does not contain the keyphrase.',
  vDescNone:'Add a video description.',
  vDescMax:n=>'The video description is '+n+' characters. YouTube allows 5,000.',
  vDescShort:n=>'The video description is short ('+n+' characters). Describe what the video shows in two or three sentences.',
  vDescGood:n=>'Video description length is good: '+n+' characters.',
  vDescKpStart:'The keyphrase is in the first 160 characters of the video description.',
  vDescKpLate:'The keyphrase is in the video description, but not in the first 160 characters, which are the ones shown in results.',
  vDescNoKp:'The video description does not contain the keyphrase.',
  chOk:n=>n+' chapters found. Google can show them as key moments.',
  chBad:'Chapter timestamps found, but chapters need at least three, starting at 0:00, each at least 10 seconds long.',
  chNone:'No chapters. Put timestamps such as "0:00 Introduction" on their own lines so Google can show key moments.',
  thNone:'Add a thumbnail URL. Google needs one to show the video in results.',
  thUrl:'The thumbnail must be a full address starting with https://.',
  thError:'The thumbnail could not be loaded. Check that the address is correct and public.',
  thLoading:'Loading the thumbnail to check its size.',
  thPlaceholder:"This is YouTube's placeholder image, so the video has no high-resolution thumbnail. Use hqdefault.jpg or upload a custom thumbnail.",
  thGood:(w,h)=>'Thumbnail size is good: '+w+' x '+h+' px.',
  thOk:(w,h)=>'The thumbnail is '+w+' x '+h+' px. 1280 x 720 px or larger looks sharper.',
  thSmall:(w,h)=>'The thumbnail is too small: '+w+' x '+h+' px. Use at least 1280 x 720 px.',
  th169:'The thumbnail is 16:9.',
  thRatio:r=>'The thumbnail ratio is '+r.toFixed(2)+':1. Video results use 16:9, so it will be cropped or letterboxed.',
  thHttp:'Use an https:// address for the thumbnail.',
  dateNone:'Add the upload date. Google requires it.',
  dateBad:'Write the upload date as YYYY-MM-DD.',
  dateFuture:'The upload date is in the future.',
  dateOk:d=>'Upload date is set ('+d+').',
  date:d=>d,
  durNone:'Add the duration so results can show how long the video is.',
  durBad:'Write the duration as 4:35, 1:02:03 or PT4M35S.',
  durOk:(c,iso)=>'Duration: '+c+' ('+iso+').',
  capOk:'Captions or subtitles are available.',
  capNo:'Captions are not marked as available. They help deaf viewers and people watching without sound.',
  trNone:'Add a transcript. It makes what is said in the video searchable and accessible.',
  trShort:n=>'The transcript is short ('+n+' words). Include everything that is said.',
  trOk:n=>'Transcript: '+n+' words.',
  trKp:'The transcript contains the keyphrase.',
  trNoKp:'The transcript does not contain the keyphrase.',
  lenGood:(n,inc)=>'Length is good: '+n+' words'+(inc?' including the transcript':'')+'.',
  lenOk:(n,inc)=>'Fairly short: '+n+' words'+(inc?' including the transcript':'')+'. 300 or more is better for search.',
  lenBad:(n,inc)=>'Thin content: '+n+' words'+(inc?' including the transcript':'')+'. Aim for at least 300.',
  bodyVideo:'Add a short introduction around the video. Text on the page helps search engines understand it.',
  bodyNone:'Add body text to check the content.',
  firstKp:'The keyphrase appears in the first paragraph.',
  firstNoKp:'The keyphrase does not appear in the first paragraph.',
  densNone:'The keyphrase does not appear in the body.',
  densLow:(d,n)=>'Keyphrase density is low: '+d.toFixed(1)+'% ('+n+(n>1?' times':' time')+'). Aim for 0.5% to 3%.',
  densGood:(d,n)=>'Keyphrase density is good: '+d.toFixed(1)+'% ('+n+(n>1?' times':' time')+').',
  densHigh:(d,n)=>'Keyphrase density is too high: '+d.toFixed(1)+'% ('+n+(n>1?' times':' time')+'). This can read as keyword stuffing.',
  headKp:'A subheading contains the keyphrase.',
  headNoKp:'No subheading contains the keyphrase.',
  headNone:'No subheadings found. Break long text up with subheadings.',
  headOk:n=>n+' subheading'+(n>1?'s':'')+' found.',
  longP:n=>n+' paragraph'+(n>1?'s are':' is')+' longer than 150 words.',
  sentGood:(p,max)=>'Sentence length is good: '+p+'% of sentences are over '+max+' words.',
  sentOk:(p,max)=>p+'% of sentences are over '+max+' words. Try to keep this under 25%.',
  sentBad:(p,max)=>p+'% of sentences are over '+max+' words. Shorten some of them.',
  read:(s,label)=>'Reading ease: '+s+' ('+label+').',
  readLabel:s=>s>=90?'very easy':s>=80?'easy':s>=70?'fairly easy':s>=60?'standard':s>=50?'fairly difficult':s>=30?'difficult':'very difficult',
  readAdvice:'Use shorter sentences and words to make it easier to read.',
  transGood:p=>p+'% of sentences contain a transition word.',
  transLow:p=>'Only '+p+'% of sentences contain a transition word. Aim for 30% or more.',
  intNone:hasDomain=>'No internal links found.'+(hasDomain?'':' Set the site domain so absolute links are classified correctly.'),
  intOk:n=>n+' internal link'+(n>1?'s':'')+'.',
  outNone:'No outbound links found.',
  outOk:n=>n+' outbound link'+(n>1?'s':'')+'.',
  imgThumb:'No featured image. Set the video thumbnail as og:image so shares show it.',
  imgNone:'Add a featured image. Social platforms use it when the page is shared.',
  imgGood:(w,h)=>'Size is good: '+w+' x '+h+' px.',
  imgOk:(w,h)=>'Size is acceptable ('+w+' x '+h+' px), but 1200 x 630 px or larger displays best.',
  imgSmall:(w,h)=>'Too small: '+w+' x '+h+' px. Use at least 1200 x 630 px.',
  imgRatioGood:'Aspect ratio is close to 1.91:1, so it will not be cropped much.',
  imgRatio:r=>'Aspect ratio is '+r.toFixed(2)+':1. Social cards use about 1.91:1, so it will be cropped.',
  imgDimUnknown:'Image dimensions are unknown. Upload the file to check its size.',
  imgLoading:'Loading the image to check its size.',
  imgError:'The image could not be loaded. Check that the address is correct and public.',
  imgUrlBad:'The image address must be a full address starting with https://.',
  sizeGood:s=>'File size is good: '+s+'.',
  sizeOk:s=>'File size is '+s+'. Under 300 KB loads faster.',
  sizeBad:s=>'File size is '+s+'. Compress it below 1 MB, ideally below 300 KB.',
  imgFormat:t=>'Format is '+t+'. JPEG, PNG or WebP are safest.',
  altNone:'Add alt text for the image.',
  altLong:n=>'Alt text is long ('+n+' characters). Screen readers handle 125 or fewer best.',
  altOk:'Alt text is present.',
  altKp:'Alt text contains the keyphrase.',
  altNoKp:'Alt text does not contain the keyphrase.',
  kb:n=>n<1024?n+' B':n<1048576?Math.round(n/1024)+' KB':(n/1048576).toFixed(1)+' MB',
  tagsNone:'No tags. Three to eight relevant tags help related-content and site search.',
  tagsFew:n=>'Only '+n+' tag'+(n>1?'s':'')+'. Three to eight is a good range.',
  tagsOk:n=>n+' tags.',
  tagsMany:n=>n+' tags. More than eight dilutes their value.',
  tagsDup:l=>'Duplicate tags: '+l+'.',
  tagsLong:l=>'Some tags are long phrases: '+l+'.',
  tagKp:'A tag matches the keyphrase.',
  tagNoKp:'No tag matches the keyphrase.',
  h1One:'Exactly one H1 heading.',
  h1None:'No H1 heading.',
  h1Many:n=>n+' H1 headings. One is usual.',
  canOk:'Canonical URL is set.',
  canNo:'No canonical URL.',
  ogAll:'Open Graph title, description and image are set.',
  ogPart:l=>'Open Graph is incomplete: missing '+l+'.',
  ogNone:'No Open Graph tags.',
  twOk:'Twitter/X card tag is set.',
  twNo:'No twitter:card tag.',
  langOk:l=>'Page language is declared ('+l+').',
  langNo:'No lang attribute on the html element.',
  hrefOk:n=>n+' hreflang alternate'+(n>1?'s':'')+' declared.',
  hrefNo:'No hreflang alternates. Add them to link language versions.',
  noindex:'The robots meta tag blocks indexing (noindex).',
  vpOk:'Viewport tag is set.',
  vpNo:'No viewport tag.',
  noAlt:n=>n+' content image'+(n>1?'s have':' has')+' no alt attribute.',
  allAlt:'All content images have an alt attribute.',
  ldNone:'No VideoObject structured data. Copy the JSON-LD under the checks into the page.',
  ldMissing:l=>'The VideoObject structured data is missing '+l+'.',
  ldOk:'VideoObject structured data has the required properties.',
  embOk:'The video is embedded in the page.',
  embNo:'No YouTube or Vimeo embed found in the source. It may be added by a script.',
  ogvOk:'og:video tag is set.',
  ogvNo:'No og:video tag. Some platforms use it to play the video in the post.',
  titleHint:(n,w,max)=>n+' characters, about '+w+' of '+max+' px',
  descHint:n=>n+' of 158 characters',
  words:n=>n+' words',
  vtitleHint:n=>n+' of 100 characters',
  chars:n=>n+' characters',
  dims:(w,h)=>w+' x '+h+' px',
  loading:'Loading',noImage:'No image',none:'None',remote:'Remote',remove:'Remove',
  serpTitle:'Your SEO title appears here',serpDesc:'Your meta description appears here.',
  socialRemote:'Image set in page source:',socialTitle:'Title',socialDesc:'Description',
  fetchFirst:'Enter a YouTube or Vimeo address first.',
  fetching:p=>'Fetching details from '+p+'.',
  fieldNames:{vtitle:'title',vdesc:'description',vdur:'duration',vdate:'upload date',vthumb:'thumbnail'},
  filled:l=>'Filled: '+l+'.',
  nothingFilled:'No empty fields to fill.',
  ytNote:' YouTube does not share the description, date or duration without an API key, so copy them from YouTube Studio.',
  fetchFail:'Could not fetch the details. The video may be private, or the request was blocked.',
  ldCopied:'JSON-LD copied.',ldCopyFail:'Copy failed. Select the code and copy it.',
  linkCounts:(i,x)=>i+' internal, '+x+' external',
  linkInternal:'Internal link',linkExternal:'External link',
  linkPhInt:dom=>'/news/... or https://'+(dom||'your-site.org')+'/...',linkPhExt:'https://example.org/page',
  linkUpdate:'Update link',linkApply:'Apply',
  noteExt:'This address is on another site, so it will count as an external link.',
  noteInt:'This address is on your own site, so it will count as an internal link.',
  noteHttps:'https:// will be added.',
  noteNoSel:'No text is selected, so the address itself will be used as the link text.',
  noteDomain:'Set the site domain above so full addresses on your site are recognised.',
  copyOk:'HTML copied.',copyFail:'Copy failed. Use the HTML view and copy from there.',
  notHtml:'This does not look like an HTML page source.',
  videoDetected:'Video page detected. ',
  imported:'Fields filled from the source. Set the focus keyphrase to complete the checks.',
  exampleLoaded:'Example loaded. Edit any field to see the checks change.'
};
const T=Object.assign({},EN,LANG.msgs);
const m=(k,...a)=>typeof T[k]==='function'?T[k](...a):T[k];

const KEY=RULES.storageKey;
const TEXT=['kp','title','slug','domain','desc','alt','tags','vurl','vtitle','vdesc','vthumb','vdate','vdur','vtrans'];
const EMPTY={type:'article',kp:'',title:'',slug:'',domain:'',desc:'',body:'',alt:'',tags:'',img:null,tech:null,
  vurl:'',vtitle:'',vdesc:'',vthumb:'',vdate:'',vdur:'',vtrans:'',vcap:false};
let S=Object.assign({},EMPTY);
try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v)Object.assign(S,v);delete S.links}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){try{const c=Object.assign({},S,{img:S.img?Object.assign({},S.img,{src:null}):null});localStorage.setItem(KEY,JSON.stringify(c))}catch(e2){}}}

const slugify=s=>norm(s).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const words=s=>(s||'').split(/\s+/).filter(w=>/[\p{L}\p{N}]/u.test(w));
// Keyphrase words that carry meaning: function words are left out when the language defines them.
const contentWords=kp=>STOP.size?norm(kp).split(/[\s'-]+/).filter(w=>w&&!STOP.has(w)):norm(kp).split(' ').filter(Boolean);
const ctx=document.createElement('canvas').getContext('2d');
function px(t,font){ctx.font=font;return Math.round(ctx.measureText(t||'').width)}
const TF='20px Arial',DF='14px Arial',TMAX=600,DMAX=920;
function cut(t,font,max){if(px(t,font)<=max)return t;let lo=0,hi=t.length;while(lo<hi){const m=(lo+hi+1)>>1;if(px(t.slice(0,m)+'...',font)<=max)lo=m;else hi=m-1}return t.slice(0,lo).replace(/\s+\S*$/,'')+' ...'}
const kpRe=(needle,f)=>new RegExp('(?<![\\p{L}\\p{N}])'+needle.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?![\\p{L}\\p{N}])','u'+(f||''));
function count(hay,needle){if(!needle)return 0;return (norm(hay).match(kpRe(needle,'g'))||[]).length}
function has(hay,needle){return !!needle&&kpRe(needle).test(norm(hay))}
function cleanDomain(d){return norm(d).replace(/^https?:\/\//,'').replace(/^www\./,'').replace(/\/.*$/,'')}
// French typography: a space before : ; ! ? and inside « ». Times like 10:30 and URLs are ignored.
const badTypo=s=>/[\p{L}\p{N})»][:;!?](?=\s|$)/u.test(s||'')||/«[^\s  ]|[^\s  ]»/.test(s||'');
// Approximate syllable count: vowel groups, minus a silent final e or es.
function syllables(w){
  const s=(w||'').toLowerCase().replace(/[^a-zàâäéèêëîïôöùûüÿœæ]/g,'');if(!s)return 0;
  let n=(s.match(/[aeiouyàâäéèêëîïôöùûüÿœæ]+/g)||[]).length;
  if(n>1&&/[^aeiouy]es?$/.test(s))n--;
  return Math.max(n,1);
}

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

// Video helpers
function parseVideo(raw){
  let u=(raw||'').trim();if(!u)return null;
  const src=u.match(/src\s*=\s*["']([^"']+)["']/i);if(src)u=src[1];
  if(/^\/\//.test(u))u='https:'+u;else if(!/^https?:/i.test(u))u='https://'+u;
  let x;try{x=new URL(u)}catch(e){return {bad:true}}
  const h=x.hostname.replace(/^(www|m)\./,'');
  if(/^(youtube\.com|youtube-nocookie\.com|youtu\.be)$/.test(h)){
    let id=h==='youtu.be'?x.pathname.split('/')[1]:x.searchParams.get('v');
    if(!id){const m=x.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]{11})/);if(m)id=m[1]}
    if(!/^[\w-]{11}$/.test(id||''))return {provider:'YouTube',bad:true};
    return {provider:'YouTube',id,watch:'https://www.youtube.com/watch?v='+id,embed:'https://www.youtube.com/embed/'+id,at:t=>'https://www.youtube.com/watch?v='+id+'&t='+t+'s'};
  }
  if(/(^|\.)vimeo\.com$/.test(h)){
    const seg=x.pathname.split('/').filter(Boolean);let i=-1;seg.forEach((p,k)=>{if(/^\d+$/.test(p))i=k});
    if(i<0)return {provider:'Vimeo',bad:true};
    const id=seg[i],hash=(/^[0-9a-f]+$/i.test(seg[i+1]||'')?seg[i+1]:x.searchParams.get('h'))||'';
    const watch='https://vimeo.com/'+id+(hash?'/'+hash:'');
    return {provider:'Vimeo',id,watch,embed:'https://player.vimeo.com/video/'+id+(hash?'?h='+hash:''),at:t=>watch+'#t='+t+'s'};
  }
  return {bad:true};
}
// Seconds from "4:35", "1:02:03", "275" or "PT4M35S"; null when empty, NaN when unreadable.
function parseDur(v){
  const s=String(v||'').trim();if(!s)return null;let m;
  if(/^\d+$/.test(s))return +s;
  if((m=s.match(/^(?:(\d+):)?(\d{1,2}):(\d{2})$/)))return (+m[1]||0)*3600+ +m[2]*60+ +m[3];
  if((m=s.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/i))&&s.length>2)return (+m[1]||0)*3600+(+m[2]||0)*60+Math.round(+m[3]||0);
  return NaN;
}
const hms=n=>{n=Math.round(n);return [Math.floor(n/3600),Math.floor(n%3600/60),n%60]};
const clock=n=>{const [h,m,s]=hms(n);return (h?h+':'+String(m).padStart(2,'0'):m)+':'+String(s).padStart(2,'0')};
const isoDur=n=>{const [h,m,s]=hms(n);return 'PT'+(h?h+'H':'')+(m?m+'M':'')+(s||(!h&&!m)?s+'S':'')};
function chapters(desc){
  const out=[];
  (desc||'').split('\n').forEach(l=>{const m=l.match(/^\s*[\[(]?((?:\d{1,2}:)?\d{1,2}:\d{2})[\])]?\s*[-\u2013\u2014:|.]?\s*(\S.*)$/);if(m)out.push({t:parseDur(m[1]),name:m[2].trim()})});
  return out;
}
const chaptersOk=c=>c.length>=3&&c[0].t===0&&c.every((x,i)=>!i||x.t-c[i-1].t>=10);
const tagList=()=>(S.tags||'').split(/[,;]/).map(s=>s.trim()).filter(Boolean);
const imgSize=u=>new Promise(res=>{const i=new Image();i.onload=()=>res({w:i.naturalWidth,h:i.naturalHeight});i.onerror=()=>res(null);i.src=u});
// The thumbnail is loaded from its address to measure it; TH caches the result for the current URL.
const TH={url:'',w:0,h:0,st:''};
function probeThumb(){
  const u=(S.vthumb||'').trim();if(u===TH.url)return;
  Object.assign(TH,{url:u,w:0,h:0,st:''});if(!u)return;
  if(!/^https?:\/\/[^\s]+$/i.test(u)){TH.st='url';return}
  TH.st='loading';imgSize(u).then(r=>{if(TH.url!==u)return;if(r)Object.assign(TH,r,{st:'ok'});else TH.st='error';render()});
}
// A featured image given by address is loaded the same way to measure it. Its file size is read
// from a HEAD request when the server allows it.
const IM={url:'',st:''};
const extType=u=>{const x=(u||'').split(/[?#]/)[0].match(/\.(jpe?g|png|webp|avif|gif|svg|bmp|tiff?)$/i);return x?x[1].toLowerCase().replace('jpg','jpeg'):''};
function probeImg(){
  const im=S.img,u=im&&!im.src&&im.remote?im.remote.trim():'';if(u===IM.url&&!(IM.st==='ok'&&!(im.w&&im.h)))return;
  IM.url=u;IM.st='';if(!u)return;
  if(!/^(https?|file):\/\/\S+$/i.test(u)){IM.st='url';return}
  IM.st='loading';
  imgSize(u).then(r=>{if(IM.url!==u||!S.img)return;if(r){Object.assign(S.img,r);IM.st='ok';save()}else IM.st='error';render()});
  fetch(u,{method:'HEAD'}).then(r=>{const n=+r.headers.get('content-length');if(n&&IM.url===u&&S.img){S.img.bytes=n;save();render()}}).catch(()=>{});
}
function remoteImg(u){u=(u||'').trim();return u?{src:null,remote:u,w:0,h:0,bytes:0,type:extType(u),name:''}:null}
function buildLD(){
  const V=parseVideo(S.vurl),du=parseDur(S.vdur),o={'@context':'https://schema.org','@type':'VideoObject'};
  const put=(k,v)=>{if(v)o[k]=v};
  put('name',(S.vtitle||'').trim());put('description',(S.vdesc||'').trim());
  const th=(S.vthumb||'').trim();put('thumbnailUrl',th&&[th]);
  put('uploadDate',S.vdate);put('duration',du>0&&isoDur(du));
  if(V&&!V.bad)put('embedUrl',V.embed);
  put('transcript',(S.vtrans||'').trim());put('keywords',tagList().join(', '));
  const ch=chapters(S.vdesc);
  if(V&&!V.bad&&chaptersOk(ch))o.hasPart=ch.map((c,i)=>{const end=i+1<ch.length?ch[i+1].t:du>0?du:0;
    return Object.assign({'@type':'Clip',name:c.name,startOffset:c.t},end?{endOffset:end}:{},{url:V.at(c.t)})});
  return '<script type="application/ld+json">\n'+JSON.stringify(o,null,2).replace(/</g,'\\u003c')+'\n</'+'script>';
}


// Optional online grammar and spelling check with LanguageTool. It is off by default, and nothing is
// sent until the visitor confirms in a dialog. The consent is remembered for that server only.
const LT_PUBLIC='https://api.languagetool.org/v2/check',LT_KEY=KEY+'-lt';
const LT={on:false,consent:'',server:'',lang:'',result:null,sent:'',busy:false,again:false,last:0,timer:null};
try{const v=JSON.parse(localStorage.getItem(LT_KEY)||'{}');['on','consent','server','lang'].forEach(k=>{if(k in v)LT[k]=v[k]})}catch(e){}
function ltSave(){try{localStorage.setItem(LT_KEY,JSON.stringify({on:LT.on,consent:LT.consent,server:LT.server,lang:LT.lang}))}catch(e){}}
const ltUrl=()=>(LT.server||'').trim()||LT_PUBLIC;
const ltHost=()=>{try{return new URL(ltUrl()).host}catch(e){return ltUrl()}};
const ltReady=()=>LT.on&&LT.consent===ltHost();
// Many rules (French agreement rules among them) have no issue type, so their category is used as well.
function ltKind(rule){
  const t=rule&&rule.issueType||'',c=(rule&&rule.category&&rule.category.id||'').toUpperCase();
  if(t==='misspelling'||c==='TYPOS')return 'misspelling';
  if(t==='grammar'||/GRAMM|AGREEMENT|CONFUSED|HOMONYM|PARONYM|CONJUG|VERB/.test(c))return 'grammar';
  if(t==='typographical'||t==='whitespace'||/TYPOGRAPHY|PUNCTUATION|CASING/.test(c))return 'typographical';
  if(/^(style|register|duplication)$/.test(t)||/STYLE|REDUNDANCY|REPETITION|PLAIN_ENGLISH/.test(c))return 'style';
  return 'other';
}
function ltStatus(t){$('ltMsg').textContent=t||''}
// The fields are sent as one text, so one request covers the page; offsets map the results back.
function ltParts(){
  const video=S.type==='video',p=[];const push=(f,t)=>{t=(t||'').trim();if(t)p.push({f,t})};
  push('kp',S.kp);push('title',S.title);push('desc',S.desc);
  if(video){push('vtitle',S.vtitle);push('vdesc',S.vdesc)}
  // Tidy the spacing left by removing HTML tags, so it is not reported as the writer's mistake.
  push('body',bodyText(S.body||'').replace(/^\s*#+\s*/gm,'').replace(/[ \t\u00a0]+/g,' ').replace(/ *\n */g,'\n').replace(/\n{3,}/g,'\n\n'));
  if(S.img||!video)push('alt',S.alt);
  push('tags',S.tags);
  if(video)push('vtrans',S.vtrans);
  return p;
}
async function ltRun(force){
  if(!ltReady())return;
  const parts=ltParts(),max=ltUrl()===LT_PUBLIC?20000:200000;let text='';
  parts.forEach(p=>{p.start=text.length;text+=p.t;p.end=text.length;text+='\n\n'});
  if(!text.trim()){if(LT.result){LT.result=null;LT.sent='';render()}ltStatus(m('ltEmpty'));return}
  const cut=text.length>max;if(cut)text=text.slice(0,max);
  const key=(LT.lang||RULES.ltLanguage)+'|'+ltUrl()+'|'+text;if(!force&&key===LT.sent)return;
  if(LT.busy){LT.again=true;return}
  // The public service allows 20 requests a minute: keep at least 3.5 seconds between requests.
  const wait=LT.last+3500-Date.now();if(wait>0){clearTimeout(LT.timer);LT.timer=setTimeout(()=>ltRun(force),wait);return}
  LT.busy=true;LT.last=Date.now();ltStatus(m('ltChecking'));
  try{
    const r=await fetch(ltUrl(),{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({text,language:LT.lang||RULES.ltLanguage})});
    if(r.status===429)throw new Error('rate');if(!r.ok)throw new Error('http');
    const j=await r.json();
    if(ltReady()){LT.result={parts,text,matches:j.matches||[]};LT.sent=key;ltStatus(cut?m('ltTooLong',max):m('ltChecked'))}
  }catch(e){ltStatus(e.message==='rate'?m('ltRate'):m('ltFail'))}
  LT.busy=false;render();
  if(LT.again){LT.again=false;ltRun()}
}
// Re-check after a pause in typing; ltRun skips the request when the text has not changed.
function ltLater(){if(ltReady()){clearTimeout(LT.timer);LT.timer=setTimeout(()=>ltRun(),2500)}}

function analyse(){
  const G=[];const grp=(key)=>{const g={key,name:T.g[key],items:[]};G.push(g);return g};
  const add=(g,s,t,f)=>g.items.push({s,t,f});
  const kp=norm(S.kp);const kpWords=kp?kp.split(' ').length:0;const video=S.type==='video';
  const kpContent=kp?contentWords(kp).length:0;

  const gk=grp('kp');
  if(!kp)add(gk,'ok',m('kpNone'));
  else if(kpContent>4)add(gk,'ok',m('kpLong',kpContent));
  else add(gk,'good',m('kpOk',kpContent));

  const gt=grp('title');
  const t=(S.title||'').trim();const tw=px(t,TF);
  if(!t)add(gt,'bad',m('titleNone'));
  else{
    if(tw>TMAX)add(gt,'bad',m('titleLong',tw,TMAX));
    else if(t.length<30)add(gt,'ok',m('titleShort',t.length));
    else if(tw>570)add(gt,'ok',m('titleNear',tw,TMAX));
    else add(gt,'good',m('titleGood',t.length,tw));
    if(kp){const n=norm(t);if(n.startsWith(kp)&&has(n.slice(0,kp.length+1),kp))add(gt,'good',m('kpStart'));else if(has(n,kp))add(gt,'ok',m('kpNotStart'));else add(gt,'bad',m('kpMissing'))}
    if(RULES.typography&&badTypo(t))add(gt,'ok',m('typo'));
  }

  const gd=grp('desc');
  const d=(S.desc||'').trim();const dl=d.length;
  if(!d)add(gd,'bad',m('descNone'));
  else{
    if(dl>=120&&dl<=158)add(gd,'good',m('descGood',dl));
    else if(dl>=70&&dl<120)add(gd,'ok',m('descShortish',dl));
    else if(dl>158&&dl<=170)add(gd,'ok',m('descCut',dl));
    else if(dl<70)add(gd,'bad',m('descShort',dl));
    else add(gd,'bad',m('descLong',dl));
    if(kp){if(has(d,kp))add(gd,'good',m('kpIn'));else add(gd,'bad',m('kpMissing'))}
    if(RULES.typography&&badTypo(d))add(gd,'ok',m('typo'));
  }

  const gs=grp('slug');
  const sl=(S.slug||'').trim().replace(/^https?:\/\/[^\/]+/,'').replace(/^\/+/,'');
  if(!sl)add(gs,'ok',m('slugNone'));
  else{
    if(/[^a-z0-9\-\/.]/.test(sl))add(gs,'ok',m('slugChars'));
    else add(gs,'good',m('slugClean'));
    const last=sl.replace(/\/$/,'').split('/').pop();
    if(last.length>75)add(gs,'ok',m('slugLong',last.length));
    if(STOP.size){const sw=[...new Set(last.split(/[-_]+/).map(norm).filter(w=>w.length>1&&STOP.has(w)))];if(sw.length>=2)add(gs,'ok',m('slugStop',sw.join(', ')))}
    if(kp){const ks=slugify(S.kp).split('-').filter(w=>w.length>2&&!STOP.has(w));const ss=norm(sl);if(!ks.length||ks.every(w=>ss.includes(w)))add(gs,'good',m('slugKp'));else add(gs,'ok',m('slugNoKp'))}
  }

  if(video){
    const gv=grp('video');const f=(s,t,k)=>add(gv,s,t,k);
    const V=parseVideo(S.vurl);
    if(!V)f('bad',m('vUrlNone'),'vurl');
    else if(V.bad)f('bad',V.provider?m('vUrlNoId',V.provider):m('vUrlOther'),'vurl');
    else f('good',m('vUrlOk',V.provider,V.id),'vurl');
    const vt=(S.vtitle||'').trim();
    if(!vt)f('bad',m('vTitleNone'),'vtitle');
    else{
      if(vt.length>100)f('bad',m('vTitleMax',vt.length),'vtitle');
      else if(vt.length>70)f('ok',m('vTitleLong',vt.length),'vtitle');
      else f('good',m('vTitleGood',vt.length),'vtitle');
      if(kp)f(has(vt,kp)?'good':'ok',has(vt,kp)?m('vTitleKp'):m('vTitleNoKp'),'vtitle');
      if(RULES.typography&&badTypo(vt))f('ok',m('typo'),'vtitle');
    }
    const vd=(S.vdesc||'').trim();
    if(!vd)f('bad',m('vDescNone'),'vdesc');
    else{
      if(vd.length>5000)f('bad',m('vDescMax',vd.length),'vdesc');
      else if(vd.length<100)f('ok',m('vDescShort',vd.length),'vdesc');
      else f('good',m('vDescGood',vd.length),'vdesc');
      if(kp){if(has(vd.slice(0,160),kp))f('good',m('vDescKpStart'),'vdesc');
        else if(has(vd,kp))f('ok',m('vDescKpLate'),'vdesc');
        else f('ok',m('vDescNoKp'),'vdesc')}
      const ch=chapters(vd);
      if(chaptersOk(ch))f('good',m('chOk',ch.length),'vdesc');
      else if(ch.length)f('ok',m('chBad'),'vdesc');
      else f('ok',m('chNone'),'vdesc');
    }
    const tu=(S.vthumb||'').trim();
    if(!tu)f('bad',m('thNone'),'vthumb');
    else if(TH.st==='url')f('bad',m('thUrl'),'vthumb');
    else if(TH.st==='error')f('bad',m('thError'),'vthumb');
    else if(TH.st==='loading')f('ok',m('thLoading'),'vthumb');
    else if(TH.st==='ok'){
      const w=TH.w,h=TH.h;
      if(w<=120&&h<=90)f('bad',m('thPlaceholder'),'vthumb');
      else{
        if(w>=1280&&h>=720)f('good',m('thGood',w,h),'vthumb');
        else if(w>=640)f('ok',m('thOk',w,h),'vthumb');
        else f('bad',m('thSmall',w,h),'vthumb');
        const r=w/h;
        if(Math.abs(r-16/9)<=0.08)f('good',m('th169'),'vthumb');
        else f('ok',m('thRatio',r),'vthumb');
      }
      if(/^http:/i.test(tu))f('ok',m('thHttp'),'vthumb');
    }
    const dt=(S.vdate||'').trim();
    if(!dt)f('bad',m('dateNone'),'vdate');
    else if(!/^\d{4}-\d{2}-\d{2}$/.test(dt)||isNaN(Date.parse(dt)))f('bad',m('dateBad'),'vdate');
    else if(dt>new Date().toISOString().slice(0,10))f('bad',m('dateFuture'),'vdate');
    else f('good',m('dateOk',m('date',dt)),'vdate');
    const du=parseDur(S.vdur);
    if(du===null)f('ok',m('durNone'),'vdur');
    else if(!(du>0))f('bad',m('durBad'),'vdur');
    else f('good',m('durOk',clock(du),isoDur(du)),'vdur');
    f(S.vcap?'good':'ok',S.vcap?m('capOk'):m('capNo'),'vcap');

    const gtr=grp('vtrans');const tr=(S.vtrans||'').trim(),trw=words(tr).length;
    if(!tr)add(gtr,'bad',m('trNone'));
    else{
      if(trw<50)add(gtr,'ok',m('trShort',trw));
      else add(gtr,'good',m('trOk',trw));
      if(kp)add(gtr,has(tr,kp)?'good':'ok',has(tr,kp)?m('trKp'):m('trNoKp'));
    }
  }

  const gb=grp('body');
  const raw=S.body||'';const txt=bodyText(raw);
  const lines=txt.split('\n');
  const heads=lines.filter(l=>/^\s*#{1,6}\s/.test(l)).map(l=>l.replace(/^\s*#+\s*/,''));
  const plain=lines.filter(l=>!/^\s*#{1,6}\s/.test(l)).join('\n');
  const paras=plain.split(/\n\s*\n/).map(p=>p.trim()).filter(p=>words(p).length);
  const wc=words(txt.replace(/^\s*#+\s*/gm,'')).length;
  // On a video page the transcript counts towards the length of the page.
  const twc=video?words(S.vtrans).length:0,tot=wc+twc;
  if(tot){
    if(tot>=300)add(gb,'good',m('lenGood',tot,!!twc));
    else if(tot>=150)add(gb,'ok',m('lenOk',tot,!!twc));
    else add(gb,'bad',m('lenBad',tot,!!twc));
  }
  if(!wc)add(gb,video?'ok':'bad',video?m('bodyVideo'):m('bodyNone'));
  else{
    if(kp){
      const first=paras[0]||'';
      if(has(first,kp))add(gb,'good',m('firstKp'));
      else add(gb,'bad',m('firstNoKp'));
      // With function words defined, only the keyphrase's content words count towards density.
      const occ=count(txt+(twc?'\n'+S.vtrans:''),kp);const dens=occ*(STOP.size?kpContent:kpWords)/tot*100;
      if(occ===0)add(gb,'bad',m('densNone'));
      else if(dens<0.5)add(gb,'ok',m('densLow',dens,occ));
      else if(dens<=3)add(gb,'good',m('densGood',dens,occ));
      else add(gb,'bad',m('densHigh',dens,occ));
      if(heads.length){if(heads.some(h=>has(h,kp)))add(gb,'good',m('headKp'));else add(gb,'ok',m('headNoKp'))}
    }
    if(!heads.length){if(wc>300)add(gb,'ok',m('headNone'))}
    else add(gb,'good',m('headOk',heads.length));
    const longP=paras.filter(p=>words(p).length>150).length;
    if(longP)add(gb,'ok',m('longP',longP));
    const sents=plain.split(/(?<=[.!?…])\s+/).map(s=>s.trim()).filter(s=>words(s).length);
    const max=RULES.sentenceMax;
    if(sents.length>=3){const lp=Math.round(sents.filter(s=>words(s).length>max).length/sents.length*100);
      if(lp<=25)add(gb,'good',m('sentGood',lp,max));
      else if(lp<=35)add(gb,'ok',m('sentOk',lp,max));
      else add(gb,'bad',m('sentBad',lp,max));}
    const F=RULES.readability;
    if(F&&sents.length>=3){
      const ws=words(plain),syl=ws.reduce((n,w)=>n+syllables(w),0);
      const score=Math.max(0,Math.min(100,Math.round(F.base-F.perWord*ws.length/sents.length-F.perSyllable*syl/ws.length)));
      add(gb,score>=60?'good':score>=50?'ok':'bad',m('read',score,m('readLabel',score))+(score<60?' '+m('readAdvice'):''));
    }
    if(RULES.transitions.length&&sents.length>=5){
      const tw=RULES.transitions.map(norm);
      const hit=sents.filter(s=>{const n=norm(s);return tw.some(w=>kpRe(w).test(n))}).length;
      const p=Math.round(hit/sents.length*100);
      add(gb,p>=30?'good':p>=20?'ok':'bad',p>=30?m('transGood',p):m('transLow',p));
    }
    const L=linksIn(raw,S.domain);
    if(!L.internal)add(gb,'ok',m('intNone',!!cleanDomain(S.domain)));
    else add(gb,'good',m('intOk',L.internal));
    if(!L.outbound)add(gb,'ok',m('outNone'));
    else add(gb,'good',m('outOk',L.outbound));
  }

  const gi=grp('image');
  const im=S.img;
  if(!im&&video&&TH.st==='ok')add(gi,'ok',m('imgThumb'));
  else if(!im)add(gi,'bad',m('imgNone'));
  else{
    if(im.w&&im.h){
      if(im.w>=1200&&im.h>=630)add(gi,'good',m('imgGood',im.w,im.h));
      else if(im.w>=600)add(gi,'ok',m('imgOk',im.w,im.h));
      else add(gi,'bad',m('imgSmall',im.w,im.h));
      const r=im.w/im.h;
      if(Math.abs(r-1.91)<=0.15)add(gi,'good',m('imgRatioGood'));
      else add(gi,'ok',m('imgRatio',r));
    }else if(im.remote&&!im.src&&IM.st&&IM.st!=='ok')add(gi,IM.st==='loading'?'ok':'bad',m(IM.st==='loading'?'imgLoading':IM.st==='url'?'imgUrlBad':'imgError'));
    else add(gi,'ok',m('imgDimUnknown'));
    if(im.bytes){
      if(im.bytes<=300*1024)add(gi,'good',m('sizeGood',m('kb',im.bytes)));
      else if(im.bytes<=1024*1024)add(gi,'ok',m('sizeOk',m('kb',im.bytes)));
      else add(gi,'bad',m('sizeBad',m('kb',im.bytes)));
    }
    if(im.type&&!/(jpe?g|png|webp|avif)/i.test(im.type))add(gi,'ok',m('imgFormat',im.type));
  }
  const alt=(S.alt||'').trim();
  if(!im&&video){}
  else if(!alt)add(gi,'bad',m('altNone'));
  else{
    if(alt.length>125)add(gi,'ok',m('altLong',alt.length));
    else add(gi,'good',m('altOk'));
    if(kp){if(has(alt,kp))add(gi,'good',m('altKp'));else add(gi,'ok',m('altNoKp'))}
  }

  const gg=grp('tags');
  const tags=tagList();
  if(!tags.length)add(gg,'ok',m('tagsNone'));
  else{
    if(tags.length<3)add(gg,'ok',m('tagsFew',tags.length));
    else if(tags.length<=8)add(gg,'good',m('tagsOk',tags.length));
    else add(gg,'ok',m('tagsMany',tags.length));
    const seen={},dup=[];tags.forEach(x=>{const n=norm(x);if(seen[n])dup.push(x);seen[n]=1});
    if(dup.length)add(gg,'bad',m('tagsDup',dup.join(', ')));
    const long=tags.filter(x=>words(x).length>4);if(long.length)add(gg,'ok',m('tagsLong',long.join(', ')));
    if(kp){if(tags.some(x=>has(x,kp)))add(gg,'good',m('tagKp'));else add(gg,'ok',m('tagNoKp'))}
  }

  if(ltReady()&&LT.result){
    const gl=grp('lang'),res=LT.result,byF={};
    // Words from the keyphrase, tags and domain are names the visitor chose: not spelling mistakes.
    const ign=new Set([S.kp,...tagList(),cleanDomain(S.domain)].flatMap(t=>norm(t).split(/[\s,.'-]+/)).filter(Boolean));
    res.matches.forEach(x=>{
      const part=res.parts.find(p=>x.offset>=p.start&&x.offset<p.end);if(!part)return;
      const snip=res.text.substr(x.offset,x.length),type=ltKind(x.rule);
      if(type==='misspelling'&&ign.has(norm(snip)))return;
      // Keyphrases, tags, titles and alt text are not sentences: skip capital-letter and final-punctuation rules there.
      if(/^(kp|tags|title|alt|vtitle)$/.test(part.f)&&/^(UPPERCASE_SENTENCE_START|PUNCTUATION_PARAGRAPH_END)/.test((x.rule&&x.rule.id)||''))return;
      // Spelling and grammar errors count as bad, except in the keyphrase and tags, where searchers' own spellings are common.
      const soft=part.f==='kp'||part.f==='tags'||(type!=='misspelling'&&type!=='grammar');
      const sugg=x.replacements&&x.replacements[0]?x.replacements[0].value:'';
      (byF[part.f]=byF[part.f]||[]).push({s:soft?'ok':'bad',type,snip,msg:x.message||'',sugg});
    });
    if(!Object.keys(byF).length)add(gl,'good',m('ltNone'));
    let shown=0,total=0;
    res.parts.forEach(p=>{const l=byF[p.f];if(!l)return;
      add(gl,worst(l),m('ltField',T.fields[p.f],l.length),p.f==='alt'?'image':p.f);
      l.forEach(i=>{total++;if(shown<25){shown++;gl.items.push({s:i.s,x:true,tag:T.ltKind[i.type],t:T.fields[p.f]+' · '+m('ltIssue',i.snip,i.msg,i.sugg)})}});
    });
    if(total>shown)gl.items.push({s:'ok',x:true,tag:'…',t:m('ltMore',total-shown)});
  }

  if(S.tech){
    const x=S.tech;const gx=grp('tech');
    if(x.h1===1)add(gx,'good',m('h1One'));else if(x.h1===0)add(gx,'bad',m('h1None'));else add(gx,'ok',m('h1Many',x.h1));
    add(gx,x.canonical?'good':'ok',x.canonical?m('canOk'):m('canNo'));
    const og=[x.ogTitle,x.ogDesc,x.ogImage].filter(Boolean).length;
    if(og===3)add(gx,'good',m('ogAll'));
    else if(og)add(gx,'ok',m('ogPart',[!x.ogTitle&&'og:title',!x.ogDesc&&'og:description',!x.ogImage&&'og:image'].filter(Boolean).join(', ')));
    else add(gx,'bad',m('ogNone'));
    add(gx,x.twitter?'good':'ok',x.twitter?m('twOk'):m('twNo'));
    add(gx,x.lang?'good':'bad',x.lang?m('langOk',x.lang):m('langNo'));
    add(gx,x.hreflang?'good':'ok',x.hreflang?m('hrefOk',x.hreflang):m('hrefNo'));
    if(/noindex/i.test(x.robots||''))add(gx,'bad',m('noindex'));
    add(gx,x.viewport?'good':'bad',x.viewport?m('vpOk'):m('vpNo'));
    if(x.noAlt)add(gx,'ok',m('noAlt',x.noAlt));
    else add(gx,'good',m('allAlt'));
    if(video&&x.video){const v=x.video;
      if(!v.ld)add(gx,'bad',m('ldNone'));
      else if(v.missing.length)add(gx,'bad',m('ldMissing',v.missing.join(', ')));
      else add(gx,'good',m('ldOk'));
      add(gx,v.embed?'good':'ok',v.embed?m('embOk'):m('embNo'));
      add(gx,v.og?'good':'ok',v.og?m('ogvOk'):m('ogvNo'));
    }
  }
  return G;
}

const RANK={bad:0,ok:1,good:2};const LABEL=T.label;
const worst=items=>items.reduce((w,i)=>RANK[i.s]<RANK[w]?i.s:w,'good');

function render(){
  probeThumb();probeImg();
  const G=analyse();const video=S.type==='video';
  const all=G.flatMap(g=>g.items).filter(i=>!i.x);
  const n={good:0,ok:0,bad:0};all.forEach(i=>n[i.s]++);
  const pct=all.length?Math.round((n.good+n.ok*0.5)/all.length*100):0;
  const band=pct>=80?'good':pct>=55?'ok':'bad';
  const sorted=all.slice().sort((a,b)=>RANK[b.s]-RANK[a.s]);
  const v=$('verdict');v.className='verdict '+band;
  const cn=m('counts',n);
  v.innerHTML='<div class="big"><span class="word">'+LABEL[band]+'</span><span class="pct">'+esc(m('overall',pct))+'</span></div>'+
    '<div class="strip" aria-hidden="true">'+sorted.map(i=>'<i class="'+i.s+'"></i>').join('')+'</div>'+
    '<div class="counts"><b class="good">'+esc(cn[0])+'</b>, <b class="ok">'+esc(cn[1])+'</b>, <b class="bad">'+esc(cn[2])+'</b></div>';

  $('groups').innerHTML=G.map(g=>{const w=worst(g.items);
    const items=g.items.slice().sort((a,b)=>(a.x?1:0)-(b.x?1:0)||RANK[a.s]-RANK[b.s]);
    return '<div class="group '+g.key+'"><h3><span class="dot '+w+'"></span>'+esc(g.name)+'</h3><ul>'+
      items.map(i=>'<li'+(i.x?' class="x"':'')+'><span class="tag '+i.s+'">'+esc(i.tag||LABEL[i.s])+'</span><span>'+esc(i.t)+'</span></li>').join('')+'</ul></div>'}).join('');

  const status={},byField={};
  G.forEach(g=>{status[g.key]=worst(g.items);g.items.forEach(i=>{if(i.f)(byField[i.f]=byField[i.f]||[]).push(i)})});
  Object.keys(byField).forEach(k=>{const w=worst(byField[k]);if(!status[k]||RANK[w]<RANK[status[k]])status[k]=w});
  document.querySelectorAll('.dot[data-g]').forEach(el=>{const s=status[el.dataset.g];el.className='dot'+(s?' '+s:'')});

  const t=(S.title||'').trim(),tw=px(t,TF);
  $('titleHint').textContent=t?m('titleHint',t.length,tw,TMAX):'';
  const tb=$('titleBar');tb.style.width=Math.min(tw/TMAX,1)*100+'%';tb.className=!t?'':tw>TMAX?'bad':(t.length<30||tw>570)?'ok':'good';
  const d=(S.desc||'').trim(),dl=d.length;
  $('descHint').textContent=d?m('descHint',dl):'';
  const db=$('descBar');db.style.width=Math.min(dl/158,1)*100+'%';db.className=!d?'':(dl>=120&&dl<=158)?'good':(dl>=70&&dl<=170)?'ok':'bad';
  const wc=words(bodyText(S.body||'').replace(/^\s*#+\s*/gm,'')).length;
  $('bodyHint').textContent=wc?m('words',wc):'';
  const vt=(S.vtitle||'').trim(),vd=(S.vdesc||'').trim(),trw=words(S.vtrans).length,du=parseDur(S.vdur);
  $('vtitleHint').textContent=vt?m('vtitleHint',vt.length):'';
  $('vdescHint').textContent=vd?m('chars',vd.length):'';
  $('vtransHint').textContent=trw?m('words',trw):'';
  const thumbOk=video&&TH.st==='ok',durTag=du>0?'<span class="dur">'+clock(du)+'</span>':'';
  const vp=$('vprev');
  if(TH.st==='ok')vp.innerHTML='<img alt="" src="'+esc(TH.url)+'">'+durTag;else vp.textContent=TH.st==='loading'?m('loading'):TH.st?m('noImage'):m('none');
  const V=parseVideo(S.vurl);
  $('vthumbInfo').textContent=[V&&!V.bad?V.provider+' '+V.id:'',TH.st==='ok'?m('dims',TH.w,TH.h):''].filter(Boolean).join(', ');
  if(video)$('ld').textContent=buildLD();

  const dom=cleanDomain(S.domain)||'example.org';
  const sl=(S.slug||'').trim().replace(/^https?:\/\/[^\/]+/,'').replace(/^\/+|\/+$/g,'');
  $('serp').className='serp'+(thumbOk?' has-vid':'');
  $('serp').innerHTML='<div class="serp-site"><span class="fav"></span><div><div class="serp-name">'+esc(dom)+'</div><div class="serp-url">https://'+esc(dom)+(sl?' › '+esc(sl.split('/').join(' › ')):'')+'</div></div></div>'+
    '<div class="serp-body"><div><div class="serp-title">'+esc(t?cut(t,TF,TMAX):m('serpTitle'))+'</div>'+
    '<div class="serp-desc">'+esc(d?cut(d,DF,DMAX):m('serpDesc'))+'</div>'+
    (video&&V&&!V.bad?'<div class="serp-meta">'+esc([V.provider,S.vdate&&m('date',S.vdate)].filter(Boolean).join(' · '))+'</div>':'')+'</div>'+
    (thumbOk?'<div class="serp-vid"><img alt="" src="'+esc(TH.url)+'">'+durTag+'</div>':'')+'</div>';

  const im=S.img;let imgHtml;
  const imSrc=im&&(im.src||(im.remote&&IM.st==='ok'?IM.url:''));
  if(imSrc)imgHtml='<div class="img has"><img alt="" src="'+esc(imSrc)+'"></div>';
  else if(!im&&thumbOk)imgHtml='<div class="img has"><img alt="" src="'+esc(TH.url)+'"><span class="play"></span></div>';
  else if(im&&im.remote)imgHtml='<div class="img">'+esc(m('socialRemote'))+'<br>'+esc(im.remote.split('/').pop())+'</div>';
  else imgHtml='<div class="img">'+esc(m('noImage'))+'</div>';
  $('social').innerHTML=imgHtml+'<div class="txt"><div class="d">'+esc(dom)+'</div><div class="t">'+esc(t||m('socialTitle'))+'</div><div class="s">'+esc(d||m('socialDesc'))+'</div></div>';

  const th=$('thumb');
  if(imSrc)th.innerHTML='<img alt="" src="'+esc(imSrc)+'">';else th.textContent=im?(IM.st==='loading'?m('loading'):m('noImage')):m('none');
  $('imgInfo').innerHTML=im?esc([im.name||'',im.w&&im.h?m('dims',im.w,im.h):'',im.bytes?m('kb',im.bytes):''].filter(Boolean).join(', '))+' <button type="button" class="ghost" id="rmImg" style="padding:2px 8px;font-size:12px;margin-left:6px">'+esc(m('remove'))+'</button>':'';
  const rm=$('rmImg');if(rm)rm.onclick=()=>{S.img=null;$('imgFile').value='';$('imgUrl').value='';save();render()};
  ltLater();
}

let timer;const schedule=()=>{clearTimeout(timer);timer=setTimeout(()=>{save();render()},120)};
TEXT.forEach(k=>{const el=$(k);el.addEventListener('input',()=>{S[k]=el.value;if(k==='domain')markLinks();schedule()})});
const radios=document.querySelectorAll('input[name=ptype]');
function syncFields(){
  TEXT.forEach(k=>{$(k).value=S[k]||''});$('vcap').checked=!!S.vcap;
  $('imgUrl').value=S.img&&!S.img.src&&S.img.remote||'';
  radios.forEach(r=>{r.checked=r.value===S.type});document.body.classList.toggle('is-video',S.type==='video');
}
syncFields();
radios.forEach(r=>r.addEventListener('change',()=>{if(r.checked){S.type=r.value;syncFields();save();render()}}));
$('vcap').addEventListener('change',e=>{S.vcap=e.target.checked;schedule()});
$('imgUrl').addEventListener('input',e=>{$('imgFile').value='';S.img=remoteImg(e.target.value);schedule()});
$('vfetch').addEventListener('click',async()=>{
  const V=parseVideo(S.vurl),msg=$('vmsg');
  if(!V||V.bad){msg.textContent=m('fetchFirst');return}
  msg.textContent=m('fetching',V.provider);
  try{
    const ep=V.provider==='YouTube'?'https://www.youtube.com/oembed?format=json&url=':'https://vimeo.com/api/oembed.json?width=1280&url=';
    const r=await fetch(ep+encodeURIComponent(V.watch));if(!r.ok)throw new Error(r.status);
    const j=await r.json(),filled=[];
    const fill=(k,v)=>{if(v&&!String(S[k]||'').trim()){S[k]=String(v);filled.push(T.fieldNames[k])}};
    fill('vtitle',j.title);fill('vdesc',j.description);
    fill('vdur',j.duration&&clock(j.duration));fill('vdate',j.upload_date&&String(j.upload_date).slice(0,10));
    let th=j.thumbnail_url||'';
    if(V.provider==='YouTube'){const big='https://i.ytimg.com/vi/'+V.id+'/maxresdefault.jpg',sz=await imgSize(big);th=sz&&sz.w>120?big:'https://i.ytimg.com/vi/'+V.id+'/hqdefault.jpg'}
    else th=th.replace(/-d_\d+(x\d+)?/,'-d_1280x720');
    fill('vthumb',th);
    syncFields();save();render();
    msg.textContent=(filled.length?m('filled',filled.join(', ')):m('nothingFilled'))+(V.provider==='YouTube'?m('ytNote'):'');
  }catch(e){msg.textContent=m('fetchFail')}
});
$('ldCopy').addEventListener('click',async()=>{
  let ok=false;try{await navigator.clipboard.writeText(buildLD());ok=true}catch(e){}
  $('ldMsg').textContent=ok?m('ldCopied'):m('ldCopyFail');setTimeout(()=>{$('ldMsg').textContent=''},2500);
});

const ltDlg=$('ltDialog'),ltOn=$('ltOn'),ltSel=$('ltLang');
function ltUi(){
  document.querySelectorAll('.lthost').forEach(e=>{e.textContent=ltHost()});
  document.querySelectorAll('.ltpublic').forEach(e=>{e.hidden=ltUrl()!==LT_PUBLIC});
  ltOn.checked=ltReady();$('ltCheck').disabled=!ltReady();$('ltServer').value=LT.server||'';
  if(ltSel)ltSel.value=LT.lang||RULES.ltLanguage;
}
function ltEnable(){LT.on=true;LT.consent=ltHost();ltSave();ltUi();ltRun(true)}
function ltDisable(){LT.on=false;LT.result=null;LT.sent='';clearTimeout(LT.timer);ltSave();ltUi();ltStatus('');render()}
if(LT.on&&!ltReady())LT.on=false;
ltUi();
ltOn.addEventListener('change',()=>{
  if(!ltOn.checked){ltDisable();return}
  if(LT.consent===ltHost()){ltEnable();return}
  ltOn.checked=false;
  if(ltDlg.showModal)ltDlg.showModal();else if(confirm(ltDlg.innerText))ltEnable();
});
$('ltSend').addEventListener('click',()=>{ltDlg.close();ltEnable()});
$('ltCancel').addEventListener('click',()=>ltDlg.close());
$('ltCheck').addEventListener('click',()=>ltRun(true));
$('ltServer').addEventListener('change',e=>{
  const v=e.target.value.trim();
  if(v&&!/^https?:\/\/\S+$/i.test(v)){ltStatus(m('ltBadServer'));return}
  // A new server needs its own consent, so the check turns off until the visitor confirms again.
  LT.server=v===LT_PUBLIC?'':v;ltDisable();
});
if(ltSel)ltSel.addEventListener('change',()=>{LT.lang=ltSel.value;ltSave();ltRun(true)});

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
  $('linkCounts').textContent=(i||x)?m('linkCounts',i,x):''}
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
  $('linkLabel').textContent=mode==='internal'?m('linkInternal'):m('linkExternal');
  const dom=cleanDomain(S.domain);
  $('linkUrl').placeholder=mode==='internal'?m('linkPhInt',dom):m('linkPhExt');
  $('linkUrl').value=editing?editing.getAttribute('href'):'';
  $('linkBlank').checked=editing?editing.getAttribute('target')==='_blank':mode==='external';
  $('linkApply').textContent=editing?m('linkUpdate'):m('linkApply');
  checkUrl();$('linkUrl').focus();
}
function checkUrl(){
  const v=$('linkUrl').value.trim();let note='';
  if(v){const k=kindOf(/^[a-z][a-z0-9+.-]*:|^\/|^#/i.test(v)?v:'https://'+v);
    if(linkMode==='internal'&&k==='external')note=m('noteExt');
    else if(linkMode==='external'&&k==='internal')note=m('noteInt');
    else if(linkMode==='external'&&!/^[a-z][a-z0-9+.-]*:/i.test(v))note=m('noteHttps');}
  else if(!saved||saved.collapsed)note=editing?'':m('noteNoSel');
  if(linkMode==='internal'&&!cleanDomain(S.domain))note=(note?note+' ':'')+m('noteDomain');
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
  $('copyMsg').textContent=ok?m('copyOk'):m('copyFail');setTimeout(()=>{$('copyMsg').textContent=''},2500);
});


$('imgFile').addEventListener('change',e=>{
  const f=e.target.files&&e.target.files[0];if(!f)return;$('imgUrl').value='';
  const r=new FileReader();
  r.onload=()=>{const i=new Image();i.onload=()=>{S.img={src:r.result,w:i.naturalWidth,h:i.naturalHeight,bytes:f.size,type:(f.type||'').replace('image/',''),name:f.name};save();render()};i.onerror=()=>{S.img={src:null,bytes:f.size,type:f.type,name:f.name};render()};i.src=r.result};
  r.readAsDataURL(f);
});

function findVideoLD(doc){
  let found=null;
  const walk=o=>{if(found||!o||typeof o!=='object')return;if(Array.isArray(o)){o.forEach(walk);return}
    if([].concat(o['@type']).includes('VideoObject')){found=o;return}Object.values(o).forEach(walk)};
  doc.querySelectorAll('script[type="application/ld+json"]').forEach(s=>{try{walk(JSON.parse(s.textContent))}catch(e){}});
  return found;
}
$('importBtn').addEventListener('click',()=>{
  const html=$('src').value;const msg=$('importMsg');
  if(!/<(html|head|meta|title|body)/i.test(html)){msg.textContent=m('notHtml');return}
  const doc=new DOMParser().parseFromString(html,'text/html');
  const meta=sel=>{const e=doc.querySelector(sel);return e?(e.getAttribute('content')||'').trim():''};
  const canonical=(doc.querySelector('link[rel="canonical"]')||{getAttribute:()=>''}).getAttribute('href')||'';
  const pageUrl=canonical||meta('meta[property="og:url"]');
  let host='',path='';try{if(pageUrl){const u=new URL(pageUrl,'https://x.invalid');if(u.hostname!=='x.invalid')host=u.hostname.replace(/^www\./,'');path=u.pathname.replace(/^\/+/,'')}}catch(e){}
  Object.assign(S,{tags:'',alt:'',img:null,vurl:'',vtitle:'',vdesc:'',vthumb:'',vdate:'',vdur:'',vtrans:'',vcap:false});
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
  if(og){let abs=og;try{abs=new URL(og,pageUrl||undefined).href}catch(e){}
    S.img=Object.assign(remoteImg(abs),{w:parseInt(meta('meta[property="og:image:width"]'))||0,h:parseInt(meta('meta[property="og:image:height"]'))||0});
    const fn=og.split('/').pop().split('?')[0];const match=[...doc.querySelectorAll('img')].find(i=>(i.getAttribute('src')||'').includes(fn));
    if(match&&match.getAttribute('alt'))S.alt=match.getAttribute('alt');}
  S.tech={h1:doc.querySelectorAll('h1').length,canonical:!!canonical,ogTitle:!!meta('meta[property="og:title"]'),ogDesc:!!meta('meta[property="og:description"]'),ogImage:!!meta('meta[property="og:image"]'),
    twitter:!!meta('meta[name="twitter:card"]'),lang:doc.documentElement.getAttribute('lang')||'',hreflang:doc.querySelectorAll('link[rel="alternate"][hreflang]').length,
    robots:meta('meta[name="robots"]'),viewport:!!doc.querySelector('meta[name="viewport"]'),noAlt:[...root.querySelectorAll('img')].filter(i=>!i.hasAttribute('alt')).length};
  const ld=findVideoLD(doc),str=v=>typeof v==='string'?v.trim():'';
  const ifr=[...doc.querySelectorAll('iframe')].map(i=>i.getAttribute('src')||i.getAttribute('data-src')||'').find(u=>/youtube(-nocookie)?\.com|youtu\.be|vimeo\.com/i.test(u))||'';
  const ogv=meta('meta[property="og:video"]')||meta('meta[property="og:video:secure_url"]')||meta('meta[property="og:video:url"]');
  S.type=ld||ifr?'video':'article';
  if(ld||ifr)S.vurl=ifr||str(ld.embedUrl)||str(ld.contentUrl)||ogv;
  if(ld){
    const th=[].concat(ld.thumbnailUrl||ld.thumbnail||[])[0];
    const du=parseDur(str(ld.duration));
    Object.assign(S,{vtitle:str(ld.name),vdesc:str(ld.description),vthumb:th&&typeof th==='object'?str(th.url||th.contentUrl):str(th),
      vdate:str(ld.uploadDate).slice(0,10),vdur:du>0?clock(du):'',vtrans:str(ld.transcript)});
  }
  S.tech.video={ld:!!ld,missing:ld?['name','thumbnailUrl','uploadDate'].filter(k=>!ld[k]):[],embed:!!ifr,og:!!ogv};
  syncFields();
  msg.textContent=(S.type==='video'?m('videoDetected'):'')+m('imported');
  save();render();
});

const EXAMPLES=Object.assign({},{article:{kp:'rainwater harvesting',title:'Rainwater harvesting: a practical guide for small farms',domain:'example.org',slug:'guides/rainwater-harvesting-small-farms',
  desc:'Rainwater harvesting helps small farms get through dry spells. Learn how to size a tank, choose a catchment surface and keep stored water clean.',
  alt:'Rainwater harvesting tank beside a farmhouse roof',img_url:'docs/example-rainwater.jpg',tags:'rainwater harvesting, water storage, farming, drought',
  body:'<p>Rainwater harvesting is one of the cheapest ways for a small farm to cope with irregular rainfall. A roof, a gutter and a tank can store enough water to keep livestock and a vegetable plot going through several dry weeks.</p>\n'+
  '<h2>How much water can you collect?</h2>\n<p>Every square metre of roof collects about one litre of water for each millimetre of rain. A 100 square metre roof in an area with 600 mm of rain a year can therefore collect around 60,000 litres, minus losses from evaporation and overflow. The <a href="https://www.fao.org/land-water/en/">FAO land and water pages</a> give regional rainfall data you can use for this estimate.</p>\n'+
  '<h2>Choosing a tank</h2>\n<p>Size the tank to cover the longest dry spell you expect, not the whole year. Plastic tanks are light and easy to install. Ferro-cement tanks cost less per litre and last longer, but they take more work to build. See our <a href="/guides/water-storage-tanks">guide to water storage tanks</a> for a comparison.</p>\n'+
  '<h2>Keeping the water clean</h2>\n<ul>\n  <li>Fit a first-flush diverter so the dirtiest water from the roof is not stored.</li>\n  <li>Cover every opening with mesh to keep out insects and leaves.</li>\n  <li>Clean gutters before the rainy season starts.</li>\n</ul>\n'+
  '<p>Rainwater harvesting works best as part of a wider plan that includes mulching, drip irrigation and drought-tolerant crops. Start small, measure how much you collect in the first season, and expand from there.</p>'}
,video:{type:'video',kp:'big buck bunny',title:'Big Buck Bunny: watch the Blender Foundation open movie',domain:'example.org',slug:'films/big-buck-bunny',
  desc:'Watch Big Buck Bunny, the free animated short from the Blender Foundation. A giant rabbit takes comic revenge on three rodents in ten minutes.',
  tags:'big buck bunny, animation, open movie, blender',vurl:'https://vimeo.com/1084537',vtitle:'Big Buck Bunny',
  vdesc:'Big Buck Bunny tells the story of a giant rabbit with a heart bigger than himself. When three rodents rudely harass him one sunny day, he prepares them a comical revenge.\n\n0:00 Opening titles\n0:45 A sunny morning\n2:40 The rodents strike\n5:30 Bunny plans his revenge\n8:10 Credits',
  vthumb:'https://i.vimeocdn.com/video/20963649-f02817456fc48e7c317ef4c07ba259cd4b40a3649bd8eb50a4418b59ec3f5af5-d_1280x720',vdate:'2008-05-29',vdur:'9:57',vcap:false,
  vtrans:'The film has no dialogue. This transcript describes what happens on screen. A bird wakes up in a tree on a sunny morning in the forest. Big Buck Bunny, a large and gentle rabbit, crawls out of his burrow and stretches in the sun. He admires a butterfly and smiles at the flowers. Three rodents, Frank, Rinky and Gimera, watch him from a tree and start throwing fruit at him. When they kill a butterfly he was enjoying, Bunny decides to fight back. He carves a bow and sharpens sticks, sets a series of traps in the forest, and waits. One by one the rodents fall into his traps. In the end Bunny flies Frank on a kite string, and the butterfly returns.',
  body:'<p>Big Buck Bunny is a short animated film made by the Blender Foundation with free and open source software. It was released in 2008 under a Creative Commons licence, so anyone can watch, share and reuse it.</p>\n'+
  '<p>Watch the full film above, or read the transcript for a description of each scene. The <a href="https://peach.blender.org/">official Big Buck Bunny site</a> has the production files. See our <a href="/films">list of open movies</a> for more.</p>'}
},LANG.examples);
$('exampleBtn').addEventListener('click',()=>{S=Object.assign({},EMPTY,S.type==='video'?EXAMPLES.video:EXAMPLES.article);if(S.img_url)S.img=remoteImg(new URL(S.img_url,location.href).href);delete S.img_url;setEditor(S.body);syncFields();$('imgFile').value='';
  $('importMsg').textContent=m('exampleLoaded');save();render()});

$('clearBtn').addEventListener('click',()=>{S=Object.assign({},EMPTY,{domain:S.domain||'',type:S.type});setEditor('');syncFields();$('imgFile').value='';$('src').value='';$('importMsg').textContent='';save();render()});

render();
if(ltReady())ltRun(true);
})();
