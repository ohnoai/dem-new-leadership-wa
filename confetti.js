/* Finish celebration: a center burst, two side cannons, then rain from the top; about 8 seconds, fading out over the
   last 1.5. Skipped entirely when the visitor prefers reduced motion. Presentation only. */
window.celebrate = () => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.getElementById('confetti'), x = c.getContext('2d'), dpr = devicePixelRatio || 1;
  const W = innerWidth, H = innerHeight;
  c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
  const colors = ['#d6fb35', '#d6fb35', '#f2f0e8', '#c0c2b8'], rnd = (a, b) => a + Math.random() * (b - a);
  const piece = o => ({ w: rnd(6, 12), h: rnd(8, 16), r: rnd(0, 6), vr: rnd(-.3, .3), sway: rnd(0, 6.28), col: colors[Math.random() * colors.length | 0], ...o });
  const start = performance.now(), total = 8000, fade = 1500, bits = [];
  for (let i = 0; i < 220; i++) bits.push(piece({ at: 0, x: W / 2 + rnd(-60, 60), y: H * .35, vx: rnd(-9, 9), vy: rnd(-17, -5) }));
  for (const side of [0, 1]) for (let i = 0; i < 120; i++) bits.push(piece({ at: 250 + side * 150, x: side ? W + 10 : -10, y: H * .75, vx: (side ? -1 : 1) * rnd(5, 15), vy: rnd(-19, -9) }));
  for (let i = 0; i < 360; i++) bits.push(piece({ at: rnd(600, 5600), x: rnd(0, W), y: -20, vx: rnd(-1.5, 1.5), vy: rnd(1, 3) }));
  (function frame(t) {
    const el = t - start, alpha = Math.max(0, Math.min(1, (total - el) / fade));
    x.clearRect(0, 0, W, H);
    for (const p of bits) {
      if (el < p.at || p.y > H + 40) continue;
      p.vy = Math.min(p.vy + .32, 5.5); p.vx *= .985; p.sway += .08;
      p.x += p.vx + Math.sin(p.sway) * .9; p.y += p.vy; p.r += p.vr;
      x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.globalAlpha = alpha; x.fillStyle = p.col;
      x.fillRect(-p.w / 2, -p.h / 2 * Math.abs(Math.cos(p.sway)), p.w, p.h * Math.abs(Math.cos(p.sway)) + 1); x.restore();
    }
    if (el < total) requestAnimationFrame(frame); else x.clearRect(0, 0, W, H);
  })(start);
};
