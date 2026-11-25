const $=s=>document.querySelector(s),main=$("#main");
const esc=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const LN={java:"Java",python:"Python",py:"Python",c:"C",cpp:"C++","c++":"C++",javascript:"JavaScript",js:"JavaScript",typescript:"TypeScript",ts:"TypeScript",sql:"SQL",html:"HTML",css:"CSS",bash:"Bash",sh:"Shell",json:"JSON",csharp:"C#",cs:"C#",go:"Go",rust:"Rust",kotlin:"Kotlin",php:"PHP",xml:"XML",text:"Output",plaintext:"Output",output:"Output"};
if(window.marked)marked.use({renderer:{code(code,info){const lang=((info||"").match(/\S*/)||[""])[0].toLowerCase();let body;
 try{body=lang&&window.hljs&&hljs.getLanguage(lang)?hljs.highlight(code,{language:lang,ignoreIllegals:true}).value:esc(code)}catch{body=esc(code)}
 const label=LN[lang]||(lang?lang[0].toUpperCase()+lang.slice(1):"Code");
 return `<div class="cb"><div class="ch"><span>${esc(label)}</span><div><button class="g" data-a="cs" type="button">Select</button><button class="g" data-a="cc" type="button">Copy code</button></div></div><pre><code>${body}</code></pre></div>`}}});
const md=t=>window.marked?marked.parse(t):"<pre>"+esc(t)+"</pre>";
function copyText(t){return(navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(t):Promise.reject()).catch(()=>{const a=document.createElement("textarea");a.value=t;a.style.cssText="position:fixed;opacity:0;top:0";document.body.appendChild(a);a.select();let ok=false;try{ok=document.execCommand("copy")}catch{}a.remove();if(!ok)throw new Error("copy")})}
document.addEventListener("click",async e=>{const b=e.target.closest('[data-a="cc"],[data-a="cs"]');if(!b)return;const pre=b.closest(".cb").querySelector("pre");
 if(b.dataset.a==="cs"){const r=document.createRange();r.selectNodeContents(pre);const s=getSelection();s.removeAllRanges();s.addRange(r);return}
 const o=b.textContent;try{await copyText(pre.textContent);b.textContent="Copied!"}catch{b.textContent="Copy failed"}setTimeout(()=>{b.textContent=o},1800)});
const mem={};const ls={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch{return mem[k]!==undefined?mem[k]:d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{mem[k]=v}}};
const uid=()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36);
let tt;const toast=m=>{const t=$("#toast");t.textContent=m;t.classList.add("on");clearTimeout(tt);tt=setTimeout(()=>t.classList.remove("on"),3200)};
const setTheme=t=>{document.documentElement.dataset.theme=t;ls.set("sb_theme",t)};setTheme(ls.get("sb_theme","dark"));
$("#theme").onclick=()=>setTheme(document.documentElement.dataset.theme==="dark"?"light":"dark");
// ---- AI: calls OUR Express backend (/api/...). The Gemini key never reaches the browser. ----
async function post(path,body){let r;
 try{r=await fetch(path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})}
 catch{throw new Error("Can’t reach the server. Make sure it is running (npm start) and you are online.")}
 if(!r.ok){let m="Request failed ("+r.status+").";try{const j=await r.json();if(j.error)m=j.error}catch{}throw new Error(m)}
 return r}
const b64=bl=>new Promise((res,rej)=>{const f=new FileReader();f.onload=()=>res(String(f.result).split(",")[1]);f.onerror=()=>rej(new Error("Couldn’t read an image."));f.readAsDataURL(bl)});
// streams the answer from /api/chat (newline-delimited JSON) and reports growing text through o.onText
const ask=async(input,o={})=>{
 const messages=typeof input==="string"?[{role:"user",content:input}]:input,images=[];
 for(const bl of (o.images||[]))images.push({mime:"image/jpeg",data:await b64(bl)});
 const r=await post("/api/chat",{messages,images,task:o.task||"chat"});
 const rd=r.body.getReader(),dec=new TextDecoder();let buf="",full="";
 for(;;){const {done,value}=await rd.read();if(done)break;buf+=dec.decode(value,{stream:true});let i;
  while((i=buf.indexOf("\n"))>=0){const line=buf.slice(0,i).trim();buf=buf.slice(i+1);if(!line)continue;
   const j=JSON.parse(line);if(j.error)throw new Error(j.error);if(j.t){full+=j.t;if(o.onText)o.onText(full)}}}
 return full};
