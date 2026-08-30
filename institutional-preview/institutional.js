(() => {
  const canvas = document.querySelector('[data-particles]');
  if (!canvas) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  let width = 0, height = 0, dpr = 1, raf = 0;
  const pointer = { x: .78, y: .48, tx: .78, ty: .48 };
  const bands = [];

  function build() {
    bands.length = 0;
    const mobile = width < 700;
    const rows = mobile ? 7 : 10;
    const cols = mobile ? 18 : 28;
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        row.push({
          phase: Math.random() * Math.PI * 2,
          drift: .65 + Math.random() * .65,
          size: .65 + Math.random() * 1.45,
          red: Math.random() < .055,
          alpha: .18 + Math.random() * .38
        });
      }
      bands.push(row);
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
  }

  function draw(time = 0) {
    ctx.clearRect(0, 0, width, height);
    const t = time * .00022;
    pointer.x += (pointer.tx - pointer.x) * .035;
    pointer.y += (pointer.ty - pointer.y) * .035;
    const startX = width * (width < 700 ? .18 : .42);
    const usableW = width - startX + 40;
    const centerY = height * .5;
    const amp = Math.min(height * .13, 118);

    bands.forEach((row, r) => {
      const rowOffset = (r - (bands.length - 1) / 2) * (height < 760 ? 26 : 34);
      row.forEach((p, c) => {
        const u = c / Math.max(1, row.length - 1);
        const x = startX + u * usableW;
        const envelope = Math.sin(Math.PI * u);
        const wave = Math.sin(u * 8.4 + t * 5.6 * p.drift + p.phase) * amp * envelope;
        const second = Math.sin(u * 3.2 - t * 2.1 + r * .42) * amp * .18;
        const pointerLift = (pointer.y - .5) * 70 * envelope;
        const y = centerY + rowOffset + wave + second + pointerLift;
        const fadeX = Math.max(0, Math.min(1, (x - width * .32) / (width * .58)));
        const edge = Math.sin(Math.PI * Math.max(0, Math.min(1, u)));
        const alpha = p.alpha * fadeX * (.38 + edge * .62);

        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.red
          ? `rgba(199,25,39,${Math.min(.56, alpha * 1.18)})`
          : `rgba(236,232,225,${alpha * .55})`;
        ctx.fill();
      });
    });

    if (!reduced) raf = requestAnimationFrame(draw);
  }

  const hero = canvas.closest('.hero');
  if (hero && !reduced && matchMedia('(pointer:fine)').matches) {
    hero.addEventListener('pointermove', (e) => {
      const rect = hero.getBoundingClientRect();
      pointer.tx = (e.clientX - rect.left) / rect.width;
      pointer.ty = (e.clientY - rect.top) / rect.height;
    }, { passive: true });
    hero.addEventListener('pointerleave', () => {
      pointer.tx = .78; pointer.ty = .48;
    });
  }

  addEventListener('resize', resize, { passive: true });
  resize();
  draw(0);
  if (reduced) cancelAnimationFrame(raf);
})();