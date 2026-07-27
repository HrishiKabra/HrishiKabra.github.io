/* deck.js — skills deck set-piece */
(() => {
  const { $, $$ } = HK;

  /* [suit, [[skill, note?], …]] — ledger-row card fronts */
  const suits = [
    ['Languages', [['Python'], ['Java'], ['TypeScript · JavaScript'], ['C · C++'], ['SQL'], ['R · Bash']]],
    ['ML & AI', [['PyTorch'], ['LangGraph'], ['RAG & LLM APIs'], ['spaCy'], ['Fine-tuning'], ['Pandas · NumPy'], ['FAISS · Pinecone']]],
    ['Systems & Cloud', [['AWS · S3 · Glue · Athena'], ['Docker'], ['Airflow'], ['Postgres · pgvector'], ['AsyncIO'], ['SQLite · Git']]],
    ['Web', [['React'], ['Next.js'], ['FastAPI'], ['Flask · Django'], ['Supabase'], ['Tailwind · Vercel']]],
    ['Research', [['Social choice'], ['MIP'], ['Simulated annealing'], ['Gradient descent'], ['Bootstrap CIs'], ['LaTeX']]],
  ];
  const n = suits.length;

  const stage = $('#stage');
  suits.forEach((s, i) => {
    const rows = s[1].map(([skill, note]) =>
      `<div class="row"><span>${skill}</span>${note ? `<em>${note}</em>` : '<i></i>'}</div>`).join('');
    stage.insertAdjacentHTML('beforeend',
      `<div class="card3" id="c${i}">
        <div class="side back"><span class="hk">HK</span></div>
        <div class="side front">
          <div class="fhead"><h3>${s[0]}</h3><span class="idx">0${i + 1} / 05</span></div>
          <div class="rows">${rows}</div>
        </div>
      </div>`);
  });
  const cards = $$('.card3');

  const spread = () => Math.min(innerWidth * .17, 215);
  const fanX = i => (i - 2) * spread();
  const fanRot = i => (i - 2) * 5;
  /* per-card suspension: depth grows away from center, lag differs per card */
  const depth = i => .45 + Math.abs(i - 2) * .27;
  const lag = i => .45 + i * .075;

  const mm = gsap.matchMedia();

  /* ---------- desktop, full motion ---------- */
  mm.add('(min-width: 821px) and (prefers-reduced-motion: no-preference)', () => {
    let dealt = false, hovered = -1;
    let mx = 0, my = 0;

    cards.forEach((_, i) =>
      gsap.set('#c' + i, { x: 0, y: i * -2, rotate: (i - 2) * 2, rotateY: 0, zIndex: i, scale: 1 }));
    gsap.set('#skillhead', { y: 0, opacity: 1 });

    const st = ScrollTrigger.create({
      trigger: '#skills', start: 'top 45%', once: true,
      onEnter: () => {
        const tl = gsap.timeline({ onComplete: () => dealt = true });
        tl.to('#skillhead', { y: -40, opacity: 0, duration: .5, ease: 'power2.in' });
        cards.forEach((_, i) =>
          tl.to('#c' + i, { x: fanX(i), rotate: fanRot(i), y: 0, duration: .9, ease: 'power3.inOut' }, .35));
        cards.forEach((_, i) =>
          tl.to('#c' + i, { rotateY: 180, duration: .65, ease: 'power3.inOut' }, 1.35 + i * .16));
      },
    });

    const drift = i => ({
      x: fanX(i) + mx * 26 * depth(i),
      y: my * 18 * depth(i) + (hovered === i ? -14 : 0),
      rotate: fanRot(i) + mx * 3,
    });

    function onMove(e) {
      if (!dealt) return;
      const r = stage.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width - .5;
      my = (e.clientY - r.top) / r.height - .5;
      cards.forEach((_, i) =>
        gsap.to('#c' + i, { ...drift(i), duration: lag(i), ease: 'power3.out', overwrite: 'auto' }));
    }
    function onLeave() {
      if (!dealt) return;
      mx = my = 0; hovered = -1;
      cards.forEach((c, i) => {
        c.classList.remove('risen');
        gsap.to(c, { x: fanX(i), y: 0, rotate: fanRot(i), scale: 1, duration: .8, ease: 'power3.out', overwrite: 'auto' });
        gsap.set(c, { zIndex: i });
      });
    }
    const enters = [], leaves = [];
    /* one z-authority: the hovered card sits at 60, everyone else at base — applied atomically
       so two cards can never both be elevated (the old delayed resets caused visible stacking bugs) */
    let zReset = null;
    const setZ = top => cards.forEach((c, j) => gsap.set(c, { zIndex: j === top ? 60 : j }));
    cards.forEach((c, i) => {
      const enter = () => {
        if (!dealt) return;
        if (zReset) { zReset.kill(); zReset = null; }
        hovered = i;
        setZ(i);
        c.classList.add('risen');
        gsap.to(c, { ...drift(i), scale: 1.04, duration: .35, ease: 'power3.out', overwrite: 'auto' });
      };
      const leave = () => {
        if (!dealt) return;
        if (hovered === i) hovered = -1;
        c.classList.remove('risen');
        gsap.to(c, { ...drift(i), scale: 1, duration: .35, ease: 'power3.out', overwrite: 'auto' });
        /* keep the card on top while it settles, then hand z back — unless something else got hovered */
        if (zReset) zReset.kill();
        zReset = gsap.delayedCall(.32, () => { zReset = null; if (hovered === -1) setZ(-1); });
      };
      c.addEventListener('mouseenter', enter); c.addEventListener('mouseleave', leave);
      enters.push(enter); leaves.push(leave);
    });
    stage.addEventListener('mousemove', onMove);
    stage.addEventListener('mouseleave', onLeave);

    return () => {
      st.kill();
      stage.removeEventListener('mousemove', onMove);
      stage.removeEventListener('mouseleave', onLeave);
      cards.forEach((c, i) => { c.removeEventListener('mouseenter', enters[i]); c.removeEventListener('mouseleave', leaves[i]); });
    };
  });

  /* ---------- desktop, reduced motion: pre-dealt + flipped ---------- */
  mm.add('(min-width: 821px) and (prefers-reduced-motion: reduce)', () => {
    cards.forEach((_, i) =>
      gsap.set('#c' + i, { x: fanX(i), y: 0, rotate: fanRot(i), rotateY: 180, zIndex: i, scale: 1 }));
  });

  /* ---------- mobile: swipeable carousel, cards flip in with a stagger ---------- */
  mm.add('(max-width: 820px) and (prefers-reduced-motion: no-preference)', () => {
    cards.forEach(c => gsap.set(c, { x: 0, y: 0, rotate: 0, rotateY: 0, zIndex: 1, scale: 1, opacity: 0 }));
    const st = ScrollTrigger.create({
      trigger: stage, start: 'top 85%', once: true,
      onEnter: () => {
        gsap.to(cards, { opacity: 1, duration: .4, stagger: .1, ease: 'power3.out' });
        gsap.to(cards, { rotateY: 180, duration: .6, stagger: .12, delay: .15, ease: 'power3.inOut' });
      },
    });
    return () => st.kill();
  });

  mm.add('(max-width: 820px) and (prefers-reduced-motion: reduce)', () => {
    cards.forEach(c => gsap.set(c, { x: 0, y: 0, rotate: 0, rotateY: 180, zIndex: 1, scale: 1, opacity: 1 }));
  });
})();