const askJson=async p=>(await (await post("/api/json",{prompt:p})).json()).data;
const errMsg=e=>(e&&(e.message||e.code))||"Something went wrong. Please try again.";
// ---- data ----
let chats=ls.get("sb_chats",[]),cur=ls.get("sb_cur",null),ren=null,del=null;
const saveChats=()=>ls.set("sb_chats",chats);
const log=(t,l,id)=>{const a=ls.get("sb_log",[]);a.push({t,l,ts:Date.now(),id});ls.set("sb_log",a.slice(-500))};
const imgs={};// message id -> image Blobs (this session only)
// ---- nav / routing ----
const IC={slides:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8"/>',home:'<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',chat:'<path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.4A8 8 0 1 1 21 12z"/>',quiz:'<path d="m9 11 3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/>',notes:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',plan:'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',prog:'<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>',clip:'<path d="m21.4 11-9.2 9.2a6 6 0 0 1-8.5-8.5l8.6-8.6A4 4 0 1 1 18 8.8l-8.6 8.6a2 2 0 0 1-2.8-2.8l8.5-8.5"/>',mic:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4"/>',send:'<path d="M12 19V5M5 12l7-7 7 7"/>',copy:'<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',volume:'<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',refresh:'<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',trash:'<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',down:'<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>'};
const ico=(n,s=18)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;
const ph=(t,s)=>`<div class="ph"><h2>${t}</h2><p>${s}</p></div>`;
const NAV=[["home","","Home"],["chat","","AI Doubt Solver"],["quiz","","Quiz Generator"],["notes","","Notes Generator"],["plan","","Study Timetable"],["prog","","Progress"]];
$("#nav").innerHTML=NAV.map(n=>`<button data-v="${n[0]}">${ico(n[0])}<span>${n[2]}</span></button>`).join("");
$("#nav").onclick=e=>{const b=e.target.closest("button");if(b){location.hash=b.dataset.v;closeSide()}};
const side=$("#side"),openSide=()=>{side.classList.add("open");$("#scrim").classList.add("on")},closeSide=()=>{side.classList.remove("open");$("#scrim").classList.remove("on")};
$("#burger").onclick=openSide;$("#scrim").onclick=closeSide;
addEventListener("hashchange",route);
function route(){const v=location.hash.slice(1)||"home";const f=V[v]||V.home;if(window.speechSynthesis)speechSynthesis.cancel();speaking=false;paused=false;main.ondragenter=main.ondragover=main.ondragleave=main.ondrop=e=>e.preventDefault();document.querySelectorAll("#nav button").forEach(b=>b.classList.toggle("on",b.dataset.v===v));$("#pt").textContent=(NAV.find(n=>n[0]===v)||NAV[0])[2];main.onclick=null;main.classList.remove("pg");void main.offsetWidth;main.classList.add("pg");f();scrollTo(0,0)}
function showChat(){if(location.hash.slice(1)==="chat")route();else location.hash="chat"}
// ---- sidebar chats ----
const chatsEl=$("#chats"),sq=$("#sq");
function renderSide(){
 const q=sq.value.trim().toLowerCase();let l=[...chats].sort((a,b)=>b.updated-a.updated);
 if(q)l=l.filter(c=>c.title.toLowerCase().includes(q)||c.msgs.some(m=>m.content.toLowerCase().includes(q)));
 chatsEl.innerHTML=l.length?l.map(c=>ren===c.id?`<div class="ci"><input class="ri" value="${esc(c.title)}"></div>`:del===c.id?`<div class="ci"><span class="t">Delete this chat?</span><button class="g" data-a="dy" data-id="${c.id}">Yes</button><button class="g" data-a="dn">No</button></div>`:
  `<div class="ci ${c.id===cur?"on":""}" data-a="open" data-id="${c.id}"><span class="t">${esc(c.title)}</span><span class="ia"><button data-a="rn" data-id="${c.id}" title="Rename">${ico("edit",14)}</button><button data-a="dl" data-id="${c.id}" title="Delete">${ico("trash",14)}</button></span></div>`).join(""):`<p class="mut sm" style="padding:8px">${q?"No matching chats.":"No chats yet. Start one!"}</p>`;
 const ri=chatsEl.querySelector(".ri");if(ri){let done=false;const fin=ok=>{if(done)return;done=true;const c=chats.find(x=>x.id===ren);if(ok&&c&&ri.value.trim()){c.title=ri.value.trim().slice(0,60);c.locked=true;saveChats()}ren=null;renderSide()};ri.focus();ri.select();ri.onkeydown=e=>{if(e.key==="Enter")fin(true);if(e.key==="Escape")fin(false)};ri.onblur=()=>fin(true)}
}
chatsEl.onclick=e=>{const b=e.target.closest("[data-a]");if(!b)return;const id=b.dataset.id,a=b.dataset.a;
 if(a==="open"){cur=id;ls.set("sb_cur",cur);closeSide();showChat();renderSide()}
 else if(a==="rn"){ren=id;renderSide()}else if(a==="dl"){del=id;renderSide()}else if(a==="dn"){del=null;renderSide()}
 else if(a==="dy"){chats=chats.filter(c=>c.id!==id);saveChats();del=null;if(cur===id){cur=null;ls.set("sb_cur",null);showChat()}renderSide();toast("Chat deleted")}};
sq.oninput=()=>{clearTimeout(sq._t);sq._t=setTimeout(renderSide,200)};
$("#newc").onclick=()=>{cur=null;ls.set("sb_cur",null);closeSide();showChat();renderSide()};
// ---- voice ----
const VO=ls.get("sb_voice",{on:true,name:""});let speaking=false,paused=false;
function plain(t){return t.replace(/```[\s\S]*?```/g," (code block skipped). ").replace(/[#*_`>|~]+/g," ").replace(/\s+/g," ").trim()}
function speak(t){if(!window.speechSynthesis)return toast("Read-aloud isn’t supported in this browser.");
 speechSynthesis.cancel();const parts=plain(t).match(/[^.!?\n]{1,180}[.!?]?|\S+/g)||[];const v=speechSynthesis.getVoices().find(x=>x.name===VO.name);
 parts.forEach((p,i)=>{const u=new SpeechSynthesisUtterance(p);if(v)u.voice=v;if(i===parts.length-1)u.onend=u.onerror=()=>{speaking=false;paused=false;vbar()};speechSynthesis.speak(u)});
 speaking=true;paused=false;vbar()}
function vbar(){const b=$("#vb");if(!b)return;b.innerHTML=speaking?`${ico("volume",15)} Reading aloud… <button class="g" id="vp">${paused?"▶ Resume":"⏸ Pause"}</button> <button class="g" id="vs">⏹ Stop</button>`:"";
 const p=$("#vp");if(p)p.onclick=()=>{paused?speechSynthesis.resume():speechSynthesis.pause();paused=!paused;vbar()};const s=$("#vs");if(s)s.onclick=()=>{speechSynthesis.cancel();speaking=false;paused=false;vbar()}}
let base="",listening=false,rec=null;
function setMic(on){listening=on;const b=$("#mic"),s=$("#ms");if(b)b.classList.toggle("rec",on);if(s)s.textContent=on?"🎙 Listening… speak now, then review the text before sending.":""}
function toggleMic(){const t=$("#ta");if(listening&&rec){rec.stop();return}
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!SR)return toast("Voice input isn’t supported in this browser. Try Chrome or Edge, or type your question.");
 base=t.value.trim();rec=new SR();rec.interimResults=true;rec.lang="en-IN";rec.onstart=()=>setMic(true);rec.onend=()=>setMic(false);
 rec.onerror=e=>toast(e.error==="not-allowed"||e.error==="service-not-allowed"?"Microphone access is blocked. Allow it in your browser settings, or type instead.":"Voice input error: "+e.error);
 rec.onresult=e=>{let s="";for(const r of e.results)s+=r[0].transcript;t.value=(base+" "+s).trim();t.dispatchEvent(new Event("input"))};
 try{rec.start()}catch{toast("Voice input couldn’t start.")}}
// ---- chat ----
const SUG=[["Explain a concept","Explain the concept of "],["Explain a topic simply","Explain this topic in simple words, with an analogy and an example: "],["Solve a mathematics problem","Solve this mathematics problem step by step: "],["Debug my Java code","Debug my Java code and explain the error:\n"],["Summarize my notes","Summarize my notes (attach them with the paperclip or paste here): "],["Prepare me for an exam","Help me prepare for my exam on "]];
let pend=[],busy=false,pendBusy=0;
const EXT=["pdf","docx","doc","pptx","ppt","txt","jpg","jpeg","png"];let pendName="";
const fmtSize=b=>b>=1e6?(b/1e6).toFixed(1)+" MB":Math.max(1,Math.round(b/1e3))+" KB";
async function shrink(f){const url=URL.createObjectURL(f);
 const im=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error(f.name+": couldn’t open this image."));i.src=url});
 const sc=Math.min(1,1280/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=Math.round(im.width*sc);c.height=Math.round(im.height*sc);
 const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(url);
 const blob=await new Promise(r=>c.toBlob(r,"image/jpeg",0.82));return{name:f.name,kind:"image",blob,url:URL.createObjectURL(blob)}}
async function readPptx(f){if(!window.JSZip)throw new Error("PowerPoint reader didn’t load.");
 let z;try{z=await JSZip.loadAsync(await f.arrayBuffer())}catch{throw new Error(f.name+": this doesn’t look like a valid .pptx file.")}
 const P=s=>new DOMParser().parseFromString(s,"application/xml");let names=Object.keys(z.files).filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a,b)=>+a.match(/(\d+)\.xml/)[1]-+b.match(/(\d+)\.xml/)[1]);
 try{const pr=z.file("ppt/presentation.xml"),rl=z.file("ppt/_rels/presentation.xml.rels");if(pr&&rl){const map={};[...P(await rl.async("string")).getElementsByTagName("Relationship")].forEach(r=>map[r.getAttribute("Id")]="ppt/"+r.getAttribute("Target").replace(/^\/?(ppt\/)?/,""));
  const ord=[...P(await pr.async("string")).getElementsByTagName("p:sldId")].map(s=>map[s.getAttribute("r:id")]).filter(n=>n&&z.file(n));if(ord.length)names=ord}}catch{}
 if(!names.length)throw new Error(f.name+": no slides found in this file.");
 const pt=p=>[...p.getElementsByTagName("a:t")].map(t=>t.textContent).join("");const out=[];
 for(let i=0;i<names.length;i++){const d=P(await z.file(names[i]).async("string"));let title="";const lines=[];
  [...d.getElementsByTagName("p:sp")].forEach(sp=>{const ph=sp.getElementsByTagName("p:ph")[0],ps=[...sp.getElementsByTagName("a:p")].map(pt).filter(x=>x.trim());
   if(ph&&/title/i.test(ph.getAttribute("type")||""))title=ps.join(" ");else ps.forEach(x=>lines.push("- "+x))});
  [...d.getElementsByTagName("a:tbl")].forEach(t=>{lines.push("Table:");[...t.getElementsByTagName("a:tr")].forEach(tr=>lines.push("| "+[...tr.getElementsByTagName("a:tc")].map(tc=>[...tc.getElementsByTagName("a:p")].map(pt).join(" ")).join(" | ")+" |"))});
  out.push(`--- Slide ${i+1}${title?": "+title:""} ---\n${lines.join("\n")||"(no text on this slide)"}`)}
 const text=out.join("\n\n");if(text.replace(/--- Slide[^\n]*---|\(no text on this slide\)/g,"").trim().length<5)throw new Error(f.name+": no readable text found (slides may be pictures only). Export the slides as images and upload those.");
 return{name:f.name,kind:"doc",text:text.slice(0,40000),slides:names.length}}
