'use client';
import {useEffect,useState} from 'react';
const SIZES=['XS','S','M','L','XL','XXL'],COLORS=['obsidian','ash','bone'];
const blank={name:'',t:'tee',price:'',colors:['obsidian'],sizes:{S:'',M:'',L:'',XL:''},images:[]};
const MAX_IMG=8;
// Shrink big photos in the browser before uploading (max 1600px, WebP when the browser can) so uploads stay small and fast.
async function shrink(file,max=1600){
 if(!/^image\/(jpeg|png|webp)$/.test(file.type))return file;
 try{
  const bmp=await createImageBitmap(file),k=Math.min(1,max/Math.max(bmp.width,bmp.height));
  if(k===1&&file.size<1.5e6)return file;
  const c=document.createElement('canvas');c.width=Math.round(bmp.width*k);c.height=Math.round(bmp.height*k);
  c.getContext('2d').drawImage(bmp,0,0,c.width,c.height);
  const blob=await new Promise(r=>c.toBlob(r,'image/webp',.86));
  return blob&&blob.size<file.size?new File([blob],'photo',{type:blob.type}):file}
 catch{return file}}
function Editor({init,onSave,onDelete,reset,onUpload}){
 const [d,setD]=useState(()=>({...init,sizes:{...init.sizes},images:[...(init.images||[])],price:init.price===''?'':String(init.price/100)})),[busy,setBusy]=useState(false),[imgErr,setImgErr]=useState('');
 const tog=c=>setD(x=>({...x,colors:x.colors.includes(c)?x.colors.filter(k=>k!==c):[...x.colors,c]}));
 const addPhotos=async e=>{const files=[...e.target.files].slice(0,MAX_IMG-d.images.length);e.target.value='';if(!files.length)return;
  setBusy(true);setImgErr('');
  const r=await onUpload(await Promise.all(files.map(f=>shrink(f))));setBusy(false);
  if(r.error)return setImgErr(r.error);
  setD(x=>({...x,images:[...x.images,...r.urls].slice(0,MAX_IMG)}))};
 const movePhoto=(i,dir)=>setD(x=>{const a=[...x.images],j=i+dir;[a[i],a[j]]=[a[j],a[i]];return{...x,images:a}});
 const dropPhoto=i=>setD(x=>({...x,images:x.images.filter((_,k)=>k!==i)}));
 const go=async()=>{const ok=await onSave({...d,price:Math.round(parseFloat(d.price||0)*100)});if(ok&&reset)setD({...init,sizes:{...init.sizes},price:''})};
 return <div className="ad-card">
  <div className="ad-grid">
   <label>Name<input value={d.name} onChange={e=>setD({...d,name:e.target.value})}/></label>
   <label>Type<select value={d.t} onChange={e=>setD({...d,t:e.target.value})}><option value="hoodie">Hoodie</option><option value="tee">T-shirt</option><option value="top">Top</option></select></label>
   <label>Price (USD)<input type="number" min="0" step="0.01" value={d.price} onChange={e=>setD({...d,price:e.target.value})}/></label>
  </div>
  <div className="ad-sub">Colors</div>
  <div className="ad-row">{COLORS.map(c=><button type="button" key={c} className="chip" aria-pressed={d.colors.includes(c)} onClick={()=>tog(c)}>{c}</button>)}</div>
  <div className="ad-sub">Photos: the first one is the main photo (up to {MAX_IMG}). Click Save to apply.</div>
  <div className="ad-imgs">
   {d.images.map((u,i)=><div className="ad-img" key={u}><img src={u} alt=""/>{i===0&&<span className="ad-main">Main</span>}
    <div className="ad-img-bar"><button type="button" disabled={i===0} onClick={()=>movePhoto(i,-1)} aria-label="Move earlier">←</button><button type="button" disabled={i===d.images.length-1} onClick={()=>movePhoto(i,1)} aria-label="Move later">→</button><button type="button" onClick={()=>dropPhoto(i)} aria-label="Remove photo">×</button></div></div>)}
   {d.images.length<MAX_IMG&&<label className="ad-add">{busy?'Uploading…':'+ Add photos'}<input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden disabled={busy} onChange={addPhotos}/></label>}
  </div>
  {imgErr&&<div className="mini" style={{color:'#ff6b6b',marginTop:6}}>{imgErr}</div>}
  <div className="ad-sub">Sizes: stock per size (leave empty if the size is not offered)</div>
  <div className="ad-row">{SIZES.map(s=><label key={s} className="ad-size">{s}<input type="number" min="0" value={d.sizes[s]??''} onChange={e=>setD({...d,sizes:{...d.sizes,[s]:e.target.value}})}/></label>)}</div>
  <div className="ad-row" style={{marginTop:16}}>
   <button type="button" className="add" onClick={go}>{onDelete?'Save changes':'Add product'}</button>
   {onDelete&&<button type="button" className="add danger" onClick={()=>confirm(`Delete ${d.name}?`)&&onDelete()}>Delete</button>}
  </div></div>}
export default function Admin(){
 const [auth,setAuth]=useState(null),[pw,setPw]=useState(''),[list,setList]=useState([]),[msg,setMsg]=useState('');
 const load=async()=>setList(await(await fetch('/api/products',{cache:'no-store'})).json());
 useEffect(()=>{fetch('/api/admin/login').then(r=>r.json()).then(j=>{setAuth(!!j.ok);if(j.ok)load()})},[]);
 const login=async e=>{e.preventDefault();const r=await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw})});if(r.ok){setAuth(true);setMsg('');load()}else setMsg((await r.json().catch(()=>({}))).error||'Wrong password')};
 const upload=async files=>{const fd=new FormData();files.forEach(f=>fd.append('files',f));
  const r=await fetch('/api/uploads',{method:'POST',body:fd});
  if(r.status===401){setAuth(false);return{error:'Session expired: sign in again'}}
  const j=await r.json().catch(()=>({}));return r.ok?j:{error:j.error||`Upload failed (${r.status})`}};
 const send=async(url,method,body)=>{const r=await fetch(url,{method,headers:{'Content-Type':'application/json'},body:body&&JSON.stringify(body)});
  if(r.status===401){setAuth(false);return false}setMsg(r.ok?'Saved ✓':'Error: check the fields');await load();return r.ok};
 if(auth===null)return null;
 if(!auth)return <main className="ad"><form className="ad-card" onSubmit={login} style={{maxWidth:380,margin:'20vh auto 0'}}><div className="name" style={{marginBottom:14}}>LEGACY ADMIN</div><label>Password<input type="password" autoFocus value={pw} onChange={e=>setPw(e.target.value)}/></label><button className="add" style={{marginTop:14,width:'100%'}}>Sign in</button>{msg&&<div className="mini" style={{marginTop:8}}>{msg}</div>}</form></main>;
 return <main className="ad">
  <div className="ad-top"><h2>Products</h2><span className="mini">{msg}</span><a className="chip" href="/">View store</a></div>
  <div className="ad-sub">Add product</div>
  <Editor key="new" init={blank} reset onUpload={upload} onSave={b=>send('/api/products','POST',b)}/>
  <div className="ad-sub">Catalog ({list.length})</div>
  {list.map(p=><Editor key={p.id} init={p} onUpload={upload} onSave={b=>send('/api/products/'+p.id,'PUT',b)} onDelete={()=>send('/api/products/'+p.id,'DELETE')}/>)}
 </main>}
