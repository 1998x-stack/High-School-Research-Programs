#!/usr/bin/env node
// Zero-dependency catalog compiler. Run: node scripts/build.mjs [--check]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const original = JSON.parse(readFileSync(resolve(root,'data/global-2026-2027.json'),'utf8'));
const china = JSON.parse(readFileSync(resolve(root,'data/china-university-programs.json'),'utf8'));
const date = '2026-11-10'; // baseline provenance, not a claim of real-time availability
const required = ['id','name','host','country','type','tier','source_url','checked_at'];
function normalizeGlobal(p) {
  const text=(key)=>String(p[key]??'').trim();
  const grade=text('项目分类').slice(0,1);
  const tier=({A:'lab',B:'mentor',C:'structured',D:'community',E:'course',F:'commercial'})[grade]||'unknown';
  const applicant=text('中国大陆普通学生可申请');
  const mainland=/不可以|不符合|仅限美国|不开放/.test(applicant)?'no': /可以（国际开放）|可以直接|可以申请/.test(applicant)?'yes': /有条件/.test(applicant)?'conditional':'unknown';
  const rawfee=text('公开费用'); const aid=text('资助与津贴');
  const cost = /(免费|无费用|免学费|无项目费)/.test(rawfee)?'free':/(资助|奖学金)/.test(aid)?'aid':/(\$|€|元|英镑|USD|收费)/.test(rawfee)?'paid':'unknown';
  return {
    id:text('编号'),name:text('项目名称'),host:text('主办机构'),country:text('国家地区'),province:'',
    city:text('举办地点'),type:text('项目分类'),tier,track:'',parent:'',
    field:text('研究方向'),delivery:text('形式'),duration:text('周期'),
    eligibility:text('具体身份与地域要求')||text('中国大陆普通学生可申请'),
    mainland,fee:rawfee,aid, cost,deadline:text('精确截止日')||null,
    application_window:text('申请时间'),year:2026,status:text('届次状态'),
    source_url:text('官方网站'),additional_sources:[],source_date:text('证据等级'),
    checked_at:text('资料更新日')||date,evidence:text('证据等级'),notes:text('特殊风险与未核事项'),
    output:text('成果及使用限制'),mentorship:text('导师与科研机制'),
    accommodation:text('住宿签证交通'),application_method:text('申请材料与方式'),
    selectivity:text('录取规模与竞争信息'),recommendation:text('普通中国家庭行动建议'),
    is_china_track:false
  };
}
function normalizeChina(p){
  const fee=p.fee||'未披露'; const aid=p.aid||'未披露';
  return {...p,mainland:'conditional',cost:/完全免费|申请.*免费/.test(fee)?'free':'unknown',
    application_window:`${p.year}届资料；实际申请期请查相应年份官方公告`,
    output:p.tier==='exposure'?'短期参与和科学体验；不保证独立研究产出':p.tier==='admissions'?'大学正式入学与培养；不是暑期科研成果':'导师指导/研究训练；实际成果依培养情况',
    mentorship:p.tier==='mentor'?'高校科学家或导师团队指导；实际分配以公告为准':p.tier==='admissions'?'入学后课程与学术导师':'高校组织科学体验或项目学习',
    accommodation:'本地活动为主；是否安排交通和住宿须查看当届通知',
    recommendation:'优先核实是否覆盖所在省份及高中、是否允许个人报名',
    application_method:p.eligibility,is_china_track:true};
}
const records=[...original.programs.map(normalizeGlobal),...china.programs.map(normalizeChina)];
const seen=new Set();let errors=[];
for(const p of records){
 for(const f of required)if(!p[f])errors.push(p.id+': missing '+f);
 if(seen.has(p.id))errors.push('duplicate ID: '+p.id);seen.add(p.id);
 if(!/^https:\/\//.test(p.source_url)) errors.push(p.id+': source must use https');
 if(p.deadline && !/^\d{4}-\d{2}-\d{2}$/.test(p.deadline))errors.push(p.id+': invalid deadline');
 if(!['lab','mentor','structured','exposure','community','course','commercial','admissions','unknown'].includes(p.tier))errors.push(p.id+': invalid tier');
 if(!['yes','no','conditional','unknown'].includes(p.mainland))errors.push(p.id+': invalid eligibility');
}
if(errors.length){ console.error(errors.join('\n'));process.exit(1); }
const byTier={},byCountry={};for(const r of records){byTier[r.tier]=(byTier[r.tier]||0)+1;byCountry[r.country]=(byCountry[r.country]||0)+1;}
const newest=records.map(p=>p.checked_at).filter(v=>/^\d{4}-\d{2}-\d{2}$/.test(v)).sort().at(-1)||date;
const output={schema_version:'1.0.0',as_of:newest,generated_on:new Date().toISOString().slice(0,10),total:records.length,china_added:china.programs.length,counts:{byTier,byCountry},caveat:'Historical entries are not proof of a new application cycle. One umbrella program may have multiple campus tracks. Eligibility and deadlines must be rechecked at official sources.',programs:records};
const filename=resolve(root,'docs/data/catalog.json');
const content=JSON.stringify(output,null,2)+'\n';
if(process.argv.includes('--check')){console.log('Validated '+records.length+' records; '+china.programs.length+' Chinese campus tracks.');process.exit(0);}
mkdirSync(resolve(root,'docs/data'),{recursive:true});
writeFileSync(filename,content);
console.log('Built '+filename+' with '+records.length+' records.');
