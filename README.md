# CPU Scheduling Simulator

A full-featured, responsive CPU scheduling simulator built with vanilla HTML, CSS, and JavaScript.

## Algorithms Implemented

| Algorithm | Type | Description |
|---|---|---|
| FCFS | Non-Preemptive | First Come First Serve |
| SJF | Non-Preemptive | Shortest Job First |
| Round Robin | Preemptive | Fixed time quantum rotation |
| Priority | Non-Preemptive | Lower number = higher priority |

## Project Structure

```
cpu-scheduler/
├── index.html           ← Main entry point
├── css/
│   ├── style.css        ← Main styles, variables, layout
│   ├── gantt.css        ← Gantt chart component styles
│   └── animations.css   ← All animations and transitions
├── js/
│   ├── algorithms.js    ← Pure scheduling logic (no DOM)
│   ├── renderer.js      ← All DOM rendering functions
│   └── app.js           ← App controller, state, events
└── README.md
```

## How to Run

### Option 1 — VS Code Live Server (Recommended)
1. Open the `cpu-scheduler/` folder in VS Code
2. Install the **Live Server** extension (Ritwick Dey)
3. Right-click `index.html` → **Open with Live Server**
4. Browser opens at `http://127.0.0.1:5500`

### Option 2 — Direct Open
1. Double-click `index.html` to open in your browser
   > Note: Some browsers restrict local fonts. Live Server is recommended.

### Option 3 — Python HTTP Server
```bash
cd cpu-scheduler
python -m http.server 8000
# Visit http://localhost:8000
```

## Features

- **Dynamic process table** — Add/remove/edit processes inline
- **Interactive Gantt chart** — Hover tooltips with exact timings
- **Metrics dashboard** — Avg waiting, turnaround, response time, CPU utilization, throughput
- **Algorithm comparison** — Side-by-side stats + bar chart for all 4 algorithms
- **Adjustable quantum** — See Round Robin behavior change in real time
- **Fully responsive** — Works on desktop and mobile

## Concepts Covered (for your presentation)

- **Burst Time**: CPU time required by a process
- **Arrival Time**: When the process enters the ready queue
- **Waiting Time**: Time spent waiting in the ready queue = TAT − Burst
- **Turnaround Time**: Total time from arrival to completion = CT − AT
- **Response Time**: Time from arrival to first CPU execution
- **CPU Utilization**: Percentage of time CPU is busy
- **Throughput**: Number of processes completed per time unit
- **Convoy Effect**: Short processes waiting behind long ones (FCFS problem)
- **Starvation**: Long processes never getting CPU time (Priority problem)
- **Context Switch**: Overhead of switching between processes (RR)

## No external dependencies

Built entirely with vanilla HTML5, CSS3, and JavaScript (ES6+).
No npm, no build tools, no frameworks needed.
