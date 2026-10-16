// 復号は閲覧端末だけで行い、パスワードを送信・保存しない。
'use strict';
const form=document.getElementById('unlock'),message=document.getElementById('message');
const from64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
form.addEventListener('submit',async event=>{
 event.preventDefault();const button=form.querySelector('button');button.disabled=true;message.textContent='画像を開いています…';
 try{
  const p=window.hoshiPayload,password=document.getElementById('password').value;
  const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);
  const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:from64(p.salt),iterations:600000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['decrypt']);
  const clear=await crypto.subtle.decrypt({name:'AES-GCM',iv:from64(p.iv)},key,from64(p.cipher));
  const files=JSON.parse(new TextDecoder().decode(clear));const doc=new DOMParser().parseFromString(new TextDecoder().decode(from64(files['index.html'])),'text/html');
  for(const img of doc.querySelectorAll('img[src]')){const name=img.getAttribute('src').replace(/^\.\//,'');if(!files[name])throw Error('missing image');img.src='data:image/webp;base64,'+files[name];}
  for(const a of doc.querySelectorAll('a[href]')){const name=a.getAttribute('href').replace(/^\.\//,'');if(files[name]){a.href=URL.createObjectURL(new Blob([from64(files[name])],{type:'image/png'}));if(a.hasAttribute('download'))a.setAttribute('download',name.split('/').pop());else{a.dataset.original=name;a.removeAttribute('target');a.href='#original';}}}
  document.getElementById('password').value='';delete window.hoshiPayload;
  document.documentElement.replaceWith(doc.documentElement);
  // HTTPSの同じ画面内で原寸を表示し、スマホでも戻りやすくする。
  for(const link of document.querySelectorAll('a[data-original]'))link.addEventListener('click',event=>{
   event.preventDefault();const name=link.dataset.original,viewer=document.createElement('div');viewer.setAttribute('role','dialog');viewer.setAttribute('aria-modal','true');viewer.setAttribute('aria-label','文字なし原寸画像');viewer.style.cssText='position:fixed;inset:0;overflow:auto;background:#081b20;z-index:9999;padding:16px;box-sizing:border-box';
   const close=document.createElement('button');close.textContent='閉じる';close.style.cssText='position:sticky;top:0;padding:12px 24px;display:block;margin-bottom:12px;cursor:pointer';close.addEventListener('click',()=>viewer.remove());
   const image=document.createElement('img');image.src='data:image/png;base64,'+files[name];image.alt=name+' 2560×1440px';image.style.cssText='display:block;max-width:100%;height:auto;margin:auto';viewer.append(close,image);document.body.append(viewer);close.focus();
  });
 }catch(error){message.textContent='パスワードを確認して、もう一度お試しください。';button.disabled=false;}
});