async function readFile(f){const ext=(f.name.split(".").pop()||"").toLowerCase();
 if(!EXT.includes(ext))throw new Error(f.name+": unsupported type (use PDF, DOCX, PPTX, TXT, JPG, JPEG or PNG).");
 if(ext==="ppt"||ext==="doc")throw new Error(f.name+": old .${ext} files can’t be read here (no file-conversion service is connected). Open it in PowerPoint/Word, choose Save As .${ext}x, and upload that file.".replace(/\$\{ext\}/g,ext));
 const img=["jpg","jpeg","png"].includes(ext),lim=img?5:ext==="pptx"?20:10;if(f.size>lim*1e6)throw new Error(f.name+": too large (max "+lim+" MB).");
 if(img)return shrink(f);
 if(ext==="pptx")return await readPptx(f);
 let text="";
 if(ext==="txt")text=await f.text();
 else if(ext==="docx"){if(!window.mammoth)throw new Error("DOCX reader didn’t load.");text=(await mammoth.extractRawText({arrayBuffer:await f.arrayBuffer()})).value}
 else{if(!window.pdfjsLib)throw new Error("PDF reader didn’t load.");pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  const d=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise;for(let i=1;i<=d.numPages&&text.length<60000;i++){const c=await(await d.getPage(i)).getTextContent();text+=c.items.map(x=>x.str).join(" ")+"\n"}}
 text=text.trim();if(text.length<5)throw new Error(f.name+": no readable text found (scanned file? upload it as an image instead).");
 return{name:f.name,kind:"doc",text:text.slice(0,40000)}}
