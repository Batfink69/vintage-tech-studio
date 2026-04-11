/* ═══════════════════════════════════════
   Vintage Tech — Main JS
   1. Hero diamond — animated on divider
      Rotate one full turn (ease in/out)
      Pause for a beat, then repeat
   2. Hero split-screen cursor interaction
   3. Nav scroll tint
   4. Smooth anchor links
   5. Commission form feedback
═══════════════════════════════════════ */

(function () {
  'use strict';

  var TWO_PI   = Math.PI * 2;
  var SPIN_MS  = 4400;
  var PAUSE_MS = 2000;
  var CYCLE_MS = SPIN_MS + PAUSE_MS;
  var loopStart = null;

  /* ── Easing ── */
  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  /* ── 3D rotation helpers ── */
  function rotY(x, y, z, a) {
    return {
      x:  x * Math.cos(a) + z * Math.sin(a),
      y:  y,
      z: -x * Math.sin(a) + z * Math.cos(a)
    };
  }
  function proj(p, fov, cx, cy) {
    var s = fov / (fov + p.z);
    return { x: cx + p.x * s, y: cy + p.y * s, z: p.z };
  }

  /* ── Diamond draw ── */
  function drawDiamond(canvas, angle) {
    var ctx = canvas.getContext('2d');
    var W = 50, H = 38;
    var cx = canvas.width  / 2;
    var cy = canvas.height / 2;
    var fov = 280;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var base = [
      { x:  0, y: -H, z: 0 },
      { x:  W, y:  0, z: 0 },
      { x:  0, y:  H, z: 0 },
      { x: -W, y:  0, z: 0 }
    ];

    var rot = base.map(function (v) { return rotY(v.x, v.y, v.z, angle); });
    var prj = rot.map(function (p) { return proj(p, fov, cx, cy); });

    /* Left half fill — studio green */
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, cx, canvas.height);
    ctx.clip();
    ctx.beginPath();
    ctx.moveTo(prj[0].x, prj[0].y);
    ctx.lineTo(prj[1].x, prj[1].y);
    ctx.lineTo(prj[2].x, prj[2].y);
    ctx.lineTo(prj[3].x, prj[3].y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(74,158,106,0.09)';
    ctx.fill();
    ctx.restore();

    /* Right half fill — factory blue */
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx, 0, canvas.width - cx, canvas.height);
    ctx.clip();
    ctx.beginPath();
    ctx.moveTo(prj[0].x, prj[0].y);
    ctx.lineTo(prj[1].x, prj[1].y);
    ctx.lineTo(prj[2].x, prj[2].y);
    ctx.lineTo(prj[3].x, prj[3].y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(106,156,196,0.07)';
    ctx.fill();
    ctx.restore();

    /* Edges — depth-responsive opacity and weight */
    var edges = [
      { f: 3, t: 0, col: 'rgba(74,158,106,'  },
      { f: 0, t: 1, col: 'rgba(106,156,196,' },
      { f: 1, t: 2, col: 'rgba(106,156,196,' },
      { f: 2, t: 3, col: 'rgba(74,158,106,'  }
    ];

    edges.map(function (e) {
      return {
        f: e.f, t: e.t, col: e.col,
        avgZ: (rot[e.f].z + rot[e.t].z) / 2
      };
    }).sort(function (a, b) {
      return a.avgZ - b.avgZ;
    }).forEach(function (e) {
      var p1  = prj[e.f];
      var p2  = prj[e.t];
      var nz  = (e.avgZ + W) / (2 * W);
      var op  = Math.max(0.14, Math.min(0.92, 0.16 + nz * 0.76));
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = e.col + op.toFixed(2) + ')';
      ctx.lineWidth   = 1.2 + nz * 1.5;
      ctx.lineCap     = 'round';
      ctx.stroke();
    });

    /* Gold vertical axis — always static */
    ctx.beginPath();
    ctx.moveTo(cx, cy - H);
    ctx.lineTo(cx, cy + H);
    ctx.strokeStyle = 'rgba(184,154,106,0.46)';
    ctx.lineWidth   = 0.75;
    ctx.stroke();

    /* Top and bottom tick marks */
    var tk = 3.5;
    ctx.strokeStyle = 'rgba(184,154,106,0.3)';
    ctx.lineWidth   = 0.7;
    [[cx, cy - H, -1], [cx, cy + H, 1]].forEach(function (pt) {
      ctx.beginPath(); ctx.moveTo(pt[0] - tk, pt[1] + pt[2] * tk); ctx.lineTo(pt[0], pt[1] + pt[2] * tk * 2.2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pt[0] + tk, pt[1] + pt[2] * tk); ctx.lineTo(pt[0], pt[1] + pt[2] * tk * 2.2); ctx.stroke();
    });

    /* Centre diamond — static gold */
    var ds = 3.5;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle   = '#09090a';
    ctx.fillRect(-ds, -ds, ds * 2, ds * 2);
    ctx.strokeStyle = 'rgba(184,154,106,0.92)';
    ctx.lineWidth   = 0.85;
    ctx.strokeRect(-ds, -ds, ds * 2, ds * 2);
    ctx.restore();

    /* Studio label — left half, italic serif, static */
    ctx.font         = 'italic 300 10px "Cormorant Garamond",serif';
    ctx.fillStyle    = 'rgba(74,158,106,0.85)';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Studio', cx - 27, cy + 1);

    /* Factory label — right half, condensed, static */
    ctx.font      = '500 9px "Barlow Condensed",sans-serif';
    ctx.fillStyle = 'rgba(106,156,196,0.85)';
    ctx.fillText('Factory', cx + 28, cy + 1);
  }

  /* ── Angle from pause-beat cycle ── */
  function getAngle(ts) {
    if (!loopStart) loopStart = ts;
    var elapsed = (ts - loopStart) % CYCLE_MS;
    return elapsed < SPIN_MS
      ? easeInOut(elapsed / SPIN_MS) * TWO_PI
      : TWO_PI;
  }

  /* ── Hero element refs ── */
  var hero        = document.getElementById('hero');
  var heroStudio  = document.getElementById('heroStudio');
  var heroDivider = document.getElementById('heroDivider');
  var heroDiamond = document.getElementById('heroDiamond');
  var studioC     = document.getElementById('studioContent');
  var factoryC    = document.getElementById('factoryContent');
  var hintEl      = document.getElementById('heroHint');
  var nav         = document.getElementById('nav');

  var cur = 50, tgt = 50, curY = 50, tgtY = 50;
  var mouseOn = false, idleT = 0, hintTimer = null;

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function lerp(a, b, t)  { return a + (b - a) * t; }

  /* ── Hero interaction ── */
  if (hero) {
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      tgt  = clamp((e.clientX - r.left) / r.width  * 100, 12, 88);
      tgtY = clamp((e.clientY - r.top)  / r.height * 100, 5, 95);
      if (!mouseOn) {
        mouseOn = true;
        if (hintEl) hintEl.style.opacity = '0';
      }
      clearTimeout(hintTimer);
      hintTimer = setTimeout(function () {
        if (hintEl) hintEl.style.opacity = '0.18';
      }, 5000);
    });

    hero.addEventListener('mouseleave', function () {
      tgt = 50;
      mouseOn = false;
      setTimeout(function () {
        if (hintEl) hintEl.style.opacity = '0.18';
      }, 1200);
    });

    hero.addEventListener('touchmove', function (e) {
      e.preventDefault();
      var r = hero.getBoundingClientRect();
      var t = e.touches[0];
      tgt  = clamp((t.clientX - r.left) / r.width  * 100, 12, 88);
      tgtY = clamp((t.clientY - r.top)  / r.height * 100, 5, 95);
      mouseOn = true;
    }, { passive: false });

    hero.addEventListener('touchend', function () {
      tgt = 50;
      mouseOn = false;
    });
  }

  /* ── Main animation loop ── */
  function frame(ts) {

    /* Idle drift when no cursor */
    if (!mouseOn) {
      idleT += 0.4;
      tgt  = 50 + Math.sin(idleT * 0.011) * 7;
      tgtY = 50 + Math.cos(idleT * 0.009) * 8;
    }

    cur  = lerp(cur,  tgt,  0.044);
    curY = lerp(curY, tgtY, 0.044);

    /* Studio clip */
    if (heroStudio) {
      heroStudio.style.clipPath =
        'polygon(0 0,' + cur + '% 0,' + cur + '% 100%,0 100%)';
    }

    /* Divider position */
    if (heroDivider) heroDivider.style.left = cur + '%';

    /* Diamond canvas — travels with divider, spins */
    if (heroDiamond) {
      heroDiamond.style.left = cur + '%';
      heroDiamond.style.top  = curY + '%';
      drawDiamond(heroDiamond, getAngle(ts));
    }

    /* World content fade */
    if (studioC)  studioC.style.opacity  = clamp((cur - 44) / 20, 0, 1);
    if (factoryC) factoryC.style.opacity = clamp((56 - cur) / 20, 0, 1);

    requestAnimationFrame(frame);
  }

  /* ── Nav scroll tint ── */
  if (nav) {
    window.addEventListener('scroll', function () {
      nav.style.borderBottomColor = window.scrollY > 60
        ? 'rgba(237,232,222,0.14)'
        : 'rgba(237,232,222,0.07)';
    }, { passive: true });
  }

  /* ── Smooth anchor links ── */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        var offset = nav ? nav.offsetHeight : 0;
        window.scrollTo({
          top: target.getBoundingClientRect().top + window.scrollY - offset,
          behavior: 'smooth'
        });
      }
    });
  });

  /* ── Commission form feedback ── */
  var form = document.querySelector('.commission-form');
  if (form) {
    form.addEventListener('submit', function () {
      var btn = form.querySelector('.form-submit');
      if (btn) {
        btn.textContent      = 'Sending\u2026';
        btn.style.opacity    = '0.6';
        btn.style.pointerEvents = 'none';
      }
    });
  }

  /* ── Start after fonts load ── */
  document.fonts.ready.then(function () {
    requestAnimationFrame(frame);
  });

})();
