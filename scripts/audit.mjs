#!/usr/bin/env node
// Offline provenance and freshness audit. Does not query official websites.
// Use the report to plan human review; do NOT automatically declare programs open.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const data=JSON.parse(readFileSync(resolve(root,'docs/data/catalog.json'),'utf8'));
if(!Array.isArray(data.programs)||data.programs.length<1)throw Error('Missing compiled catalog');
const today=new Date().toISOString().slice(0,10);
const yearsOld=(value)=>{if(!value||!(/^\d{4}-\d{2}-\d{2}$/).test(value))return null;const days=(Date.parse(today)-Date.parse(value))/86400000;return Number.isFinite(days)?Math.floor(days):null;};
const issues=[],typeCount={},parents={};
for(const p of data.programs){
 typeCount[p.tier]=(typeCount[p.tier]||0)+1;
 if(p.parent)parents[p.parent]=(parents[p.parent]||0)+1;
 if(p.deadline&&p.deadline<today)issues.push({id:p.id,severity:'info',code:'past_deadline',note:'Stored deadline is in the past; this is not current availability'});
 const stale=yearsOld(p.checked_at);if(stale!=null&&stale>365)issues.push({id:p.id,severity:'review',code:'stale_verification',days:stale});
 if(!/^https:\/\//.test(p.source_url||''))issues.push({id:p.id,severity:'critical',code:'missing_source'});
 if((p.tier==='exposure'||p.tier==='admissions')&&p.mainland==='yes')issues.push({id:p.id,severity:'info',code:'verify_direct_access',note:'Campus-level school nomination may be needed even when program is open domestically'});
 if(p.is_china_track&&(!p.province||p.province==='未披露'))issues.push({id:p.id,severity:'review',code:'missing_province'});
}
const report={
 produced_at:today,origin_as_of:data.as_of,records:data.programs.length,
 campus_tracks:data.programs.filter(p=>p.is_china_track).length,
 research_type_counts:typeCount,parent_programs:parents,
 findings:issues,
 counts_by_finding:issues.reduce((a,i)=>(a[i.code]=(a[i.code]||0)+1,a),{}),
 note:'This is an OFFLINE consistency and freshness audit. It does not verify URLs, intake dates or eligibility in real time. Official-source re-review remains required.'
};
mkdirSync(resolve(root,'docs/data'),{recursive:true});
writeFileSync(resolve(root,'docs/data/quality.json'),JSON.stringify(report,null,2)+'\n');
console.log('Quality audit:',report.records,'entries.',JSON.stringify(report.counts_by_finding));
if(issues.some(i=>i.severity==='critical'))process.exitCode=1;
