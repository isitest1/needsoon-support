/* ないかも / NeedSoon — site interactions (no dependencies) */
(() => {
  const root = document.documentElement;
  root.classList.remove("no-js");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* header + mobile dock */
  const header = document.querySelector(".site-header");
  const darkSections = document.querySelectorAll(".flow, .family, .site-footer");
  const dock = document.querySelector(".dock");
  const hero = document.querySelector(".hero");
  const final = document.querySelector(".final");
  let finalVisible = false;
  if (final && "IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => { finalVisible = e.isIntersecting; onScroll(); }, { threshold: 0.05 }).observe(final);
  }
  function onScroll() {
    const y = window.scrollY;
    if (header) {
      header.classList.toggle("is-scrolled", y > 12);
      const dark = Array.from(darkSections).some((el) => { const r = el.getBoundingClientRect(); return r.top <= 36 && r.bottom >= 36; });
      header.classList.toggle("on-dark", dark);
    }
    if (dock && hero) dock.classList.toggle("show", y > hero.offsetHeight * 0.8 && !finalVisible);
  }

  /* reveal on scroll */
  const reveals = document.querySelectorAll(".reveal");
  if (!reduce && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }

  /* hero sequence: drain → notice → add → done */
  const bottle = document.querySelector(".hero .bottle");
  const toast = document.querySelector(".hero .toast");
  const steps = document.querySelectorAll(".hero-steps span");
  const setStep = (i) => steps.forEach((s, k) => s.classList.toggle("on", k === i));
  if (bottle) {
    const liquid = bottle.querySelector(".liquid");
    if (reduce) {
      liquid.style.transform = "translateY(0)";
      bottle.classList.add("noticed");
      if (toast) toast.style.opacity = 1;
      setStep(2);
    } else {
      if (toast) { toast.style.opacity = 0; toast.style.transform = "translateY(14px) scale(.96)"; toast.style.transition = "opacity .5s var(--ease), transform .7s var(--spring)"; }
      liquid.style.transform = "translateY(-120px)";
      setStep(-1);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        liquid.style.transform = "translateY(0)";
        setTimeout(() => { bottle.classList.add("noticed"); setStep(0); }, 1500);
        setTimeout(() => { setStep(1); if (toast) { toast.style.opacity = 1; toast.style.transform = "none"; } }, 2300);
        setTimeout(() => setStep(2), 3400);
      }));
    }
  }

  /* flow: sticky three beats */
  const flow = document.querySelector(".flow");
  let flowTick;
  if (flow && !reduce) {
    const words = flow.querySelectorAll(".flow-words li");
    const caps = flow.querySelectorAll(".flow-captions figure");
    const bar = flow.querySelector(".flow-progress span");
    let last = -2;
    flowTick = () => {
      const r = flow.getBoundingClientRect();
      const total = flow.offsetHeight - window.innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / total));
      if (bar) bar.style.width = (p * 100).toFixed(1) + "%";
      const i = Math.min(2, Math.floor(p * 3 + 0.0001));
      if (i === last) return;
      last = i;
      words.forEach((w, k) => { w.classList.toggle("on", k === i); w.classList.toggle("past", k < i); });
      caps.forEach((c, k) => { c.classList.toggle("on", k === i); c.setAttribute("aria-hidden", k === i ? "false" : "true"); });
    };
  } else if (flow) {
    flow.querySelectorAll(".flow-words li").forEach((w) => w.classList.add("on"));
  }

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onScroll(); if (flowTick) flowTick(); ticking = false; });
  }, { passive: true });
  onScroll(); if (flowTick) flowTick();

  /* interactive demo */
  const demo = document.querySelector("[data-demo]");
  if (demo) {
    const t = demo.dataset;
    const form = demo.querySelector("form");
    const input = demo.querySelector("input");
    const list = demo.querySelector(".demo-list");
    const empty = list.querySelector(".empty");
    const dToast = demo.querySelector(".demo-toast");
    const dToastText = dToast.querySelector(".msg");
    const timer = demo.querySelector(".demo-timer");
    const voiceBtn = demo.querySelector(".demo-voice");
    const live = demo.querySelector("[aria-live]");
    let start = null, toastTimer, lastAdded = [];

    const arm = () => { if (start === null) start = performance.now(); };
    input.addEventListener("focus", arm);
    input.addEventListener("input", arm);

    const norm = (s) => s.trim().toLowerCase();
    const existing = () => Array.from(list.querySelectorAll("li[data-name]"));

    function add(names, viaVoice, viaChip) {
      names = names.map((n) => n.trim()).filter(Boolean);
      if (viaVoice) names = names.map((n) => n.charAt(0).toLocaleUpperCase() + n.slice(1));
      if (!names.length) return;
      const added = [];
      names.forEach((name) => {
        const dup = existing().find((li) => norm(li.dataset.name) === norm(name));
        if (dup) {
          dup.classList.remove("flash"); void dup.offsetWidth; dup.classList.add("flash");
          setTimeout(() => dup.classList.remove("flash"), 1400);
          return;
        }
        const li = document.createElement("li");
        li.dataset.name = name;
        li.textContent = name;
        const small = document.createElement("small");
        small.textContent = viaVoice ? t.srcVoice : t.srcText;
        li.appendChild(small);
        list.insertBefore(li, list.firstChild);
        added.push(li);
      });
      if (empty) empty.hidden = existing().length > 0;

      let msg;
      if (!added.length) msg = t.dup.replace("{name}", names[0]);
      else if (added.length === 1) msg = t.toast.replace("{name}", added[0].dataset.name);
      else msg = t.toastMany.replace("{n}", added.length);
      lastAdded = added;
      dToastText.textContent = msg;
      dToast.querySelector(".undo").hidden = !added.length;
      dToast.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => dToast.classList.remove("show"), 3200);
      if (live) live.textContent = msg;

      if (added.length && viaVoice) {
        timer.textContent = t.splitMsg.replace("{n}", names.length);
      } else if (added.length && viaChip) {
        timer.textContent = t.timeTap;
      } else if (added.length && start !== null) {
        const s = Math.max(0.1, (performance.now() - start) / 1000);
        timer.innerHTML = t.time.replace("{s}", "<b>" + s.toFixed(1) + "</b>");
      }
      start = null;
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const v = input.value;
      if (!v.trim()) { input.focus(); return; }
      add([v], false);
      input.value = "";
    });
    demo.querySelectorAll(".demo-chips button").forEach((b) => {
      b.addEventListener("click", () => add([b.dataset.name || b.textContent], false, true));
    });
    dToast.querySelector(".undo").addEventListener("click", () => {
      lastAdded.forEach((li) => li.remove());
      lastAdded = [];
      if (empty) empty.hidden = existing().length > 0;
      dToastText.textContent = t.undone;
      dToast.querySelector(".undo").hidden = true;
      if (live) live.textContent = t.undone;
      timer.textContent = "";
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => dToast.classList.remove("show"), 1600);
    });

    let speaking = false;
    voiceBtn.addEventListener("click", () => {
      if (speaking) return;
      speaking = true;
      arm();
      const phrase = t.voicePhrase;
      const label = voiceBtn.querySelector("span");
      const orig = label.textContent;
      voiceBtn.classList.add("listening");
      label.textContent = t.listening;
      input.value = "";
      let i = 0;
      const step = reduce ? phrase.length : 1;
      const typer = setInterval(() => {
        i = Math.min(phrase.length, i + step);
        input.value = phrase.slice(0, i);
        if (i >= phrase.length) {
          clearInterval(typer);
          setTimeout(() => {
            const parts = phrase.split(new RegExp(t.splitRe, "i"));
            add(parts, true);
            input.value = "";
            voiceBtn.classList.remove("listening");
            label.textContent = orig;
            speaking = false;
          }, reduce ? 0 : 420);
        }
      }, reduce ? 0 : 110);
    });
  }

  /* current year */
  document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
