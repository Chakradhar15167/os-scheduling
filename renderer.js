/**
 * renderer.js
 * Handles all DOM rendering: Gantt chart, tables, metric cards, comparison.
 */

const Renderer = (() => {

  const PROCESS_COLORS = [
    { bg: '#4f7ef8', light: '#deeaff', dark: '#2d5ad4' },
    { bg: '#22c9a5', light: '#d0f5ec', dark: '#0f9b7d' },
    { bg: '#f5a623', light: '#fef3dc', dark: '#c07d0b' },
    { bg: '#ff7b72', light: '#ffe4e2', dark: '#d94f47' },
    { bg: '#9b7df8', light: '#ede8ff', dark: '#6b47db' },
    { bg: '#4caf7d', light: '#d9f2e6', dark: '#2e7d5a' },
    { bg: '#e8699a', light: '#fde8f1', dark: '#b54278' },
    { bg: '#60b8e8', light: '#ddf1fb', dark: '#2e7fab' },
  ];

  function colorFor(index) {
    return PROCESS_COLORS[index % PROCESS_COLORS.length];
  }

  /** Build process table rows */
  function renderProcessTable(processes, algo) {
    const tbody = document.getElementById('procBody');
    const showPriority = algo === 'priority';
    document.getElementById('priorityHeader').style.display = showPriority ? '' : 'none';
    document.querySelectorAll('.priority-cell').forEach(el => {
      el.style.display = showPriority ? '' : 'none';
    });

    tbody.innerHTML = '';
    processes.forEach((p, i) => {
      const color = colorFor(i);
      const prCell = showPriority
        ? `<td class="priority-cell"><input class="num-input" type="number" min="1" max="10" value="${p.pr}" data-id="${p.id}" data-field="pr"/></td>`
        : `<td class="priority-cell" style="display:none"><input class="num-input" type="number" min="1" max="10" value="${p.pr}" data-id="${p.id}" data-field="pr"/></td>`;

      const row = document.createElement('tr');
      row.setAttribute('data-pid', p.id);
      row.innerHTML = `
        <td><span class="proc-label">
          <span class="proc-dot" style="background:${color.bg}"></span>
          P${p.pid}
        </span></td>
        <td><input class="num-input" type="number" min="0" max="99" value="${p.at}" data-id="${p.id}" data-field="at"/></td>
        <td><input class="num-input" type="number" min="1" max="99" value="${p.bt}" data-id="${p.id}" data-field="bt"/></td>
        ${prCell}
        <td>
          <button class="del-btn" data-id="${p.id}" title="Remove">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </td>`;
      tbody.appendChild(row);
    });
  }

  /** Render Gantt chart */
  function renderGantt(gantt, processes, containerId) {
    const container = document.getElementById(containerId || 'ganttContainer');
    if (!gantt || gantt.length === 0) { container.innerHTML = '<p style="color:var(--c-text-3);font-size:13px;padding:1rem">No data</p>'; return; }

    const totalTime = gantt[gantt.length - 1].end;
    const pidToIndex = {};
    processes.forEach((p, i) => { pidToIndex[p.pid] = i; });

    // Build blocks
    const blocks = gantt.map(g => {
      const widthPct = ((g.end - g.start) / totalTime * 100).toFixed(3);
      if (g.pid === null) {
        return `<div class="gantt-block idle" style="width:${widthPct}%;min-width:6px;" title="CPU Idle">
          <span class="tooltip"><strong>Idle</strong>${g.start} → ${g.end} (${g.end - g.start}u)</span>
        </div>`;
      }
      const idx = pidToIndex[g.pid] ?? 0;
      const color = colorFor(idx);
      const label = (g.end - g.start) >= (totalTime * 0.05) ? `P${g.pid}` : '';
      return `<div class="gantt-block" style="width:${widthPct}%;background:${color.bg};min-width:8px;">
        ${label}
        <span class="tooltip">
          <strong>P${g.pid}</strong>
          Start: ${g.start} &nbsp;|&nbsp; End: ${g.end}<br/>
          Duration: ${g.end - g.start} units
        </span>
      </div>`;
    }).join('');

    // Build tick marks
    const numTicks = Math.min(totalTime, 16);
    const step = Math.ceil(totalTime / numTicks);
    let ticks = '';
    for (let t = 0; t <= totalTime; t += step) {
      const pct = (t / totalTime * 100).toFixed(2);
      ticks += `<div class="axis-tick" style="left:${pct}%">${t}</div>`;
    }
    if (totalTime % step !== 0) {
      ticks += `<div class="axis-tick" style="left:100%">${totalTime}</div>`;
    }

    container.innerHTML = `
      <div class="gantt-row">
        <div class="gantt-row-label">CPU</div>
        <div class="gantt-blocks">${blocks}</div>
      </div>
      <div class="gantt-axis">
        <div class="gantt-axis-inner">${ticks}</div>
      </div>`;

    // Update duration badge
    const badge = document.getElementById('ganttDuration');
    if (badge) badge.textContent = `${totalTime} time units`;

    // Legend
    renderLegend(processes);
  }

  function renderLegend(processes) {
    const legend = document.getElementById('ganttLegend');
    if (!legend) return;
    legend.innerHTML = processes.map((p, i) => {
      const c = colorFor(i);
      return `<div class="legend-item">
        <div class="legend-dot" style="background:${c.bg}"></div>
        P${p.pid} (burst: ${p.bt})
      </div>`;
    }).join('') + `<div class="legend-item">
      <div class="legend-dot" style="background:#dde4f4;border:1px solid #c0cadf"></div>
      Idle
    </div>`;
  }

  /** Render metric cards */
  function renderMetrics(statsObj) {
    const grid = document.getElementById('metricsGrid');
    const cards = [
      { label: 'Avg Waiting Time',   val: statsObj.avgWT,       unit: 'units',   cls: 'blue'   },
      { label: 'Avg Turnaround',     val: statsObj.avgTAT,      unit: 'units',   cls: 'teal'   },
      { label: 'Avg Response Time',  val: statsObj.avgRT,       unit: 'units',   cls: 'amber'  },
      { label: 'CPU Utilization',    val: statsObj.cpuUtil,     unit: '%',       cls: 'coral'  },
      { label: 'Throughput',         val: statsObj.throughput,  unit: 'proc/u',  cls: 'purple' },
    ];
    grid.innerHTML = cards.map(c => `
      <div class="metric-card ${c.cls}">
        <div class="metric-lbl">${c.label}</div>
        <div class="metric-val">${c.val}</div>
        <div class="metric-unit">${c.unit}</div>
      </div>`).join('');
  }

  /** Render result table */
  function renderResultTable(results, processes) {
    const tbody = document.getElementById('resultBody');
    const pidToIndex = {};
    processes.forEach((p, i) => { pidToIndex[p.pid] = i; });

    tbody.innerHTML = Object.entries(results).map(([pid, r]) => {
      const idx = pidToIndex[+pid] ?? 0;
      const c = colorFor(idx);
      return `<tr>
        <td><span class="proc-label">
          <span class="proc-dot" style="background:${c.bg}"></span>
          <strong>P${pid}</strong>
        </span></td>
        <td>${r.at}</td>
        <td>${r.bt}</td>
        <td>${r.ct}</td>
        <td><span class="pill pill-blue">${r.tat}</span></td>
        <td><span class="pill pill-green">${r.wt}</span></td>
        <td><span class="pill pill-teal">${r.rt}</span></td>
      </tr>`;
    }).join('');
  }

  /** Render compare cards */
  function renderCompareCards(algoResults) {
    const container = document.getElementById('compareCards');
    const ACCENT = ['#4f7ef8','#22c9a5','#f5a623','#9b7df8'];

    // Find best (lowest avgWT)
    const bestWT = Math.min(...algoResults.map(a => a.stats.avgWT));

    container.innerHTML = algoResults.map((a, i) => {
      const isBest = a.stats.avgWT === bestWT;
      return `
      <div class="compare-card" style="border-top-color:${ACCENT[i]}">
        <h3 style="color:${ACCENT[i]}">${a.label}</h3>
        <div class="compare-stat">
          <div class="compare-stat-lbl">Avg Waiting</div>
          <div class="compare-stat-val">${a.stats.avgWT} <span class="compare-unit">u</span></div>
        </div>
        <div class="compare-stat">
          <div class="compare-stat-lbl">Avg Turnaround</div>
          <div class="compare-stat-val">${a.stats.avgTAT} <span class="compare-unit">u</span></div>
        </div>
        <div class="compare-stat">
          <div class="compare-stat-lbl">CPU Util</div>
          <div class="compare-stat-val">${a.stats.cpuUtil} <span class="compare-unit">%</span></div>
        </div>
        ${isBest ? '<div class="best-badge">⭐ Best WT</div>' : ''}
      </div>`;
    }).join('');
  }

  /** Render compare bar chart (no library — pure canvas) */
  function renderCompareChart(algoResults) {
    const canvas = document.getElementById('compareChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const W = canvas.offsetWidth || 600;
    const H = 240;
    canvas.width = W;
    canvas.height = H;

    const labels = algoResults.map(a => a.label);
    const wts   = algoResults.map(a => a.stats.avgWT);
    const tats  = algoResults.map(a => a.stats.avgTAT);
    const maxVal = Math.max(...wts, ...tats, 1);

    const pad = { top: 20, right: 20, bottom: 40, left: 44 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;
    const groupW = chartW / labels.length;
    const barW = Math.min(groupW * 0.28, 36);

    const COLORS = ['#4f7ef8','#22c9a5'];

    ctx.clearRect(0, 0, W, H);
    ctx.font = '11px DM Mono, monospace';
    ctx.fillStyle = '#8a93b8';

    // Y grid lines
    const steps = 5;
    for (let s = 0; s <= steps; s++) {
      const val = (maxVal / steps * s).toFixed(1);
      const y = pad.top + chartH - (s / steps) * chartH;
      ctx.fillStyle = '#8a93b8';
      ctx.textAlign = 'right';
      ctx.fillText(val, pad.left - 6, y + 4);
      ctx.beginPath();
      ctx.strokeStyle = s === 0 ? '#c0cadf' : '#eef0f8';
      ctx.lineWidth = s === 0 ? 1.5 : 1;
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + chartW, y);
      ctx.stroke();
    }

    // Bars
    algoResults.forEach((a, gi) => {
      const cx = pad.left + gi * groupW + groupW / 2;
      [[wts[gi], COLORS[0]], [tats[gi], COLORS[1]]].forEach(([val, color], bi) => {
        const barH = (val / maxVal) * chartH;
        const x = cx + (bi - 0.5) * (barW + 4);
        const y = pad.top + chartH - barH;
        ctx.fillStyle = color + 'cc';
        ctx.beginPath();
        ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
        ctx.fill();
        // value label
        ctx.fillStyle = '#1a1f36';
        ctx.textAlign = 'center';
        ctx.font = '10px DM Mono, monospace';
        if (barH > 16) ctx.fillText(val, x + barW / 2, y - 4);
      });

      // x label
      ctx.fillStyle = '#4a5580';
      ctx.textAlign = 'center';
      ctx.font = '11px DM Sans, sans-serif';
      ctx.fillText(a.shortLabel || a.label, cx, pad.top + chartH + 20);
    });

    // Legend
    const legX = pad.left + chartW - 200;
    [['Avg Waiting', COLORS[0]], ['Avg Turnaround', COLORS[1]]].forEach(([lbl, c], i) => {
      ctx.fillStyle = c;
      ctx.fillRect(legX + i * 110, 4, 12, 10);
      ctx.fillStyle = '#4a5580';
      ctx.textAlign = 'left';
      ctx.font = '11px DM Sans, sans-serif';
      ctx.fillText(lbl, legX + i * 110 + 16, 13);
    });
  }

  return { renderProcessTable, renderGantt, renderMetrics, renderResultTable, renderCompareCards, renderCompareChart, colorFor };
})();
