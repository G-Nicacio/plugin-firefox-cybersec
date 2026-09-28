const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {sanitizeReport,writeJson}=require('./evidence-lib.cjs');
const input=process.argv[2]||'.tmp/final-ddg/ddg',output='evidencias/final-validation';
const cases=['tracker-reporting','canvas','storage-blocking','storage-partitioning','tracker-blocking','query-parameters','bounce-tracking','js-leaks','custom-main-frame','settings-reload'];
const result=[];
for(const name of cases){
 const data=JSON.parse(fs.readFileSync(path.join(input,name+'.json'),'utf8'));
 if(name==='settings-reload'){
  assert.deepEqual(data.actual[0],{ads:false,trackers:true,custom:true});assert.deepEqual(data.actual[1].domains,['example.com']);
 }else{
  assert(data.report.navigationObserved);assert(data.report.requestCount>0);
  assert.equal(data.report.score,100-Object.values(data.report.scoreBreakdown).reduce((a,b)=>a+b,0));
  if(name==='canvas')assert(data.report.canvas.detected);
  if(name==='bounce-tracking')assert(data.report.bounceTracking.suspected);
  if(name==='tracker-blocking')assert(data.report.blockedCounts.trackers>0);
  if(name==='custom-main-frame')assert(data.report.blockedCounts.custom>0);
  if(name.startsWith('storage-'))assert(data.report.storage.localStorage||data.report.storage.indexedDB);
 }
 delete data.pageText;
 data.validationScope='Separate final regression, reused disposable DDG profile; not comparable to clean real-site runs. Page text omitted; previous DDG evidence preserved.';
 writeJson(path.join(output,'ddg',name+'.json'),sanitizeReport(data));
 result.push({case:name,status:'PASS',at:data.at,score:data.report?.score,blocked:data.report?.blockedCounts});
}
writeJson(path.join(output,'browser-checks.json'),{checkedAt:new Date().toISOString(),cases:result,scope:'Runtime smoke assertions, not a claim that every external DDG protection test passes.'});
console.log(result.length+' real browser cases checked; previous evidence untouched');
