/**
 * app.js
 * Main application controller. Orchestrates UI, state, and algorithm calls.
 */

const App = (() => {

  // ─── State ────────────────────────────────────────────────
  let processes = [];
  let pidCounter = 1;
  let currentAlgo = 'fcfs';
  let quantum = 3;

  const ALGO_META = {
    fcfs:     { title: 'First Come First Serve', desc: 'Processes execute in arrival order. Simple & fair, but may cause the convoy effect.', badge: 'Non-Preemptive', icon: '📋' },
    sjf:      { title: 'Shortest Job First',     desc: 'Selects the process with the smallest burst time. Minimizes avg waiting time but may starve long processes.', badge: 'Non-Preemptive', icon: '⚡' },
    rr:       { title: 'Round Robin',            desc: 'Each process gets a fixed time quantum in rotation. Great for time-sharing. Adjust quantum to see the impact.', badge: 'Preemptive', icon: '🔄' },
    priority: { title: 'Priority Scheduling',    desc: 'Processes scheduled by priority (lower = higher priority). May cause starvation of low-priority processes.', badge: 'Non-Preemptive', icon: '🏆' },
    compare:  { title: 'Algorithm Comparison',   desc: 'Compare all four algorithms side by side on the same process set to find the best performer.', badge: 'Analysis Mode', icon: '📊' },
  };

  // ─── Init ─────────────────────────────────────────────────
  function init() {
    bindNavTabs();
    bindTableEvents();
    loadExample();
    updateBanner('fcfs');
  }

  // ─── Navigation tabs ──────────────────────────────────────
  function bindNavTabs() {
    document.getElementById('navTabs').addEventListener('click', e => {
      const btn = e.target.closest('.nav-tab');
      if (!btn) return;
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      currentAlgo = btn.dataset.algo;
      updateBanner(currentAlgo);

      const isRR = currentAlgo === 'rr';
      document.getElementById('quantumBox').style.display = isRR ? 'block' : 'none';

      const isPriority = currentAlgo === 'priority';
      document.getElementById('priorityHeader').style.display = isPriority ? '' : 'none';
      document.querySelectorAll('.priority-cell').forEach(c => {
        c.style.display = isPriority ? '' : 'none';
      });

      hideOutput();
      if (currentAlgo === 'compare') runCompare();
    });
  }

  function updateBanner(algo) {
    const m = ALGO_META[algo] || ALGO_META.fcfs;
    document.getElementById('algoBannerIcon').textContent  = m.icon;
    document.getElementById('algoBannerTitle').textContent = m.title;
    document.getElementById('algoBannerDesc').textContent  = m.desc;
    document.getElementById('algoBadge').textContent       = m.badge;
  }

  // ─── Table events (delegation) ────────────────────────────
  function bindTableEvents() {
    document.getElementById('procBody').addEventListener('input', e => {
      const input = e.target;
      if (!input.dataset.id) return;
      const p = processes.find(x => x.id === input.dataset.id);
      if (!p) return;
      const val = parseInt(input.value, 10);
      if (!isNaN(val)) p[input.dataset.field] = Math.max(input.min ? +input.min : 0, val);
    });

    document.getElementById('procBody').addEventListener('click', e => {
      const btn = e.target.closest('.del-btn');
      if (!btn) return;
      removeProcess(btn.dataset.id);
    });
  }

  // ─── Process management ───────────────────────────────────
  function addProcess(at = 0, bt = 4, pr = 1) {
    const id  = 'p' + Date.now() + pidCounter;
    const pid = pidCounter++;
    at = at ?? Math.max(0, ...processes.map(p => p.at));
    processes.push({ id, pid, at, bt, pr });
    rerender();
    hideOutput();
  }

  function removeProcess(id) {
    processes = processes.filter(p => p.id !== id);
    rerender();
    hideOutput();
  }

  function reset() {
    processes = [];
    pidCounter = 1;
    rerender();
    hideOutput();
  }

  function loadExample() {
    processes = [];
    pidCounter = 1;
    const examples = [
      { at: 0, bt: 6, pr: 3 },
      { at: 1, bt: 4, pr: 1 },
      { at: 2, bt: 8, pr: 4 },
      { at: 3, bt: 2, pr: 2 },
      { at: 5, bt: 3, pr: 2 },
    ];
    examples.forEach(({ at, bt, pr }) => {
      const id  = 'p' + Date.now() + pidCounter + Math.random();
      const pid = pidCounter++;
      processes.push({ id, pid, at, bt, pr });
    });
    rerender();
    hideOutput();
  }

  function changeQuantum(delta) {
    quantum = Math.max(1, Math.min(20, quantum + delta));
    document.getElementById('quantumVal').textContent = quantum;
  }

  // ─── Render process table ─────────────────────────────────
  function rerender() {
    Renderer.renderProcessTable(processes, currentAlgo);
  }

  // ─── Run simulation ───────────────────────────────────────
  function runSim() {
    if (currentAlgo === 'compare') { runCompare(); return; }
    if (processes.length === 0) { showAlert('Please add at least one process.'); return; }

    const result = Algorithms.run(currentAlgo, processes, quantum);
    if (!result) return;

    const { gantt, results } = result;
    const s = Algorithms.stats(results);

    document.getElementById('simOutput').style.display = 'block';
    document.getElementById('compareOutput').style.display = 'none';
    document.getElementById('emptyState').style.display = 'none';

    Renderer.renderGantt(gantt, processes, 'ganttContainer');
    Renderer.renderMetrics(s);
    Renderer.renderResultTable(results, processes);

    // Smooth scroll to results on mobile
    if (window.innerWidth < 900) {
      document.getElementById('resultPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // ─── Compare all algos ────────────────────────────────────
  function runCompare() {
    if (processes.length === 0) { showAlert('Please add at least one process.'); return; }

    const algoList = [
      { key: 'fcfs',     label: 'FCFS',          shortLabel: 'FCFS' },
      { key: 'sjf',      label: 'SJF',           shortLabel: 'SJF' },
      { key: 'rr',       label: `Round Robin (q=${quantum})`, shortLabel: `RR q=${quantum}` },
      { key: 'priority', label: 'Priority',      shortLabel: 'Priority' },
    ];

    const algoResults = algoList.map(a => {
      const { results } = Algorithms.run(a.key, processes, quantum);
      return { ...a, stats: Algorithms.stats(results) };
    });

    document.getElementById('simOutput').style.display = 'none';
    document.getElementById('compareOutput').style.display = 'block';
    document.getElementById('emptyState').style.display = 'none';

    Renderer.renderCompareCards(algoResults);
    setTimeout(() => Renderer.renderCompareChart(algoResults), 50);
  }

  // ─── Helpers ──────────────────────────────────────────────
  function hideOutput() {
    document.getElementById('simOutput').style.display = 'none';
    document.getElementById('compareOutput').style.display = 'none';
    document.getElementById('emptyState').style.display = 'flex';
  }

  function showAlert(msg) {
    const banner = document.getElementById('algoBanner');
    banner.style.background = '#ffe4e2';
    banner.style.borderColor = '#f48fb1';
    document.getElementById('algoBannerDesc').textContent = '⚠ ' + msg;
    setTimeout(() => {
      banner.style.background = '';
      banner.style.borderColor = '';
      updateBanner(currentAlgo);
    }, 2200);
  }

  // ─── Public API ───────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);

  return { addProcess, removeProcess, reset, loadExample, runSim, runCompare, changeQuantum };
})();
