(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Theme toggle (remembered per browser) ---------- */
  const root = document.documentElement;
  const themeBtn = document.getElementById("themeToggle");
  const applyTheme = (t) => {
    root.dataset.theme = t;
    themeBtn.textContent = t === "dark" ? "☀" : "☾";
  };
  let saved = null;
  try { saved = localStorage.getItem("theme"); } catch (_) {}
  applyTheme(saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  themeBtn.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem("theme", next); } catch (_) {}
    say(next === "dark" ? "Lights off! 🌙" : "Ahh, sunshine! ☀️");
  });

  /* ---------- Mascot: mini Yin Hern ---------- */
  const mascot = document.getElementById("mascot");
  const bubble = document.getElementById("bubble");
  const bubbleText = document.getElementById("bubbleText");
  const choicesEl = document.getElementById("choices");
  const mouth = document.getElementById("mouth");
  const pupils = [...document.querySelectorAll(".mascot .m-pupil, .mascot .m-glint")];
  const peekPupils = [...document.querySelectorAll(".peek-pupil")];

  const MOUTHS = {
    smile: "M100 137 Q110 145 120 137",
    grin: "M98 135 Q110 151 122 135 Z",
    oh: "M106 140 a4 5 0 1 0 8 0 a4 5 0 1 0 -8 0",
    flat: "M102 140 L118 140",
  };
  const setMouth = (name) => {
    mouth.setAttribute("d", MOUTHS[name]);
    mouth.classList.toggle("open", name === "grin" || name === "oh");
  };

  // Eyes follow the pointer (behind the glasses)
  const track = (els, clientX, clientY, max) => {
    els.forEach((el) => {
      const eye = el.closest("[data-eye]") || el;
      const box = (eye.querySelector(".m-eye-white") || eye).getBoundingClientRect();
      const cx = box.left + box.width / 2;
      const cy = box.top + box.height / 2;
      const ang = Math.atan2(clientY - cy, clientX - cx);
      const dist = Math.min(max, Math.hypot(clientX - cx, clientY - cy) / 40);
      el.setAttribute("transform", `translate(${Math.cos(ang) * dist} ${Math.sin(ang) * dist})`);
    });
  };
  const trackPeek = (x, y) => {
    peekPupils.forEach((p) => {
      const b = p.getBoundingClientRect();
      const ang = Math.atan2(y - (b.top + b.height / 2), x - (b.left + b.width / 2));
      p.setAttribute("transform", `translate(${Math.cos(ang) * 2.5} ${Math.sin(ang) * 2.5})`);
    });
  };
  let raf = 0;
  window.addEventListener("pointermove", (e) => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      track(pupils, e.clientX, e.clientY, 3.2);
      trackPeek(e.clientX, e.clientY);
    });
  });

  // Blinking
  const blink = () => {
    mascot.classList.add("blink");
    setTimeout(() => mascot.classList.remove("blink"), 140);
    setTimeout(blink, 2200 + Math.random() * 3200);
  };
  if (!reduceMotion) setTimeout(blink, 1800);

  // Speech bubble with optional answer buttons
  let sayTimer;
  function say(text, mood = "grin", choices = []) {
    bubbleText.textContent = text;
    choicesEl.replaceChildren(
      ...choices.map(([label, next]) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "choice";
        b.textContent = label;
        b.addEventListener("click", () => go(next));
        return b;
      })
    );
    bubble.classList.remove("pop");
    void bubble.offsetWidth;
    bubble.classList.add("pop");
    setMouth(mood);
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => setMouth("smile"), 1600);
  }

  const scrollToId = (id) => setTimeout(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }, 700);

  const FACTS = [
    "I city-walk around KL to hunt for ideas. 🚶",
    "I trained a game agent with reinforcement learning. 🤖",
    "My pantry app works with zero internet. 🥕",
    "I speak English, Bahasa Malaysia and 中文. 🗣",
    "I scraped café menus and read them with OCR. ☕",
  ];
  let factIdx = 0;

  // Dialogue tree: each node returns [text, mood, choices]
  const NODES = {
    start: () => ["Hey! I'm mini Yin Hern 👋 What do you wanna know?", "grin", [
      ["Who are you?", "who"], ["Show projects", "projects"], ["Can I hire you?", "hire"], ["🎉 Party!", "party"],
    ]],
    who: () => ["CS student at UTAR who loves Python, data & AI. 🐍", "smile", [
      ["Fun fact?", "fact"], ["Your projects?", "projects"], ["Back", "start"],
    ]],
    fact: () => [FACTS[factIdx++ % FACTS.length], "grin", [
      ["Another one!", "fact"], ["Back", "start"],
    ]],
    projects: () => { scrollToId("projects"); return ["Follow me — my café data pipeline is a favourite! →", "grin", []]; },
    hire: () => ["Yes please! I'm looking for Data Scientist & Data Analyst roles. 💼", "grin", [
      ["Email you", "email"], ["See journey", "journey"], ["Back", "start"],
    ]],
    email: () => { scrollToId("contact"); return ["Down here! My inbox is open ✉", "grin", []]; },
    journey: () => { scrollToId("journey"); return ["Here's my journey so far →", "smile", []]; },
    party: () => { party(); return ["PARTY MODE!! 🎉", "grin", [["Again!", "party"], ["Calm down", "calm"]]]; },
    calm: () => { mascot.classList.remove("party"); return ["Phew… okay, I'm calm. 😅", "smile", [["Back", "start"]]]; },
  };
  function go(id) {
    const [text, mood, choices] = NODES[id]();
    say(text, mood, choices);
  }

  // Click: hop + open the dialogue. 5 quick clicks = party mode easter egg.
  let clicks = 0;
  let clickReset;
  mascot.addEventListener("click", () => {
    mascot.classList.remove("jump");
    void mascot.offsetWidth;
    mascot.classList.add("jump");
    clicks++;
    clearTimeout(clickReset);
    clickReset = setTimeout(() => (clicks = 0), 1500);
    if (clicks >= 5) {
      clicks = 0;
      go("party");
      return;
    }
    go("start");
  });
  mascot.addEventListener("pointerenter", () => setMouth("oh"));
  mascot.addEventListener("pointerleave", () => setMouth("smile"));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && choicesEl.childElementCount) say("Okay, bye for now! 👋", "smile");
  });

  // Party mode: dance, colour-cycle and confetti
  const confetti = document.getElementById("confetti");
  const colors = ["#ffd23f", "#ff6b9d", "#4cc9f0", "#7bd389", "#b28dff"];
  let partyTimer;
  function party() {
    mascot.classList.add("party");
    clearTimeout(partyTimer);
    partyTimer = setTimeout(() => mascot.classList.remove("party"), 5000);
    if (reduceMotion) return;
    for (let i = 0; i < 90; i++) {
      const c = document.createElement("i");
      c.style.left = Math.random() * 100 + "vw";
      c.style.background = colors[i % colors.length];
      c.style.animationDuration = 1.8 + Math.random() * 1.8 + "s";
      c.style.animationDelay = Math.random() * 0.5 + "s";
      c.style.borderRadius = i % 3 === 0 ? "50%" : "2px";
      confetti.appendChild(c);
      c.addEventListener("animationend", () => c.remove());
    }
  }

  // Mini me reacts to which section you're looking at
  const SECTION_LINES = {
    about: "That's me! 👆",
    projects: "Ooh, the good stuff. ✨",
    journey: "What a journey, huh?",
    contact: "Go on, say hi! I'm peeking ↓",
  };
  const seen = new Set();
  const sectionObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting && !seen.has(en.target.id)) {
        seen.add(en.target.id);
        if (mascot.getBoundingClientRect().bottom > 0 && !choicesEl.childElementCount) say(SECTION_LINES[en.target.id], "smile");
      }
    });
  }, { threshold: 0.45 });
  Object.keys(SECTION_LINES).forEach((id) => {
    const el = document.getElementById(id);
    if (el) sectionObs.observe(el);
  });

  /* ---------- Draggable stickers ---------- */
  document.querySelectorAll("[data-drag]").forEach((el) => {
    let sx, sy, ox = 0, oy = 0;
    const rot = getComputedStyle(el).transform;
    el.addEventListener("pointerdown", (e) => {
      el.setPointerCapture(e.pointerId);
      el.classList.add("dragging");
      sx = e.clientX - ox;
      sy = e.clientY - oy;
    });
    el.addEventListener("pointermove", (e) => {
      if (!el.classList.contains("dragging")) return;
      ox = e.clientX - sx;
      oy = e.clientY - sy;
      el.style.transform = `translate(${ox}px, ${oy}px) ${rot === "none" ? "" : rot}`;
    });
    const end = () => el.classList.remove("dragging");
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  });

  /* ---------- Project filters ---------- */
  const filterBtns = document.querySelectorAll("[data-filter]");
  filterBtns.forEach((btn) =>
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.toggle("is-active", b === btn));
      const f = btn.dataset.filter;
      document.querySelector(".projects").classList.toggle("filtered", f !== "all");
      document.querySelectorAll(".project").forEach((p) => {
        p.classList.toggle("hide", f !== "all" && p.dataset.type !== f);
      });
    })
  );

  /* ---------- Tilt on project cards ---------- */
  if (!reduceMotion && matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".project").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(700px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg) translate(-3px,-3px)`;
        card.style.boxShadow = "9px 9px 0 var(--ink)";
      });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
        card.style.boxShadow = "";
      });
    });
  }

  /* ---------- Count-up stats + reveal on scroll ---------- */
  const countUp = (el) => {
    const target = +el.dataset.count;
    if (reduceMotion) { el.textContent = target; return; }
    const start = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - start) / 900);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const revealEls = document.querySelectorAll(".section .card, .section-title, .filters");
  revealEls.forEach((el) => el.classList.add("reveal"));
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      en.target.querySelectorAll("[data-count]").forEach(countUp);
      revealObs.unobserve(en.target);
    });
  }, { threshold: 0.15 });
  revealEls.forEach((el) => revealObs.observe(el));

  /* ---------- Copy email ---------- */
  const copyBtn = document.getElementById("copyEmail");
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(copyBtn.dataset.email);
      copyBtn.textContent = "Copied! ✓";
    } catch (_) {
      copyBtn.textContent = copyBtn.dataset.email;
    }
    setTimeout(() => (copyBtn.textContent = "Copy email"), 1800);
  });

  document.getElementById("year").textContent = new Date().getFullYear();
})();
