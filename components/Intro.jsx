'use client';
import {useEffect,useRef,useState} from 'react';import gsap from 'gsap';
// ready: the heavy page setup (WebGL scene) has finished, so the animation can run smoothly.
// onOutro: fired as the zoom-out starts (used to start the hero reveal underneath).
//
// Timeline (~2.5s once ready):
//   0.0  logo/track/counter fade in (CSS, starts at first paint)
//   0.0 → 1.3  loading bar fills + counter 000 → 100
//   1.45 → 2.0 logo + bar zoom IN toward the viewer while fading out
//   1.55 → 2.5 black panel fades away; the page behind settles from a slight zoom (1.12 → 1)
// The full zoom version plays for everyone. ?intro=calm gives a fade-only version (no zoom).
const PAGE='#gl,.hero';
export default function Intro({ready,onOutro}){
 const root=useRef(),cb=useRef(onOutro),calm=useRef(false),[done,setDone]=useState(false);
 cb.current=onOutro;
 useEffect(()=>{
  // the zoom always plays; add ?intro=calm to the URL to preview the no-zoom version
  calm.current=new URLSearchParams(location.search).get('intro')==='calm';
  document.documentElement.style.overflow='hidden';
  return()=>{document.documentElement.style.overflow=''}
 },[]);
 useEffect(()=>{
  if(!ready||done||!root.current)return;
  const zoom=!calm.current,n={v:0},num=root.current.querySelector('.in-num');
  const tl=gsap.timeline({onComplete:()=>{
   gsap.set(PAGE,{clearProps:'transform'});
   document.documentElement.style.overflow='';setDone(true)}});
  tl.fromTo('.in-bar',{scaleX:0},{scaleX:1,duration:1.3,ease:'power2.inOut'},0)
   .to(n,{v:100,duration:1.3,ease:'power2.inOut',onUpdate:()=>{num.textContent=String(Math.round(n.v)).padStart(3,'0')}},0)
   .addLabel('out','+=.15');
  if(zoom)tl.set(PAGE,{scale:1.12,transformOrigin:'50% 50%'},0); // page waits slightly zoomed-in under the panel
  tl.to('.in-ui',zoom?{scale:2.2,opacity:0,duration:.55,ease:'power2.in'}:{opacity:0,duration:.5,ease:'power1.in'},'out')
   .call(()=>cb.current?.(),null,'out+=.1')
   .to(root.current,{opacity:0,duration:zoom?.95:.7,ease:'power1.inOut'},'out+=.1');
  if(zoom)tl.to(PAGE,{scale:1,duration:1.05,ease:'power3.out'},'out+=.1');
  return()=>{tl.kill();gsap.set(PAGE,{clearProps:'transform'})}
 },[ready,done]);
 if(done)return null;
 return <div className="intro" ref={root}><div className="in-ui"><img className="in-logo" src="/logo.svg" alt="LEGACY"/><div className="in-track"><div className="in-bar"/></div><div className="in-meta"><span>COLLECTION 001</span><span className="in-num">000</span></div></div></div>}
