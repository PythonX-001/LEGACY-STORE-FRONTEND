'use client';
import {useEffect,useMemo,useState} from 'react';
import gsap from 'gsap';import {ScrollToPlugin} from 'gsap/ScrollToPlugin';
import Intro from './Intro';import initScene from '@/lib/scene';
const COL={obsidian:'#1b1d24',ash:'#8a8e98',bone:'#e6e1d6'};
const SIL={tee:'M60 30L85 20Q100 34 115 20L140 30L182 64L160 94L140 82V200H60V82L40 94L18 64Z',
top:'M60 30L85 20Q100 34 115 20L140 30L188 150L166 160L140 92V200H60V92L34 160L12 150Z',
hoodie:'M58 46L84 36Q100 52 116 36L142 46L186 132L164 144L142 114V205H58V114L36 144L14 132ZM76 40Q100 -6 124 40Q100 66 76 40Z'};
const STAR='M100 78Q103 92 118 96Q103 100 100 116Q97 100 82 96Q97 92 100 78Z';
const money=c=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(c/100);
const Art=({t,col})=><svg viewBox="0 -10 200 230" aria-hidden="true"><path d={SIL[t]} fill={COL[col]} stroke="rgba(255,255,255,.28)" strokeWidth="1.4" fillRule="evenodd"/>{t==='hoodie'&&<path d="M72 150H128L136 184H64Z" fill="none" stroke="rgba(255,255,255,.18)"/>}<path d={STAR} fill={col==='bone'?'#111':'#e9ecf2'}/></svg>;
export default function Store({products}){
 const [filter,setFilter]=useState('All'),[sel,setSel]=useState({}),[cart,setCart]=useState([]),[open,setOpen]=useState(false),[msg,setMsg]=useState(''),[busy,setBusy]=useState(false),[ready,setReady]=useState(false),[form,setForm]=useState({name:'',phone:'',address:'',note:''});
 const byId=useMemo(()=>Object.fromEntries(products.map(p=>[p.id,p])),[products]);
 useEffect(()=>{try{setCart(JSON.parse(localStorage.getItem('legacy-cart')||'[]'))}catch{}},[]);
 useEffect(()=>{try{localStorage.setItem('legacy-cart',JSON.stringify(cart))}catch{}},[cart]);
 useEffect(()=>{if(!msg)return;const t=setTimeout(()=>setMsg(''),2400);return()=>clearTimeout(t)},[msg]);
 useEffect(()=>{
  gsap.registerPlugin(ScrollToPlugin);const stop=initScene();
  // let WebGL compile its shaders / draw first frames BEFORE the intro animates, so it never freezes mid-way
  let f=0,raf;const wait=()=>{if(++f>=4)setReady(true);else raf=requestAnimationFrame(wait)};raf=requestAnimationFrame(wait);
  const fail=setTimeout(()=>setReady(true),2500); // failsafe: never leave the intro waiting forever
  const click=e=>{const a=e.target.closest('a[href^="#"]');if(!a)return;const el=document.querySelector(a.getAttribute('href'));if(!el)return;e.preventDefault();gsap.to(window,{scrollTo:{y:el,autoKill:true},duration:1.3,ease:'power3.inOut'})};
  const key=e=>{if(e.key==='Escape')setOpen(false)};
  document.addEventListener('click',click);document.addEventListener('keydown',key);
  return()=>{cancelAnimationFrame(raf);clearTimeout(fail);stop&&stop();document.removeEventListener('click',click);document.removeEventListener('keydown',key)}},[]);
 const get=p=>sel[p.id]||{c:p.colors[0],s:Object.keys(p.sizes).find(k=>p.sizes[k]>0)||Object.keys(p.sizes)[0]};
 const pick=(p,patch)=>setSel(s=>({...s,[p.id]:{...get(p),...patch}}));
 const add=p=>{const s=get(p),stock=p.sizes[s.s]??0,k=[p.id,s.c,s.s].join('|'),ex=cart.find(x=>x.k===k);
  if(stock<1||(ex?.q||0)>=stock)return setMsg(stock<1?'Sold out':'Max stock reached');
  setCart(c=>ex?c.map(x=>x.k===k?{...x,q:x.q+1}:x):[...c,{k,id:p.id,c:s.c,s:s.s,q:1}]);setMsg(`${p.name} added to cart`);setOpen(true)};
 const lines=cart.map(l=>({...l,p:byId[l.id]})).filter(l=>l.p&&l.s in l.p.sizes);
 const qty=(l,d)=>{if(d>0&&l.q>=l.p.sizes[l.s])return setMsg('Max stock reached');setCart(c=>c.map(x=>x.k===l.k?{...x,q:x.q+d}:x).filter(x=>x.q>0))};
 const order=async e=>{e.preventDefault();setBusy(true);
  const r=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:lines.map(({id,c,s,q})=>({id,c,s,q})),customer:form})});
  const j=await r.json().catch(()=>({}));setBusy(false);
  if(!r.ok)return setMsg(j.error||'Something went wrong');
  setCart([]);location.href=j.url};
 const shown=products.filter(p=>filter==='All'||p.cat===filter);
 return(<>
 <Intro ready={ready} onOutro={()=>window.dispatchEvent(new Event('legacy:reveal'))}/>
 <canvas id="gl" aria-hidden="true"/><div className="vig"/><div className="grain"/>
 <header>
  <a className="logo" href="#top" aria-label="LEGACY home"><img src="/logo.svg" alt="LEGACY"/></a>
  <nav><a href="#shop">Collection</a><a href="#about">Craft</a><button className="cartbtn" onClick={()=>setOpen(true)} aria-label="Open cart">Cart<b>{lines.reduce((a,l)=>a+l.q,0)}</b></button></nav>
 </header>
 <main>
  <section className="hero" id="top">
   <div className="kick">Collection 001 · Hoodies · Tees · Tops</div>
   <h1>Wear what outlasts you</h1>
   <p className="sub">Heavyweight streetwear cut for the next era. Limited runs, worldwide shipping.</p>
   <a className="btn" href="#shop">Enter the collection</a>
   <div className="scrollhint">Scroll ↓</div>
  </section>
  <section className="manifesto"><p>Not made to follow the <em>moment.</em> Made to be what’s left <em>when it’s gone.</em></p></section>
  <section id="shop">
   <h2>Collection 001</h2>
   <div className="chips">{['All','Hoodies','T-shirts','Tops'].map(f=><button key={f} className="chip" aria-pressed={f===filter} onClick={()=>setFilter(f)}>{f}</button>)}</div>
   <div id="grid">{shown.map(p=>{const s=get(p),stock=p.sizes[s.s]??0;return(
    <article className="card" key={p.id}>
     <div className="art"><Art t={p.t} col={s.c}/></div>
     <div className="row"><span className="name">{p.name}</span><span className="price">{money(p.price)}</span></div>
     <div className="row"><span style={{display:'flex',gap:8}}>{p.colors.map(c=><button key={c} className="sw" aria-label={c} aria-pressed={c===s.c} style={{background:COL[c]}} onClick={()=>pick(p,{c})}/>)}</span><span className="mini">{s.c}</span></div>
     <div className="row" style={{justifyContent:'flex-start',gap:8,flexWrap:'wrap'}}>{Object.keys(p.sizes).map(z=><button key={z} className="sz" disabled={p.sizes[z]<1} aria-pressed={z===s.s} onClick={()=>pick(p,{s:z})}>{z}</button>)}</div>
     <div className="mini">{stock<1?'Sold out':stock<=3?`Only ${stock} left`:'In stock'}</div>
     <button className="add" disabled={stock<1} onClick={()=>add(p)}>{stock<1?'Sold out':'Add to cart'}</button>
    </article>)})}
    {!shown.length&&<div className="mini">No products here yet.</div>}
   </div>
  </section>
  <section id="about">
   <h2>Built to last</h2>
   <div className="feats">
    <div><h3>HEAVYWEIGHT</h3><p>Dense, structured fabrics that hold their shape wash after wash.</p></div>
    <div><h3>LIMITED RUNS</h3><p>Small batches per drop. When a colorway sells out, it stays out.</p></div>
    <div><h3>WORLDWIDE</h3><p>Shipped from our own stock to customers around the world.</p></div>
   </div>
  </section>
 </main>
 <footer><span>© LEGACY</span><span>Privacy · Terms · Shipping · Returns</span></footer>
 <div id="scrim" className={open?'on':''} onClick={()=>setOpen(false)}/>
 <aside id="drawer" className={open?'open':''} aria-label="Cart" aria-hidden={!open}>
  <div className="dh"><div className="name">YOUR CART</div><button className="x" onClick={()=>setOpen(false)} aria-label="Close cart">×</button></div>
  <div id="lines">{lines.length?lines.map(l=><div className="ln" key={l.k}><Art t={l.p.t} col={l.c}/><div><div className="name">{l.p.name}</div><div className="mini">{l.c} · {l.s}</div><div className="qty"><button onClick={()=>qty(l,-1)} aria-label="Decrease">−</button>{l.q}<button onClick={()=>qty(l,1)} aria-label="Increase">+</button></div></div><b>{money(l.p.price*l.q)}</b></div>):<div className="empty">Your cart is empty.</div>}</div>
  <div className="tot"><span>Subtotal</span><b>{money(lines.reduce((a,l)=>a+l.p.price*l.q,0))}</b></div>
  <div className="mini">Shipping is confirmed with you on WhatsApp.</div>
  {lines.length>0&&<form className="f" onSubmit={order}>
   <input required placeholder="Full name" autoComplete="name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
   <input required placeholder="Phone / WhatsApp number" autoComplete="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/>
   <input required placeholder="Delivery address (street, city, country)" autoComplete="street-address" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/>
   <input placeholder="Notes (optional)" value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/>
   <button className="btn" disabled={busy} style={{width:'100%',marginTop:8,textAlign:'center'}}>{busy?'Preparing…':'Order on WhatsApp'}</button>
  </form>}
 </aside>
 <div id="toast" className={msg?'on':''} role="status" aria-live="polite">{msg}</div>
 </>)}