function build(c){
 const ms=c.msgs.filter(m=>!m.err&&(m.role==="user"||m.content));
 const docIdx=[];ms.forEach((m,i)=>(m.att||[]).forEach(a=>a.text&&docIdx.push(m.id+a.name)));const keep=new Set(docIdx.slice(-3));
 const out=[];let first=true;
 for(const m of ms){let t=m.content;
  (m.att||[]).forEach(a=>{if(a.kind==="image")t+=`\n\n[Attached image: ${a.name}]`;else if(keep.has(m.id+a.name))t+=`\n\n[Attached document: ${a.name}]\n"""\n${a.text.slice(0,25000)}\n"""`;else t+=`\n\n[Earlier attached document: ${a.name} (text omitted to save space)]`});
  
  const l=out[out.length-1];if(l&&l.role===m.role)l.content+="\n\n"+t;else out.push({role:m.role,content:t})}
 const images=[];ms.forEach(m=>{if(m.role==="user"&&imgs[m.id])images.push(...imgs[m.id])});
 return{input:out,images:images.slice(-4)}}
function chatView(){
 main.innerHTML=`<div id="hd" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:space-between"><div><h2>AI Doubt Solver</h2><p class="mut sm" style="margin:2px 0 0">Ask, attach files or speak. Follow-up questions remember the conversation.</p></div><div class="sm mut" style="display:flex;gap:8px;align-items:center"><label><input type="checkbox" id="von" style="width:auto"> Voice replies</label><select id="vsel" style="width:auto;max-width:170px"></select></div></div>
 <div id="msgs" class="msgs" style="margin-top:14px"></div>
 <div class="dock"><div id="vb" class="vb"></div><div class="att" id="att"></div><div class="cmp" id="cmp"><input type="file" id="fi" multiple hidden accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.jpg,.jpeg,.png"><button class="ib" id="clip" title="Attach files (PDF, DOCX, PPTX, TXT, JPG, PNG)">${ico("clip",20)}</button><textarea id="ta" rows="1" placeholder="Ask anything, attach a file, or tap the mic…"></textarea><button class="ib" id="mic" title="Voice input">${ico("mic",20)}</button><button class="send" id="sendb" title="Send">${ico("send",18)}</button></div><div class="sm mut" id="ms" style="min-height:1.2em;padding:4px 6px"></div></div>`;
 const ta=$("#ta");
 const von=$("#von");von.checked=VO.on;von.onchange=()=>{VO.on=von.checked;ls.set("sb_voice",VO);drawMsgs()};
 const vs=$("#vsel"),fill=()=>{const v=window.speechSynthesis?speechSynthesis.getVoices():[];vs.innerHTML=v.length?v.map(x=>`<option ${x.name===VO.name?"selected":""}>${esc(x.name)}</option>`).join(""):"<option>No voices</option>"};
 fill();if(window.speechSynthesis)speechSynthesis.onvoiceschanged=fill;vs.onchange=()=>{VO.name=vs.value;ls.set("sb_voice",VO)};
 ta.oninput=()=>{ta.style.height="auto";ta.style.height=Math.min(ta.scrollHeight,180)+"px"};
 ta.onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send()}};
 $("#sendb").onclick=send;$("#mic").onclick=toggleMic;$("#clip").onclick=()=>$("#fi").click();
 $("#fi").onchange=e=>{addFiles([...e.target.files]);e.target.value=""};
 const cmp=$("#cmp");main.ondragenter=main.ondragover=e=>{e.preventDefault();cmp.classList.add("hov")};
 main.ondragleave=e=>{if(e.target===main)cmp.classList.remove("hov")};main.ondrop=e=>{e.preventDefault();cmp.classList.remove("hov");addFiles([...e.dataTransfer.files])};
 $("#msgs").onclick=e=>{const b=e.target.closest("[data-a]");if(!b)return;const c=chats.find(x=>x.id===cur),m=c&&c.msgs[+b.dataset.i];
  if(b.dataset.a==="cp"){navigator.clipboard&&navigator.clipboard.writeText(m.content).then(()=>toast("Copied"),()=>toast("Copy failed"))}
  else if(b.dataset.a==="sp")speak(m.content);else if(b.dataset.a==="rg"&&!busy){c.msgs.splice(+b.dataset.i,1);run(c)}
  else if(b.dataset.a==="sg"){ta.value=SUG[+b.dataset.i][1];ta.dispatchEvent(new Event("input"));ta.focus()}};
 drawAtt();drawMsgs();vbar()}
function drawAtt(){const el=$("#att");if(!el)return;el.innerHTML=pend.map((a,i)=>`<span>${a.kind==="image"?`<img src="${a.url}" alt="" style="width:26px;height:26px;object-fit:cover;border-radius:6px">`:ico(/\.pptx$/i.test(a.name)?"slides":"notes",15)} ${esc(a.name)} <small class="mut">${(a.name.split(".").pop()||"").toUpperCase()} · ${fmtSize(a.size||0)}${a.slides?` · ${a.slides} slides`:""}</small> <b data-r="${i}" title="Remove">✕</b></span>`).join("")+(pendBusy?`<span><span class="spin">⏳</span> Reading ${esc(pendName)}…</span>`:"");
 el.onclick=e=>{const r=e.target.dataset.r;if(r!=null){pend.splice(+r,1);drawAtt()}}}
