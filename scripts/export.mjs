#!/usr/bin/env node
// Portable machine-readable exports from generated canonical index.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const base=resolve(import.meta.dirname,'../docs/data');
const catalog=JSON.parse(readFileSync(resolve(base,'catalog.json'),'utf8'));
const rows=catalog.programs;
const columns=['id','name','host','parent','country','province','city','tier','type','field','delivery','duration','mainland','eligibility','cost','fee','aid','deadline','year','status','source_date','checked_at','source_url','notes'];
const quoted=(v)=>{const t=v===null||v===undefined?'':typeof v==='string'?v:JSON.stringify(v);return '"'+String(t).replaceAll('"','""')+'"';};
writeFileSync(resolve(base,'catalog.csv'),'\uFEFF'+[columns.map(quoted).join(','),...rows.map(r=>columns.map(c=>quoted(r[c])).join(','))].join('\n')+'\n');
writeFileSync(resolve(base,'catalog.ndjson'),rows.map(r=>JSON.stringify(r)).join('\n')+'\n');
console.log('Exported CSV and NDJSON with',rows.length,'entries.');
