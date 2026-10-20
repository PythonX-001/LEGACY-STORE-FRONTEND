import * as THREE from 'three';import gsap from 'gsap';import {ScrollTrigger} from 'gsap/ScrollTrigger';import D from './starPath';
const $=s=>document.querySelector(s);
export default function initScene(){
let raf,reveal;

const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,small=innerWidth<760||matchMedia('(pointer:coarse)').matches;
let R;try{R=new THREE.WebGLRenderer({canvas:$('#gl'),antialias:!small,alpha:true,powerPreference:'high-performance'})}catch(e){return}
R.setPixelRatio(Math.min(devicePixelRatio,small?1.5:2));R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.15;
const S=new THREE.Scene();S.fog=new THREE.FogExp2(0x050507,.04);
const cam=new THREE.PerspectiveCamera(45,1,.1,100);cam.position.set(0,0,9);
// reflection environment (soft boxes) so the metal has something to mirror
const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d');
const gr=x.createLinearGradient(0,0,0,256);gr.addColorStop(0,'#0a0b10');gr.addColorStop(.5,'#1b1e29');gr.addColorStop(1,'#050507');x.fillStyle=gr;x.fillRect(0,0,512,256);
[[60,70,90,26,'#fff'],[300,40,120,16,'#7fd4ff'],[430,110,50,60,'#c9d6ff'],[170,150,150,10,'#fff']].forEach(([a,b,w,h,k])=>{x.fillStyle=k;x.fillRect(a,b,w,h)});
const et=new THREE.CanvasTexture(c);et.mapping=THREE.EquirectangularReflectionMapping;et.colorSpace=THREE.SRGBColorSpace;
S.environment=new THREE.PMREMGenerator(R).fromEquirectangular(et).texture;
// the LEGACY star, extruded from the real logo path

const paths=D.split(/(?=M)/).filter(Boolean).map(s=>{const p=new THREE.Path(),re=/([MCZ])([^MCZ]*)/g;let m;
 while(m=re.exec(s)){const n=(m[2].match(/-?\d+\.?\d*/g)||[]).map(Number);
  if(m[1]==='M')p.moveTo(n[0],-n[1]);else if(m[1]==='C')for(let i=0;i<n.length;i+=6)p.bezierCurveTo(n[i],-n[i+1],n[i+2],-n[i+3],n[i+4],-n[i+5])}
 return p.getPoints(10)}).sort((a,b)=>Math.abs(THREE.ShapeUtils.area(b))-Math.abs(THREE.ShapeUtils.area(a)));
const shape=new THREE.Shape(paths[0]);shape.holes=paths.slice(1).map(p=>new THREE.Path(p));
const geo=new THREE.ExtrudeGeometry(shape,{depth:20,bevelEnabled:true,bevelThickness:3,bevelSize:2,bevelSegments:2,curveSegments:8});
geo.center();geo.computeBoundingBox();geo.scale(...Array(3).fill(5.2/(geo.boundingBox.max.y-geo.boundingBox.min.y)));
const star=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0xdfe6ee,metalness:1,roughness:.2,envMapIntensity:1.3,side:THREE.DoubleSide}));
// glow sprite
const gc=document.createElement('canvas');gc.width=gc.height=128;const gx=gc.getContext('2d'),gg=gx.createRadialGradient(64,64,0,64,64,64);gg.addColorStop(0,'rgba(127,212,255,.9)');gg.addColorStop(1,'rgba(127,212,255,0)');gx.fillStyle=gg;gx.fillRect(0,0,128,128);
const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(gc),blending:THREE.AdditiveBlending,opacity:.3,depthWrite:false}));glow.scale.set(11,11,1);glow.position.z=-1.5;
const g=new THREE.Group(),rig=new THREE.Group();g.add(star,glow);rig.add(g);S.add(rig);
const L=new THREE.PointLight(0x7fd4ff,40,30);L.position.set(-4,3,4);S.add(L);
// dust
const N=small?500:1400,pa=new Float32Array(N*3);for(let i=0;i<N*3;i+=3){pa[i]=(Math.random()-.5)*34;pa[i+1]=(Math.random()-.5)*22;pa[i+2]=(Math.random()-.5)*30-4}
const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pa,3));
const dust=new THREE.Points(pg,new THREE.PointsMaterial({size:.035,color:0x9fd8ff,transparent:true,opacity:.6,depthWrite:false}));S.add(dust);
function fit(){R.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()}
fit();addEventListener('resize',fit);
let mx=0,my=0;addEventListener('pointermove',e=>{mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5});
// gsap.context lets cleanup REVERT the hero/card "from" tweens. Without it, React StrictMode (dev)
// runs this twice and the 2nd gsap.from() reads opacity:0 as its end value -> hero/cards stay invisible.
const ctx=gsap.context(()=>{gsap.registerPlugin(ScrollTrigger);
 const off=small?0:3.4,up=small?2.6:0.4;
 gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:'main',start:'top top',end:'bottom bottom',scrub:reduce?true:1.2}})
 .to(cam.position,{z:6.2,duration:1},0).to(g.rotation,{y:Math.PI,x:.25,duration:1},0)
 .to(g.position,{x:off,y:up,duration:1.2},1).to(g.scale,{x:.5,y:.5,z:.5,duration:1.2},1).to(cam.position,{z:9,duration:1.2},1).to(g.rotation,{y:Math.PI*2,duration:1.2},1)
 .to(g.position,{x:0,y:0,duration:1},3).to(g.scale,{x:1.1,y:1.1,z:1.1,duration:1},3).to(g.rotation,{y:Math.PI*3,x:0,duration:1},3);
 if(!reduce){const h=gsap.from('.hero>*',{y:30,opacity:0,stagger:.12,duration:1,paused:true});reveal=()=>h.play();addEventListener('legacy:reveal',reveal,{once:true})}
 if(!reduce)gsap.from('.card',{y:40,opacity:0,stagger:.08,duration:.7,scrollTrigger:{trigger:'#grid',start:'top 85%'}})});
const clk=new THREE.Clock();
(function loop(){raf=requestAnimationFrame(loop);const t=clk.getElapsedTime();
 star.position.y=reduce?0:Math.sin(t*.8)*.12;star.rotation.y=reduce?0:Math.sin(t*.35)*.18;
 rig.rotation.y+=(mx*.4-rig.rotation.y)*.05;rig.rotation.x+=(my*.25-rig.rotation.x)*.05;
 dust.rotation.y=t*.012;R.render(S,cam)})();

return()=>{cancelAnimationFrame(raf);reveal&&removeEventListener('legacy:reveal',reveal);removeEventListener('resize',fit);ctx.revert();R.dispose()}}
