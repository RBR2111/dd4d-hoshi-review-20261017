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
  for(const a of doc.querySelectorAll('a[href]')){const name=a.getAttribute('href').replace(/^\.\//,'');if(files[name]){a.href=URL.createObjectURL(new Blob([from64(files[name])],{type:'image/png'}));if(a.hasAttribute('download'))a.setAttribute('download',name.split('/').pop());}}
  document.getElementById('password').value='';delete window.hoshiPayload;
  document.documentElement.replaceWith(doc.documentElement);
 }catch(error){message.textContent='パスワードを確認して、もう一度お試しください。';button.disabled=false;}
});
