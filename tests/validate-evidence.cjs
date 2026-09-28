const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const config=require('./real-sites.config.json');
const {analyzeHar,writeJson,redactUrl}=require('./evidence-lib.cjs');
const root=path.join(__dirname,'..'),base=path.join(root,'evidencias/sites-reais');
function validate(){
 const failures=[],checks=[],artifacts=[];
 const load=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
 for(const site of config.sites){
  for(const mode of Object.keys(config.modes)){
   const dir=path.join(base,site.slug,mode);
   try{
    for(const file of ['metadata.json','privacy-inspector.json','page-observation.json','page.png','plugin.png','har-summary.json',site.slug+'-'+mode+'.har',...(mode==='ublock'?['ublock-log.json','ublock-defaults.json']:[])])assert(fs.statSync(path.join(dir,file)).size>0,file);
    const m=load(path.join(dir,'metadata.json')),r=load(path.join(dir,'privacy-inspector.json')).report,h=load(path.join(dir,site.slug+'-'+mode+'.har'));
    assert.equal(m.status,'collected');assert.equal(m.url,site.url);assert.deepEqual(m.settings,config.modes[mode]);assert.equal(h.log.version,'1.2');
    assert(h.log._privacyInspector.sanitized);assert(m.harSource.includes('DevTools'));assert(r.navigationObserved);assert.equal(r.pageUrl,m.finalUrl);
    assert.equal(r.score,Math.max(0,100-Object.values(r.scoreBreakdown).reduce((a,b)=>a+b,0)));
    assert(r.requests.length<=200);assert(r.requests.length<=r.requestCount);
    if(mode!=='blocking')assert.equal(Object.values(r.blockedCounts).reduce((a,b)=>a+b,0),0);
    for(const entry of h.log.entries){
     assert.equal(entry.request.url,redactUrl(entry.request.url),'URL not sanitized');
     for(const p of entry.request.queryString||[])assert.equal(p.value,'[REDACTED]');
     for(const side of ['request','response']){
      for(const c of entry[side].cookies||[])assert.equal(c.value,'[REDACTED]');
      for(const header of entry[side].headers||[])if(/^(cookie|set-cookie|authorization|proxy-authorization|x-api-key)$/i.test(header.name))assert.equal(header.value,'[REDACTED]');
      assert(!entry[side].content?.text);assert(!entry[side].postData?.text);assert(!entry[side].postData?.params);
     }
    }
    const a=analyzeHar(h,r.pageUrl,r),saved=load(path.join(dir,'har-summary.json'));assert.deepEqual(saved,JSON.parse(JSON.stringify(a)));
    assert.equal(a.totalRequests,a.firstPartyRequests+a.thirdPartyRequests+a.unclassifiedRequests);
    if(mode==='ublock'){
     const log=load(path.join(dir,'ublock-log.json')),defaults=load(path.join(dir,'ublock-defaults.json'));
     assert(log.entries.length>0);assert(log.entries.every(e=>e.tabId===log.targetTabId));assert.equal(defaults.version,m.ublockVersion);
     assert(defaults.lists.netFilterCount>0);assert.equal(defaults.lists.current['user-filters'].entryCount,0);
    }
    checks.push({site:site.slug,mode,status:'PASS',harEntries:h.log.entries.length,score:r.score});
   }catch(error){failures.push(site.slug+'/'+mode+': '+error.message)}
  }
  try{const dir=path.join(base,site.slug,'blacklight'),m=load(path.join(dir,'metadata.json')),r=load(path.join(dir,'result.json'));assert.equal(m.status,'collected');assert.equal(r.status,'success');assert(r.groups[0].cards.length>0);assert.equal(r.uri_ins,site.url);checks.push({site:site.slug,mode:'blacklight',status:'PASS'})}catch(error){failures.push(site.slug+'/blacklight: '+error.message)}
 }
 function inventory(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())inventory(p);else if(!['completeness.json','artifact-hashes.json'].includes(entry.name))artifacts.push({path:path.relative(root,p).replaceAll('\\','/'),sha256:crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')})}}
 inventory(base);
 writeJson(path.join(base,'completeness.json'),{checkedAt:new Date().toISOString(),status:failures.length?'FAIL':'PASS',checks,failures,
  manualPending:['Final editorial screenshots with anchored popup/about:debugging/uBlock UI (see docs/screenshot-plan.md)'],
  scope:'Structural consistency and selected privacy checks; not proof that all personal data is absent or all functionality was tested'});
 writeJson(path.join(base,'artifact-hashes.json'),artifacts);
 console.log(checks.length+' evidence runs PASS; '+failures.length+' failures');for(const f of failures)console.error(f);return failures;
}
if(require.main===module&&validate().length)process.exitCode=1;
module.exports={validate};

