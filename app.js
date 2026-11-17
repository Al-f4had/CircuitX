let state={parts:[],wires:[],nextId:1,selected:null},pending=null,clockTimer=null,scale=1,pan={x:0,y:0};
const canvas=document.getElementById('canvas'),world=document.getElementById('world'),svg=document.getElementById('wires');
const PART_W=112,PIN_GAP=25,$=id=>document.getElementById(id),clone=obj=>JSON.parse(JSON.stringify(obj));
const rows=p=>Math.max(SPECS[p.type].ins.length,SPECS[p.type].outs.length,1),pinY=(p,i)=>p.y+31+i*PIN_GAP;
function addPart(type,x,y){state.parts.push({id:state.nextId++,type,x,y,out:Array(SPECS[type].outs.length).fill(0),lastClk:0});$('canvasHint').hidden=true;update();}
document.querySelectorAll('.item').forEach(el=>el.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',el.dataset.type)));
canvas.addEventListener('dragover',e=>e.preventDefault());
canvas.addEventListener('drop',e=>{e.preventDefault();const type=e.dataTransfer.getData('text/plain');if(!SPECS[type])return;const r=canvas.getBoundingClientRect();addPart(type,(e.clientX-r.left-pan.x)/scale-PART_W/2,(e.clientY-r.top-pan.y)/scale-45);});
function applyView(){world.style.transform='translate('+pan.x+'px,'+pan.y+'px) scale('+scale+')';$('zoomLabel').textContent=Math.round(scale*100)+'%';}
function zoomAt(next,cx=canvas.clientWidth/2,cy=canvas.clientHeight/2){const r=canvas.getBoundingClientRect(),x=cx-r.left,y=cy-r.top,wx=(x-pan.x)/scale,wy=(y-pan.y)/scale;scale=Math.max(.45,Math.min(2.1,next));pan.x=x-wx*scale;pan.y=y-wy*scale;applyView();}

$('fitBtn').onclick=()=>{if(!state.parts.length){scale=1;pan={x:0,y:0};applyView();return;}const minX=Math.min(...state.parts.map(p=>p.x)),minY=Math.min(...state.parts.map(p=>p.y)),maxX=Math.max(...state.parts.map(p=>p.x+PART_W)),maxY=Math.max(...state.parts.map(p=>p.y+90));scale=Math.max(.45,Math.min(1.25,(canvas.clientWidth-100)/(maxX-minX+100),(canvas.clientHeight-100)/(maxY-minY+100)));pan.x=(canvas.clientWidth-(maxX-minX)*scale)/2-minX*scale;pan.y=(canvas.clientHeight-(maxY-minY)*scale)/2-minY*scale;applyView();};
canvas.addEventListener('wheel',e=>{e.preventDefault();zoomAt(scale+(e.deltaY<0?.08:-.08),e.clientX,e.clientY);},{passive:false});
const activePointers=new Map();let gesture=null;
// Keep pinch gestures scoped correctly: canvas-only pinches zoom the circuit;
// gestures fully outside the canvas remain available for normal browser/page zoom.
function canvasTouchCount(touches){const r=canvas.getBoundingClientRect();return Array.from(touches).filter(t=>t.clientX>=r.left&&t.clientX<=r.right&&t.clientY>=r.top&&t.clientY<=r.bottom).length;}
function preventMixedCanvasPinch(e){if(e.touches.length>1){const inside=canvasTouchCount(e.touches);if(inside>0&&inside<e.touches.length)e.preventDefault();}}
document.addEventListener('touchstart',preventMixedCanvasPinch,{passive:false,capture:true});
document.addEventListener('touchmove',preventMixedCanvasPinch,{passive:false,capture:true});

canvas.addEventListener('pointerdown',e=>{
 if(e.target.closest('.box')||e.target.closest('svg path'))return;
 if(e.pointerType==='mouse'&&e.button!==0&&e.button!==1)return;
 activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 try{canvas.setPointerCapture(e.pointerId);}catch(err){}
 if(activePointers.size===1){gesture={kind:'pan',x:e.clientX,y:e.clientY,panX:pan.x,panY:pan.y};canvas.classList.add('panning');}
 else if(activePointers.size===2){const pts=[...activePointers.values()],dx=pts[1].x-pts[0].x,dy=pts[1].y-pts[0].y;gesture={kind:'pinch',distance:Math.hypot(dx,dy),scale,midX:(pts[0].x+pts[1].x)/2,midY:(pts[0].y+pts[1].y)/2};}
});
canvas.addEventListener('pointermove',e=>{
 if(!activePointers.has(e.pointerId))return;
 activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(activePointers.size>=2){const pts=[...activePointers.values()].slice(0,2),dx=pts[1].x-pts[0].x,dy=pts[1].y-pts[0].y,distance=Math.hypot(dx,dy),midX=(pts[0].x+pts[1].x)/2,midY=(pts[0].y+pts[1].y)/2;
  if(!gesture||gesture.kind!=='pinch')gesture={kind:'pinch',distance,scale,midX,midY};
  const factor=distance/Math.max(1,gesture.distance),next=gesture.scale*factor,r=canvas.getBoundingClientRect(),x=midX-r.left,y=midY-r.top,worldX=(x-pan.x)/scale,worldY=(y-pan.y)/scale;
  const previousMidX=gesture.midX-r.left,previousMidY=gesture.midY-r.top;
  const anchorX=(previousMidX-pan.x)/scale,anchorY=(previousMidY-pan.y)/scale;
  scale=Math.max(.45,Math.min(2.1,next));pan.x=x-anchorX*scale;pan.y=y-anchorY*scale;applyView();
  gesture={kind:'pinch',distance,scale,midX,midY};return;
 }
 if(gesture&&gesture.kind==='pan'){pan.x=gesture.panX+e.clientX-gesture.x;pan.y=gesture.panY+e.clientY-gesture.y;applyView();}
});
function endCanvasPointer(e){activePointers.delete(e.pointerId);if(activePointers.size===1){const p=[...activePointers.values()][0];gesture={kind:'pan',x:p.x,y:p.y,panX:pan.x,panY:pan.y};}else if(activePointers.size===0){gesture=null;canvas.classList.remove('panning');}}
canvas.addEventListener('pointerup',endCanvasPointer);canvas.addEventListener('pointercancel',endCanvasPointer);
function update(){const ok=simulate(state);render(ok);try{localStorage.setItem('circuitx',JSON.stringify(state));}catch(e){}}
function shapeSvg(type){const d={AND:'<path d="M12 10 H49 A27 27 0 0 1 49 64 H12 Z"/>',OR:'<path d="M10 10 Q34 37 10 64 Q51 64 83 37 Q51 10 10 10 Z"/>',NOT:'<path d="M14 10 L78 37 L14 64 Z"/><circle cx="84" cy="37" r="6" class="bubble"/>',NAND:'<path d="M12 10 H49 A27 27 0 0 1 49 64 H12 Z"/><circle cx="83" cy="37" r="6" class="bubble"/>',NOR:'<path d="M10 10 Q34 37 10 64 Q51 64 83 37 Q51 10 10 10 Z"/><circle cx="89" cy="37" r="6" class="bubble"/>',XOR:'<path d="M20 10 Q44 37 20 64 Q61 64 93 37 Q61 10 20 10 Z"/><path d="M10 10 Q34 37 10 64"/>'};return '<svg class="gate-art" viewBox="0 0 104 74" aria-hidden="true"><g>'+d[type]+'</g></svg>';}
function componentMarkup(p){if(GATES.includes(p.type))return shapeSvg(p.type)+'<span class="part-label">'+p.type+'</span>';if(p.type==='LED')return '<div class="bulb '+(inputValue(state,p,0)?'lit':'')+'"><div class="bulb-glass"></div><div class="bulb-neck"></div><div class="bulb-base"></div></div><span class="part-label">LED</span>';if(p.type==='SWITCH'||p.type==='CLOCK')return '<div class="toggle-track '+(p.out[0]?'active':'')+'"><span></span></div><span class="part-label">'+(p.type==='CLOCK'?'CLOCK':'SWITCH')+'</span><span class="switch-value">'+p.out[0]+'</span>';return '<div class="chip-face"><span>'+(p.type==='DFF'?'D':'4')+'</span><small>'+(p.type==='DFF'?'FLIP-FLOP':'REGISTER')+'</small></div>';}
function makePin(p,side,i,name){const pin=document.createElement('button');pin.type='button';pin.className='pin '+side;pin.style.top=(25+i*PIN_GAP)+'px';pin.title=name;pin.setAttribute('aria-label',side+'put '+name);if(pending&&pending.id===p.id&&pending.pin===i&&side==='out')pin.classList.add('pending');pin.addEventListener('pointerdown',e=>e.stopPropagation());pin.addEventListener('click',e=>{e.stopPropagation();pinClick(p,side,i);});return pin;}
function render(ok){world.querySelectorAll('.box').forEach(b=>b.remove());svg.innerHTML='';for(const p of state.parts){const box=document.createElement('div');box.className='box '+p.type;box.style.left=p.x+'px';box.style.top=p.y+'px';box.style.height=(55+rows(p)*PIN_GAP)+'px';box.innerHTML=componentMarkup(p);if(p.id===state.selected)box.classList.add('selected');if(p.type==='LED'&&inputValue(state,p,0))box.classList.add('on');box.addEventListener('pointerdown',e=>startDrag(e,p));SPECS[p.type].ins.forEach((n,i)=>box.appendChild(makePin(p,'in',i,n)));SPECS[p.type].outs.forEach((n,i)=>box.appendChild(makePin(p,'out',i,n)));world.appendChild(box);}
for(const w of state.wires){const a=getPart(state,w.from),b=getPart(state,w.to);if(!a||!b)continue;const x1=a.x+PART_W,y1=pinY(a,w.fromPin)+6,x2=b.x,y2=pinY(b,w.toPin)+6,dx=Math.max(35,Math.abs(x2-x1)*.48);const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d','M '+x1+' '+y1+' C '+(x1+dx)+' '+y1+', '+(x2-dx)+' '+y2+', '+x2+' '+y2);path.setAttribute('class','wire'+(a.out[w.fromPin]?' active':''));path.addEventListener('click',()=>{state.wires=state.wires.filter(v=>v!==w);update();});svg.appendChild(path);}showInfo(ok);renderTruthTable();}
function pinClick(p,side,i){if(side==='out'){pending={id:p.id,pin:i};render(true);return;}if(!pending||pending.id===p.id)return;state.wires=state.wires.filter(w=>!(w.to===p.id&&w.toPin===i));state.wires.push({from:pending.id,fromPin:pending.pin,to:p.id,toPin:i});pending=null;update();}
function startDrag(e,p){if(e.target.closest('.pin'))return;e.preventDefault();const sx=e.clientX,sy=e.clientY,ox=p.x,oy=p.y;state.selected=p.id;let moved=false;const move=ev=>{if(Math.abs(ev.clientX-sx)+Math.abs(ev.clientY-sy)>4)moved=true;p.x=ox+(ev.clientX-sx)/scale;p.y=oy+(ev.clientY-sy)/scale;render(true);};const up=()=>{document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',up);if(!moved&&(p.type==='SWITCH'||p.type==='CLOCK'))p.out[0]=1-p.out[0];update();};document.addEventListener('pointermove',move);document.addEventListener('pointerup',up);}
function showInfo(ok){const p=getPart(state,state.selected);$('noSel').hidden=!!p;$('selInfo').hidden=!p;if(p){$('selName').textContent=p.type;$('selId').textContent='Component #'+p.id;$('selIcon').textContent=GATES.includes(p.type)?'⌁':p.type==='LED'?'●':p.type==='SWITCH'?'◉':'◇';$('selOut').textContent=p.type==='LED'?(inputValue(state,p,0)?'ON · 1':'OFF · 0'):p.out.join('  ')||'—';$('selInputs').innerHTML='';SPECS[p.type].ins.forEach((name,i)=>{const row=document.createElement('div');row.className='input-row';row.innerHTML='<span>'+name+'</span><strong>'+inputValue(state,p,i)+'</strong>';$('selInputs').appendChild(row);});}
const warnings=findWarnings(state),msg=$('messages');msg.innerHTML='';if(!state.parts.length)msg.innerHTML='<p class="empty-state">Add components to begin experimenting.</p>';else msg.innerHTML='<p class="'+(ok?'ok':'msg-err')+'">'+(ok?'Circuit simulation is stable.':'Feedback loop detected: circuit did not settle.')+'</p>';warnings.forEach(w=>{const el=document.createElement('p');el.className='msg-warn';el.textContent=w;msg.appendChild(el);});$('workspaceStatus').textContent=state.parts.length+' components · '+state.wires.length+' connections';}
function renderTruthTable(){
 const host=$('truth-wrap')||document.querySelector('.truth-wrap');
 const inputsAll=state.parts.filter(p=>p.type==='SWITCH').sort((a,b)=>a.id-b.id);
 const outputsAll=state.parts.filter(p=>p.type==='LED').sort((a,b)=>a.id-b.id);
 $('tableMeta').textContent=inputsAll.length+' inputs · '+outputsAll.length+' outputs';
 const groups=[],seen=new Set(),adj=new Map(state.parts.map(p=>[p.id,new Set()]));
 state.wires.forEach(w=>{if(adj.has(w.from)&&adj.has(w.to)){adj.get(w.from).add(w.to);adj.get(w.to).add(w.from);}});
 state.parts.forEach(p=>{if(seen.has(p.id))return;const stack=[p.id],ids=[];seen.add(p.id);while(stack.length){const id=stack.pop();ids.push(id);for(const next of adj.get(id)||[]){if(!seen.has(next)){seen.add(next);stack.push(next);}}}const parts=ids.map(id=>getPart(state,id)).filter(Boolean);const ins=parts.filter(x=>x.type==='SWITCH').sort((a,b)=>a.id-b.id),outs=parts.filter(x=>x.type==='LED').sort((a,b)=>a.id-b.id);if(ins.length&&outs.length)groups.push({parts,ins,outs});});
 const title=$('truthHint');title.textContent=groups.length?groups.length+' independent circuit'+(groups.length===1?'':'s')+' · each table uses only its connected switches':'Connect switches through gates to LEDs. Independent wired groups get separate tables.';
 let container=document.getElementById('truthTables');if(!container){container=document.createElement('div');container.id='truthTables';container.className='truth-tables';const old=$('truthTable');if(old)old.remove();const scroll=document.querySelector('.table-scroll');if(scroll)scroll.replaceWith(container);else host.appendChild(container);}
 container.innerHTML='';
 if(!groups.length){const empty=document.createElement('p');empty.className='empty-table';empty.textContent='Connect at least one switch and one LED through a circuit. Each disconnected circuit will appear separately.';container.appendChild(empty);return;}
 groups.forEach((group,index)=>{
  const {ins,outs}=group,section=document.createElement('section');section.className='truth-circuit';
  const heading=document.createElement('div');heading.className='truth-circuit-heading';const name=document.createElement('strong');name.textContent='Circuit '+(index+1);const meta=document.createElement('small');meta.textContent=ins.length+' input'+(ins.length===1?'':'s')+' · '+outs.length+' LED'+(outs.length===1?'':'s');heading.append(name,meta);section.appendChild(heading);
  if(ins.length>8){const limit=document.createElement('p');limit.className='empty-table';limit.textContent='This circuit has more than 8 switches; its table is limited to 256 combinations.';section.appendChild(limit);container.appendChild(section);return;}
  const table=document.createElement('table');table.className='truth-table';const thead=document.createElement('thead'),head=document.createElement('tr');
  ins.forEach((p,i)=>{const th=document.createElement('th');th.textContent='S'+(i+1);head.appendChild(th);});
  outs.forEach((p,i)=>{const th=document.createElement('th');th.textContent='LED '+(i+1);head.appendChild(th);});thead.appendChild(head);table.appendChild(thead);
  const tbody=document.createElement('tbody');
  for(let n=0;n<(1<<ins.length);n++){const test=clone(state);ins.forEach((orig,i)=>{getPart(test,orig.id).out[0]=(n>>(ins.length-1-i))&1;});const stable=simulate(test),tr=document.createElement('tr');ins.forEach(p=>{const td=document.createElement('td');td.textContent=getPart(test,p.id).out[0];tr.appendChild(td);});outs.forEach(p=>{const td=document.createElement('td');td.textContent=stable?inputValue(test,getPart(test,p.id),0):'—';tr.appendChild(td);});if(ins.every((p,i)=>((n>>(ins.length-1-i))&1)===p.out[0]))tr.className='current-row';tbody.appendChild(tr);}
  table.appendChild(tbody);const scroll=document.createElement('div');scroll.className='table-scroll';scroll.appendChild(table);section.appendChild(scroll);container.appendChild(section);
 });
}
$('delBtn').onclick=()=>{const id=state.selected;state.parts=state.parts.filter(p=>p.id!==id);state.wires=state.wires.filter(w=>w.from!==id&&w.to!==id);state.selected=null;update();};
$('resetBtn').onclick=()=>{state={parts:[],wires:[],nextId:1,selected:null};pending=null;$('canvasHint').hidden=false;update();};
$('clockBtn').onclick=e=>{if(clockTimer){clearInterval(clockTimer);clockTimer=null;e.target.textContent='Auto clock: OFF';return;}e.target.textContent='Auto clock: ON';clockTimer=setInterval(()=>{state.parts.filter(p=>p.type==='CLOCK').forEach(p=>p.out[0]=1-p.out[0]);update();},1000);};
try{const saved=JSON.parse(localStorage.getItem('circuitx'));if(saved&&Array.isArray(saved.parts)&&Array.isArray(saved.wires))state=saved;}catch(e){}
applyView();update();