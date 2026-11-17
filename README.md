# CircuitX - Milestone 3 Beta

A digital circuit simulator that runs in the browser. Drag logic gates onto the canvas, connect them with wires, click switches, and watch the outputs change.

## Files

| File | What it does |
|---|---|
| `index.html` | The page structure: toolbox, canvas, details panel and buttons |
| `style.css` | The look and layout of the page |
| `engine.js` | The logic: gate rules, flip-flops, registers and the signal propagation loop |
| `app.js` | Connects the page to the engine: drag and drop, wires, clicks and drawing |

## How to run

1. Put all four files in the same folder.
2. Open `index.html` in Chrome or Edge (double-click it).

Do not open only `app.js` or `engine.js` on their own. The page needs all four files together.

## How to use

| Action | Result |
|---|---|
| Drag an item from the left toolbox onto the canvas | Adds that part |
| Click a part and drag it | Moves the part |
| Click an output pin (right side of a box), then an input pin (left side of another box) | Draws a wire |
| Click a wire | Deletes it |
| Click a Switch or Clock | Toggles it between 0 and 1 |
| Click a part once | Selects it and shows details on the right |
| Delete part (right panel) | Removes the selected part and its wires |
| Auto clock button | Turns the clock on or off (ticks every second) |
| Reset | Clears the whole circuit |

Your circuit is saved automatically in the browser, so it's still there after you reload.

## Parts

- **Logic gates:** AND, OR, NOT, NAND, NOR, XOR
- **Input and output:** Switch (input), Clock (input), LED (output)
- **Memory:** D flip-flop (stores 1 bit), 4-bit register (stores 4 bits)

## Known limits (beta)

- No login or online saving yet. Saving is only in your own browser.
- A circuit that never settles (for example a NOT gate wired to itself) shows a message instead of running forever.
- Input pins with no wire are read as 0, and the bottom panel shows a warning for them.

## Tested so far

- All 5 two-input gates match their truth tables.
- D flip-flop changes only on the clock's rising edge.
- 4-bit register stores 1011 correctly.
- A NOT gate wired to itself is detected as unstable.
- An SR latch made from 2 NOR gates holds its value.

## Team

- Alfahad (BTTC26O1011)
- Krishna (BTTC2601073)
