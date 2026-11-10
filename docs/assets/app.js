/* Research Atlas • progressively enhanced, accessible, dependency-free explorer */
const $ = (s, scope=document) => scope.querySelector(s);
const $$ = (s, scope=document) => [...scope.querySelectorAll(s)];
const TIER = {lab:'实验室科研',mentor:'导师制研究',structured:'科研训练',exposure:'科研体验',community:'竞赛 / 开放协作',admissions:'特殊招生',course:'课程型夏校',commercial:'商业指导',unknown:'待分类'};
const COST = {free:'明确免费',aid:'可申请资助',paid:'收费',unknown:'待核实'};
const ACCESS = {yes:'可申请',conditional:'有条件',no:'不开放',unknown:'待核实'};
const state = {data:[],q:'',region:'all',province:'all',tier:'all',cost:'all',access:'all',deadlineOnly:false,favoritesOnly:false,sort:'default',quick:'all',page:1,compact:false,bookmarks:new Set(),selected:null};
const PAGE_SIZE=16;
const today = new Date();
const ymd = [today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
const escapeHTML = s => String(s??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeURL = s => {try{const u=new URL(String(s));return u.protocol==='https:'?u.href:null;}catch{return null;}};
const clean = s => {const v=String(s??'').trim();return v||'暂未披露 / 待核实';};
const locationOf = p=>[p.country,p.province,p.city].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).join(' · ');
const isChina = p=>p.country==='中国'||p.is_china_track;
function loadBookmarks(){try{state.bookmarks=new Set(JSON.parse(localStorage.getItem('research-atlas-favorites')||'[]'));}catch{state.bookmarks=new Set();}}
function saveBookmarks(){try{localStorage.setItem('research-atlas-favorites',JSON.stringify([...state.bookmarks]));}catch{}}
function copyText(s){if(navigator.clipboard?.writeText){navigator.clipboard.writeText(s).then(()=>notify('链接已复制')).catch(()=>fallbackCopy(s));}else fallbackCopy(s);}
function fallbackCopy(s){const t=document.createElement('textarea');t.value=s;document.body.appendChild(t);t.select();try{document.execCommand('copy');notify('链接已复制')}catch{notify('请手动复制地址栏链接')}t.remove();}
let toastTimer;function notify(s){const el=$('#toast');el.textContent=s;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2800);}
const dateLabel = v => {if(!v)return '截止日期待核实';const d=new Date(v+'T12:00:00');if(Number.isNaN(d.valueOf()))return v;return d.toLocaleDateString('zh-CN',{year:'numeric',month:'short',day:'numeric'})+(v<ymd?' · 历史截止':v===ymd?' · 今天截止':' · 待核实是否仍开放');};
const statusLabel=p=>p.year===2027?'2027 届次':'20'+String(p.year||26).slice(-2)+' 资料';
function resultData(){
 const q=state.q.trim().toLocaleLowerCase();let rows=state.data.filter(p=>{
  if(state.region==='china'&&!isChina(p))return false;
  if(state.region==='international'&&isChina(p))return false;
  if(state.province!=='all'&&p.province!==state.province)return false;
  if(state.tier!=='all'&&p.tier!==state.tier)return false;
  if(state.cost!=='all'&&p.cost!==state.cost)return false;
  if(state.access!=='all'&&p.mainland!==state.access)return false;
  if(state.deadlineOnly&&(!p.deadline||p.deadline<ymd))return false;
  if(state.favoritesOnly&&!state.bookmarks.has(p.id))return false;
  if(state.quick==='china'&&!isChina(p))return false;
  if(state.quick==='mentor'&&!['mentor','lab'].includes(p.tier))return false;
  if(state.quick==='free'&&!['free','aid'].includes(p.cost))return false;
  if(q&&!([p.name,p.host,p.country,p.province,p.city,p.field,p.parent,p.notes,p.eligibility,p.track].join(' ').toLocaleLowerCase().includes(q)))return false;
  return true;
 });
 if(state.sort==='name')rows.sort((a,b)=>a.name.localeCompare(b.name,'zh-CN'));
 else if(state.sort==='deadline')rows.sort((a,b)=>(a.deadline&&a.deadline>=ymd?a.deadline:'9999-99-99').localeCompare(b.deadline&&b.deadline>=ymd?b.deadline:'9999-99-99')||a.name.localeCompare(b.name,'zh-CN'));
 else if(state.sort==='source')rows.sort((a,b)=>(parseInt(b.source_date)||b.year||0)-(parseInt(a.source_date)||a.year||0)||a.name.localeCompare(b.name,'zh-CN'));
 return rows;
}
function renderCard(p){
 const bookmark=state.bookmarks.has(p.id);const label=TIER[p.tier]||'科研机会';
 return '<article class="opportunity-card" data-card="'+escapeHTML(p.id)+'">'+
 '<div class="card-top"><span class="tier-pill '+escapeHTML(p.tier)+'">'+escapeHTML(label)+'</span>'+
 '<button class="bookmark '+(bookmark?'saved':'')+'" data-bookmark="'+escapeHTML(p.id)+'" aria-label="'+(bookmark?'取消收藏':'收藏项目')+'" title="'+(bookmark?'取消收藏':'收藏')+'"><svg viewBox="0 0 24 24" fill="'+(bookmark?'currentColor':'none')+'" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 3.7h12v17l-6-4.4-6 4.4z"/></svg></button></div>'+
 '<div class="card-body" role="button" tabindex="0" data-open="'+escapeHTML(p.id)+'" aria-label="查看 '+escapeHTML(p.name)+' 详情"><div class="card-location">'+escapeHTML(locationOf(p)||'全球 / 远程')+'</div><h3>'+escapeHTML(p.name)+'</h3><div class="card-host">'+escapeHTML(p.host)+'</div>'+
 '<div class="card-tags"><span>'+escapeHTML(COST[p.cost]||'费用待核')+'</span><span>'+escapeHTML(ACCESS[p.mainland]||'资格待核')+'</span></div></div>'+
 '<div class="card-bottom"><div class="meta"><span class="dot"></span>'+escapeHTML(statusLabel(p))+'</div><button data-open="'+escapeHTML(p.id)+'" aria-label="查看详细信息">查看详情 ↗</button></div></article>';
}
function renderPagination(count){
 const pages=Math.max(1,Math.ceil(count/PAGE_SIZE));state.page=Math.min(state.page,pages);
 const el=$('#pagination');if(pages<=1){el.innerHTML='';return;}
 el.innerHTML='<button data-page="'+(state.page-1)+'" '+(state.page===1?'disabled':'')+'>← 上一页</button><span>'+state.page+' / '+pages+'</span><button data-page="'+(state.page+1)+'" '+(state.page===pages?'disabled':'')+'>下一页 →</button>';
}
function renderChips(){
 const items=[];
 for(const [key,label] of [['q','搜索'],['region','地区'],['province','省份'],['tier','类型'],['cost','费用'],['access','资格']]){
 const v=state[key];if(v&&v!=='all')items.push({key,label:label+'：'+(key==='tier'?TIER[v]:key==='cost'?COST[v]:key==='access'?ACCESS[v]:key==='region'?(v==='china'?'中国':'海外'):v)});
 }
 if(state.deadlineOnly)items.push({key:'deadlineOnly',label:'未来截止日'});
 if(state.favoritesOnly)items.push({key:'favoritesOnly',label:'我的收藏'});
 if(state.quick!=='all')items.push({key:'quick',label:'快捷：'+({china:'中国高校',mentor:'导师研究',free:'低成本'}[state.quick]||state.quick)});
 $('#active-filters').innerHTML=items.map(x=>'<span class="filter-chip">'+escapeHTML(x.label)+'<button aria-label="移除 '+escapeHTML(x.label)+'" data-remove="'+x.key+'">×</button></span>').join('');
}
function render(){
 if(!state.data.length)return;
 const rows=resultData(),start=(state.page-1)*PAGE_SIZE;
 $('#result-count').textContent=rows.length.toLocaleString('zh-CN');
 $('#cards').classList.toggle('compact',state.compact);
 $('#view-toggle').setAttribute('aria-pressed',String(state.compact));
 if(!rows.length)$('#cards').innerHTML='<div class="empty-state"><div style="font-size:31px">⌕</div><strong>没有找到符合条件的项目</strong><p>试试移除某个筛选条件，或搜索其他学校与学科。</p><button data-reset="true">清除筛选</button></div>';
 else $('#cards').innerHTML=rows.slice(start,start+PAGE_SIZE).map(renderCard).join('');
 renderPagination(rows.length);renderChips();
 $$('.quick-tab').forEach(b=>b.classList.toggle('active',b.dataset.quick===state.quick));
 updateURL();
}
function updateURL(){const p=new URLSearchParams();for(const k of ['q','region','province','tier','access','cost','sort','quick'])if(state[k]&&state[k]!=='all'&&state[k]!=='default')p.set(k,state[k]);if(state.deadlineOnly)p.set('future','1');if(state.favoritesOnly)p.set('saved','1');const q=p.toString();history.replaceState(null,'',location.pathname+(q?'?'+q:'')+location.hash);}
function syncControls(){
 $('#search-input').value=state.q;
 for(const k of ['region','province','tier','access','cost','sort']){const e=$('#'+k+'-filter');if(e&&[...e.options].some(o=>o.value===state[k]))e.value=state[k];}
 $('#deadline-filter').checked=state.deadlineOnly;$('#favorite-filter').checked=state.favoritesOnly;
 $('#province-filter').disabled=state.region==='international';
}
function setProvinceOptions(){
 const provinces=[...new Set(state.data.filter(isChina).map(p=>p.province).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'zh-CN'));
 $('#province-filter').innerHTML='<option value="all">全部省份 / 城市</option>'+provinces.map(p=>'<option value="'+escapeHTML(p)+'">'+escapeHTML(p)+'</option>').join('');
}
function reset(){Object.assign(state,{q:'',region:'all',province:'all',tier:'all',cost:'all',access:'all',deadlineOnly:false,favoritesOnly:false,sort:'default',quick:'all',page:1});syncControls();render();}
function pair(label,value){return '<div class="detail-pair"><dt>'+escapeHTML(label)+'</dt><dd>'+escapeHTML(clean(value))+'</dd></div>';}
function openDrawer(id){
 const p=state.data.find(x=>x.id===id);if(!p)return;
 state.selected=id;const source=safeURL(p.source_url);
 $('#drawer-body').innerHTML='<span class="tier-pill '+escapeHTML(p.tier)+'">'+escapeHTML(TIER[p.tier]||'科研机会')+'</span>'+
 '<h2 id="drawer-title">'+escapeHTML(p.name)+'</h2><div class="drawer-host">'+escapeHTML(p.host)+'<br>'+escapeHTML(locationOf(p))+'</div>'+
 '<div class="drawer-actions"><button id="share-program">复制详情链接</button><button id="save-program">'+(state.bookmarks.has(id)?'★ 已收藏':'☆ 收藏项目')+'</button></div>'+
 '<div class="drawer-section"><h3>项目概况 / Overview</h3><dl>'+pair('方向',p.field)+pair('培养形式',p.delivery)+pair('时长',p.duration)+pair('参与机制',p.mentorship)+pair('所属计划',p.parent||p.track)+pair('资料届次',p.year)+' </dl></div>'+
 '<div class="drawer-section"><h3>申请资格 / Eligibility</h3><dl>'+pair('中国学生',ACCESS[p.mainland]||'待核实')+pair('具体要求',p.eligibility)+pair('申请方式',p.application_method)+pair('申请窗口',p.application_window)+pair('截止日期',dateLabel(p.deadline))+'</dl></div>'+
 '<div class="drawer-section"><h3>费用与成果 / Financials & output</h3><dl>'+pair('项目费用',p.fee)+pair('资助',p.aid)+pair('住宿与交通',p.accommodation)+pair('成果及限制',p.output)+'</dl></div>'+
 '<div class="drawer-section"><h3>来源与核查 / Evidence</h3><dl>'+pair('证据标记',p.evidence||'官方网站资料')+pair('来源届次',p.source_date)+pair('核查基准',p.checked_at)+pair('状态',p.status)+pair('重要提示',p.notes)+pair('建议',p.recommendation)+'</dl></div>'+
 '<div class="drawer-notice">注意：此处显示的项目资格、费用与日期可能属于过往届次。数据收录不等于当前开放申请，也不保证个人一定可报名。</div>'+
 (source?'<a class="drawer-cta" href="'+escapeHTML(source)+'" target="_blank" rel="noopener noreferrer">前往官方信息来源 ↗</a>':'<p>暂缺可靠官方来源链接。</p>')+
 '<p class="drawer-small">记录编号 '+escapeHTML(p.id)+' · 发现信息过期？可以在 GitHub 提交 Issue 或 Pull Request。</p>';
 $('#drawer-overlay').hidden=false;$('#detail-drawer').classList.add('open');$('#detail-drawer').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';$('#detail-drawer').focus();
 const hash='#program='+encodeURIComponent(id);history.replaceState(null,'',location.pathname+location.search+hash);
}
function closeDrawer(){state.selected=null;$('#detail-drawer').classList.remove('open');$('#detail-drawer').setAttribute('aria-hidden','true');$('#drawer-overlay').hidden=true;document.body.style.overflow='';history.replaceState(null,'',location.pathname+location.search);}
function handleHash(){const m=location.hash.match(/^#program=(.+)$/);if(m){try{openDrawer(decodeURIComponent(m[1]))}catch{}}else if(state.selected){closeDrawer();}}
function initListeners(){
 $$('.filters-panel select, #sort-filter').forEach(e=>e.addEventListener('change',()=>{const key=e.id.replace('-filter','');state[key]=e.value;state.page=1;if(key==='region'&&state.region==='international'){state.province='all';}state.quick='all';syncControls();render();}));
 $('#search-input').addEventListener('input',e=>{state.q=e.target.value;state.page=1;render();});
 $('#deadline-filter').addEventListener('change',e=>{state.deadlineOnly=e.target.checked;state.page=1;render();});
 $('#favorite-filter').addEventListener('change',e=>{state.favoritesOnly=e.target.checked;state.page=1;render();});
 $('#clear-filters').addEventListener('click',reset);
 $('#mobile-filter-btn').addEventListener('click',()=>{const open=$('#filters-panel').classList.toggle('mobile-open');$('#mobile-filter-btn').setAttribute('aria-expanded',String(open));});
 $('#explore-china').addEventListener('click',()=>{state.region='china';state.province='all';state.quick='china';state.page=1;syncControls();render();$('#discover').scrollIntoView({behavior:'smooth'});});
 $$('.quick-tab').forEach(b=>b.addEventListener('click',()=>{state.quick=b.dataset.quick;if(state.quick==='china'){state.region='china';}else if(state.region==='china'&&state.quick!=='china'){state.region='all';}state.page=1;syncControls();render();}));
 $('#view-toggle').addEventListener('click',()=>{state.compact=!state.compact;render();});
 $('#cards').addEventListener('click',e=>{const b=e.target.closest('[data-bookmark]');if(b){const id=b.dataset.bookmark;state.bookmarks.has(id)?state.bookmarks.delete(id):state.bookmarks.add(id);saveBookmarks();render();notify(state.bookmarks.has(id)?'已加入收藏':'已从收藏移除');return;}const o=e.target.closest('[data-open]');if(o)openDrawer(o.dataset.open);if(e.target.closest('[data-reset]'))reset();});
 $('#cards').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-open]')){e.preventDefault();openDrawer(e.target.dataset.open);}});
 $('#pagination').addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(!b)return;state.page=Number(b.dataset.page);render();$('#discover').scrollIntoView({behavior:'smooth'});});
 $('#active-filters').addEventListener('click',e=>{const b=e.target.closest('[data-remove]');if(!b)return;const k=b.dataset.remove;state[k]=['deadlineOnly','favoritesOnly'].includes(k)?false:k==='q'?'':'all';state.page=1;syncControls();render();});
 $('#drawer-close').addEventListener('click',closeDrawer);$('#drawer-overlay').addEventListener('click',closeDrawer);
 $('#drawer-body').addEventListener('click',e=>{if(e.target.closest('#share-program')){copyText(location.href);}if(e.target.closest('#save-program')){const id=state.selected;state.bookmarks.has(id)?state.bookmarks.delete(id):state.bookmarks.add(id);saveBookmarks();render();$('#save-program').textContent=state.bookmarks.has(id)?'★ 已收藏':'☆ 收藏项目';}});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.selected){closeDrawer();return;}if(e.key==='/'&&!state.selected&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){e.preventDefault();$('#search-input').focus();}});
 window.addEventListener('hashchange',handleHash);
 const theme=(()=>{try{return localStorage.getItem('research-atlas-theme')}catch{return null}})();if(theme==='dark')document.body.classList.add('dark');
 $('#theme-toggle').addEventListener('click',()=>{const d=document.body.classList.toggle('dark');try{localStorage.setItem('research-atlas-theme',d?'dark':'light')}catch{}});
}
async function init(){
 loadBookmarks();initListeners();
 try{
  const response=await fetch('./data/catalog.json',{cache:'no-cache'});if(!response.ok)throw Error('HTTP '+response.status);
  const result=await response.json();if(!Array.isArray(result.programs))throw Error('Invalid catalog format');
  state.data=result.programs;$('#stat-total').textContent=result.total||result.programs.length;
  $('#stat-china').textContent=result.china_added||result.programs.filter(x=>x.is_china_track).length;
  $('#stat-regions').textContent=new Set(result.programs.map(x=>x.country).filter(Boolean)).size;
  setProvinceOptions();
  const u=new URLSearchParams(location.search);
  for(const key of ['q','region','province','tier','access','cost','sort','quick'])if(u.has(key))state[key]=u.get(key);
  state.deadlineOnly=u.get('future')==='1';state.favoritesOnly=u.get('saved')==='1';syncControls();render();handleHash();
 }catch(err){$('#cards').innerHTML='<div class="empty-state"><strong>数据库载入失败</strong><p>请刷新页面，或直接到 GitHub 仓库浏览数据。错误：'+escapeHTML(err.message)+'</p><a href="https://github.com/1998x-stack/High-School-Research-Programs/tree/main/data">打开原始数据库 ↗</a></div>';console.error(err);}
}
init();
