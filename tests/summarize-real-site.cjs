const fs=require('node:fs'),path=require('node:path');
const {getBaseDomain,filterEngine,writeJson}=require('./evidence-lib.cjs');
const config=require('./real-sites.config.json');
const base=path.join(__dirname,'../evidencias/sites-reais');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const escape=value=>String(value).replace(/\|/g,'&#124;').replace(/\n/g,' ');
function summarize(slug){
 const dir=path.join(base,slug),runs={};
 for(const mode of Object.keys(config.modes)){
  const d=path.join(dir,mode),r=read(path.join(d,'privacy-inspector.json')).report,h=read(path.join(d,'har-summary.json'));
  runs[mode]={report:r,har:h,metadata:read(path.join(d,'metadata.json'))};
 }
 const bl=read(path.join(dir,'blacklight/result.json')),log=read(path.join(dir,'ublock/ublock-log.json')).entries;
 const blockEntries=log.map((entry,index)=>({entry,index})).filter(({entry:e})=>e.realm==='network'&&e.filter?.result===1&&!e.filter.modifier);
 const blCards=bl.groups[0].cards,domains=new Set();
 for(const run of Object.values(runs))for(const [host,info]of Object.entries(run.har.hosts))if(info.categories.length)domains.add(getBaseDomain(host));
 for(const {entry:e}of blockEntries)if(e.hostname)domains.add(getBaseDomain(e.hostname));
 for(const card of blCards)if(card.testEventsFound)for(const domain of card.domainData?.scripts||[])domains.add(getBaseDomain(domain));
 const reconciliation=[...domains].sort().map(domain=>{
  const evidence={};
  for(const [mode,run]of Object.entries(runs)){
   evidence[mode]=Object.entries(run.har.hosts).filter(([host])=>getBaseDomain(host)===domain).map(([host,v])=>({host,entries:v.harEntries,statuses:v.statuses,types:v.types}));
  }
  const sampled=runs.baseline.report.requests.filter(r=>getBaseDomain(r.hostname)===domain);
  const observed=Object.keys(runs.baseline.report.thirdPartyDomains).filter(h=>getBaseDomain(h)===domain);
  const categories=[...new Set([domain,...Object.values(evidence).flat().map(x=>x.host)].flatMap(host=>Array.from(filterEngine.classify('https://'+host).matches,m=>m.category)))];
  const piBlocked=Object.values(runs.blocking.report.blocked).flat().filter(r=>getBaseDomain(r.hostname)===domain);
  const ubo=blockEntries.filter(({entry:e})=>getBaseDomain(e.hostname)===domain);
  const uboObserved=log.filter(e=>e.realm==='network'&&getBaseDomain(e.hostname)===domain);
  const blFindings=blCards.filter(c=>c.testEventsFound&&(c.domainData?.scripts||[]).some(h=>getBaseDomain(h)===domain)).map(c=>c.cardType);
  const reasons=[];
  if(ubo.length&&!categories.length)reasons.push('uBlock aplicou '+[...new Set(ubo.map(x=>x.entry.filter.raw))].join('; ')+'. A lista interna não contém este domínio.');
  else if(ubo.length&&categories.length)reasons.push('Classificação interna '+categories.join('/')+' e decisão de bloqueio uBlock registradas em execuções distintas.');
  if(piBlocked.length&&!ubo.length)reasons.push(uboObserved.length?'PI bloqueou em B; C contém tráfego do domínio sem decisão de bloqueio. Conferir paths/tipos: não implica mesmas URLs.':'PI bloqueou em B; domínio ausente no logger C. Não equivale a permissão pelo uBlock.');
  if(blFindings.length&&!evidence.baseline.length)reasons.push('Blacklight identificou o domínio; não consta no HAR A. A sessão externa visitou duas páginas; a causa exata da diferença não foi isolada.');
  if(blFindings.length&&evidence.baseline.length&&!categories.length)reasons.push('HAR A confirma tráfego; Blacklight identifica '+blFindings.join('/')+'; lista didática sem classificação para este domínio.');
  if(!blFindings.length)reasons.push('Não identificado nominalmente nos cartões do Blacklight; ausência não prova ausência de tráfego.');
  if(!reasons.length)reasons.push('HAR e cartões externos registram o domínio; presença de domínio não prova execução de uma API específica.');
  return {domain,piBaselineObservedHosts:observed,piBaselineSampleCount:sampled.length,piSampledCategories:[...new Set(sampled.map(r=>r.category).filter(Boolean))],internalCategories:categories,
   piBaselineHistoryTruncated:!!runs.baseline.report.historyTruncated,piBlockedB:piBlocked.length,ublockBlockingDecisionsC:ubo.length,ublockObservedC:uboObserved.length,
   ublockLogIndexes:ubo.map(x=>x.index),ublockRules:[...new Set(ubo.map(x=>x.entry.filter.raw))],blacklightFindings:blFindings,evidence,explanation:reasons.join(' ')};
 });
 const summary={site:slug,runs:Object.fromEntries(Object.entries(runs).map(([mode,{report:r,har:h,metadata:m}])=>[mode,{
  timestamp:m.navigationStartedAt,har:h.totalRequests,firstPartyHar:h.firstPartyRequests,thirdPartyHar:h.thirdPartyRequests,unclassifiedHar:h.unclassifiedRequests,
  attempted:r.requestCount,allowedByPI:r.requestCount-Object.values(r.blockedCounts).reduce((a,b)=>a+b,0),
  thirdPartyHosts:Object.keys(r.thirdPartyDomains).length,thirdPartyRequestsRetainedHosts:Object.values(r.thirdPartyDomains).reduce((n,h)=>n+h.count,0),
  detected:r.detectedCounts,blocked:r.blockedCounts,cookies:r.cookies,cookieWrites:{...r.cookieWrites,events:undefined},storage:r.storage,
  canvas:r.canvas.detected,bounce:r.bounceTracking.suspected,cookieSync:r.bounceTracking.cookieSyncSuspected,
  hooks:r.hijacking.hooks,polling:r.hijacking.polling,websockets:r.hijacking.websockets,score:r.score,breakdown:r.scoreBreakdown,historyTruncated:!!r.historyTruncated
 }])),ublock:{blockingDecisions:blockEntries.length,blockedHosts:[...new Set(blockEntries.map(x=>x.entry.hostname))],
  note:'Network logger result=1, excluding modifier entries. These are logged decisions, not a deduplicated HTTP request counter. Redirect/scriptlet/cosmetic rows excluded.'},
  blacklight:blCards.map(c=>({type:c.cardType,found:c.testEventsFound,count:c.bigNumber,domains:c.domainData?.scripts})),reconciliation};
 writeJson(path.join(dir,'summary.json'),summary);
 const lines=['# Reconciliação — '+slug,'','Gerado por `node tests/summarize-real-site.cjs`. A=baseline, B=blocking, C=uBlock. Índices HAR e logger começam em zero. Agrupamento por domínio registrável parcial; hosts exatos estão no JSON. `Não observado` não significa permitido. Categoria interna sem request retido é classificação retrospectiva, não nova evidência de detecção.','',
  '| Domínio | PI observado em A / classificação | PI bloqueou B | uBlock C | Blacklight | HAR | Explicação |','|---|---|---:|---|---|---|---|'];
 for(const r of reconciliation){
  const har=Object.entries(r.evidence).filter(([,v])=>v.length).map(([mode,v])=>`[${mode} ${v.flatMap(x=>x.entries).slice(0,3).join(',')}](./${mode}/${slug}-${mode}.har)`).join('; ')||'Ausente A/B/C';
  const observed=r.piBaselineObservedHosts.length||r.piBaselineSampleCount?'Sim':r.piBaselineHistoryTruncated?'Não retido; histórico parcial':'Não observado';
  lines.push('| '+[r.domain,observed+' / '+(r.piSampledCategories.join(', ')||((r.internalCategories.join(', ')||'sem categoria')+' [lista]')),r.piBlockedB,
   r.ublockBlockingDecisionsC?`${r.ublockBlockingDecisionsC} decisões; log ${r.ublockLogIndexes.slice(0,3).join(',')}`:r.ublockObservedC?'Observado sem bloqueio':'Não observado',r.blacklightFindings.join(', ')||'Não identificado',har,r.explanation].map(escape).join(' | ')+' |');
 }
 fs.writeFileSync(path.join(dir,'reconciliation.md'),lines.join('\n')+'\n');return summary;
}
if(require.main===module)for(const site of config.sites.filter(s=>!process.argv[2]||s.slug===process.argv[2])){const s=summarize(site.slug);console.log(site.slug,'reconciliation',s.reconciliation.length,'uBlock decisions',s.ublock.blockingDecisions)}
module.exports={summarize};
