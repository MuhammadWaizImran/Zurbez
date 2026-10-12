const {get,put,issueSignedToken,presignUrl,BlobPreconditionFailedError}=require('@vercel/blob');
const {api}=require('../server');

module.exports=async function handler(req,res){
  let url;
  try{url=decodeURIComponent(new URL(req.url,'https://zurbez.vercel.app').pathname)}catch{return reply(res,400,'Bad request')}
  if(url.startsWith('/api/media/')&&req.method==='GET'){
    const file=url.slice('/api/media/'.length);
    if(!/^[a-f0-9-]+\.(jpg|png|webp|mp4)$/.test(file))return reply(res,404,'Not found');
    try{const pathname='media/'+file,validUntil=Date.now()+10*60*1000,token=await issueSignedToken({pathname,operations:['get'],validUntil}),signed=await presignUrl(token,{operation:'get',pathname,access:'private',validUntil});res.writeHead(307,{Location:signed.presignedUrl,'Cache-Control':'public, max-age=300'});return res.end()}catch(e){console.error(e);return reply(res,502,'Media unavailable')}
  }
  try{
    const stored=await get('zurbez/store.json',{access:'private',useCache:false});
    if(!stored)return reply(res,503,'Store data is not configured');
    const db=JSON.parse(await new Response(stored.stream).text());
    const save=()=>put('zurbez/store.json',JSON.stringify(db),{access:'private',allowOverwrite:true,ifMatch:stored.blob.etag.replace(/^W\//,''),contentType:'application/json'});
    await api(req,res,url,db,save);
  }catch(e){console.error(e);if(res.headersSent)return;if(e instanceof BlobPreconditionFailedError)return reply(res,409,'Store changed. Please retry.');return reply(res,500,'Server error')}
};
function reply(res,status,error){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify({error}))}
