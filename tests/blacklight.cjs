const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {writeJson,redactUrl}=require('./evidence-lib.cjs');
const config=require('./real-sites.config.json');
const endpoint='https://blacklight-us-oh.api.themarkup.org/graphic-api';
const client='https://mrkp-static-production.themarkup.org/graphics/blacklight-client_blacklight-client/1781703161872/main.js';
function save(slug,envelope){
  const site=config.sites.find(s=>s.slug===slug);if(!site)throw new Error('Site inválido');
  const directory=path.join(__dirname,'../evidencias/sites-reais',slug,'blacklight');
  const raw=typeof envelope.body==='string'?envelope.body:JSON.stringify(envelope.body||envelope);
  let response;try{response=JSON.parse(raw)}catch{}
  const metadata={site:site.name,url:site.url,endpoint,client,request:envelope.request,
    timestamp:envelope.startedAt,finishedAt:envelope.finishedAt,httpStatus:envelope.httpStatus,
    status:response?.status==='success'?'collected':'PENDENTE',error:envelope.error||response?.error||response?.message,
    responseSha256:crypto.createHash('sha256').update(raw).digest('hex'),
    source:'Actual Blacklight graphic-api response; structured factual extract, not a local Firefox run',
    sanitization:'No cookie values, response bodies, embedded images, request headers or browser profile retained'};
  if(response?.status==='success'){
    const keys=['status','page_title','host','browser','start_time','end_time','location','tracker_radar_last_updated','display_time','aws_region','hosts'];
    const result=Object.fromEntries(keys.filter(k=>k in response).map(k=>[k,response[k]]));
    result.uri_ins=redactUrl(response.uri_ins);result.uri_dest=redactUrl(response.uri_dest);
    result.browsing_history=(response.browsing_history||[]).map(redactUrl);
    result.config=Object.fromEntries(['numPages','defaultTimeout','defaultWaitUntil','enableAdBlock','cleareCache','headless','emulateDevice'].filter(k=>k in response.config).map(k=>[k,response.config[k]]));
    result.reportUrl=response.s3?.report;
    result.groups=response.groups.map(group=>({title:group.title,cards:group.cards.map(card=>Object.fromEntries(
      ['cardType','title','testEventsFound','bigNumber','domainData','domains_found','bl_data_type','methodology','caveat'].filter(k=>k in card).map(k=>[k,card[k]])))}));
    writeJson(path.join(directory,'result.json'),result);
  }
  writeJson(path.join(directory,'metadata.json'),metadata);console.log(slug,metadata.status);
}
async function main(){
  const slug=process.argv[2],site=config.sites.find(s=>s.slug===slug);if(!site)throw new Error('Uso: node tests/blacklight.cjs <slug> [arquivo JSON real]');
  if(process.argv[3])return save(slug,JSON.parse(fs.readFileSync(process.argv[3],'utf8').replace(/^\uFEFF/,'')));
  const request={inUrl:site.url,device:'desktop',force:true,location:'us-oh'},startedAt=new Date().toISOString();
  let envelope={startedAt,request};
  try{const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8',Origin:'https://themarkup.org'},body:JSON.stringify(request),signal:AbortSignal.timeout(180000)});envelope.httpStatus=response.status;envelope.body=await response.text()}
  catch(error){envelope.error=String(error);envelope.cause=String(error.cause)}
  envelope.finishedAt=new Date().toISOString();save(slug,envelope);
}
if(require.main===module)main().catch(error=>{console.error(error);process.exitCode=1});
module.exports={save};
