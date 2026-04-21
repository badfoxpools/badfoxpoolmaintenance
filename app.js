/* ============================================================
   BadFox Pool Maintenance — app.js  (Version A: Aurelia)
   Optimized animations + fail-proof video playback.

   Script loading: GSAP → ScrollTrigger → app.js all use `defer`,
   so they execute in source order. By the time this file runs,
   window.gsap and window.ScrollTrigger are both guaranteed defined.
   ============================================================ */

(function () {
  "use strict";

  const prefersReducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* -------------------- Footer year -------------------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* -------------------- Smooth anchor scroll -------------------- */
  const headerEl = document.querySelector(".site-header");
  const getHeaderH = () => (headerEl ? headerEl.offsetHeight : 72);

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.pageYOffset - (getHeaderH() - 1);
      window.scrollTo({ top, behavior: prefersReducedMotion ? "auto" : "smooth" });
      history.replaceState(null, "", id);
    });
  });

  /* -------------------- Form validation -------------------- */
  const form = document.querySelector(".contact-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const note = form.querySelector(".form-note");
      const required = form.querySelectorAll("input[required]");
      let ok = true;
      required.forEach((input) => {
        if (!input.value.trim()) {
          ok = false;
          input.style.borderColor = "#ff7070";
        } else {
          input.style.borderColor = "";
        }
      });
      if (!ok) {
        if (note) note.textContent = "Please complete all fields to book service.";
        return;
      }
      if (note) note.textContent = "Thanks — we'll be in touch within one business day.";
      form.reset();
    });
  }

  /* -------------------- Tabs + animated underline -------------------- */
  const tabs = Array.from(document.querySelectorAll(".tab"));
  const tabUnderline = document.querySelector(".tab-underline");
  const tabMap = new Map(tabs.map((t) => [t.dataset.tab, t]));

  function setActiveTab(id) {
    tabs.forEach((t) => {
      const active = t.dataset.tab === id;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", active ? "true" : "false");
    });
    positionUnderline(tabMap.get(id));
  }

  function positionUnderline(tabEl) {
    if (!tabUnderline || !tabEl) return;
    const tabsWrap = tabEl.closest(".tabs");
    if (!tabsWrap) return;
    const wrapBox = tabsWrap.getBoundingClientRect();
    const box = tabEl.getBoundingClientRect();
    const x = box.left - wrapBox.left + 14;
    const w = Math.max(box.width - 28, 24);
    if (window.gsap && !prefersReducedMotion) {
      window.gsap.to(tabUnderline, { x, width: w, opacity: 1, duration: 0.5, ease: "power3.out" });
    } else {
      tabUnderline.style.transform = `translateX(${x}px)`;
      tabUnderline.style.width = w + "px";
      tabUnderline.style.opacity = "1";
    }
  }

  window.addEventListener("load", () => positionUnderline(document.querySelector(".tab.is-active")));
  window.addEventListener("resize", () => positionUnderline(document.querySelector(".tab.is-active")));
  tabs.forEach((t) => t.addEventListener("click", () => setActiveTab(t.dataset.tab)));

  /* -------------------- Tab follows scroll (rAF-throttled) -------------------- */
  const sectionIds = ["home", "about", "contact"];
  const sectionEls = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
  let scrollTicking = false;

  function onScrollUpdateTab() {
    const offset = getHeaderH() + 40;
    let current = sectionIds[0];
    for (const el of sectionEls) {
      if (el.getBoundingClientRect().top - offset <= 0) current = el.id;
    }
    if (!tabMap.get(current)?.classList.contains("is-active")) {
      setActiveTab(current);
    }
  }

  window.addEventListener("scroll", () => {
    if (!scrollTicking) {
      requestAnimationFrame(() => { onScrollUpdateTab(); scrollTicking = false; });
      scrollTicking = true;
    }
  }, { passive: true });

  /* ============================================================
     GSAP animations
     ============================================================ */
  function initAnimations() {
    if (!window.gsap) return;
    const gsap = window.gsap;
    const ST = window.ScrollTrigger;
    if (ST) gsap.registerPlugin(ST);

    /* Reduced-motion: immediately reveal everything, no animations */
    if (prefersReducedMotion) {
      document.querySelectorAll('[data-anim="fadeUp"], [data-anim="cardUp"]').forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
      return;
    }

    /* ---- Hero: stagger fade-up (data-hero attribute marks hero items) ---- */
    const heroItems = document.querySelectorAll('[data-hero]');
    if (heroItems.length) {
      gsap.to(heroItems, {
        opacity: 1, y: 0,
        duration: 1.0, ease: "power3.out",
        stagger: 0.12, delay: 0.15,
      });
    }

    /* ---- Hero: parallax on wrapper div (NEVER on <video> directly) --------
       Animating transforms on <video> causes Chrome to pause autoplay.
       We animate .hero-media (the parent wrapper) instead.            */
    const heroMedia = document.querySelector(".hero-media");
    if (heroMedia && ST) {
      gsap.to(heroMedia, {
        yPercent: 12, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
      });
    }

    if (!ST) return; /* ScrollTrigger not available — skip scroll animations */

    /* ---- Scroll-triggered fadeUp for all sections outside the hero ---- */
    document.querySelectorAll('[data-anim="fadeUp"]').forEach((el) => {
      /* Skip hero items — already animated above */
      if (el.hasAttribute("data-hero")) return;
      gsap.to(el, {
        opacity: 1, y: 0,
        duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none none" },
      });
    });

    /* ---- Feature cards: staggered group reveal ---- */
    const cards = gsap.utils.toArray('.card[data-anim="cardUp"]');
    if (cards.length) {
      gsap.to(cards, {
        opacity: 1, y: 0,
        duration: 0.9, ease: "power3.out", stagger: 0.14,
        scrollTrigger: { trigger: ".card-grid", start: "top 80%", toggleActions: "play none none none" },
      });
    }

    /* ---- Horizontal timeline pin (desktop only) ---- */
    const track = document.querySelector(".timeline-track");
    const pinWrap = document.querySelector(".timeline-pin");
    if (track && pinWrap && window.matchMedia("(min-width: 760px)").matches) {
      const getDistance = () => track.scrollWidth - pinWrap.clientWidth + 80;
      gsap.to(track, {
        x: () => -getDistance(), ease: "none",
        scrollTrigger: {
          trigger: pinWrap,
          start: "top top",
          end: () => "+=" + getDistance(),
          pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true,
        },
      });
    }

    /* Re-position tab underline after any ScrollTrigger layout refresh */
    ST.addEventListener("refresh", () =>
      positionUnderline(document.querySelector(".tab.is-active"))
    );
  }

  /* ============================================================
     Initialization — runs after DOM + deferred scripts are ready.
     Because all three script tags use `defer`, window.gsap and
     window.ScrollTrigger are both defined before DOMContentLoaded.
     ============================================================ */
  function init() {
    initAnimations();
    positionUnderline(document.querySelector(".tab.is-active"));
    onScrollUpdateTab();

    /* Final ScrollTrigger refresh after full page load (images, fonts).
       This corrects any trigger positions that shifted during page paint. */
    if (window.ScrollTrigger) {
      window.addEventListener("load", () => {
        window.ScrollTrigger.refresh();
        positionUnderline(document.querySelector(".tab.is-active"));
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init(); /* DOM already parsed (e.g. script injected dynamically) */
  }

  /* ============================================================
     FAIL-PROOF VIDEO PLAYBACK
     ————————————————————————————————————————————————————————————
     Root problem: the 17 MB hero video needs enough buffered data
     before browsers honor autoplay — especially on slow connections.
     Additional Chrome bug: applying CSS transforms directly to a
     <video> element pauses autoplay until the transform settles.
     Fix: GSAP parallax targets .hero-media (parent), not the video.

     Strategy — 7 independent triggers so at least one always wins:
       1. Immediate attempt on script execution
       2. Every video readiness event (loadedmetadata → canplaythrough)
       3. window.load (all resources done)
       4. IntersectionObserver (hero enters viewport)
       5. First user interaction (scroll/click/touch/keyboard)
       6. visibilitychange (tab returns from background)
       7. Polling every 500 ms for 15 s as a final safety net
     ============================================================ */

  const videoEl = document.querySelector(".hero-video"); /* cached once */
  const videoState = { polling: null, pollCount: 0 };

  function isPlaying(v) {
    return v && !v.paused && !v.ended && v.readyState > 2 && v.currentTime > 0;
  }

  /* Stamp every mute property the browser exposes so no path leaves audio on. */
  function muteVideo() {
    videoEl.muted        = true;
    videoEl.defaultMuted = true;
    videoEl.volume       = 0;
    videoEl.autoplay     = true;   /* JS property, separate from HTML attribute */
    videoEl.setAttribute("muted", "");
  }

  function tryPlay() {
    if (!videoEl) return;
    if (isPlaying(videoEl)) {
      /* Already running — stop polling */
      if (videoState.polling) { clearInterval(videoState.polling); videoState.polling = null; }
      return;
    }
    muteVideo();
    const p = videoEl.play();
    if (p && typeof p.catch === "function") p.catch(() => { /* blocked — will retry */ });
  }

  function initVideo() {
    if (!videoEl) return;

    muteVideo();

    /* Trigger 2: attempt on every buffering milestone */
    ["loadedmetadata", "loadeddata", "canplay", "canplaythrough", "progress", "suspend"]
      .forEach((evt) => videoEl.addEventListener(evt, tryPlay, { passive: true }));

    /* Trigger 3: double-rAF — waits for the browser to complete one full paint cycle
       before calling play(). This ensures the video element is fully composited and
       the browser's autoplay policy evaluates it as "visible" content, which is a
       prerequisite for muted autoplay to be granted in Chrome and Safari. */
    requestAnimationFrame(() => requestAnimationFrame(tryPlay));

    /* Trigger 4: polling — fires every 500 ms for up to 15 s */
    videoState.polling = setInterval(() => {
      videoState.pollCount++;
      if (isPlaying(videoEl) || videoState.pollCount > 30) {
        clearInterval(videoState.polling);
        videoState.polling = null;
        return;
      }
      tryPlay();
    }, 500);

    /* Trigger 5: tab visibility — pause to save data, resume on return */
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) videoEl.pause();
      else tryPlay();
    });

    /* Trigger 6: browser sometimes randomly pauses; re-trigger if tab is visible */
    videoEl.addEventListener("pause", () => {
      if (!document.hidden) setTimeout(tryPlay, 100);
    });
  }

  /* Boot video as early as possible */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initVideo);
  } else {
    initVideo();
  }

  /* Trigger 7: window.load — all resources available */
  window.addEventListener("load", tryPlay);

  /* Trigger 8: IntersectionObserver — play the moment the hero enters viewport */
  if ("IntersectionObserver" in window && videoEl) {
    new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) tryPlay();
    }, { threshold: 0.1 }).observe(document.querySelector(".hero") || videoEl);
  }

  /* Trigger 9: first interaction — guarantees playback on any browser policy */
  function onFirstInteraction() {
    tryPlay();
    ["scroll", "click", "touchstart", "keydown", "pointermove"].forEach((evt) =>
      window.removeEventListener(evt, onFirstInteraction)
    );
  }
  ["scroll", "click", "touchstart", "keydown", "pointermove"].forEach((evt) =>
    window.addEventListener(evt, onFirstInteraction, { once: true, passive: true })
  );

})();
