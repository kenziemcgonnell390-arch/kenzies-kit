/* ==========================================================================
   page.js — the page's own behaviour.

   Everything it renders comes from picks.js. Four jobs:

     1. build the six lists,
     2. answer the two questions by re-sorting them and moving the lead,
     3. keep the kit plate in step with the answers,
     4. tell the world behind the page what the reader is looking at.

   The engine (scrollcraft.js) is never edited. It is mounted at the end of
   this file, once the lists exist, so it can see them.
   ========================================================================== */
(function () {
  "use strict";

  var KIT = window.KIT;
  if (!KIT) return;

  var root = document.documentElement;
  var STORE = "kt-state-v1";
  var MOTION = "kt-motion";

  /* ?preview on the address shows every button as if its link were in, so the
     finished page can be judged before the affiliate links exist. */
  var preview = /[?&]preview\b/.test(window.location.search);

  var state = { situation: null, budget: null };
  try {
    var saved = JSON.parse(localStorage.getItem(STORE) || "{}");
    if (saved && typeof saved === "object") {
      state.situation = saved.situation || null;
      state.budget = saved.budget || null;
    }
  } catch (e) { /* private window, or storage turned off. Carry on. */ }

  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {}
  }

  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(sel));
  };
  var el = function (tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  /* --------------------------------------------------------------- motion --
     The visitor's off switch. It starts from the system setting and remembers
     what they chose. The attribute is already on <html> before first paint. */
  var motionOn = root.getAttribute("data-motion") !== "off";
  var motionBtn = $("#motion"), motionLabel = $("#motion-label");

  function applyMotion() {
    root.setAttribute("data-motion", motionOn ? "on" : "off");
    motionBtn.setAttribute("aria-pressed", motionOn ? "true" : "false");
    motionLabel.textContent = motionOn ? "Motion on" : "Motion off";
    if (window.Ground) window.Ground.motion(motionOn);
  }
  motionBtn.addEventListener("click", function () {
    motionOn = !motionOn;
    try { localStorage.setItem(MOTION, motionOn ? "on" : "off"); } catch (e) {}
    applyMotion();
  });
  applyMotion();

  /* ------------------------------------------------------- the site copy -- */
  $("#hero-title").textContent = KIT.site.headline;
  $("#hero-lede").textContent = KIT.site.tagline;
  $("#hero-cta").textContent = KIT.site.cta;
  $("#hero-mark").textContent = KIT.site.name;
  $("#ask-note").textContent = KIT.site.disclosureShort;
  $("#foot-reviewed").textContent = KIT.site.reviewed;
  $("#foot-name").textContent = KIT.site.name;
  $("#rules-disclosure").textContent = KIT.site.disclosure;
  $("#foot-disclosure").textContent = KIT.site.disclosure;
  $(".kt-strip__mark").textContent = KIT.site.name;
  var contact = $("#foot-contact");
  contact.href = "mailto:" + KIT.site.contact;
  contact.textContent = KIT.site.contact;
  $$("[data-kt-line]").forEach(function (n) {
    var cat = catById(n.getAttribute("data-kt-line"));
    if (cat) n.textContent = cat.line;
  });

  function catById(id) {
    for (var i = 0; i < KIT.categories.length; i++) if (KIT.categories[i].id === id) return KIT.categories[i];
    return null;
  }
  function pickById(id) {
    for (var i = 0; i < KIT.picks.length; i++) if (KIT.picks[i].id === id) return KIT.picks[i];
    return null;
  }
  function picksIn(id) {
    return KIT.picks.filter(function (p) { return p.cat === id; });
  }
  function budget() {
    for (var i = 0; i < KIT.budgets.length; i++) if (KIT.budgets[i].id === state.budget) return KIT.budgets[i];
    return null;
  }

  /* ------------------------------------------------------------- scoring --
     Deliberately simple and readable: a pick that suits what you said you are
     doing comes first, anything above your budget stands down but stays on the
     page, because hiding what someone cannot afford today is a shop's trick.  */
  function fits(p) {
    var b = budget();
    if (state.situation && p.fits.indexOf(state.situation) === -1) return false;
    if (b && b.allows.indexOf(p.band) === -1) return false;
    return true;
  }
  function score(p) {
    var s = 0;
    if (state.situation && p.fits.indexOf(state.situation) > -1) s += 3;
    if (state.situation && p.fits.indexOf(state.situation) === -1) s -= 4;
    var b = budget();
    if (b && b.allows.indexOf(p.band) > -1) s += 2;
    if (b && b.allows.indexOf(p.band) === -1) s -= 6;
    return s;
  }
  function bestIn(id) {
    var list = picksIn(id).slice();
    if (!state.situation && !state.budget) return list[0] || null;
    /* If nothing in a list clears the answers, the honest result is no pick at
       all. Leading with the least-bad option on a row the same pass has just
       stood down tells the reader two opposite things at once. */
    var eligible = list.filter(fits);
    if (!eligible.length) return null;
    eligible.sort(function (a, b) { return score(b) - score(a); });
    return eligible[0];
  }
  function skipped() {
    return KIT.categories.filter(function (c) { return !bestIn(c.id); });
  }
  function currentKit() {
    return KIT.categories.map(function (c) { return { cat: c, pick: bestIn(c.id) }; })
      .filter(function (r) { return !!r.pick; });
  }

  /* ---------------------------------------------------------- the answers -- */
  function chips(hostSel, options, key) {
    var host = $(hostSel);
    options.forEach(function (o) {
      var b = el("button", "kt-chip", o.label);
      b.type = "button";
      b.setAttribute("aria-pressed", state[key] === o.id ? "true" : "false");
      if (o.note) b.title = o.note;
      b.addEventListener("click", function () {
        state[key] = (state[key] === o.id) ? null : o.id;
        save();
        $$(".kt-chip", host).forEach(function (other, i) {
          other.setAttribute("aria-pressed", options[i].id === state[key] ? "true" : "false");
        });
        resort();
      });
      host.appendChild(b);
    });
  }
  chips("#ask-situation", KIT.situations, "situation");
  chips("#ask-budget", KIT.budgets, "budget");

  /* ------------------------------------------------------------ the links --
     One label per kind of thing: paid products say "See the price", because the
     price is the next question and this page does not quote one. Accounts that
     are free to open say "See the offer".                                      */
  function linkLabel(p) {
    return /^free/i.test(p.price) ? "See the offer" : "See the price";
  }
  function linkNode(p) {
    if (!p.url && !preview) return el("span", "kt-soon", "Link coming");
    var a = el("a", "kt-btn", linkLabel(p));
    a.setAttribute("aria-label", linkLabel(p) + ": " + p.name);
    if (p.url) {
      a.href = p.url;
      a.target = "_blank";
      /* rel="sponsored" is what a paid link is supposed to say to a search engine. */
      a.rel = "sponsored noopener noreferrer";
    } else {
      a.href = "#";
      a.addEventListener("click", function (e) { e.preventDefault(); });
    }
    return a;
  }

  /* ------------------------------------------------------------ the lists --
     One shape for every pick: name, price band, what it is, why it is here,
     and the link. Which one leads is a class, set against the answers.         */
  function item(p) {
    var li = el("li", "kt-item");
    li.setAttribute("data-kt-pick", p.id);
    li.appendChild(el("span", "kt-item__flag", "What I'd pick"));
    var main = el("div", "kt-item__main");
    var top = el("div", "kt-item__top");
    top.appendChild(el("h3", "kt-item__name", p.name));
    top.appendChild(el("span", "kt-price", p.price));
    main.appendChild(top);
    main.appendChild(el("p", "kt-item__what", p.what));
    main.appendChild(el("p", "kt-item__why", p.why));
    li.appendChild(main);
    var go = el("div", "kt-item__go");
    go.appendChild(linkNode(p));
    li.appendChild(go);
    return li;
  }

  var groups = $$("[data-kt-list]").map(function (host) {
    var id = host.getAttribute("data-kt-list");
    picksIn(id).forEach(function (p) { host.appendChild(item(p)); });
    return { host: host, id: id };
  });

  /* ------------------------------------------------------------ the strip -- */
  var stripList = $("#strip-list");
  function jump(label, href, id) {
    var li = el("li"), a = el("a", null, label);
    a.href = href;
    a.setAttribute("data-kt-jump", id);
    li.appendChild(a);
    stripList.appendChild(li);
  }
  jump("Your kit", "#kit", "kit");
  KIT.categories.forEach(function (c) { jump(c.name, "#h-" + c.id, c.id); });

  /* -------------------------------------------------------------- the kit --
     One pick per list, assembled from the two answers.                        */
  var plate = $("#plate");
  var plateList = $("#plate-list"), plateNote = $("#plate-note"), plateStatus = $("#plate-status");

  function renderPlate(write) {
    var rows = currentKit();
    plateList.classList.remove("is-writing");
    plateList.innerHTML = "";
    rows.forEach(function (r, i) {
      var li = el("li");
      li.style.setProperty("--kt-i", String(i));
      li.appendChild(el("span", "kt-plate__cat", r.cat.name));
      li.appendChild(el("h3", "kt-plate__name", r.pick.name));
      li.appendChild(el("p", "kt-plate__why", r.pick.why));
      var go = el("div", "kt-plate__go");
      go.appendChild(linkNode(r.pick));
      go.appendChild(el("span", "kt-price", r.pick.price));
      li.appendChild(go);
      plateList.appendChild(li);
    });
    if (write && motionOn) {
      void plateList.offsetWidth;            /* restart the animation */
      plateList.classList.add("is-writing");
    }

    plateStatus.textContent = answersLine();

    var out = skipped(), note = "";
    if (out.length) {
      var names = out.map(function (c) { return c.name; });
      var list = names.length === 1 ? names[0]
        : names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
      note = "Nothing in " + list + " fits what you said, so " +
             (names.length === 1 ? "it is" : "they are") +
             " left out. The full lists are further down if you want a look. ";
    }
    plateNote.textContent = note + KIT.site.disclosure;
  }

  function answersLine() {
    var sit = null, bud = budget();
    for (var i = 0; i < KIT.situations.length; i++) if (KIT.situations[i].id === state.situation) sit = KIT.situations[i];
    if (!sit && !bud) return "One thing from each list. This is what I would tell anyone who asked.";
    if (sit && bud) return "One thing from each list, for " + sit.label.toLowerCase() + ", " + bud.label.toLowerCase() + ".";
    if (sit) return "One thing from each list, for " + sit.label.toLowerCase() + ".";
    return "One thing from each list, " + bud.label.toLowerCase() + ".";
  }

  /* ---------------------------------------------------------- the re-sort --
     Answering a question moves the rows. FLIP so they travel rather than jump:
     a list that changes order between two frames reads as a page reloading.    */
  function resort() {
    groups.forEach(function (g) {
      var nodes = $$(".kt-item", g.host);
      var first = new Map();
      nodes.forEach(function (n) { first.set(n, n.getBoundingClientRect()); });

      /* Array.prototype.sort is stable, so picks that score the same keep the
         order they have in picks.js. */
      var order = picksIn(g.id).map(function (p) { return p.id; });
      nodes.sort(function (a, b) {
        var d = score(pickOf(b)) - score(pickOf(a));
        return d || order.indexOf(pickOf(a).id) - order.indexOf(pickOf(b).id);
      });
      nodes.forEach(function (n) { g.host.appendChild(n); });
      markStates(g);

      if (motionOn) {
        nodes.forEach(function (n) {
          var was = first.get(n);
          if (!was) return;
          var now = n.getBoundingClientRect();
          var dx = was.left - now.left, dy = was.top - now.top;
          if (!dx && !dy) return;
          n.style.transition = "none";
          n.style.transform = "translate(" + dx + "px," + dy + "px)";
          requestAnimationFrame(function () {
            n.style.transition = "transform 480ms var(--sc-ease-out), opacity var(--sc-d-slow) var(--sc-ease-out)";
            n.style.transform = "";
          });
        });
      }
    });

    renderPlate(true);
  }

  function pickOf(node) { return pickById(node.getAttribute("data-kt-pick")); }

  /* Which row leads, and which have stood down. */
  function markStates(g) {
    var best = bestIn(g.id);
    $$("[data-kt-pick]", g.host).forEach(function (n) {
      var p = pickOf(n);
      n.classList.toggle("is-best", !!best && p.id === best.id);
      n.classList.toggle("is-aside", !fits(p));
    });
  }

  /* -------------------------------------------------------- the composition --
     Tell the world where the opening copy ends, so the range rises in the open
     part of the frame and stays low behind the words.                          */
  var heroCopy = $("#hero-copy");
  function compose() {
    if (!window.Ground || !heroCopy) return;
    /* Measure the ink, not the boxes: a balanced headline leaves its box much
       wider than its longest line, and the range would be planned around air. */
    var right = 0, bottom = 0;
    $$("h1, p", heroCopy).forEach(function (n) {
      var range = document.createRange();
      range.selectNodeContents(n);
      var r = range.getBoundingClientRect();
      right = Math.max(right, r.right);
      bottom = Math.max(bottom, r.bottom);
    });
    if (!right) return;
    window.Ground.compose(right + window.scrollX, bottom + window.scrollY);
  }
  compose();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(compose);
  var composeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(composeTimer);
    composeTimer = setTimeout(compose, 180);
  });

  /* ------------------------------------------------------- what is in view --
     The strip's current item, how still the water is, and how far the fog has
     come down. One read per frame, on scroll.                                  */
  var hero = $(".kt-hero"), strip = $("#strip");
  var rules = $("#rules"), close = $("#close");
  var marks = [{ id: "kit", el: plate }].concat(KIT.categories.map(function (c) {
    return { id: c.id, el: $('[data-kt-cat="' + c.id + '"]') };
  })).filter(function (m) { return !!m.el; });

  var currentId;
  function setCurrent(id) {
    if (id === currentId) return;
    currentId = id;
    $$("a", stripList).forEach(function (a) {
      var on = a.getAttribute("data-kt-jump") === id;
      a.setAttribute("aria-current", on ? "true" : "false");
      /* On a phone the strip is wider than the screen. Keep the current list's
         name in view by moving the strip itself, never the page. */
      if (on) stripList.scrollLeft = Math.max(0, a.parentNode.offsetLeft - 16);
    });
  }

  var ticking = false;
  function read() {
    ticking = false;
    var vh = window.innerHeight;

    var heroOut = hero.getBoundingClientRect().bottom < vh * 0.45;
    strip.classList.toggle("is-up", heroOut);

    /* The list whose top most recently crossed the upper third of the screen. */
    var current = null;
    marks.forEach(function (m) {
      if (m.el.getBoundingClientRect().top < vh * 0.4) current = m.id;
    });
    setCurrent(heroOut ? current : null);

    if (!window.Ground) return;
    var p = plate.getBoundingClientRect();
    var kitOn = p.top < vh * 0.7 && p.bottom > vh * 0.3;
    var fogIn = clamp((vh * 0.95 - rules.getBoundingClientRect().top) / (vh * 0.55), 0, 1);
    var fogOut = clamp((vh * 0.9 - close.getBoundingClientRect().top) / (vh * 0.6), 0, 1);
    window.Ground.fog(0.92 * fogIn * (1 - fogOut));
    window.Ground.still(kitOn || fogOut > 0.3 ? 1 : (heroOut ? 0.3 : 0.55));
  }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(read);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  /* ------------------------------------------------------------ take-away -- */
  function kitText() {
    var lines = [KIT.site.name + ": " + answersLine(), ""];
    currentKit().forEach(function (r, i) {
      lines.push((i + 1) + ". " + r.pick.name + " (" + r.cat.name + ", " + r.pick.price + ")");
      lines.push("   " + r.pick.what);
      if (r.pick.url) lines.push("   " + r.pick.url);
    });
    lines.push("");
    lines.push(KIT.site.disclosure);
    return lines.join("\n");
  }

  function copyKit(button) {
    var text = kitText();
    var label = button.getAttribute("data-label") || button.textContent;
    button.setAttribute("data-label", label);
    var done = function () {
      button.textContent = "Copied";
      setTimeout(function () { button.textContent = label; }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else fallback();

    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); done(); } catch (e) {
        button.textContent = "Copy did not work";
        setTimeout(function () { button.textContent = label; }, 2200);
      }
      document.body.removeChild(ta);
    }
  }
  $("#plate-copy").addEventListener("click", function () { copyKit(this); });
  $("#close-copy").addEventListener("click", function () { copyKit(this); });

  /* ------------------------------------------------------------- first run --
     Answers survive a refresh, so a returning visitor lands on their own order
     rather than on the default one. Nothing animates on the way in.            */
  var wasOn = motionOn;
  motionOn = false;
  if (state.situation || state.budget) resort();
  else {
    groups.forEach(markStates);
    renderPlate(false);
  }
  motionOn = wasOn;
  read();

  /* The engine goes last: it reads the markup this file just wrote. */
  if (window.ScrollCraft) window.ScrollCraft.mount(document.body);
})();
