import {upload} from '@vercel/blob/client';

window.zurbezUpload=async function(file){
  const extension=({'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp','video/mp4':'.mp4'})[file.type];
  if(!extension)throw Error('Use JPG, PNG, WebP or MP4');
  if(file.size>100*1024*1024)throw Error('File is larger than 100 MB');
  const result=await upload('media/'+crypto.randomUUID()+extension,file,{access:'private',handleUploadUrl:'/api/admin/upload-token',multipart:file.size>4*1024*1024});
  return {path:'/api/media/'+result.pathname.slice('media/'.length)};
};