async function addFiles(fs){for(const f of fs){if(pend.length>=5){toast("Maximum 5 attachments per message.");break}pendBusy++;pendName=f.name;drawAtt();try{const r=await readFile(f);r.size=f.size;pend.push(r)}catch(e){toast(errMsg(e))}pendBusy--;drawAtt()}}
function drawMsgs(){const box=$("#msgs");if(!box)return;const c=chats.find(x=>x.id===cur),ms=c?c.msgs:[];
 const near=innerHeight+scrollY>document.body.scrollHeight-160;
 if(!ms.length){box.innerHTML=`<div class="welcome"><div class="wi">${ico("chat",26)}</div><h1>How can I help you study today?</h1><p class="mut">Ask a doubt, solve a problem, or upload your notes.</p><div class="chips">${SUG.map((s,i)=>`<button class="chip" data-a="sg" data-i="${i}">${s[0]}</button>`).join("")}</div><p class="mut sm" style="margin-top:18px">Tip: attach PDFs, Word, PowerPoint, TXT or screenshots with the paperclip, or drag them here.</p></div>`;return}
 box.innerHTML=ms.map((m,i)=>m.role==="user"?`<div class="m user">${esc(m.content)}${(m.att||[]).map(a=>`<br><span class="fl">${ico(a.kind==="image"?"image":"notes",13)} ${esc(a.name)}</span>`).join("")}</div>`:
  `<div class="m assistant"><div class="md">${m.err?`<span class="err">${esc(m.content)}</span>`:m.content?md(m.content):`<span class="mut"><span class="spin">⏳</span> Thinking…</span>`}</div>${m.content&&!(busy&&i===ms.length-1)?`<div class="acts">${m.err?"":`<button class="g" data-a="cp" data-i="${i}">${ico("copy",14)} Copy</button>${VO.on?`<button class="g" data-a="sp" data-i="${i}">${ico("volume",14)} Listen</button>`:""}`}${i===ms.length-1?`<button class="g" data-a="rg" data-i="${i}">${ico("refresh",14)} Regenerate</button>`:""}</div>`:""}</div>`).join("");
 if(near)scrollTo(0,document.body.scrollHeight)}
async function send(){const ta=$("#ta");const text=ta.value.trim();if((!text&&!pend.length)||busy||pendBusy)return;
 let c=chats.find(x=>x.id===cur);if(!c){c={id:uid(),title:"New chat",locked:false,updated:Date.now(),msgs:[]};chats.push(c);cur=c.id;ls.set("sb_cur",cur);log("chat","Started a new chat")}
 const m={id:uid(),role:"user",content:text||"Please explain the attached file(s).",att:pend.map(a=>({name:a.name,kind:a.kind,text:a.text}))};
 const bl=pend.filter(a=>a.blob).map(a=>a.blob);if(bl.length)imgs[m.id]=bl;c.msgs.push(m);c.updated=Date.now();saveChats();
 pend=[];ta.value="";ta.style.height="auto";drawAtt();renderSide();await run(c)}
async function run(c){busy=true;const a={id:uid(),role:"assistant",content:""};let b;
 try{b=build(c);c.msgs.push(a);drawMsgs();a.content=await ask(b.input,{images:b.images,onText:x=>{a.content=x;drawMsgs()}});if(!a.content.trim())throw new Error("The AI returned an empty answer. Please regenerate.")}
 catch(e){if(!c.msgs.includes(a))c.msgs.push(a);a.content=errMsg(e);a.err=true}
 c.updated=Date.now();saveChats();busy=false;if(cur===c.id)drawMsgs();renderSide();
 if(!a.err&&c.title==="New chat"&&!c.locked)autoTitle(c)}
async function autoTitle(c){const q=c.msgs[0].content;let t="";
 try{t=(await (await post("/api/title",{text:q.slice(0,400)})).json()).title||""}catch{}
 if(!t)t=q.split(/\s+/).slice(0,6).join(" ").slice(0,50);if(!c.locked){c.title=t;saveChats();renderSide()}}
// ---- shared form helpers ----
const opts=a=>a.map(x=>`<option>${x}</option>`).join("");
const SUBJ=["Mathematics","Physics","Chemistry","Computer Science","Programming","Digital Electronics","Other"];
const LVL=["Class 9","Class 10","Class 11","Class 12","Diploma","B.Tech 1st Year","B.Tech 2nd Year","B.Tech 3rd Year","B.Tech 4th Year","Other"];
const sel=(id,label,a)=>`<div><label class="f">${label}</label><select id="${id}">${opts(a)}</select><input id="${id}o" placeholder="Please specify" style="display:none;margin-top:6px"></div>`;
const val=id=>{const s=$("#"+id).value;return s==="Other"?($("#"+id+"o").value.trim()||"general"):s};
const wire=ids=>ids.forEach(id=>$("#"+id).onchange=()=>$("#"+id+"o").style.display=$("#"+id).value==="Other"?"block":"none");
const wait=m=>`<p class="mut"><span class="spin">⏳</span> ${m}</p>`;
function saveFile(name,text){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type:"text/markdown"}));a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1500)}
// ---- quiz ----
const validQ=q=>Array.isArray(q)&&q.length&&q.every(x=>x&&typeof x.q==="string"&&Array.isArray(x.options)&&x.options.length===4&&Number.isInteger(x.answer)&&x.answer>=0&&x.answer<4);
function quizUI(el,qs,meta){let ans=[],done=false;
 const draw=()=>{const sc=qs.filter((q,i)=>ans[i]===q.answer).length;
  el.innerHTML=qs.map((q,i)=>`<div class="card"><b>${i+1}. ${esc(q.q)}</b>`+q.options.map((o,j)=>`<label class="opt ${done?(j===q.answer?"ok":ans[i]===j?"bad":""):""}"><input type="radio" name="q${i}" value="${j}" ${ans[i]===j?"checked":""} ${done?"disabled":""}><span class="lt">${"ABCD"[j]}</span><span>${esc(o)}</span></label>`).join("")+(done?`<p class="mut">${ans[i]===q.answer?"✅ Correct. ":ans[i]==null?"⚠️ Not answered. ":"❌ Incorrect. "}${esc(q.explain||"")}</p>`:"")+`</div>`).join("")+
  (done?`<div class="card"><h2>Score: ${sc}/${qs.length} (${Math.round(sc/qs.length*100)}%)</h2><button class="p" id="rt">Retry quiz</button></div>`:`<button class="p" id="sb">Submit quiz</button>`);
  const sb=$("#sb");if(sb)sb.onclick=()=>{done=true;const s=qs.filter((q,i)=>ans[i]===q.answer).length;const h=ls.get("sb_quiz",[]);h.push({t:meta.t,sub:meta.sub,lvl:meta.lvl,s,n:qs.length,d:Date.now()});ls.set("sb_quiz",h);log("quiz",`Quiz: ${meta.t} (${s}/${qs.length})`);draw()};
  const rt=$("#rt");if(rt)rt.onclick=()=>{ans=[];done=false;draw();el.scrollIntoView()}};
 el.onchange=e=>{if(!done&&e.target.name&&e.target.name[0]==="q")ans[+e.target.name.slice(1)]=+e.target.value};draw()}
