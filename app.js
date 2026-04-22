/* ============================================================
   BadFox Pools — app.js  (Version A: Aurelia)
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
        e.preventDefault();
        if (note) note.textContent = "Please complete all fields to book service.";
        return;
      }
      if (note) note.textContent = "Thanks — we'll be in touch within one business day.";
      /* Allow Netlify form submission to proceed */
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
  const sectionIds = ["home", "services", "about", "contact"];
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
     VIDEO PLAYBACK
     ————————————————————————————————————————————————————————————
     The HTML <video autoplay muted playsinline preload="auto">
     attributes are what actually start playback. Modern browsers
     honor this over HTTPS for muted videos — no JS required.

     Our job here is MINIMAL: just be a safety net. The previous
     version called load() and play() repeatedly, which triggered
     AbortError cascades (each load() aborts the prior play() promise)
     and actually prevented autoplay from succeeding.

     What we do now:
       • Re-assert muted (some browsers reset it)
       • One play() attempt on canplay, in case autoplay was deferred
       • Resume on visibility change
       • Fallback play() on first user interaction
       • Never call load() — it aborts pending play promises
     ============================================================ */
  const videoEl = document.querySelector(".hero-video");

  if (videoEl) {
    videoEl.muted = true;
    videoEl.defaultMuted = true;

    const safePlay = () => {
      if (!videoEl.paused) return;
      const p = videoEl.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };

    // Attempt immediately — covers cached/fast loads where canplay fires
    // before this deferred script attaches its listener, and browsers that
    // need an explicit play() even when the autoplay attribute is present.
    safePlay();

    // Belt-and-suspenders: retry when first data arrives and when fully loaded
    videoEl.addEventListener("canplay", safePlay, { once: true, passive: true });
    window.addEventListener("load", safePlay, { once: true });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) videoEl.pause();
      else safePlay();
    });

    const onFirstInteraction = () => {
      safePlay();
      ["scroll", "click", "touchstart", "keydown"].forEach((evt) =>
        window.removeEventListener(evt, onFirstInteraction)
      );
    };
    ["scroll", "click", "touchstart", "keydown"].forEach((evt) =>
      window.addEventListener(evt, onFirstInteraction, { once: true, passive: true })
    );
  }

})();
