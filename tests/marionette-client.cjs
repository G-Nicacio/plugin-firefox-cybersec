const net = require("node:net");
const wait = ms => new Promise(resolve=>setTimeout(resolve,ms));
class Marionette {
  constructor(socket) {
    this.socket=socket; this.pending=new Map(); this.sequence=0; this.buffer=Buffer.alloc(0);
    this.ready=new Promise((resolve,reject)=>{this.onHello=resolve;this.onFailure=reject});
    socket.on("error",error=>this.fail(error));
    socket.on("close",()=>this.fail(new Error("Marionette connection closed")));
    socket.on("data",chunk=>{
      this.buffer=Buffer.concat([this.buffer,chunk]);
      while(true){
        const colon=this.buffer.indexOf(58);if(colon<0)return;
        const length=Number(this.buffer.subarray(0,colon).toString());
        if(this.buffer.length<colon+1+length)return;
        const packet=JSON.parse(this.buffer.subarray(colon+1,colon+1+length));
        this.buffer=this.buffer.subarray(colon+1+length);
        if(!Array.isArray(packet)){this.onHello(packet);continue}
        const task=this.pending.get(packet[1]);if(!task)continue;
        clearTimeout(task.timer);this.pending.delete(packet[1]);
        packet[2]?task.reject(new Error(JSON.stringify(packet[2]))):task.resolve(packet[3]);
      }
    });
  }
  fail(error){this.onFailure(error);for(const task of this.pending.values()){clearTimeout(task.timer);task.reject(error)}this.pending.clear()}
  static async connect(port=2830){
    for(let i=0;i<40;i++){
      const socket=net.connect(port,"127.0.0.1");
      try {await new Promise((resolve,reject)=>{socket.once("connect",resolve);socket.once("error",reject)});const client=new Marionette(socket);await client.ready;return client}
      catch{socket.destroy();await wait(250)}
    }
    throw new Error("Firefox Marionette não iniciou");
  }
  call(name,params={},timeout=60000){
    return new Promise((resolve,reject)=>{
      const id=++this.sequence;
      const timer=setTimeout(()=>{this.pending.delete(id);reject(new Error("Timeout: "+name))},timeout);
      this.pending.set(id,{resolve,reject,timer});
      const data=JSON.stringify([0,id,name,params]);this.socket.write(Buffer.byteLength(data)+":"+data);
    });
  }
  async context(value){await this.call("Marionette:SetContext",{value})}
  async execute(script){return (await this.call("WebDriver:ExecuteScript",{script,args:[],sandbox:null})).value}
  async asyncExecute(body){
    const result=(await this.call("WebDriver:ExecuteAsyncScript",{
      script:"const done=arguments[arguments.length-1];(async()=>{"+body+"})().then(value=>done({ok:true,value}),error=>done({ok:false,error:String(error),stack:error.stack}));",
      args:[],sandbox:null
    })).value;
    if(!result.ok)throw new Error(result.error+"\n"+result.stack);return result.value;
  }
  async switchTo(handle){await this.context("content");await this.call("WebDriver:SwitchToWindow",{handle})}
  async quit(){try{await this.call("Marionette:Quit",{flags:["eAttemptQuit"]},10000)}finally{this.socket.destroy()}}
}
module.exports={Marionette,wait};