function quizView(){
 main.innerHTML=`${ph("Quiz Generator","Choose your subject, level and topic. The AI builds a quiz and scores it for you.")}<div class="card"><div class="row">${sel("s","Subject",SUBJ)}${sel("l","Class / education level",LVL)}<div><label class="f">Topic or chapter</label><input id="t" placeholder="e.g. Newton’s laws of motion"></div>${sel("d","Difficulty",["Easy","Medium","Hard","Mixed"])}${sel("n","Number of questions",["5","10","15","20"])}</div><p><button class="p" id="go">Generate quiz</button></p></div><div id="out"></div>`;
 wire(["s","l"]);
 $("#go").onclick=async()=>{const t=$("#t").value.trim();if(!t)return toast("Please enter a topic or chapter.");const sub=val("s"),lvl=val("l"),d=$("#d").value,n=$("#n").value,o=$("#out"),b=$("#go");b.disabled=true;o.innerHTML=wait("Generating your quiz…");
  try{const qs=await askJson(`Create exactly ${n} multiple-choice questions. Subject: ${sub}. Level: ${lvl}. Topic: ${t}. Difficulty: ${d==="Mixed"?"mixed (a balance of easy, medium and hard)":d}. Match the syllabus level. Return ONLY a JSON array. Each item: {"q":string,"options":[exactly 4 strings without letter prefixes],"answer":index 0-3 of the single correct option,"explain":one or two sentence explanation}. Make correct answers vary in position.`);
   if(!validQ(qs))throw new Error("The AI returned an unexpected format. Please try again.");quizUI(o,qs,{t,sub,lvl})}catch(e){o.innerHTML=`<p class="err">${esc(errMsg(e))}</p>`}b.disabled=false}}
// ---- notes ----
function notesView(){
 main.innerHTML=`${ph("Notes Generator","Structured revision notes with definitions, formulas, examples and exam points.")}<div class="card"><div class="row">${sel("s","Subject",SUBJ)}${sel("l","Class / education level",LVL)}<div><label class="f">Topic</label><input id="t" placeholder="e.g. Hill cipher"></div>${sel("m","Notes length",["Short","Medium","Detailed"])}${sel("x","Explanation level",["Simple","Standard","Advanced"])}</div><p><button class="p" id="go">Generate notes</button></p></div><div id="out"></div>`;wire(["s","l"]);
 $("#go").onclick=async()=>{const t=$("#t").value.trim();if(!t)return toast("Please enter a topic.");const o=$("#out"),b=$("#go");b.disabled=true;o.innerHTML=wait("Writing notes…");
  try{const p=`Write ${$("#m").value.toLowerCase()} revision notes in Markdown. Subject: ${val("s")}. Level: ${val("l")}. Topic: ${t}. Explanation level: ${$("#x").value.toLowerCase()}. Sections: Introduction, Important definitions, Key concepts, Important formulas (if applicable), Examples, Important exam points, Quick revision summary. Write maths in plain text or Unicode, not LaTeX.`;
   const txt=await ask(p,{task:"notes",onText:x=>o.innerHTML=`<div class="card md">${md(x)}</div>`});
   o.innerHTML=`<div class="card md">${md(txt)}</div><button class="g" id="cp">${ico("copy",14)} Copy</button> <button class="g" id="dl">${ico("down",14)} Download (.md)</button>`;
   $("#cp").onclick=()=>navigator.clipboard&&navigator.clipboard.writeText(txt).then(()=>toast("Copied"),()=>toast("Copy failed"));$("#dl").onclick=()=>saveFile(t.replace(/\W+/g,"-")+"-notes.md",txt);
   log("notes","Notes: "+t);const n=ls.get("sb_notes",0);ls.set("sb_notes",n+1)}catch(e){o.innerHTML=`<p class="err">${esc(errMsg(e))}</p>`}b.disabled=false}}
