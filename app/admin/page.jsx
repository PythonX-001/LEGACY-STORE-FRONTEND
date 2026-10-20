'use client';
import {useEffect,useState} from 'react';
const SIZES=['XS','S','M','L','XL','XXL'],COLORS=['obsidian','ash','bone'];
const blank={name:'',t:'tee',price:'',colors:['obsidian'],sizes:{S:'',M:'',L:'',XL:''}};
function Editor({init,onSave,onDelete,reset}){
 const [d,setD]=useState(()=>({...init,sizes:{...init.sizes},price:init.price===''?'':String(init.price/100)}));
 const tog=c=>setD(x=>({...x,colors:x.colors.includes(c)?x.colors.filter(k=>k!==c):[...x.colors,c]}));
 const go=async()=>{const ok=await onSave({...d,price:Math.round(parseFloat(d.price||0)*100)});if(ok&&reset)setD({...init,sizes:{...init.sizes},price:''})};
 return <div className="ad-card">
  <div className="ad-grid">
   <label>Name<input value={d.name} onChange={e=>setD({...d,name:e.target.value})}/></label>
   <label>Type<select value={d.t} onChange={e=>setD({...d,t:e.target.value})}><option value="hoodie">Hoodie</option><option value="tee">T-shirt</option><option value="top">Top</option></select></label>
   <label>Price (USD)<input type="number" min="0" step="0.01" value={d.price} onChange={e=>setD({...d,price:e.target.value})}/></label>
  </div>
  <div className="ad-sub">Colors</div>
  <div className="ad-row">{COLORS.map(c=><button type="button" key={c} className="chip" aria-pressed={d.colors.includes(c)} onClick={()=>tog(c)}>{c}</button>)}</div>
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
 const send=async(url,method,body)=>{const r=await fetch(url,{method,headers:{'Content-Type':'application/json'},body:body&&JSON.stringify(body)});
  if(r.status===401){setAuth(false);return false}setMsg(r.ok?'Saved ✓':'Error: check the fields');await load();return r.ok};
 if(auth===null)return null;
 if(!auth)return <main className="ad"><form className="ad-card" onSubmit={login} style={{maxWidth:380,margin:'20vh auto 0'}}><div className="name" style={{marginBottom:14}}>LEGACY ADMIN</div><label>Password<input type="password" autoFocus value={pw} onChange={e=>setPw(e.target.value)}/></label><button className="add" style={{marginTop:14,width:'100%'}}>Sign in</button>{msg&&<div className="mini" style={{marginTop:8}}>{msg}</div>}</form></main>;
 return <main className="ad">
  <div className="ad-top"><h2>Products</h2><span className="mini">{msg}</span><a className="chip" href="/">View store</a></div>
  <div className="ad-sub">Add product</div>
  <Editor key="new" init={blank} reset onSave={b=>send('/api/products','POST',b)}/>
  <div className="ad-sub">Catalog ({list.length})</div>
  {list.map(p=><Editor key={p.id} init={p} onSave={b=>send('/api/products/'+p.id,'PUT',b)} onDelete={()=>send('/api/products/'+p.id,'DELETE')}/>)}
 </main>}
