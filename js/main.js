/* main.js — config, theme, nav, loader, hero, about, stats, experience, terminal */
gsap.registerPlugin(ScrollTrigger);

const NAV_VARIANT = 'links'; /* 'links' | 'dock' — desktop A/B; mobile always gets the menu overlay */

window.HK = {
  reduce: matchMedia('(prefers-reduced-motion: reduce)').matches,
  mobile: () => matchMedia('(max-width: 820px)').matches,
  $: s => document.querySelector(s),
  $$: s => [...document.querySelectorAll(s)],
};
const { $, $$, reduce } = HK;

/* ---------- theme (circle-reveal switch via the View Transitions API) ---------- */
const root = document.documentElement;
function applyTheme(t) {
  root.dataset.theme = t;
  localStorage.setItem('hk-theme', t);
  ScrollTrigger.refresh();
}
HK.toggleTheme = ev => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  const btn = ev && ev.currentTarget instanceof Element ? ev.currentTarget : null;
  if (reduce || !document.startViewTransition) { applyTheme(next); return next; }
  if (!btn) { document.startViewTransition(() => applyTheme(next)); return next; } /* default crossfade */
  root.classList.add('vt-circle');
  const r = btn.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const rad = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy));
  const vt = document.startViewTransition(() => applyTheme(next));
  vt.ready.then(() => {
    root.animate(
      { clipPath: [`circle(0px at ${cx}px ${cy}px)`, `circle(${rad}px at ${cx}px ${cy}px)`] },
      { duration: 650, easing: 'cubic-bezier(.22,1,.36,1)', pseudoElement: '::view-transition-new(root)' });
  }).catch(() => {});
  vt.finished.finally(() => root.classList.remove('vt-circle'));
  return next;
};
/* the inline <head> script already set this pre-paint; re-apply to persist + refresh triggers */
applyTheme(root.dataset.theme || localStorage.getItem('hk-theme') ||
  (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
['themebtn', 'themebtn-m'].forEach(id => {
  const b = document.getElementById(id);
  if (b) b.addEventListener('click', e => HK.toggleTheme(e));
});

/* ---------- nav variant + dock ---------- */
if (NAV_VARIANT === 'dock' && !HK.mobile()) {
  $('.navlinks').style.display = 'none';
  $('#dock').classList.add('on');
  $('#dock').setAttribute('aria-hidden', 'false');
}

/* ---------- menu overlay ---------- */
const overlay = $('#overlay'), menubtn = $('#menubtn');
let overlayOpen = false;
function openOverlay() {
  overlayOpen = true;
  overlay.style.visibility = 'visible';
  overlay.setAttribute('aria-hidden', 'false');
  menubtn.setAttribute('aria-expanded', 'true');
  if (reduce) {
    overlay.style.clipPath = 'inset(0 0 0% 0)';
    $$('#overlay nav a, #overlay .oextra').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
    return;
  }
  gsap.to(overlay, { clipPath: 'inset(0 0 0% 0)', duration: .7, ease: 'power3.inOut' });
  gsap.fromTo('#overlay nav a', { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration: .6, stagger: .07, delay: .35, ease: 'power3.out', overwrite: 'auto' });
  gsap.fromTo('#overlay .oextra', { opacity: 0, y: 24 },
    { opacity: 1, y: 0, duration: .6, delay: .7, ease: 'power3.out', overwrite: 'auto' });
}
function closeOverlay() {
  overlayOpen = false;
  overlay.setAttribute('aria-hidden', 'true');
  menubtn.setAttribute('aria-expanded', 'false');
  const done = () => { overlay.style.visibility = 'hidden'; };
  if (reduce) { overlay.style.clipPath = 'inset(0 0 100% 0)'; done(); return; }
  gsap.to('#overlay nav a, #overlay .oextra', { opacity: 0, y: 30, duration: .3, ease: 'power3.in', overwrite: 'auto' });
  gsap.to(overlay, { clipPath: 'inset(0 0 100% 0)', duration: .6, ease: 'power3.inOut', delay: .15, onComplete: done });
}
menubtn.addEventListener('click', () => overlayOpen ? closeOverlay() : openOverlay());
$('#overlayx').addEventListener('click', closeOverlay);
$$('#overlay a').forEach(a => a.addEventListener('click', closeOverlay));
addEventListener('keydown', e => { if (e.key === 'Escape' && overlayOpen) closeOverlay(); });

/* ---------- reveal verb (fade + 12px rise) ---------- */
HK.reveal = (targets, vars = {}) => {
  if (reduce) return;
  gsap.utils.toArray(targets).forEach(el => {
    gsap.from(el, {
      opacity: 0, y: 12, duration: .7, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }, ...vars,
    });
  });
};

/* ---------- loader + hero settle-in ---------- */
const WORDS = ['Hello', 'नमस्ते', 'Bonjour', 'Hola', 'こんにちは', 'Ciao'];
const WORD_MS = 420;  /* dwell per greeting — whole intro ≈ 6×WORD_MS + .7s slide */
function heroIn(withDelay) {
  if (reduce) return;
  const d = withDelay ? 0 : .15;
  gsap.set('#hero h1 .line>span', { y: '110%' });
  gsap.set('#hero .intro, #hero .ctas, .tiltcard', { opacity: 0 });
  gsap.to('#hero h1 .line>span', { y: 0, duration: .9, stagger: .09, ease: 'power3.out', delay: d });
  gsap.to('#hero .intro', { opacity: 1, duration: .7, delay: d + .5 });
  gsap.to('#hero .ctas', { opacity: 1, duration: .7, delay: d + .65 });
  gsap.to('.tiltcard', { opacity: 1, duration: .9, delay: d + .35 });
}
(function boot() {
  /* whether the loader runs was decided pre-paint by the inline <head> script */
  if (reduce || !root.classList.contains('loading')) { heroIn(false); return; }
  const L = $('#loader'), W = $('#lw');
  gsap.set('#hero h1 .line>span', { y: '110%' });
  gsap.set('#hero .intro, #hero .ctas, .tiltcard', { opacity: 0 });
  let i = 0;
  const iv = setInterval(() => {
    i++;
    if (i >= WORDS.length) {
      clearInterval(iv);
      gsap.to(L, {
        yPercent: -100, duration: .7, ease: 'power3.inOut',
        onComplete: () => { root.classList.remove('loading'); L.style.transform = ''; heroIn(true); },
      });
    } else W.textContent = WORDS[i];
  }, WORD_MS);
})();

/* ---------- hero photo: sits beside the name on phones, beside the column on desktop ---------- */
(function placePhoto() {
  const img = $('.heroimg'), h1 = $('#hero h1'), hero = $('#hero');
  const mq = matchMedia('(max-width: 820px)');
  const place = () => mq.matches ? h1.insertAdjacentElement('afterend', img) : hero.appendChild(img);
  place();
  mq.addEventListener('change', place);
})();

/* ---------- hero photo tilt ---------- */
const tilt = $('#tilt');
tilt.addEventListener('mousemove', e => {
  if (reduce) return;
  const r = tilt.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
  gsap.to(tilt, { rotateY: x * 8, rotateX: -y * 7, transformPerspective: 800, duration: .4, ease: 'power3.out' });
});
tilt.addEventListener('mouseleave', () =>
  gsap.to(tilt, { rotateX: 0, rotateY: 0, duration: .6, ease: 'power3.out' }));

/* ---------- ghost numerals — slower scroll rate ---------- */
if (!reduce) $$('.ghost').forEach(g => {
  gsap.fromTo(g, { y: -50 }, {
    y: 90, ease: 'none',
    scrollTrigger: { trigger: g.parentElement, start: 'top bottom', end: 'bottom top', scrub: .8 },
  });
});

/* ---------- about ink-in ---------- */
(function inkIn() {
  const ink = $('#inktext');
  const frag = document.createDocumentFragment();
  let prevEndsOpen = false; /* previous node ended mid-word (no trailing whitespace) */
  [...ink.childNodes].forEach(node => {
    const hl = node.nodeType === 1 && node.classList.contains('hlm');
    const text = node.textContent;
    const words = text.split(/\s+/).filter(Boolean);
    words.forEach((w, j) => {
      /* glue leading punctuation (", teach" after a highlight) onto the previous word */
      if (j === 0 && prevEndsOpen && !/^\s/.test(text) && frag.lastElementChild) {
        frag.lastElementChild.textContent += w;
        return;
      }
      const s = document.createElement('span');
      s.className = 'w' + (hl ? ' hl' : '');
      s.textContent = w;
      frag.appendChild(s);
      frag.appendChild(document.createTextNode(' '));
    });
    prevEndsOpen = !/\s$/.test(text);
  });
  ink.textContent = '';
  ink.appendChild(frag);
  if (reduce) return;
  const ws = $$('#about .w');
  ScrollTrigger.create({
    trigger: '#about', start: 'top 70%', end: 'bottom 60%', scrub: true,
    onUpdate: st => {
      const n = Math.floor(st.progress * ws.length * 1.15);
      ws.forEach((w, i) => w.classList.toggle('on', i <= n));
    },
  });
})();

/* ---------- stats count-ups (only counters on the page) ---------- */
$$('#stats [data-count]').forEach(el => {
  if (reduce) return; /* final values are already in the markup */
  const target = +el.dataset.count;
  el.textContent = '0';
  ScrollTrigger.create({
    trigger: el, start: 'top 85%', once: true,
    onEnter: () => {
      const o = { v: 0 };
      gsap.to(o, { v: target, duration: 1.4, ease: 'power3.out', onUpdate: () => el.textContent = Math.round(o.v) });
    },
  });
});

/* ---------- gentle reveals ---------- */
HK.reveal('#about .fine, #contact h2, #contact .sub2, #contact .btn');

/* ---------- terminal: window-opens clip reveal (scrubbed) ---------- */
if (!reduce) {
  /* end inset is negative so the box shadow isn't clipped once fully open */
  gsap.fromTo('.term',
    { clipPath: 'inset(18% 24% 18% 24% round 18px)' },
    {
      clipPath: 'inset(-8% -8% -14% -8% round 18px)', ease: 'none',
      scrollTrigger: { trigger: '.term', start: 'top 94%', end: 'top 42%', scrub: .5 },
    });
}

/* ---------- nav: fuse into one capsule on scroll down; split on scroll up / hover ---------- */
(function navFuse() {
  const nav = document.querySelector('header nav');
  let lastY = scrollY, wantFused = false, hovering = false;
  const apply = () => nav.classList.toggle('fused', wantFused && !hovering);
  addEventListener('scroll', () => {
    const d = scrollY - lastY;
    if (Math.abs(d) < 5) return;
    if (d > 0 && scrollY > 140) wantFused = true;
    else if (d < 0) wantFused = false;
    lastY = scrollY;
    apply();
  }, { passive: true });
  /* hover splits it AND clears the fused intent — it stays open until the next scroll DOWN */
  nav.addEventListener('mouseenter', () => { hovering = true; wantFused = false; apply(); });
  nav.addEventListener('mouseleave', () => { hovering = false; apply(); });
})();

/* ---------- nav: sage pill travels between links on hover ---------- */
(function hoverPill() {
  const pill = $('#apill');
  if (!pill) return;
  const island = $('#navlinks');
  const links = [...island.querySelectorAll('a')];
  let visible = false;
  function moveTo(a) {
    const x = a.offsetLeft, w = a.offsetWidth; /* layout coords — immune to the fused scale */
    links.forEach(l => l.classList.toggle('on', l === a));
    if (!visible || reduce) {
      gsap.set(pill, { x, width: w });
      gsap.to(pill, { opacity: 1, duration: reduce ? 0 : .2, overwrite: 'auto' });
    } else {
      gsap.to(pill, { x, width: w, opacity: 1, duration: .55, ease: 'elastic.out(1,.72)', overwrite: 'auto' });
    }
    visible = true;
  }
  links.forEach(a => a.addEventListener('mouseenter', () => moveTo(a)));
  island.addEventListener('mouseleave', () => {
    visible = false;
    links.forEach(l => l.classList.remove('on'));
    gsap.to(pill, { opacity: 0, duration: .25, overwrite: 'auto' });
  });
})();

/* ---------- experience: timeline + sticky live panel ---------- */
const ROLES = [
  ['Currently', 'Louisa AI', 'Software Engineer Intern, Embedded AI — Mumbai', '1000s', 'of contacts resolved per pipeline run', 'Airflow · OpenAI · Tavily · Firecrawl'],
  ['Research', 'TUDAI', 'Research Assistant — Tulane', 'AAMAS', '2026 — co-authored + PyPI package', 'Simulated annealing · GD · MIP'],
  ['Teaching', 'Tulane CS', 'Undergraduate TA', '50+', 'students across two courses', 'Data science · Intro CS'],
  ['Previously', 'Niyogin AI', 'AI/ML Engineer Intern — Mumbai', '~97%', 'NER precision on noisy OCR', 'SpaCy · Python · Excel automation'],
];
const SIDE_IDS = ['s-k', 's-org', 's-role', 's-metric', 's-md', 's-stk'];
let curRole = 0;
function setSide(i) {
  curRole = i;
  const fill = () => SIDE_IDS.forEach((id, j) => $('#' + id).textContent = ROLES[i][j]);
  if (reduce) { fill(); return; }
  gsap.to('#side > :not(canvas)', {
    opacity: 0, y: 8, duration: .18, overwrite: 'auto',
    onComplete: () => {
      fill();
      gsap.to('#side > :not(canvas)', { opacity: 1, y: 0, duration: .3, stagger: .03, overwrite: 'auto' });
    },
  });
}
const steps = $$('.step');
if (reduce) {
  $('#prog').style.height = '100%';
  steps.forEach(s => s.classList.add('on'));
} else {
  /* stateless: derive everything from live rects each scroll tick, so layout changes
     (View More growing the page) can never leave the timeline wedged in a stale state */
  const progEl = $('#prog'), stepsEl = $('#steps');
  let progH = -1;
  function updateSteps() {
    const line = innerHeight * .58;
    let active = -1;
    steps.forEach((s, i) => {
      const on = s.getBoundingClientRect().top < line;
      s.classList.toggle('on', on);
      if (on) active = i;
    });
    if (active >= 0 && active !== curRole) setSide(active);
    const r = stepsEl.getBoundingClientRect();
    const h = Math.round(Math.max(0, Math.min(line - r.top, r.height)));
    if (h !== progH) { progH = h; progEl.style.height = h + 'px'; }
  }
  addEventListener('scroll', updateSteps, { passive: true });
  addEventListener('resize', updateSteps);
  ScrollTrigger.addEventListener('refresh', updateSteps);
  updateSteps();
}

/* rings canvas — ~30fps, viewport-gated */
(function rings() {
  const cv = $('#sidecv'), sc = cv.getContext('2d');
  const accent = () => document.documentElement.dataset.theme === 'dark' ? '#7BAE8A' : '#4A7C59';
  let t = 2, visible = false, raf = null, last = 0;
  function draw() {
    sc.clearRect(0, 0, 300, 300);
    sc.strokeStyle = accent(); sc.globalAlpha = .6; sc.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      sc.beginPath(); sc.arc(150, 150, 60 + i * 34 + Math.sin(t * 2 + i) * 6, 0, 7); sc.stroke();
    }
  }
  draw();
  if (reduce) return;
  function frame(now) {
    if (now - last >= 33) { t += (now - last) / 1000; last = now; draw(); }
    raf = visible ? requestAnimationFrame(frame) : null;
  }
  new IntersectionObserver(en => {
    visible = en[0].isIntersecting;
    if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }).observe(cv);
})();