// ---- timetable ----
const dstr=d=>d.toISOString().slice(0,10),today=()=>dstr(new Date());
function planView(){let plan=ls.get("sb_plan",null),edit=null;
 const tomorrow=new Date(Date.now()+7*864e5);
 main.innerHTML=`${ph("Study Timetable","Tell us your subjects and exam date. Tick tasks off as you finish them.")}<div class="card"><div class="row"><div><label class="f">Subjects (comma separated)</label><input id="s" placeholder="Maths, Physics, Electronics"></div><div><label class="f">Study hours per day</label><input id="h" type="number" min="1" max="14" value="4"></div><div><label class="f">Exam date</label><input id="e" type="date" min="${today()}" value="${dstr(tomorrow)}"></div><div><label class="f">Daily available time</label><input id="w" placeholder="e.g. 5 PM to 10 PM"></div>${sel("p","Preferred sessions",["Morning","Afternoon","Evening","Night","Any time"])}</div><p><button class="p" id="go">Create timetable</button></p></div><div id="out"></div>`;
 const out=$("#out");
 const show=()=>{if(!plan||!plan.length){out.innerHTML="";return}const all=plan.flatMap(d=>d.tasks),dn=all.filter(t=>t.done).length;
  out.innerHTML=`<div class="card"><b>${dn}/${all.length} tasks completed</b><div class="pb" style="margin-top:8px"><i style="width:${all.length?dn/all.length*100:0}%"></i></div></div>`+plan.map((d,di)=>`<div class="card" ${d.date===today()?'style="border-color:var(--a1)"':""}><div class="dh"><div class="dbx"><b>${new Date(d.date+"T12:00").getDate()}</b><span>${new Date(d.date+"T12:00").toLocaleDateString(undefined,{weekday:"short"})}</span></div><div><b>${new Date(d.date+"T12:00").toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"})}</b>${d.date===today()?' <span class="tag">Today</span>':""}<div class="mut sm">${d.tasks.filter(t=>t.done).length}/${d.tasks.length} done</div></div></div>${d.tasks.map((t,ti)=>edit===di+"-"+ti?`<div class="tk"><input data-f="time" value="${esc(t.time)}" style="width:110px"><input data-f="subject" value="${esc(t.subject)}" style="width:130px"><input data-f="task" value="${esc(t.task)}"><button class="g" data-a="sv" data-d="${di}" data-t="${ti}">Save</button></div>`:`<div class="tk ${t.done?"done":""}"><input type="checkbox" data-a="ck" data-d="${di}" data-t="${ti}" ${t.done?"checked":""}><span class="tm">${esc(t.time)}</span><span class="tx"><b>${esc(t.subject)}</b> · ${esc(t.task)}</span><button class="g" data-a="ed" data-d="${di}" data-t="${ti}" title="Edit">${ico("edit",14)}</button><button class="g" data-a="rm" data-d="${di}" data-t="${ti}" title="Remove">${ico("trash",14)}</button></div>`).join("")}</div>`).join("")+`<button class="g" data-a="clr">Clear timetable</button>`};
 out.onclick=e=>{const b=e.target.closest("[data-a]");if(!b)return;const a=b.dataset.a,d=+b.dataset.d,t=+b.dataset.t;
  if(a==="ck"){const k=plan[d].tasks[t];k.done=b.checked;if(k.done)log("task",`Completed: ${k.subject} – ${k.task}`,k.id);else{const L=ls.get("sb_log",[]);const i=L.map(x=>x.id).lastIndexOf(k.id);if(i>=0){L.splice(i,1);ls.set("sb_log",L)}}}
  else if(a==="ed")edit=d+"-"+t;else if(a==="rm")plan[d].tasks.splice(t,1);
  else if(a==="sv"){const r=b.parentElement;r.querySelectorAll("input[data-f]").forEach(i=>plan[d].tasks[t][i.dataset.f]=i.value.trim()||"—");edit=null}
  else if(a==="clr"){if(b.dataset.s){plan=null;ls.set("sb_plan",null);show();return}b.dataset.s=1;b.textContent="Click again to confirm";return}
  ls.set("sb_plan",plan);show()};
 show();
 $("#go").onclick=async()=>{const s=$("#s").value.trim(),e=$("#e").value;if(!s||!e)return toast("Enter your subjects and exam date.");
  const days=Math.round((new Date(e+"T12:00")-new Date(today()+"T12:00"))/864e5)+1;if(days<1)return toast("Pick an exam date that isn’t in the past.");const n=Math.min(days,30),b=$("#go");b.disabled=true;out.innerHTML=wait("Planning your timetable…");
  try{const p=await askJson(`Create a realistic study timetable for ${n} consecutive days starting ${today()} (exam on ${e}; the last day should focus on revision). Subjects: ${s}. Study hours per day: ${$("#h").value}. Daily available time: ${$("#w").value||"flexible"}. Preferred sessions: ${val("p")}. Include short breaks, rotate subjects and keep each day within the stated hours. Return ONLY JSON: [{"date":"YYYY-MM-DD","tasks":[{"time":"5:00-6:00 PM","subject":string,"task":short description}]}]`);
   if(!Array.isArray(p)||!p.length||!p.every(d=>d&&typeof d.date==="string"&&Array.isArray(d.tasks)))throw new Error("Unexpected format. Please try again.");
   plan=p.map(d=>({date:d.date,tasks:d.tasks.map(t=>({id:uid(),time:String(t.time||""),subject:String(t.subject||""),task:String(t.task||""),done:false}))}));ls.set("sb_plan",plan);log("plan","Created a study timetable");show()}
  catch(x){out.innerHTML=`<p class="err">${esc(errMsg(x))}</p>`}b.disabled=false}}
