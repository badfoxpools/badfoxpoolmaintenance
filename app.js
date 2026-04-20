/* ============================================================
   BadFox Pool Maintenance — app.js
   GSAP + ScrollTrigger animations, nav tweens, form handler.
   ============================================================ */

(function () {
  "use strict";

  const prefersReducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Footer year
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

  /* -------------------- Form stub -------------------- */
  const form = document.querySelector(".contact-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const note = form.querySelector(".form-note");
      const required = form.querySelectorAll("input[required]");
      let ok = true;
      required.forEach((i) => {
        if (!i.value.trim()) {
          ok = false;
          i.style.borderColor = "#ff7070";
        } else {
          i.style.borderColor = "";
        }
      });
      if (!ok) {
        if (note) note.textContent = "Please complete all fields to book service.";
        return;
      }
      if (note) note.textContent = "Thanks — we’ll be in touch within one business day.";
      form.reset();
    });
  }

  /* -------------------- Tabs (active state on scroll) -------------------- */
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
      window.gsap.to(tabUnderline, {
        x,
        width: w,
        opacity: 1,
        duration: 0.5,
        ease: "power3.out",
      });
    } else {
      tabUnderline.style.transform = `translateX(${x}px)`;
      tabUnderline.style.width = w + "px";
      tabUnderline.style.opacity = "1";
    }
  }

  // Initial underline on load
  window.addEventListener("load", () => positionUnderline(document.querySelector(".tab.is-active")));
  window.addEventListener("resize", () => positionUnderline(document.querySelector(".tab.is-active")));

  tabs.forEach((t) =>
    t.addEventListener("click", () => {
      setActiveTab(t.dataset.tab);
    })
  );

  /* -------------------- Tab follows scroll position -------------------- */
  const sectionIds = ["home", "about", "contact"];
  const sectionEls = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);

  function onScrollUpdateTab() {
    const offset = getHeaderH() + 40;
    let current = sectionIds[0];
    for (const el of sectionEls) {
      const top = el.getBoundingClientRect().top;
      if (top - offset <= 0) current = el.id;
    }
    if (!tabMap.get(current)?.classList.contains("is-active")) {
      setActiveTab(current);
    }
  }
  window.addEventListener("scroll", onScrollUpdateTab, { passive: true });

  /* -------------------- GSAP animations -------------------- */
  function initAnimations() {
    if (!window.gsap) return;
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    if (ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    if (prefersReducedMotion) {
      // Reveal everything immediately
      document.querySelectorAll('[data-anim="fadeUp"], [data-anim="cardUp"]').forEach((el) => {
        el.style.opacity = 1;
        el.style.transform = "none";
      });
      return;
    }

    /* Hero fade-up stagger */
    const heroItems = document.querySelectorAll(
      '.hero-inner [data-anim="fadeUp"]'
    );
    gsap.to(heroItems, {
      opacity: 1,
      y: 0,
      duration: 1.0,
      ease: "power3.out",
      stagger: 0.12,
      delay: 0.15,
    });

    /* Subtle hero parallax — animate the WRAPPER, not the <video>.
       Transforming a video element directly causes Chrome to pause autoplay
       until the transform stabilizes (which is why scrolling "unlocked" it). */
    const heroMedia = document.querySelector(".hero-media");
    if (heroMedia && ScrollTrigger) {
      gsap.to(heroMedia, {
        yPercent: 12,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }

    /* Generic fadeUp on scroll */
    if (ScrollTrigger) {
      document
        .querySelectorAll('main [data-anim="fadeUp"]:not(.hero-inner [data-anim="fadeUp"])')
        .forEach((el) => {
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          });
        });

      /* Feature cards staggered bottom-up */
      const cards = gsap.utils.toArray('.card[data-anim="cardUp"]');
      if (cards.length) {
        gsap.to(cards, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.14,
          scrollTrigger: {
            trigger: ".card-grid",
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });
      }

      /* Parallax divider */
      gsap.to(".parallax-back", {
        yPercent: -20,
        ease: "none",
        scrollTrigger: {
          trigger: ".parallax-divider",
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
      gsap.to(".parallax-front", {
        yPercent: -40,
        ease: "none",
        scrollTrigger: {
          trigger: ".parallax-divider",
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });

      /* Horizontal pinned timeline */
      const track = document.querySelector(".timeline-track");
      const pinWrap = document.querySelector(".timeline-pin");
      if (track && pinWrap && window.matchMedia("(min-width: 760px)").matches) {
        const getDistance = () => track.scrollWidth - pinWrap.clientWidth + 80;

        gsap.to(track, {
          x: () => -getDistance(),
          ease: "none",
          scrollTrigger: {
            trigger: pinWrap,
            start: "top top",
            end: () => "+=" + getDistance(),
            pin: true,
            scrub: 0.8,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });
      }

      /* Section-change underline tween (refresh when sections enter) */
      ScrollTrigger.addEventListener("refresh", () =>
        positionUnderline(document.querySelector(".tab.is-active"))
      );
    }
  }

  /* Wait for GSAP to load (deferred scripts) */
  function whenGsapReady(cb, tries = 0) {
    if (window.gsap) return cb();
    if (tries > 40) return cb();
    setTimeout(() => whenGsapReady(cb, tries + 1), 50);
  }

  window.addEventListener("DOMContentLoaded", () => {
    whenGsapReady(() => {
      initAnimations();
      positionUnderline(document.querySelector(".tab.is-active"));
      onScrollUpdateTab();
    });
  });

  /* -------------------- Video resilience -------------------- */
  // Browsers can refuse autoplay if the play() call happens during a layout
  // shift (e.g. GSAP ScrollTrigger refresh). We attempt play at three stages:
  //   1. DOMContentLoaded — as early as possible
  //   2. window load       — after all assets are ready
  //   3. First user gesture (scroll / click / touch) — guaranteed fallback

  function tryPlayVideo() {
    const v = document.querySelector(".hero-video");
    if (!v || !v.paused) return;           // already playing, nothing to do
    // Re-assert muted — some browsers need this explicitly before play()
    v.muted = true;
    v.defaultMuted = true;
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }

  function initHeroVideo() {
    const v = document.querySelector(".hero-video");
    if (!v) return;

    // Force the browser to start loading the video immediately.
    // Without this, some browsers delay fetch until layout settles,
    // which is often too late for autoplay.
    v.muted = true;
    v.defaultMuted = true;
    try { v.load(); } catch (e) {}

    // Fire play() the moment the video reports it can start
    v.addEventListener("loadedmetadata", tryPlayVideo, { once: true });
    v.addEventListener("canplay", tryPlayVideo, { once: true });
    v.addEventListener("canplaythrough", tryPlayVideo, { once: true });

    // Immediate attempt
    tryPlayVideo();
  }

  // Run as early as possible
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHeroVideo);
  } else {
    initHeroVideo();
  }

  // Additional retry after full page load
  window.addEventListener("load", tryPlayVideo);

  // First-interaction fallback (satisfies any remaining gate)
  function onFirstInteraction() {
    tryPlayVideo();
    ["scroll", "click", "touchstart", "keydown"].forEach((evt) =>
      window.removeEventListener(evt, onFirstInteraction)
    );
  }
  ["scroll", "click", "touchstart", "keydown"].forEach((evt) =>
    window.addEventListener(evt, onFirstInteraction, { once: true, passive: true })
  );
})();