/* ---------- terminal (virtual fs + unix classics) ---------- */
(function terminal() {
  const out = $('#tout'), input = $('#tin');
  const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const BIO = 'Hrishi Kabra — CS + Math junior @ Tulane (May 2028)\nSWE intern @ Louisa AI · AAMAS 2026 co-author · TA for 50+ students\nPADI Master Scuba Diver — New Orleans / Mumbai';
  const proj = (title, line, url) => `# ${title}\n${line}\n${url || '(no public link yet)'}`;
  const FS = {
    'about.txt': BIO,
    'dive-log.txt': 'last logged: Coral Triangle\ncerts: PADI Master Scuba Diver · Rescue Diver\nbuddy: one very judgmental sea turtle\nvisibility: better than my git history',
    'resume.pdf': '%BINARY%',
    '.plan': '1. build ML systems that ship\n2. research that counts\n3. more bottom time 🤿',
    'projects': {
      'wc-market.md': proj('World Cup Prediction Market', 'Dixon-Coles + LMSR · 100k Monte Carlo sims · Brier 0.572 vs 0.613 Elo', 'https://wc-prediction-market.vercel.app'),
      'optimal-voting.md': proj('Optimal Voting — AAMAS 2026', 'Peer-reviewed · positional-scoring optimizers · SA / GD / MIP', 'https://pypi.org/project/optimal-voting/'),
      'reefscan.md': proj('ReefScan', 'DINOv2 + SAM2 + conformal prediction · 89.5% test acc', 'https://reefscan.vercel.app'),
      'f1-interpreter.md': proj('F1 Rule Interpreter', 'Corrective RAG over 1,000+ FIA PDFs · 60% → 93% citation coverage', 'https://github.com/HrishiKabra/AI_Engineering_Project'),
      'fishid.md': proj('FishID', 'Species ID from photos · Next.js + Supabase', 'https://fishid.vercel.app'),
      'arbitrage.md': proj('Cross-Venue Arbitrage Engine', 'Kalshi × Polymarket · >95% event match · sub-2s EV', null),
      'handos.md': proj('HandOS', 'Gesture control for macOS · Kalman + One-Euro · 27px → 6px jitter', 'https://github.com/HrishiKabra/HandOS'),
      'circuit-dna.md': proj('Circuit DNA', 'F1 telemetry fingerprints · OpenF1 · 360° resampling', 'https://hrishikabra.github.io/circuit_dna/'),
      'ocean-jukebox.md': proj('Ocean Jukebox', '131 NOAA hydrophone recordings · Leaflet', 'https://hrishikabra.github.io/ocean_jukebox/'),
      'wikipedia-race.md': proj('Wikipedia Race', 'Bidirectional BFS pathfinder · React', 'https://wikipediarace.netlify.app'),
      'gigpilot.md': proj('GigPilot', 'Multi-agent gig booking · Freeman AI Challenge winner', null),
    },
  };
  const norm = p => (p || '').replace(/^~\/?/, '').replace(/^\.\//, '').replace(/\/$/, '');
  const resolve = p => {
    const parts = norm(p).split('/').filter(Boolean);
    let node = FS;
    for (const part of parts) {
      if (typeof node !== 'object' || node === null || !(part in node)) return undefined;
      node = node[part];
    }
    return node;
  };
  const lsDir = (dir, all) => Object.keys(dir)
    .filter(k => all || !k.startsWith('.'))
    .map(k => typeof dir[k] === 'object' ? k + '/' : k)
    .sort().join('   ');

  const history = [];
  const CMDS = {
    help: () => 'site: projects · email · resume · github · linkedin · theme · whoami · dive · box box · clear\nshell: ls [-a] · cat <file> · open <file> · pwd · cd · echo · date · uname · history\ntry: ls projects · cat projects/f1-interpreter.md · cat .plan',
    projects: () => { $('#projects').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); return 'scrolling to projects…'; },
    email: () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText('hkabra@tulane.edu').catch(() => {});
        return 'hkabra@tulane.edu → copied to clipboard ✓';
      }
      return 'hkabra@tulane.edu (clipboard unavailable — copy it the old way)';
    },
    resume: () => { window.open('assets/HrishiKabraResume.pdf', '_blank', 'noopener'); return '→ opening HrishiKabraResume.pdf'; },
    github: () => { window.open('https://github.com/HrishiKabra', '_blank', 'noopener'); return '→ github.com/HrishiKabra'; },
    linkedin: () => { window.open('https://linkedin.com/in/HrishiKabra', '_blank', 'noopener'); return '→ linkedin.com/in/HrishiKabra'; },
    theme: () => `theme → ${HK.toggleTheme()} ✓`,
    whoami: () => BIO,
    dive: () => '🤿 logged: Coral Triangle · PADI Master Scuba Diver\n"the ocean is the best debugger"',
    'box box': () => '🏎  pitting for softs. undercut deployed.',
    clear: () => { out.textContent = ''; return null; },
    pwd: () => '/Users/visitor',
    date: () => new Date().toString(),
    uname: () => 'hkOS 3.0 · sage-kernel · cream build · Fraunces/Archivo/JetBrains',
    history: () => history.map((h, i) => `  ${i + 1}  ${h}`).join('\n') || '(empty)',
  };
  const RUN = {
    ls(args) {
      const all = args.includes('-a') || args.includes('-la') || args.includes('-al');
      const path = args.find(a => !a.startsWith('-'));
      if (!path) return lsDir(FS, all);
      const node = resolve(path);
      if (node === undefined) return `ls: ${path}: No such file or directory`;
      return typeof node === 'object' ? lsDir(node, all) : norm(path);
    },
    cat(args) {
      if (!args.length) return 'cat: which file? try ls';
      const node = resolve(args[0]);
      if (node === undefined) return `cat: ${args[0]}: No such file or directory`;
      if (typeof node === 'object') return `cat: ${norm(args[0])}: Is a directory`;
      if (node === '%BINARY%') return `${norm(args[0])} is binary — try: open ${norm(args[0])}`;
      return node;
    },
    open(args) {
      if (!args.length) return 'open: which file? try ls';
      const p = norm(args[0]);
      if (p === 'resume.pdf') { window.open('assets/HrishiKabraResume.pdf', '_blank', 'noopener'); return '→ opening resume.pdf'; }
      const node = resolve(p);
      if (node === undefined) return `open: ${p}: No such file or directory`;
      if (typeof node === 'string') {
        const url = (node.match(/https?:\/\/\S+/) || [])[0];
        if (url) { window.open(url, '_blank', 'noopener'); return `→ ${url}`; }
        return `open: ${p}: nothing to open — cat it instead`;
      }
      return `open: ${p}: Is a directory`;
    },
    cd(args) {
      const p = norm(args[0] || '');
      if (!p || p === '~') return '';
      if (resolve(p) === undefined) return `cd: ${p}: No such file or directory`;
      return 'cd: guest shell is read-only — directories are for looking (ls), not living';
    },
    echo(args, raw) { return raw.slice(5) || ''; },
    sudo() { return 'visitor is not in the sudoers file. This incident will be reported 🤿'; },
    rm() { return 'rm: permission denied — and the reef thanks you for it'; },
    git() { return 'on branch redesign-v3 — working tree clean. everything ships ✓'; },
    python() { return 'Python 3.13 (just kidding — this shell speaks JavaScript)'; },
    vim() { return 'E37: no write since last change. also: :q will not save you here'; },
    nano() { return 'nano: this terminal is 13px tall. use cat'; },
    man(args) { return args[0] ? `No manual entry for ${args[0]} — try help` : 'What manual page do you want?'; },
    touch() { return 'touch: read-only filesystem (the grass, however, is available)'; },
  };

  const FILE_PATHS = ['about.txt', 'dive-log.txt', 'resume.pdf', '.plan', 'projects',
    ...Object.keys(FS.projects).map(f => 'projects/' + f)];
  const ALL_CMDS = [...Object.keys(CMDS), ...Object.keys(RUN)];

  function execute(raw) {
    const q = raw.trim();
    const lower = q.toLowerCase();
    if (CMDS[lower]) return CMDS[lower]();
    const [cmd, ...args] = q.split(/\s+/);
    if (RUN[cmd.toLowerCase()]) return RUN[cmd.toLowerCase()](args, q);
    return `command not found: ${cmd.toLowerCase()} — try help`;
  }

  let hi = -1;
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length) { hi = Math.min(hi + 1, history.length - 1); input.value = history[history.length - 1 - hi]; }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (hi > 0) { hi--; input.value = history[history.length - 1 - hi]; }
      else { hi = -1; input.value = ''; }
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const v = input.value;
      const sp = v.indexOf(' ');
      if (sp === -1) { /* complete the command */
        const m = ALL_CMDS.find(c => c.startsWith(v.trim().toLowerCase()));
        if (v.trim() && m) input.value = m + (RUN[m] && m !== 'pwd' ? ' ' : '');
      } else {          /* complete a file argument */
        const head = v.slice(0, sp + 1), frag = v.slice(sp + 1).trim();
        const m = FILE_PATHS.find(f => f.startsWith(frag));
        if (m) input.value = head + m;
      }
      return;
    }
    if (e.key !== 'Enter') return;
    const q = input.value.trim();
    input.value = '';
    if (!q) return;
    history.push(q); hi = -1;
    const res = execute(q);
    if (res !== null) out.innerHTML += `<span class="g">›</span> ${esc(q)}\n${esc(res)}\n`;
    out.scrollTop = out.scrollHeight;
  });
})();
