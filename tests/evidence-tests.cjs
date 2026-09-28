const assert=require("node:assert/strict");
const {sanitizeHar,sanitizeReport,analyzeHar,redactUrl}=require("./evidence-lib.cjs");
// Synthetic unit data only; never written into the empirical evidence folders.
const input={log:{version:"1.2",creator:{name:"unit fixture",version:"1"},entries:[{
 startedDateTime:"2026-09-28T12:00:00Z",time:12,timings:{wait:5,receive:7},cache:{},
 request:{method:"GET",url:"https://google-analytics.com/collect?uid=secret-query",headers:[{name:"Cookie",value:"uid=secret-cookie"}],cookies:[{name:"uid",value:"secret-cookie"}],queryString:[{name:"uid",value:"secret-query"}]},
 response:{status:200,statusText:"OK",headers:[{name:"Set-Cookie",value:"uid=secret-response; Max-Age=60"}],cookies:[{name:"uid",value:"secret-response"}],content:{mimeType:"text/plain",size:10,text:"secret-body"},redirectURL:""}
}]}};
const clean=sanitizeHar(input,"unit fixture");
assert.ok(!JSON.stringify(clean).includes("secret-"));
assert.equal(clean.log.entries[0].response.content.mimeType,"text/plain");
assert.equal(clean.log.entries[0]._cookieWriteMetadata[0].session,false);
const summary=analyzeHar(clean,"https://www.cnn.com/");
assert.equal(summary.totalRequests,1);assert.equal(summary.thirdPartyRequests,1);
assert.deepEqual(summary.hosts["google-analytics.com"].categories,["tracker"]);
assert.equal(summary.statuses[200],1);
assert.throws(()=>sanitizeHar({},"unit fixture"),/inválido/);
const report=sanitizeReport({pageUrl:"https://example.com/?id=private",bounceTracking:{sharedIdentifiers:["private"],suspiciousParameters:[{value:"private"}]}});
assert.ok(!JSON.stringify(report).includes("private"));
assert.equal(input.log.entries[0].request.queryString[0].value,"secret-query");
assert.ok(!redactUrl("https://example.com/sync/8611247803078717893").includes("8611247803078717893"));
const local=JSON.parse(JSON.stringify(clean));local.log.entries[0].request.url="data:text/plain,unit";
const localSummary=analyzeHar(local,"https://example.com/");
assert.equal(localSummary.unclassifiedRequests,1);
assert.equal(localSummary.firstPartyRequests,0);
assert.equal(localSummary.thirdPartyRequests,0);
console.log("14 assertions passed: HAR sanitization, metadata, classification, malformed input, non-network URLs and report privacy.");
