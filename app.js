// app.js - connects the screen (HTML/CSS) with the engine (engine.js).
// STATE = one object that stores everything about the circuit.
// Every change follows the same 3 steps:  change state -> simulate -> draw.
let state = { parts: [], wires: [], nextId: 1, selected: null };
let pending = null;          // output pin clicked first, waiting for an input pin
let clockTimer = null;

const canvas = document.getElementById('canvas');
const svg = document.getElementById('wires');
const W = 90, PIN_GAP = 24;  // box width, space between pins

const rows = (p) => Math.max(SPECS[p.type].ins.length, SPECS[p.type].outs.length, 1);
const pinY = (p, i) => p.y + 20 + i * PIN_GAP;   // y position of pin number i

// ---------- adding parts ----------
function addPart(type, x, y) {
  const outs = SPECS[type].outs.length;
  state.parts.push({ id: state.nextId++, type, x, y, out: Array(outs).fill(0), lastClk: 0 });
  update();
}

// drag from toolbox and drop on canvas
document.querySelectorAll('.item').forEach((el) =>
  el.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', el.dataset.type)));
canvas.addEventListener('dragover', (e) => e.preventDefault());
canvas.addEventListener('drop', (e) => {
  e.preventDefault();
  const r = canvas.getBoundingClientRect();
  addPart(e.dataTransfer.getData('text/plain'), e.clientX - r.left - W / 2, e.clientY - r.top - 20);
});

// ---------- the main loop: simulate, draw, save ----------
function update() {
  const ok = simulate(state);
  render(ok);
  localStorage.setItem('circuitx', JSON.stringify(state));
}

// ---------- drawing ----------
function render(ok) {
  canvas.querySelectorAll('.box').forEach((b) => b.remove());   // remove old parts
  svg.innerHTML = '';                                           // remove old wires

  for (const p of state.parts) {
    const box = document.createElement('div');
    box.className = 'box ' + p.type;
    box.style.left = p.x + 'px';
    box.style.top = p.y + 'px';
    box.style.height = 28 + rows(p) * PIN_GAP + 'px';
    box.textContent = p.type === 'REG4' ? 'REG' : p.type === 'DFF' ? 'D-FF' : p.type;
    if (p.id === state.selected) box.classList.add('selected');
    if (lit(p)) box.classList.add('on');
    if (p.type === 'SWITCH' || p.type === 'CLOCK') box.textContent += ' = ' + p.out[0];
    box.addEventListener('mousedown', (e) => startDrag(e, p));

    SPECS[p.type].ins.forEach((name, i) => box.appendChild(makePin(p, 'in', i, name)));
    SPECS[p.type].outs.forEach((name, i) => box.appendChild(makePin(p, 'out', i, name)));
    canvas.appendChild(box);
  }

  for (const w of state.wires) {                               // draw wires as SVG lines
    const a = getPart(state, w.from), b = getPart(state, w.to);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', a.x + W);  line.setAttribute('y1', pinY(a, w.fromPin) + 6);
    line.setAttribute('x2', b.x);      line.setAttribute('y2', pinY(b, w.toPin) + 6);
    if (a.out[w.fromPin] === 1) line.classList.add('on');
    line.addEventListener('click', () => { state.wires = state.wires.filter((x) => x !== w); update(); });
    svg.appendChild(line);
  }
  showInfo(ok);
}

// Is this part "on"? Switch/clock/gate use their output, LED uses its input
function lit(p) {
  return p.type === 'LED' ? inputValue(state, p, 0) === 1 : p.type === 'SWITCH' || p.type === 'CLOCK' ? p.out[0] === 1 : false;
}

function makePin(p, side, i, name) {
  const pin = document.createElement('div');
  pin.className = 'pin ' + side;
  pin.style.top = 14 + i * PIN_GAP + 'px';
  pin.title = name;
  if (pending && pending.id === p.id && pending.pin === i && side === 'out') pin.classList.add('pending');
  pin.addEventListener('mousedown', (e) => e.stopPropagation());   // do not start dragging the box
  pin.addEventListener('click', (e) => { e.stopPropagation(); pinClick(p, side, i); });
  return pin;
}

// ---------- wiring: click output pin, then input pin ----------
function pinClick(p, side, i) {
  if (side === 'out') { pending = { id: p.id, pin: i }; render(true); return; }
  if (!pending || pending.id === p.id) return;
  state.wires = state.wires.filter((w) => !(w.to === p.id && w.toPin === i));  // one wire per input
  state.wires.push({ from: pending.id, fromPin: pending.pin, to: p.id, toPin: i });
  pending = null;
  update();
}

// ---------- moving parts, and clicking switches ----------
function startDrag(e, p) {
  const sx = e.clientX, sy = e.clientY, ox = p.x, oy = p.y;
  let moved = false;
  state.selected = p.id;
  function move(ev) {
    if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) > 3) moved = true;
    p.x = ox + ev.clientX - sx;  p.y = oy + ev.clientY - sy;
    render(true);
  }
  function up() {
    document.removeEventListener('mousemove', move);
    document.removeEventListener('mouseup', up);
    if (!moved && (p.type === 'SWITCH' || p.type === 'CLOCK')) p.out[0] = 1 - p.out[0];  // a click toggles
    update();
  }
  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', up);
}

// ---------- side panel and bottom panel ----------
function showInfo(ok) {
  const sel = getPart(state, state.selected);
  document.getElementById('noSel').hidden = !!sel;
  document.getElementById('selInfo').hidden = !sel;
  if (sel) {
    document.getElementById('selName').textContent = sel.type + ' ' + sel.id;
    document.getElementById('selOut').textContent = sel.type === 'LED' ? inputValue(state, sel, 0) : sel.out.join(' ') || '-';
  }
  const msg = document.getElementById('messages');
  msg.innerHTML = ok ? '<p class="ok">Circuit settled.</p>' : '<p class="msg-err">This circuit never settles (a feedback loop keeps changing).</p>';
  findWarnings(state).forEach((w) => (msg.innerHTML += '<p class="msg-warn">' + w + '</p>'));
  document.getElementById('values').innerHTML = state.parts
    .map((p) => '<tr><td>' + p.type + ' ' + p.id + '</td><td>' + (p.type === 'LED' ? inputValue(state, p, 0) : p.out.join(' ')) + '</td></tr>').join('');
}

// ---------- buttons ----------
document.getElementById('delBtn').addEventListener('click', () => {
  state.parts = state.parts.filter((p) => p.id !== state.selected);
  state.wires = state.wires.filter((w) => w.from !== state.selected && w.to !== state.selected);
  state.selected = null;
  update();
});
document.getElementById('resetBtn').addEventListener('click', () => {
  state = { parts: [], wires: [], nextId: 1, selected: null };
  update();
});
document.getElementById('clockBtn').addEventListener('click', (e) => {   // auto clock toggles every second
  if (clockTimer) { clearInterval(clockTimer); clockTimer = null; e.target.textContent = 'Auto clock: OFF'; return; }
  e.target.textContent = 'Auto clock: ON';
  clockTimer = setInterval(() => {
    state.parts.filter((p) => p.type === 'CLOCK').forEach((p) => (p.out[0] = 1 - p.out[0]));
    update();
  }, 1000);
});

// ---------- start: load the saved circuit if there is one ----------
try { const saved = JSON.parse(localStorage.getItem('circuitx')); if (saved && saved.parts) state = saved; } catch (e) {}
update();
