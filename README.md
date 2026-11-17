# CircuitX

**CircuitX is a browser-based digital logic circuit simulator.** Build a circuit by dragging logic gates onto a workspace, connecting them with wires, changing the switches, and watching the outputs update live. No installation is required.

**Live demo:** https://circuitx-taupe.vercel.app/

**Project:** *Engineering and Development of an Interactive Digital Circuit Design and Simulation Platform*  
MITS Gwalior · B.Tech CST · First-Year Micro Project

---

## Features

- **Logic gates:** AND, OR, NOT, NAND, NOR, XOR
- **Inputs and outputs:** Switch (digital input), Clock (pulse input), LED (visual output)
- **Memory components:** D flip-flop (1-bit storage) and 4-bit register
- **Drag and drop:** Place components on the workspace and connect their pins with wires
- **Live simulation:** Wire colours and LED indicators show signal changes
- **Automatic truth table:** Generates circuit truth tables for up to 8 switches (256 combinations)
- **Component inspector:** Shows the selected component, its inputs and live output, with a delete control
- **Workspace controls:** Pan, zoom, Fit view, Auto clock and Reset
- **Automatic local saving:** The circuit is saved in the browser and restored after reloading
- **Warnings:** Identifies unconnected inputs and circuits that do not settle

## How to use

| Action | How |
|---|---|
| Add a component | Drag it from the Component Library onto the workspace |
| Move a component | Drag the component |
| Connect a wire | Click an output pin and drag/connect it to an input pin |
| Remove a wire | Click the wire |
| Change a switch | Click the switch to toggle between 0 and 1 |
| Inspect a component | Click it to view its details and live values |
| Delete a component | Select it and use **Delete component** |
| Move around the workspace | Drag empty space |
| Zoom | Scroll, or pinch on a touch screen |

### Top-bar controls

- **Auto clock:** Starts or stops the clock components; while running, they alternate between 0 and 1.
- **Fit view:** Fits the circuit into the visible workspace.
- **Reset:** Removes all components and wires and clears the workspace.

### Truth table

CircuitX automatically generates a truth table from the current circuit:

- Each switch gets an input column (S1, S2, ...).
- Each LED gets an output column (LED 1, LED 2, ...).
- The table includes every input combination.
- Selecting a row applies that row's switch values to the circuit.
- Truth-table generation supports up to 8 switches (256 combinations).

### Example: OR circuit

1. Drag two **Switches**, one **OR** gate and one **LED** onto the workspace.
2. Connect each switch to a separate OR-gate input.
3. Connect the OR-gate output to the LED input.
4. Toggle the switches. The LED turns on when at least one input is 1.

## How it works

CircuitX stores the circuit's components and connections in a central state object. When the user interacts with the circuit, the application:

1. Updates the circuit state.
2. Runs the simulation engine.
3. Redraws the workspace and displayed results.
4. Saves the updated circuit in browser Local Storage.

### Signal propagation

The simulation engine reads component inputs, calculates the outputs of logic gates, and repeats the calculation until the outputs stop changing. At that point, the circuit has settled and its results can be displayed.

### Memory components

The D flip-flop and 4-bit register capture their data inputs on the rising edge of the clock signal (the transition from 0 to 1). They retain the stored value until the next rising edge.

### Feedback and unconnected inputs

The engine allows up to 100 settling rounds. If the circuit still has changing outputs after that limit (for example, a NOT gate connected to its own output), it reports that the circuit did not settle instead of continuing indefinitely. An unconnected input is read as 0, and the application displays a warning.

## Project structure

| File | Responsibility |
|---|---|
| `index.html` | Page structure and interface |
| `style.css` | Styling, layout and responsive presentation |
| `app.js` | User interactions, drag and drop, wires, rendering, inspector, truth table and browser saving |
| `engine.js` | Gate calculations, signal propagation, clock edges and memory components |

## Technology

- HTML5
- CSS3
- JavaScript
- SVG for gate symbols and wires
- Browser Local Storage for saving circuits
- GitHub for source-code version control
- Vercel for cloud hosting and deployment

## Run locally

1. Clone or download the repository.
2. Keep all four project files in the same folder.
3. Open `index.html` in a modern browser.

```bash
git clone https://github.com/Al-f4had/CircuitX.git
cd CircuitX
```

There is no package installation or build step required for the current project.

## Testing

The simulation engine was tested using a standalone Node.js test harness. The following checks were completed:

| Test | Result |
|---|---|
| AND, OR, NAND, NOR, XOR and NOT gate truth tables | PASS (6 checks) |
| 100 NOT gates in forward component order | PASS |
| 100 NOT gates in reverse component order | PASS |
| NOT gate connected to its own output (unstable feedback) | PASS — instability detected |
| **Total** | **9/9 checks passed** |

### Engine benchmark

A 100-gate circuit was simulated 1,000 times using Node.js v22.16.0.

- Total execution time: 2,297.35 ms
- Average simulation time: 2.2973 ms per run

**Scope:** These results validate the simulation engine in an isolated Node.js test harness. They are not browser rendering or end-to-end UI performance measurements. The temporary test harness was used for this evaluation and is not included as a committed project test suite.

## Project milestones

1. Requirement analysis and architectural design
2. Core module and prototype
3. Integration and intermediate evaluation
4. Comprehensive testing and optimization
5. Deployment, final documentation and viva preparation

## Team

- **Alfahad** (BTTC26O1011)
- **Krishna** (BTTC2601073)
