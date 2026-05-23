/**
 * algorithms.js
 * Pure scheduling algorithm implementations.
 * Each function returns: { gantt: [{pid, start, end}], results: {pid: {at,bt,ct,tat,wt,rt}} }
 */

const Algorithms = (() => {

  /** FCFS – First Come First Serve */
  function fcfs(processes) {
    const ps = [...processes].sort((a, b) => a.at - b.at || a.pid - b.pid);
    let t = 0;
    const gantt = [];
    const results = {};

    ps.forEach(p => {
      if (t < p.at) {
        gantt.push({ pid: null, start: t, end: p.at, label: 'idle' });
        t = p.at;
      }
      const start = t;
      t += p.bt;
      gantt.push({ pid: p.pid, start, end: t });
      results[p.pid] = {
        at: p.at, bt: p.bt, ct: t,
        tat: t - p.at,
        wt: t - p.at - p.bt,
        rt: start - p.at
      };
    });

    return { gantt, results };
  }

  /** SJF – Shortest Job First (Non-Preemptive) */
  function sjf(processes) {
    const ps = processes.map(p => ({ ...p, done: false }));
    let t = 0;
    const gantt = [];
    const results = {};
    const started = {};
    let remaining = ps.length;

    while (remaining > 0) {
      const available = ps.filter(p => !p.done && p.at <= t);

      if (available.length === 0) {
        // Fast-forward to next arrival
        const next = ps.filter(p => !p.done).sort((a, b) => a.at - b.at)[0];
        if (next) {
          gantt.push({ pid: null, start: t, end: next.at, label: 'idle' });
          t = next.at;
        }
        continue;
      }

      available.sort((a, b) => a.bt - b.bt || a.at - b.at);
      const p = available[0];
      p.done = true;
      if (!(p.pid in started)) started[p.pid] = t;

      const start = t;
      t += p.bt;
      gantt.push({ pid: p.pid, start, end: t });
      results[p.pid] = {
        at: p.at, bt: p.bt, ct: t,
        tat: t - p.at,
        wt: t - p.at - p.bt,
        rt: started[p.pid] - p.at
      };
      remaining--;
    }

    return { gantt, results };
  }

  /** SRTF – Shortest Remaining Time First (Preemptive SJF) */
  function srtf(processes) {
    const ps = processes.map(p => ({ ...p, rem: p.bt, rt: -1, done: false }));
    const gantt = [];
    const results = {};
    let t = 0;
    let lastPid = null;
    let lastStart = 0;
    const totalBurst = ps.reduce((s, p) => s + p.bt, 0);
    const startTime = Math.min(...ps.map(p => p.at));
    const endTime = startTime + totalBurst + ps.length;

    while (ps.some(p => !p.done)) {
      const available = ps.filter(p => !p.done && p.at <= t);
      if (!available.length) { t++; continue; }

      available.sort((a, b) => a.rem - b.rem || a.at - b.at);
      const p = available[0];
      if (p.rt === -1) p.rt = t - p.at;

      if (lastPid !== p.pid) {
        if (lastPid !== null) gantt.push({ pid: lastPid, start: lastStart, end: t });
        lastPid = p.pid; lastStart = t;
      }
      p.rem--; t++;
      if (p.rem === 0) {
        p.done = true;
        gantt.push({ pid: p.pid, start: lastStart, end: t });
        lastPid = null;
        results[p.pid] = {
          at: p.at, bt: p.bt, ct: t,
          tat: t - p.at,
          wt: t - p.at - p.bt,
          rt: p.rt
        };
      }
    }

    // Merge consecutive same-pid blocks
    const merged = [];
    gantt.forEach(b => {
      const last = merged[merged.length - 1];
      if (last && last.pid === b.pid && last.end === b.start) last.end = b.end;
      else merged.push({ ...b });
    });

    return { gantt: merged, results };
  }

  /** Round Robin */
  function roundRobin(processes, quantum) {
    const ps = processes.map(p => ({ ...p, rem: p.bt, rtSet: false }));
    ps.sort((a, b) => a.at - b.at);
    const queue = [];
    const gantt = [];
    const results = {};
    const started = {};
    let t = 0;
    let i = 0;

    // Enqueue all arrived at t=0
    while (i < ps.length && ps[i].at <= t) { queue.push(ps[i]); i++; }

    while (queue.length > 0 || i < ps.length) {
      if (queue.length === 0) {
        // Idle gap
        gantt.push({ pid: null, start: t, end: ps[i].at, label: 'idle' });
        t = ps[i].at;
        while (i < ps.length && ps[i].at <= t) { queue.push(ps[i]); i++; }
        continue;
      }

      const p = queue.shift();
      if (!(p.pid in started)) started[p.pid] = t;

      const run = Math.min(quantum, p.rem);
      const start = t;
      t += run;
      p.rem -= run;

      gantt.push({ pid: p.pid, start, end: t });

      // Enqueue newly arrived processes
      while (i < ps.length && ps[i].at <= t) { queue.push(ps[i]); i++; }

      if (p.rem > 0) {
        queue.push(p);
      } else {
        results[p.pid] = {
          at: p.at, bt: p.bt, ct: t,
          tat: t - p.at,
          wt: t - p.at - p.bt,
          rt: started[p.pid] - p.at
        };
      }
    }

    return { gantt, results };
  }

  /** Priority (Non-Preemptive) – lower number = higher priority */
  function priority(processes) {
    const ps = processes.map(p => ({ ...p, done: false }));
    let t = 0;
    const gantt = [];
    const results = {};

    while (ps.some(p => !p.done)) {
      const available = ps.filter(p => !p.done && p.at <= t);

      if (!available.length) {
        const next = ps.filter(p => !p.done).sort((a, b) => a.at - b.at)[0];
        if (next) {
          gantt.push({ pid: null, start: t, end: next.at, label: 'idle' });
          t = next.at;
        }
        continue;
      }

      available.sort((a, b) => a.pr - b.pr || a.at - b.at);
      const p = available[0];
      p.done = true;
      const start = t;
      t += p.bt;
      gantt.push({ pid: p.pid, start, end: t });
      results[p.pid] = {
        at: p.at, bt: p.bt, ct: t,
        tat: t - p.at,
        wt: t - p.at - p.bt,
        rt: start - p.at
      };
    }

    return { gantt, results };
  }

  /** Run a named algorithm */
  function run(algoKey, processes, quantum = 3) {
    if (!processes || processes.length === 0) return null;
    switch (algoKey) {
      case 'fcfs':     return fcfs(processes);
      case 'sjf':      return sjf(processes);
      case 'srtf':     return srtf(processes);
      case 'rr':       return roundRobin(processes, quantum);
      case 'priority': return priority(processes);
      default:         return fcfs(processes);
    }
  }

  /** Compute aggregate stats from results map */
  function stats(results) {
    const vals = Object.values(results);
    const n = vals.length;
    const avg = key => +(vals.reduce((s, v) => s + v[key], 0) / n).toFixed(2);
    const total = key => vals.reduce((s, v) => s + v[key], 0);
    const maxCT = Math.max(...vals.map(v => v.ct));
    return {
      avgWT:  avg('wt'),
      avgTAT: avg('tat'),
      avgRT:  avg('rt'),
      cpuUtil: +((total('bt') / maxCT) * 100).toFixed(1),
      throughput: +(n / maxCT).toFixed(3),
      n,
      maxCT
    };
  }

  return { run, stats, fcfs, sjf, srtf, roundRobin, priority };
})();
