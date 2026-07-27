/* cards.js — project canvas loops, viewport gating, inner parallax, View More */
(() => {
  const { $, $$, reduce } = HK;

  /* [id, title, subline, url, moreTier] — real repo/live links; null = no public URL */
  const PROJECTS = [
    ['wc', 'World Cup Prediction Market', 'Dixon-Coles + LMSR · 100k Monte Carlo sims · Brier 0.572 vs 0.613 Elo', 'https://wc-prediction-market.vercel.app', 0],
    ['vote', 'Optimal Voting — AAMAS 2026', 'Peer-reviewed · positional-scoring optimizers · SA / GD / MIP · PyPI', 'https://pypi.org/project/optimal-voting/', 0],
    ['reefscan', 'ReefScan', 'DINOv2 + SAM2 + conformal prediction · 89.5% test acc · $0 infra', 'https://reefscan.vercel.app', 0],
    ['rag', 'F1 Rule Interpreter', 'Corrective RAG over 1,000+ FIA PDFs · 60% → 93% citation coverage', 'https://github.com/HrishiKabra/AI_Engineering_Project', 0],
    ['fish', 'FishID', 'Species ID from photos · Next.js + Supabase · Fishial + Groq', 'https://fishid.vercel.app', 1],
    ['arb', 'Cross-Venue Arbitrage Engine', 'Kalshi × Polymarket · >95% event match · sub-2s EV', null, 1],
    ['handos', 'HandOS', 'Gesture control for macOS · Kalman + One-Euro filters · 27px → 6px jitter', 'https://github.com/HrishiKabra/HandOS', 1],
    ['dna', 'Circuit DNA', 'F1 telemetry fingerprints · OpenF1 · 360° resampling', 'https://hrishikabra.github.io/circuit_dna/', 1],
    ['wave', 'Ocean Jukebox', '131 NOAA hydrophone recordings · Leaflet', 'https://hrishikabra.github.io/ocean_jukebox/', 1],
    ['wiki', 'Wikipedia Race', 'Bidirectional BFS pathfinder · React', 'https://wikipediarace.netlify.app', 1],
    ['gig', 'GigPilot', 'Multi-agent gig booking · Freeman AI Innovation Challenge winner', null, 1],
  ];

  const grid = $('#pgrid');
  function cardHTML([id, title, sub, url]) {
    const tag = url ? 'a' : 'div';
    const attrs = url ? ` href="${url}" target="_blank" rel="noopener" aria-label="${title} — open project"` : '';
    return `<${tag} class="mcard" data-id="${id}"${attrs}>
      <div class="pwrap"><canvas id="cv-${id}" width="800" height="620" aria-hidden="true"></canvas></div>
      <div class="meta"><div><h3>${title}</h3><p>${sub}</p></div><span class="arr" aria-hidden="true">→</span></div>
    </${tag}>`;
  }

  /* ---------- canvas loops (dark bg, mono, sage; 3–5s, seamless) ---------- */
  const BG = '#171713', FG = '#D9D5C9', DIM = '#33332C', G = '#4A7C59', G2 = '#8FBF9C',
    WARM = '#8A8578', RED = '#B8552F';
  const MONO = px => `${px}px "JetBrains Mono", monospace`;

  function base(x) {
    x.fillStyle = BG; x.fillRect(0, 0, 800, 620);
    x.strokeStyle = DIM; x.lineWidth = 1;
    for (let g = 110; g < 620; g += 110) { x.beginPath(); x.moveTo(0, g); x.lineTo(800, g); x.stroke(); }
  }

  const LOOPS = {
    arb(x, T) {
      const t = T % 3.4, A = 'Fed cuts rates in March?', B = 'March FOMC rate cut';
      base(x); x.font = MONO(25); x.fillStyle = FG;
      x.fillText('kalshi   › ' + A.slice(0, Math.floor(Math.min(t * 1.2, 1) * A.length)), 56, 200);
      x.fillText('polymkt  › ' + B.slice(0, Math.floor(Math.max(0, Math.min(t * 1.2 - .4, 1)) * B.length)), 56, 270);
      const p = Math.max(0, Math.min((t - 1.3) * 1.3, 1));
      x.fillStyle = G; x.fillRect(56, 340, 620 * p * .9552, 14);
      x.strokeStyle = DIM; x.strokeRect(56, 340, 620, 14);
      x.fillStyle = G2; x.font = MONO(28);
      x.fillText('match ' + (p * 95.5).toFixed(1) + '%' + (p >= 1 ? '  ✓ arb found' : ''), 56, 410);
    },
    dna(x, T) {
      const t = T % 4.6; base(x);
      const dr = (ph, col, w) => {
        x.strokeStyle = col; x.lineWidth = w; x.beginPath();
        for (let i = 0; i <= 800; i += 6) {
          const th = .5 + .5 * Math.sin(i * .02 + ph) + .22 * Math.sin(i * .09 + ph * 1.7);
          const y = 540 - th * 400 * Math.min(1, Math.max(0, (t * 260 - i) / 60));
          i ? x.lineTo(i, y) : x.moveTo(i, y);
        }
        x.stroke();
      };
      dr(0, G, 3.5); dr(2.1, WARM, 2); x.lineWidth = 1;
      x.fillStyle = FG; x.font = MONO(21); x.fillText('throttle % — monza vs monaco', 56, 70);
    },
    vote(x, T) {
      const t = T % 3.8, k = Math.min(t / 2.6, 1), ease = 1 - Math.pow(1 - k, 3);
      base(x);
      const target = [1, .72, .48, .27, .1]; x.font = MONO(21);
      target.forEach((tv, i) => {
        const noisy = .5 + .5 * Math.sin(i * 3 + t * 9) * (1 - ease), v = tv * ease + noisy * (1 - ease);
        x.fillStyle = k >= 1 ? G : WARM; x.fillRect(120 + i * 130, 470 - v * 300, 74, v * 300);
        x.fillStyle = FG; x.fillText('w' + (i + 1), 140 + i * 130, 510);
      });
      x.fillStyle = G2;
      x.fillText(k >= 1 ? 'annealed ✓ optimal scoring rule' : 'annealing… T=' + (1 - ease).toFixed(2), 56, 80);
    },
    rag(x, T) {
      const t = T % 4, q = '› why was VER penalised at COTA?';
      base(x); x.font = MONO(23); x.fillStyle = FG;
      x.fillText(q.slice(0, Math.floor(Math.min(t, 1) * q.length)), 56, 140);
      ['Art 33.3 — track limits', 'Doc 44 — stewards', 'Art 54.3 — penalty'].forEach((c, i) => {
        if (t > 1.5 + i * .55) {
          x.fillStyle = G; x.fillRect(56, 220 + i * 90, 10, 52);
          x.fillStyle = FG; x.fillText(c, 90, 254 + i * 90);
          x.fillStyle = G2; x.fillText('✓', 700, 254 + i * 90);
        }
      });
      if (t > 3.3) { x.fillStyle = G2; x.fillText('coverage 93%', 520, 90); }
    },
    fish(x, T) {
      const t = T % 3.5, sway = Math.sin(T * 2) * 20;
      base(x);
      x.fillStyle = G; x.beginPath(); x.ellipse(330 + sway, 300, 130, 60, 0, 0, 7); x.fill();
      x.beginPath(); x.moveTo(455 + sway, 300); x.lineTo(530 + sway, 250); x.lineTo(530 + sway, 350); x.fill();
      x.fillStyle = BG; x.beginPath(); x.arc(270 + sway, 285, 9, 0, 7); x.fill();
      const conf = Math.min(t / 2, 1) * .94;
      x.fillStyle = FG; x.font = MONO(22); x.fillText('lutjanus campechanus', 56, 372);
      x.fillStyle = G2; x.fillText((conf * 100).toFixed(1) + '% conf', 56, 410);
    },
    reef(x, T) {
      base(x);
      for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) {
        const h = .5 + .5 * Math.sin(r * 1.3 + c * .8 + T * 2);
        x.fillStyle = h > .78 ? RED : h > .5 ? WARM : G; x.globalAlpha = .35 + h * .5;
        x.fillRect(70 + c * 100, 110 + r * 80, 88, 68);
      }
      x.globalAlpha = 1;
      x.fillStyle = FG; x.font = MONO(21); x.fillText('SST anomaly — bleaching watch', 56, 70);
    },
    wiki(x, T) {
      base(x);
      const t = (T % 3) / 3, hops = [[80, 320], [240, 190], [420, 300], [590, 180], [720, 320]];
      const seg = Math.min(t * 4, 4);
      x.strokeStyle = G; x.lineWidth = 3; x.beginPath();
      hops.forEach((h, i) => {
        if (i === 0) x.moveTo(...h);
        else if (i <= seg) x.lineTo(...h);
        else if (i - 1 < seg) { const p = seg - (i - 1), a = hops[i - 1]; x.lineTo(a[0] + (h[0] - a[0]) * p, a[1] + (h[1] - a[1]) * p); }
      });
      x.stroke(); x.lineWidth = 1;
      hops.forEach((h, i) => { x.fillStyle = i <= seg ? G : DIM; x.beginPath(); x.arc(h[0], h[1], 12, 0, 7); x.fill(); });
      x.fillStyle = FG; x.font = MONO(21); x.fillText('Tulane → … → Scuba diving · 4 hops (BFS)', 56, 430);
    },
    wave(x, T) {
      base(x);
      x.fillStyle = G;
      for (let i = 0; i < 46; i++) {
        const h = 14 + Math.abs(Math.sin(i * .6 + T * 4)) * 160;
        x.fillRect(60 + i * 15, 320 - h / 2, 9, h);
      }
      x.fillStyle = FG; x.font = MONO(21); x.fillText('▶ humpback song — monterey bay', 56, 440);
    },
    gig(x, T) {
      /* multi-agent nodes passing a booking token */
      const t = T % 4.2;
      const nodes = [[110, 330], [300, 170], [490, 330], [680, 190]];
      const names = ['scout', 'sched', 'outreach', 'book'];
      base(x);
      x.strokeStyle = DIM; x.lineWidth = 2;
      for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(...nodes[i]); x.lineTo(...nodes[i + 1]); x.stroke(); }
      const seg = Math.min(t / .9, 3);              /* token travels 3 legs, .9s each */
      const li = Math.min(Math.floor(seg), 2), p = seg - li;
      const a = nodes[li], b = nodes[li + 1];
      const tx = a[0] + (b[0] - a[0]) * p, ty = a[1] + (b[1] - a[1]) * p;
      nodes.forEach((nd, i) => {
        const holds = seg >= 3 ? i === 3 : i === li;
        x.fillStyle = holds ? G : BG; x.strokeStyle = holds ? G2 : WARM; x.lineWidth = 2;
        x.beginPath(); x.arc(nd[0], nd[1], 26, 0, 7); x.fill(); x.stroke();
        x.fillStyle = holds ? '#EDE8DC' : WARM; x.font = MONO(17);
        x.fillText(names[i], nd[0] - 24, nd[1] + 58);
      });
      if (seg < 3) { x.fillStyle = G2; x.beginPath(); x.arc(tx, ty, 9, 0, 7); x.fill(); }
      x.fillStyle = seg >= 3 ? G2 : FG; x.font = MONO(21);
      x.fillText(seg >= 3 ? 'venue confirmed ✓' : 'passing booking token…', 56, 440);
      x.lineWidth = 1;
    },
    wc(x, T) {
      /* LMSR market converging on the bracket favourites */
      const t = T % 4.2, k = Math.min(t / 2.4, 1), ease = 1 - Math.pow(1 - k, 3);
      base(x);
      x.fillStyle = FG; x.font = MONO(22); x.fillText('48-team bracket · 100k sims', 56, 90);
      const rows = [['ESP', .31], ['FRA', .25], ['ARG', .19]];
      rows.forEach(([team, p], i) => {
        const y = 170 + i * 90;
        const noisy = p * (.55 + .45 * Math.abs(Math.sin(i * 2.1 + t * 7)));
        const v = p * ease + noisy * (1 - ease);
        x.fillStyle = FG; x.font = MONO(21); x.fillText(team, 56, y + 34);
        x.strokeStyle = DIM; x.strokeRect(140, y, 480, 46);
        x.fillStyle = k >= 1 ? G : WARM; x.fillRect(140, y, 480 * v / .35, 46);
        x.fillStyle = G2; x.fillText((v * 100).toFixed(1) + '%', 650, y + 34);
      });
      if (t > 3.1) { x.fillStyle = G2; x.font = MONO(22); x.fillText('Brier 0.572 < 0.613 Elo ✓', 56, 128); }
    },
    reefscan(x, T) {
      /* segment → classify → calibrate */
      const t = T % 4.5;
      base(x);
      x.fillStyle = FG; x.font = MONO(21); x.fillText('segment → classify → calibrate', 56, 70);
      /* coral blob traced by SAM-ish outline */
      const cx = 360, cy = 290, N = 42;
      const pt = j => {
        const a = j / N * Math.PI * 2;
        const r = 120 + 34 * Math.sin(a * 3 + 1.2) + 18 * Math.sin(a * 7);
        return [cx + Math.cos(a) * r * 1.25, cy + Math.sin(a) * r * .8];
      };
      const prog = Math.min(t / 1.6, 1);
      x.strokeStyle = G2; x.lineWidth = 3; x.beginPath();
      for (let j = 0; j <= N * prog; j++) { const [px, py] = pt(j); j ? x.lineTo(px, py) : x.moveTo(px, py); }
      if (prog >= 1) x.closePath();
      x.stroke(); x.lineWidth = 1;
      if (prog >= 1) { x.fillStyle = G; x.globalAlpha = .16 + .06 * Math.sin(T * 3); x.fill(); x.globalAlpha = 1; }
      if (t > 2.2) {
        x.fillStyle = G; x.fillRect(600, 210, 10, 46);
        x.fillStyle = FG; x.font = MONO(21); x.fillText('bleached', 624, 236);
        x.fillStyle = G2; x.fillText('p=0.89', 624, 262);
      }
      if (t > 3.2) { x.fillStyle = G2; x.font = MONO(21); x.fillText('conformal {bleached} · 90% cover · acc 89.5%', 56, 108); }
    },
    handos(x, T) {
      /* raw hand jitter vs the filtered cursor */
      const t = T % 4;
      base(x);
      x.fillStyle = FG; x.font = MONO(21); x.fillText('webcam hand → native cursor', 56, 70);
      const prog = Math.min(t / 2.6, 1);
      const baseY = s => 300 + 110 * Math.sin(s * 4.2) + 40 * Math.sin(s * 9);
      const drawPath = (jitter, col, w) => {
        x.strokeStyle = col; x.lineWidth = w; x.beginPath();
        for (let s = 0; s <= prog; s += .01) {
          const px = 70 + 640 * s;
          const py = baseY(s) + jitter * Math.sin(s * 90 + 2) * Math.cos(s * 41);
          s ? x.lineTo(px, py) : x.moveTo(px, py);
        }
        x.stroke();
      };
      drawPath(13, WARM, 1.5);           /* raw: ~27px of shake */
      drawPath(0, G, 3.5);               /* filtered */
      const hx = 70 + 640 * prog, hy = baseY(prog);
      x.fillStyle = G2; x.beginPath(); x.arc(hx, hy, 9, 0, 7); x.fill();
      x.lineWidth = 1;
      x.fillStyle = t > 2.8 ? G2 : FG; x.font = MONO(21);
      x.fillText(t > 2.8 ? 'kalman + one-euro · 27px → 6px ✓' : 'filtering…', 56, 108);
    },
  };
  /* representative timestamps for the reduced-motion / first static frame */
  const STATIC_T = { arb: 3.2, dna: 4.4, vote: 3.0, rag: 3.6, fish: 2.8, wiki: 2.2, wave: 1, gig: 3.6, wc: 3.4, reefscan: 3.6, handos: 3.2 };

  /* ---------- shared ~30fps ticker, viewport-gated ---------- */
  const live = new Map(); /* id → {x, t, visible} */
  let raf = null, lastDraw = 0;
  function tick(now) {
    if (now - lastDraw >= 33) {
      const dt = Math.min((now - lastDraw) / 1000, .1);
      lastDraw = now;
      live.forEach((c, id) => { if (c.visible) { c.t += dt; LOOPS[id](c.x, c.t); } });
    }
    raf = [...live.values()].some(c => c.visible) ? requestAnimationFrame(tick) : null;
  }
  function ensureTicker() {
    if (!raf && !reduce && [...live.values()].some(c => c.visible)) {
      lastDraw = performance.now();
      raf = requestAnimationFrame(tick);
    }
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      const c = live.get(en.target.dataset.id);
      if (c) c.visible = en.isIntersecting;
    });
    ensureTicker();
  }, { rootMargin: '60px' });

  function wireCard(el) {
    const id = el.dataset.id;
    const x = $('#cv-' + id).getContext('2d');
    LOOPS[id](x, STATIC_T[id]);                    /* static first frame (and reduced-motion end-state) */
    if (reduce) return;
    live.set(id, { x, t: STATIC_T[id], visible: false });
    io.observe(el);
    gsap.fromTo(el.querySelector('.pwrap'), { yPercent: -8 }, {
      yPercent: 8, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: .6 },
    });
  }

  /* ---------- initial four ---------- */
  PROJECTS.filter(p => !p[4]).forEach(p => grid.insertAdjacentHTML('beforeend', cardHTML(p)));
  $$('#pgrid .mcard').forEach(el => { wireCard(el); HK.reveal(el); });

  /* ---------- headline drift (gentler on phones so PROJECTS stays readable) ---------- */
  if (!reduce) {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 821px)', () => {
      /* the title is ~89vw wide and centered — ±4vw drift keeps every letter on screen */
      gsap.fromTo('#bigtitle', { x: '4vw' }, {
        x: '-4vw', ease: 'none',
        scrollTrigger: { trigger: '#projects', start: 'top bottom', end: 'bottom top', scrub: .7 },
      });
    });
    mm.add('(max-width: 820px)', () => {
      gsap.fromTo('#bigtitle', { x: '2vw' }, {
        x: '-3vw', ease: 'none',
        scrollTrigger: { trigger: '#projects', start: 'top bottom', end: 'bottom top', scrub: .7 },
      });
    });
  }

  /* ---------- View More — clip-wipe reveal, fluid grid growth, gentle scroll-along ---------- */
  $('#morebtn').addEventListener('click', () => {
    const wrap = $('#morewrap');
    const h0 = grid.offsetHeight;
    const moreCount = PROJECTS.filter(p => p[4]).length;
    PROJECTS.filter(p => p[4]).forEach(p => grid.insertAdjacentHTML('beforeend', cardHTML(p)));
    const fresh = $$('#pgrid .mcard').slice(-moreCount);
    fresh.forEach(wireCard);
    wrap.style.display = 'none';
    /* measure + refresh every trigger against the FINAL layout before animating —
       stale positions were making the experience timeline fire and wedge mid-scroll */
    ScrollTrigger.refresh();
    if (reduce) return;

    const h1 = grid.offsetHeight;
    const startY = window.scrollY;
    const targetY = Math.max(startY, fresh[0].getBoundingClientRect().top + startY - innerHeight * .3);
    gsap.set(grid, { height: h0, overflow: 'hidden' });
    gsap.set(fresh, { clipPath: 'inset(100% 0 0 0)', y: 24 });
    const scrollProxy = { y: startY };
    const html = document.documentElement;
    html.style.scrollBehavior = 'auto'; /* keep CSS smooth-scroll from fighting the tween */

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(grid, { height: 'auto', clearProps: 'overflow' });
        html.style.scrollBehavior = '';
      },
    });
    tl.to(grid, { height: h1, duration: 1, ease: 'power2.out' })
      .to(scrollProxy, {
        y: targetY, duration: 1, ease: 'power2.inOut',
        onUpdate: () => window.scrollTo(0, scrollProxy.y),
      }, '<')
      /* wipe rows in as their area appears so the growing grid never looks empty */
      .to(fresh, { clipPath: 'inset(0% 0 0 0)', y: 0, duration: .6, stagger: .1, ease: 'power3.out' }, '<.05');
  });
})();
