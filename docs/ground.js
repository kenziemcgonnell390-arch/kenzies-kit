/* ==========================================================================
   ground.js — the world, drawn live.

   A cold lake under fog: three ridges, a stand of firs on the near shore, and
   water that holds their reflection. Nothing here is a photograph or a video;
   it is redrawn at whatever size the window is, which is why it stays sharp on
   a phone and costs nothing to ship.

   The scene is composed around the words. page.js tells it where the headline
   ends (Ground.compose), and the ridges stay low behind the copy and rise in
   the open part of the frame, so nothing dark ever sits under a sentence.

   One camera idea: scrolling pushes in toward the lake, near planes growing
   faster than far ones. Then the fog comes down over the lists (Ground.fog)
   and the water goes to a mirror for the kit (Ground.still).

   Motion off, or the visitor's reduced-motion setting, gets a still frame that
   only repaints when the page state changes. No loop runs at all.
   ========================================================================== */
(function () {
  "use strict";

  var cv = document.getElementById("ground");
  if (!cv) return;
  var ctx = cv.getContext("2d", { alpha: false });

  var moving = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var looping = false;
  var W = 0, H = 0, dpr = 1;
  var t0 = performance.now();
  var heroP = 0;                    // 0 on the first screen, 1 once it has gone
  var pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  var stillTarget = 0.55, still = 0.55;   // 1 = mirror, 0 = moving water
  var fogTarget = 0, fog = 0;             // 1 = the scene is a pale ground

  /* Where the hero copy ends, in pixels: its right edge and its bottom edge.
     Zero means nobody has said yet, and the scene falls back to a plain range. */
  var comp = { x: 0, y: 0 };
  var horizonBase = 0.615, low = 1, clearX = 0, narrow = false;

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function smoothstep(a, b, x) {
    var t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  }

  /* Deterministic value noise, so the ridges are the same shape on every load
     and on every machine. A random skyline that changes on refresh reads as a
     glitch rather than as a place. */
  function hash(n) {
    var s = Math.sin(n * 127.1) * 43758.5453;
    return s - Math.floor(s);
  }
  function noise(x, seed) {
    var i = Math.floor(x), f = x - i;
    var a = hash(i + seed), b = hash(i + 1 + seed);
    var u = f * f * (3 - 2 * f);
    return a * (1 - u) + b * u;
  }
  function ridgeHeight(x, seed, roughness) {
    return noise(x * 1.1, seed) * 0.55 +
           noise(x * 2.7, seed + 7) * 0.28 * roughness +
           noise(x * 6.3, seed + 31) * 0.12 * roughness +
           noise(x * 13.1, seed + 53) * 0.05 * roughness;
  }

  /* The plan: where the waterline sits and how much room the ridges have
     behind the copy. On a wide screen the copy holds the left and the range
     rises on the right. On a phone the copy holds the top, so the whole range
     is kept low and the waterline drops to sit just under the last line. */
  function plan() {
    if (!comp.y) { horizonBase = 0.615; low = 1; clearX = 0; narrow = W < 760; return; }
    narrow = W < 760 || comp.x / W > 0.68;
    if (narrow) {
      horizonBase = clamp((comp.y + H * 0.17) / H, 0.46, 0.74);
      clearX = 2;                       /* the whole width stays low */
    } else {
      horizonBase = 0.615;
      clearX = clamp(comp.x / W, 0.3, 0.7);
    }
    var room = horizonBase * H - comp.y - 18;
    low = clamp(room / (H * 0.46), 0.07, 1);
  }
  /* `keep` is how much of its height a plane holds behind the copy. The far
     ranges are pale enough to pass behind a headline; the near one is not. */
  function envelope(xn, keep) {
    if (!clearX) return 1;
    var floor = low + (1 - low) * (keep || 0);
    var s = smoothstep(clearX - 0.06, clearX + 0.2, xn);
    return floor + (1.12 - floor) * s;
  }

  /* Each plane is drawn once into its own offscreen canvas and then moved
     around per frame. Redrawing the silhouettes every frame is the one thing
     that would make this expensive. */
  var LAYERS = [
    /* seed, roughness, height as a share of the viewport, tint, snowline,
       pointer travel in px, and how much the push-in grows it */
    { seed: 3,  rough: 0.55, h: 0.46, tint: "#5c4436", snow: 0.42, px: 8,  zoom: 0.03, keep: 0.72, peak: 0.70, peakNarrow: 0.30 },
    { seed: 17, rough: 0.85, h: 0.38, tint: "#3d2d23", snow: 0.34, px: 18, zoom: 0.07, keep: 0.4,  peak: 0.90, peakNarrow: 0.78 },
    { seed: 41, rough: 1.20, h: 0.26, tint: "#261c16", snow: 0.00, px: 30, zoom: 0.13, keep: 0,    peak: 1.06, peakNarrow: 0.05 }
  ];
  var NEAR = { h: 0.34, tint: "#16100c", px: 54, zoom: 0.27 };
  var PAD = 80;

  function makeCanvas(w, h) {
    var c = document.createElement("canvas");
    c.width = Math.max(2, Math.round(w * dpr));
    c.height = Math.max(2, Math.round(h * dpr));
    var g = c.getContext("2d");
    g.scale(dpr, dpr);
    return { c: c, g: g };
  }

  function buildLayer(L) {
    var w = Math.ceil(W + PAD * 2), h = Math.ceil(H * L.h + 2);
    var made = makeCanvas(w, h), g = made.g;

    var pts = [], steps = 180;
    for (var i = 0; i <= steps; i++) {
      var x = (i / steps) * w;
      var xn = (x - PAD) / W;
      /* Noise gives the ridge its texture; one broad summit per plane gives
         the range a shape, placed in the open part of the frame. */
      var d = (xn - (narrow ? L.peakNarrow : L.peak)) / 0.21;
      var n = ridgeHeight((i / steps) * 6 + L.seed, L.seed, L.rough) * 0.62 +
              Math.exp(-d * d) * 0.46;
      var env = envelope(xn, L.keep);
      pts.push({ x: x, y: h - n * h * 0.92 * env - h * 0.04 * env });
    }

    g.beginPath();
    g.moveTo(0, h);
    for (var j = 0; j < pts.length; j++) g.lineTo(pts[j].x, pts[j].y);
    g.lineTo(w, h);
    g.closePath();

    var grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, L.tint);
    grad.addColorStop(1, mix(L.tint, "#8a5a3c", 0.45));   /* dusk haze low on each range */
    g.fillStyle = grad;
    g.fill();

    /* Snow, on the far two ranges only. Clipped to the silhouette and faded
       down from the peaks, so it follows the rock rather than sitting on it as
       a slab. */
    if (L.snow > 0) {
      g.save();
      g.clip();
      var snowTop = h * (1 - 0.96), snowEnd = h * (1 - L.snow);
      var sg = g.createLinearGradient(0, snowTop, 0, snowEnd);
      sg.addColorStop(0, "rgba(255,206,168,0.55)");      /* snow holding the last of the light */
      sg.addColorStop(0.55, "rgba(255,190,150,0.22)");
      sg.addColorStop(1, "rgba(255,190,150,0)");
      g.fillStyle = sg;
      g.fillRect(0, 0, w, snowEnd);
      g.restore();
    }

    /* A rim of light along the ridge line: real distance reads as lower
       contrast plus a lit edge, not as a flat grey shape. */
    g.beginPath();
    g.moveTo(pts[0].x, pts[0].y);
    for (var m = 1; m < pts.length; m++) g.lineTo(pts[m].x, pts[m].y);
    g.strokeStyle = "rgba(255,170,110,0.38)";   /* ember rim light from the low sun */
    g.lineWidth = 1;
    g.stroke();

    L.canvas = made.c;
    L.w = w;
    L.hpx = h;
  }

  /* The near shore: a wooded point coming in from the edge of the frame, in
     front of everything else. It is the darkest thing in the scene and the
     plane that moves most, which is what makes the ranges behind it read as
     far away rather than as a backdrop. */
  function fir(g, x, y, th, tw, colour) {
    var tiers = 7, i, yy, half;
    g.beginPath();
    g.moveTo(x, y - th);
    for (i = 1; i <= tiers; i++) {
      yy = y - th + th * (i / tiers) * 0.94;
      half = tw * 0.5 * Math.pow(i / tiers, 0.82);
      g.lineTo(x + half, yy);
      g.lineTo(x + half * 0.46, yy + th * 0.012);
    }
    g.lineTo(x + tw * 0.05, y);
    g.lineTo(x - tw * 0.05, y);
    for (i = tiers; i >= 1; i--) {
      yy = y - th + th * (i / tiers) * 0.94;
      half = tw * 0.5 * Math.pow(i / tiers, 0.82);
      g.lineTo(x - half * 0.46, yy + th * 0.012);
      g.lineTo(x - half, yy);
    }
    g.closePath();
    g.fillStyle = colour;
    g.fill();
  }

  function buildNear() {
    var w = Math.ceil(W + PAD * 2), h = Math.ceil(H * NEAR.h + 2);
    var made = makeCanvas(w, h), g = made.g;
    var start = narrow ? 0.56 : Math.max(0.58, clearX + 0.16);

    function shore(xn) {
      var s = smoothstep(start, 1.1, xn);
      return Math.pow(s, 1.3) * h * 0.40 + s * noise(xn * 9, 77) * h * 0.035;
    }

    g.beginPath();
    g.moveTo(0, h);
    var steps = 160;
    for (var i = 0; i <= steps; i++) {
      var x = (i / steps) * w;
      g.lineTo(x, h - shore((x - PAD) / W));
    }
    g.lineTo(w, h);
    g.closePath();
    var grad = g.createLinearGradient(0, h * 0.5, 0, h);
    grad.addColorStop(0, NEAR.tint);
    grad.addColorStop(1, mix(NEAR.tint, "#3a2a20", 0.6));
    g.fillStyle = grad;
    g.fill();

    /* Trees, left to right, which is also far to near: each one is a little
       taller and a little darker than the last. */
    var tx = PAD + start * W + 4, k = 0;
    while (tx < w + 30) {
      var xn = (tx - PAD) / W;
      var s = smoothstep(start, 1.04, xn);
      var th = H * (0.03 + 0.085 * s) * (0.7 + 0.6 * hash(k * 3.1 + 5));
      var colour = mix(mix(NEAR.tint, "#4a3628", 0.45 * (1 - s)), "#080605", 0.35 * hash(k + 19) * s);
      fir(g, tx, h - shore(xn) + 3, th, th * (0.32 + 0.08 * hash(k + 11)), colour);
      tx += th * (0.15 + 0.2 * hash(k * 1.7 + 2));
      k++;
    }

    NEAR.canvas = made.c;
    NEAR.w = w;
    NEAR.hpx = h;
  }

  function mix(a, b, t) {
    var A = hex(a), B = hex(b);
    return "rgb(" + Math.round(A[0] + (B[0] - A[0]) * t) + "," +
                    Math.round(A[1] + (B[1] - A[1]) * t) + "," +
                    Math.round(A[2] + (B[2] - A[2]) * t) + ")";
  }
  /* Colours arrive from two places: the constants above, written as hex, and
     the page ground, which the engine's drift rewrites as `rgb(r, g, b)`.
     Parsing only hex here is what turns a drift step into NaN, and a NaN colour
     stop throws, which kills the animation loop a few seconds into the page. */
  function hex(h) {
    h = String(h).trim();
    var m = h.match(/rgba?\(([^)]+)\)/i);
    if (m) {
      var parts = m[1].split(/[\s,/]+/).map(parseFloat);
      return [parts[0] | 0, parts[1] | 0, parts[2] | 0];
    }
    h = h.replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    if (isNaN(n)) return [11, 9, 8];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgba(colour, a) {
    var c = hex(colour);
    return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")";
  }

  /* The scene above the waterline, cached so the reflection can be built from
     the same pixels rather than drawn a second time. */
  var scene = document.createElement("canvas");
  var sctx = scene.getContext("2d");

  /* The same scene again, mirrored and squashed: what the lake holds. */
  var refl = document.createElement("canvas");
  var rctx = refl.getContext("2d");

  function build() {
    plan();
    for (var i = 0; i < LAYERS.length; i++) buildLayer(LAYERS[i]);
    buildNear();
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    cv.style.width = W + "px";
    cv.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    scene.width = Math.round(W * dpr);
    scene.height = Math.round(H * dpr);
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    build();
    draw(performance.now());
  }

  function canvasColour() {
    var v = getComputedStyle(document.documentElement).getPropertyValue("--sc-canvas");
    v = (v || "").trim();
    return v || "#0b0908";
  }

  var groundColour = "#0b0908", colourTick = 0;

  function plane(L, horizon, px, py) {
    if (!L.canvas) return;
    var s = 1 + heroP * L.zoom;
    var cx = W * (narrow ? 0.5 : 0.68);
    var x = -PAD + px * L.px;
    var w = L.w * s, h = L.hpx * s;
    sctx.drawImage(L.canvas, cx + (x - cx) * s, horizon - h + py * L.px * 0.2 + 1, w, h);
  }

  function draw(now) {
    /* A draw can land before the first resize has sized anything (a font load
       or a scroll event arriving during parse). Nothing to paint yet. */
    if (!W || !H || !scene.width || !scene.height) return;

    var t = moving ? (now - t0) / 1000 : 12;   /* still: a fixed, pleasant instant */

    /* The drift on the acts is the page's light. Read it occasionally rather
       than every frame; getComputedStyle is the expensive call here. */
    if (!moving || (colourTick++ % 12) === 0) groundColour = canvasColour();

    var horizon = H * (horizonBase + heroP * 0.035);
    var px = (pointer.x - 0.5), py = (pointer.y - 0.5);

    /* --- sky ------------------------------------------------------------- */
    var sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, groundColour);                               /* dusk: dark overhead */
    sky.addColorStop(0.55, mix(groundColour, "#3a1c0e", 0.65));
    sky.addColorStop(1, mix(groundColour, "#c0581f", 0.6));          /* ember on the horizon */
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, horizon + 1);

    /* --- the planes, into the scene buffer so the water can borrow them --- */
    sctx.clearRect(0, 0, W, H);
    for (var i = 0; i < LAYERS.length; i++) plane(LAYERS[i], horizon, px, py);
    plane(NEAR, horizon, px, py);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, horizon);
    ctx.clip();
    ctx.drawImage(scene, 0, 0, W, H);
    ctx.restore();

    /* --- water ----------------------------------------------------------- */
    var waterH = H - horizon;
    var wg = ctx.createLinearGradient(0, horizon, 0, H);
    wg.addColorStop(0, mix(groundColour, "#6a3418", 0.55));
    wg.addColorStop(0.45, mix(groundColour, "#1e140e", 0.5));
    wg.addColorStop(1, mix(groundColour, "#16100c", 0.6));
    ctx.fillStyle = wg;
    ctx.fillRect(0, horizon, W, waterH + 1);

    /* The reflection: the same scene, flipped, foreshortened, and cut into
       bands that slide against each other. Amplitude falls to nothing as the
       water goes still. */
    var amp = (1 - still) * Math.min(4.5, waterH * 0.012);

    /* Mirror the whole scene in one draw first. Sampling the upright scene band
       by band instead leaves a staircase down every steep ridge. One flipped
       draw is smooth; the bands then only move sideways. */
    if (refl.width !== Math.round(W * dpr) || refl.height !== Math.round(waterH * dpr)) {
      refl.width = Math.max(2, Math.round(W * dpr));
      refl.height = Math.max(2, Math.round(waterH * dpr));
    }
    rctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    rctx.clearRect(0, 0, W, waterH);
    rctx.save();
    rctx.scale(1, -0.78);                                /* foreshortening */
    rctx.drawImage(scene, 0, -horizon, W, H);
    rctx.restore();

    var band = 4;
    ctx.save();
    for (var yy = 0; yy < waterH; yy += band) {
      /* The reflection fades with depth: near water holds the ridges, far water
         is sky. A still lake holds more of it than a moving one. */
      var depth = yy / waterH;
      ctx.globalAlpha = (0.38 + 0.2 * still) * (1 - depth * 0.85);
      var wob = moving ? Math.sin(t * 0.9 + yy * 0.06) * amp * (0.3 + depth) : 0;
      ctx.drawImage(
        refl,
        0, yy * dpr, W * dpr, band * dpr,
        wob - amp - 2, horizon + yy, W + amp * 2 + 4, band + 0.6
      );
    }
    ctx.restore();

    /* Specular lines: a few bright streaks where the sky lands on the water. */
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (var s = 0; s < 7; s++) {
      var sy = horizon + (waterH * (0.12 + s * 0.13));
      var phase = moving ? Math.sin(t * 0.55 + s * 1.7) : 0;
      var sw = W * (0.22 + 0.10 * Math.abs(phase));
      var sx = W * (0.30 + 0.12 * phase) - sw / 2;
      var lg = ctx.createLinearGradient(sx, 0, sx + sw, 0);
      lg.addColorStop(0, "rgba(255,160,90,0)");
      lg.addColorStop(0.5, "rgba(255,160,90," + (0.16 + 0.10 * (1 - still)) + ")");
      lg.addColorStop(1, "rgba(255,160,90,0)");
      ctx.fillStyle = lg;
      ctx.fillRect(sx, sy, sw, 1.5);
    }
    ctx.restore();

    /* The waterline itself: a thin bright edge, and haze sitting on it. */
    var hz = ctx.createLinearGradient(0, horizon - H * 0.09, 0, horizon + H * 0.05);
    hz.addColorStop(0, "rgba(224,118,47,0)");
    hz.addColorStop(0.62, "rgba(224,118,47,0.32)");
    hz.addColorStop(1, "rgba(224,118,47,0)");
    ctx.fillStyle = hz;
    ctx.fillRect(0, horizon - H * 0.09, W, H * 0.14);

    /* --- fog: three bands, different speeds, never the same shape twice --- */
    for (var f = 0; f < 3; f++) {
      var fy = horizon - H * (0.10 + f * 0.13) + Math.sin(t * (0.07 + f * 0.03)) * H * 0.012;
      var drift = moving ? (t * (7 + f * 5)) % (W + 400) - 200 : W * (0.2 + f * 0.25);
      var fg = ctx.createRadialGradient(drift + px * 30 * (f + 1), fy, 0,
                                        drift + px * 30 * (f + 1), fy, W * 0.55);
      fg.addColorStop(0, "rgba(200,150,118," + (0.08 - f * 0.02) + ")");   /* warm smoke-haze */
      fg.addColorStop(1, "rgba(200,150,118,0)");
      ctx.fillStyle = fg;
      ctx.fillRect(0, fy - H * 0.2, W, H * 0.4);
    }

    /* A bank of fog behind the opening copy, sized to the copy and nothing
       else. It is the scene's own weather, so it clears as the copy leaves. */
    if (comp.y && heroP < 1) {
      var bx = narrow ? W * 0.5 : comp.x * 0.36, by = comp.y * 0.62;
      var br = Math.max(narrow ? W * 0.8 : comp.x * 0.74, comp.y * 0.95);
      var bank = ctx.createRadialGradient(bx, by, br * 0.2, bx, by, br);
      bank.addColorStop(0, "rgba(11,9,8," + (0.7 * (1 - heroP)) + ")");   /* shade behind the light headline */
      bank.addColorStop(1, "rgba(11,9,8,0)");
      ctx.fillStyle = bank;
      ctx.fillRect(0, 0, W, H);
    }

    /* The fog coming down: the whole scene eases toward the page ground, which
       is what gives the lists a calm surface to be read on. */
    if (fog > 0.004) {
      ctx.fillStyle = rgba(mix(groundColour, "#16110d", 0.3), Math.min(0.94, fog));
      ctx.fillRect(0, 0, W, H);
    }

    /* A soft vignette keeps the eye in the middle of the frame and stops the
       corners reading as a flat wash. */
    var vg = ctx.createRadialGradient(W * 0.5, H * 0.46, Math.min(W, H) * 0.35,
                                      W * 0.5, H * 0.46, Math.max(W, H) * 0.78);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0," + (0.45 * (1 - fog * 0.7)) + ")");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  /* ------------------------------------------------------------- the loop -- */
  function frame(now) {
    if (!moving) { looping = false; return; }
    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;
    still += (stillTarget - still) * 0.05;
    fog += (fogTarget - fog) * 0.07;
    draw(now);
    requestAnimationFrame(frame);
  }
  function start() {
    if (looping || !moving) return;
    looping = true;
    requestAnimationFrame(frame);
  }
  function settle() {
    still = stillTarget;
    fog = fogTarget;
    draw(performance.now());
  }

  function onScroll() {
    heroP = clamp(window.scrollY / Math.max(1, H * 0.9), 0, 1);
    if (!moving) draw(performance.now());
  }

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 120);
  });
  window.addEventListener("scroll", onScroll, { passive: true });

  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    window.addEventListener("pointermove", function (e) {
      if (!moving) return;
      pointer.tx = e.clientX / window.innerWidth;
      pointer.ty = e.clientY / window.innerHeight;
    }, { passive: true });
  }

  window.Ground = {
    /* 0..1, how still the water is. */
    still: function (v) { stillTarget = clamp(v, 0, 1); if (!moving) settle(); },
    /* 0..1, how far the fog has come down. */
    fog: function (v) { fogTarget = clamp(v, 0, 1); if (!moving) settle(); },
    /* Where the opening copy ends, in pixels from the top-left of the page. */
    compose: function (right, bottom) {
      if (Math.abs(right - comp.x) < 2 && Math.abs(bottom - comp.y) < 2) return;
      comp.x = right; comp.y = bottom;
      if (!W) return;
      build();
      draw(performance.now());
    },
    /* The visitor's off switch. */
    motion: function (on) {
      moving = !!on;
      if (moving) start();
      else { pointer.x = pointer.tx = 0.5; pointer.y = pointer.ty = 0.5; settle(); }
    },
    redraw: function () { draw(performance.now()); }
  };

  resize();
  onScroll();
  start();
})();
