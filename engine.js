

const SPECS = {
  SWITCH: { ins: [], outs: ['out'] },
  CLOCK:  { ins: [], outs: ['out'] },
  LED:    { ins: ['in'], outs: [] },
  AND:  { ins: ['A', 'B'], outs: ['out'] },  OR:  { ins: ['A', 'B'], outs: ['out'] },
  NAND: { ins: ['A', 'B'], outs: ['out'] },  NOR: { ins: ['A', 'B'], outs: ['out'] },
  XOR:  { ins: ['A', 'B'], outs: ['out'] },  NOT: { ins: ['A'], outs: ['out'] },
  DFF:  { ins: ['D', 'CLK'], outs: ['Q'] },
  REG4: { ins: ['D0', 'D1', 'D2', 'D3', 'CLK'], outs: ['Q0', 'Q1', 'Q2', 'Q3'] }
};
const GATES = ['AND', 'OR', 'NAND', 'NOR', 'XOR', 'NOT'];
const isMemory = (p) => p.type === 'DFF' || p.type === 'REG4';

function getPart(state, id) { return state.parts.find((p) => p.id === id); }

function inputValue(state, p, i) {
  const w = state.wires.find((w) => w.to === p.id && w.toPin === i);
  return w ? getPart(state, w.from).out[w.fromPin] : 0;
}

function gateOutput(type, a, b) {
  if (type === 'AND') return a & b;
  if (type === 'OR') return a | b;
  if (type === 'NAND') return 1 - (a & b);
  if (type === 'NOR') return 1 - (a | b);
  if (type === 'XOR') return a ^ b;
  return 1 - a;
}

function settle(state) {
  for (let round = 0; round < 100; round++) {
    let changed = false;
    for (const p of state.parts) {
      if (!GATES.includes(p.type)) continue;
      const v = gateOutput(p.type, inputValue(state, p, 0), inputValue(state, p, 1));
      if (v !== p.out[0]) { p.out[0] = v; changed = true; }
    }
    if (!changed) return true;
  }
  return false;
}

function clockEdges(state) {
  const updates = [];
  for (const p of state.parts.filter(isMemory)) {
    const clkPin = SPECS[p.type].ins.length - 1;
    const clk = inputValue(state, p, clkPin);
    if (clk === 1 && p.lastClk === 0) {
      updates.push({ p, data: p.out.map((_, i) => inputValue(state, p, i)) });
    }
    p.lastClk = clk;
  }
  updates.forEach((u) => u.data.forEach((v, i) => (u.p.out[i] = v)));
  return updates.length > 0;
}

function simulate(state) {
  let ok = settle(state);
  for (let i = 0; i < 10 && ok && clockEdges(state); i++) ok = settle(state);
  return ok;
}

function findWarnings(state) {
  const list = [];
  for (const p of state.parts) {
    SPECS[p.type].ins.forEach((name, i) => {
      if (!state.wires.some((w) => w.to === p.id && w.toPin === i))
        list.push(p.type + ' ' + p.id + ': input ' + name + ' is not connected (read as 0)');
    });
  }
  return list;
}