// ---- progress ----
function progView(){
 const q=ls.get("sb_quiz",[]),L=ls.get("sb_log",[]),plan=ls.get("sb_plan",null)||[],tasks=plan.flatMap(d=>d.tasks),dn=tasks.filter(t=>t.done).length;
 const avg=q.length?Math.round(q.reduce((a,x)=>a+x.s/x.n,0)/q.length*100):0,sessions=L.filter(x=>["chat","quiz","notes"].includes(x.t)).length;
 const days=[...Array(7)].map((_,i)=>{const d=new Date(Date.now()-(6-i)*864e5);return{k:dstr(d),l:d.toLocaleDateString(undefined,{weekday:"short"}),n:0}});L.forEach(x=>{const d=days.find(y=>y.k===dstr(new Date(x.ts)));if(d)d.n++});
 const mx=Math.max(1,...days.map(d=>d.n)),by={};q.forEach(x=>{(by[x.sub]=by[x.sub]||[]).push(x.s/x.n)});
 const st=Object.entries(by).map(([k,v])=>[k,Math.round(v.reduce((a,b)=>a+b,0)/v.length*100),v.length]).sort((a,b)=>b[1]-a[1]);
 const stat=(l,v)=>`<div class="card stat2"><span class="sl">${l}</span><div class="sv">${v}</div></div>`;
 main.innerHTML=`${ph("Progress","Everything here is calculated from your own activity.")}<div class="grid">${stat("Quizzes attempted",q.length)}${stat("Average quiz score",avg+"%")}${stat("Study sessions",sessions)}${stat("Timetable tasks done",dn+"/"+tasks.length)}</div>
 <div class="card"><b>This week’s activity</b><div class="bars">${days.map(d=>`<div><span>${d.n||""}</span><i style="height:${Math.max(3,d.n/mx*100)}%"></i>${d.l}</div>`).join("")}</div></div>
 <div class="card"><b>Learning statistics</b>${st.length?st.map(s=>`<p style="margin:10px 0 2px">${esc(s[0])} · ${s[1]}% avg <span class="mut sm">(${s[2]} quiz${s[2]>1?"zes":""})</span></p><div class="pb"><i style="width:${s[1]}%"></i></div>`).join(""):`<p class="mut">Take a quiz to see subject-wise performance.</p>`}<p class="mut sm" style="margin-top:12px">Study sessions = chats started + quizzes + notes generated. Everything here is calculated from your own activity in this browser.</p></div>
 <div class="card"><b>Recent activity</b>${L.length?L.slice(-8).reverse().map(x=>`<p style="margin:6px 0" class="sm">${ico({chat:"chat",quiz:"quiz",notes:"notes",task:"quiz",plan:"plan"}[x.t]||"home",14)} ${esc(x.l)} <span class="mut">· ${new Date(x.ts).toLocaleString(undefined,{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</span></p>`).join(""):`<p class="mut">No activity yet.</p>`}</div>
 <button class="g" id="rs">Reset progress</button>`;
 $("#rs").onclick=e=>{const b=e.target;if(!b.dataset.s){b.dataset.s=1;b.textContent="Click again to confirm";return}["sb_quiz","sb_log","sb_notes"].forEach(k=>ls.set(k,k==="sb_notes"?0:[]));progView()}}
function homeView(){
 const q=ls.get("sb_quiz",[]),L=ls.get("sb_log",[]),plan=ls.get("sb_plan",null)||[],tasks=plan.flatMap(d=>d.tasks),dn=tasks.filter(t=>t.done).length;
 const avg=q.length?Math.round(q.reduce((a,x)=>a+x.s/x.n,0)/q.length*100):0,sessions=L.filter(x=>["chat","quiz","notes"].includes(x.t)).length,pr=tasks.length?Math.round(dn/tasks.length*100):0;
 const hr=new Date().getHours(),g=hr<5?"Good night":hr<12?"Good morning":hr<17?"Good afternoon":"Good evening";
 const FC=[["chat","AI Doubt Solver","Ask questions, attach files and get step-by-step help.","#6d5ef0"],["quiz","Quiz Generator","Practise with AI-made MCQs and instant scoring.","#0ea5e9"],["notes","Notes Generator","Exam-ready revision notes on any topic.","#10b981"],["plan","Study Timetable","A day-by-day plan you can tick off.","#f59e0b"],["prog","Progress Tracking","Your scores and weekly activity at a glance.","#ec4899"]];
 const st=(i,l,v)=>`<div class="card stat"><span class="si">${ico(i,18)}</span><div><div class="sv">${v}</div><div class="sl">${l}</div></div></div>`;
 main.innerHTML=`<section class="banner"><div><h1>${g}</h1><p>Learn smarter, revise faster, perform better. Pick up where you left off.</p></div><div class="bt"><button class="wb" data-go="newchat">Ask a doubt</button><button class="wb o" data-go="quiz">Take a quiz</button>${chats.length?'<button class="wb o" data-go="lastchat">Continue last chat</button>':""}</div></section>
 <div class="grid">${st("quiz","Quizzes completed",q.length)}${st("prog","Average score",avg+"%")}${st("home","Study sessions",sessions)}${st("plan","Timetable progress",pr+"%")}</div>
 <h3 class="sec">Study tools</h3><div class="fcs">${FC.map(f=>`<button class="card fc" data-go="${f[0]}" style="--c:${f[3]}"><span class="fi">${ico(f[0],22)}</span><b>${f[1]}</b><span class="mut sm">${f[2]}</span></button>`).join("")}</div>`;
 const ac=L.slice(-6).reverse();main.insertAdjacentHTML("beforeend",`<h3 class="sec">Recent activity</h3><div class="card">${ac.length?ac.map(x=>`<p style="margin:7px 0" class="sm">${ico({chat:"chat",quiz:"quiz",notes:"notes",task:"quiz",plan:"plan"}[x.t]||"home",14)} ${esc(x.l)} <span class="mut">· ${new Date(x.ts).toLocaleString(undefined,{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</span></p>`).join(""):'<p class="mut sm" style="margin:0">Nothing yet. Ask a doubt or take a quiz to get started.</p>'}</div>`);
 main.onclick=e=>{const b=e.target.closest("[data-go]");if(!b)return;const g=b.dataset.go;if(g==="newchat")$("#newc").click();else if(g==="lastchat"){const l=[...chats].sort((a,b)=>b.updated-a.updated)[0];if(l){cur=l.id;ls.set("sb_cur",cur);renderSide();location.hash="chat"}}else location.hash=g}}
$("#av").onclick=e=>{e.stopPropagation();$("#pm").classList.toggle("show")};document.addEventListener("click",()=>$("#pm").classList.remove("show"));
const V={home:homeView,chat:chatView,quiz:quizView,notes:notesView,plan:planView,prog:progView};
renderSide();route();
