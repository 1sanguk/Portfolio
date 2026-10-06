document.addEventListener("DOMContentLoaded", () => {
  const motionOK = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (motionOK) document.documentElement.classList.add("fx");

  // wrap the last line of each section title so the highlighter can sweep under it
  document.querySelectorAll(".section-title, .case-title").forEach((title) => {
    const brs = title.querySelectorAll("br");
    const start = brs.length ? brs[brs.length - 1].nextSibling : title.firstChild;
    const hl = document.createElement("span");
    hl.className = "hl";
    let node = start;
    while (node) {
      const next = node.nextSibling;
      hl.appendChild(node);
      node = next;
    }
    title.appendChild(hl);
  });

  document.querySelectorAll("#skills .skill-row").forEach((row, i) => {
    row.style.setProperty("--row", i % 9);
  });

  const targets = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0, rootMargin: "0px 0px -60px 0px" }
  );
  targets.forEach((el) => observer.observe(el));

  document.querySelectorAll("h2.toggle").forEach((h2) => {
    h2.addEventListener("click", () => {
      h2.closest("section.block").classList.toggle("collapsed");
    });
  });

  document.querySelectorAll("#career-detail .proj-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;
      item.classList.toggle("open");
    });
  });

  document.querySelectorAll(".deep-head").forEach((head) => {
    head.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;
      head.closest(".deep").classList.toggle("collapsed");
    });
  });

  document.querySelectorAll(".career-job .job-head").forEach((head) => {
    head.addEventListener("click", () => {
      head.closest(".career-job").classList.toggle("collapsed");
    });
  });

  document.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.matches("[data-toggle]")) {
      e.preventDefault();
      e.target.click();
    }
  });

  const nav = document.querySelector("nav.topnav");
  const isMobile = () => window.matchMedia("(max-width: 640px)").matches;
  let lastScrollY = window.scrollY;

  const topBtn = document.getElementById("topBtn");
  const progressBar = document.querySelector(".scroll-progress i");

  window.addEventListener(
    "scroll",
    () => {
      const currentY = window.scrollY;

      if (!isMobile()) {
        nav.classList.remove("nav-hidden");
        lastScrollY = currentY;
      } else {
        if (currentY > lastScrollY && currentY > nav.offsetHeight) {
          nav.classList.add("nav-hidden");
        } else {
          nav.classList.remove("nav-hidden");
        }
        lastScrollY = currentY;
      }

      if (topBtn) {
        topBtn.classList.toggle("visible", currentY > 300);
      }

      if (progressBar) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progressBar.style.transform = `scaleX(${max > 0 ? Math.min(currentY / max, 1) : 0})`;
      }
    },
    { passive: true }
  );

  const miniTocLinks = document.querySelectorAll(".mini-toc a");
  if (miniTocLinks.length) {
    const sections = Array.from(miniTocLinks)
      .map((a) => document.querySelector(a.getAttribute("href")))
      .filter(Boolean);

    const intersecting = new Set();

    const setActive = (id) => {
      miniTocLinks.forEach((a) => {
        a.classList.toggle("active", id !== null && a.getAttribute("href") === `#${id}`);
      });
    };

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            intersecting.add(entry.target.id);
          } else {
            intersecting.delete(entry.target.id);
          }
        });

        if (intersecting.size === 0) {
          setActive(null);
          return;
        }

        const activeId = sections.find((sec) => intersecting.has(sec.id)).id;
        setActive(activeId);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );

    sections.forEach((sec) => sectionObserver.observe(sec));
  }

  if (motionOK) {
    // diagrams animate once when they come into view
    const diagramObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const steps = entry.target.querySelectorAll(
            ".bar, .fill, .pf-node, .pf-branch, .pipe li, .vtable tbody tr, .ch-arrow, .legend-list li"
          );
          steps.forEach((el, i) => {
            el.style.transitionDelay = `${i * 70}ms`;
          });
          entry.target.classList.add("play");
          diagramObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.25 }
    );
    document.querySelectorAll(".diagram").forEach((d) => diagramObserver.observe(d));

    // count numbers up from zero, keeping the surrounding text and screen-reader spans intact
    const numberPattern = /\d[\d,]*(?:\.\d+)?/g;
    const countTargets = Array.from(document.querySelectorAll(".metric-after, .deep-kpis .stat-value strong"));
    const textNodesOf = (el) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) =>
          n.parentElement.closest(".sr-only") || !/\d/.test(n.nodeValue)
            ? NodeFilter.FILTER_REJECT
            : NodeFilter.FILTER_ACCEPT,
      });
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      return nodes.map((node) => ({ node, original: node.nodeValue }));
    };
    const render = (items, t) => {
      items.forEach(({ node, original }) => {
        node.nodeValue = original.replace(numberPattern, (m) => {
          const decimals = (m.split(".")[1] || "").length;
          const value = parseFloat(m.replace(/,/g, "")) * t;
          const fixed = value.toFixed(decimals);
          return m.includes(",") ? Number(fixed).toLocaleString("en-US", { minimumFractionDigits: decimals }) : fixed;
        });
      });
    };
    const counters = new Map();
    countTargets.forEach((el) => {
      const items = textNodesOf(el);
      counters.set(el, items);
      if (el.getBoundingClientRect().top > window.innerHeight) render(items, 0);
    });
    const countObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const items = counters.get(entry.target);
          const begin = performance.now();
          const tick = (now) => {
            const p = Math.min((now - begin) / 1200, 1);
            render(items, 1 - Math.pow(1 - p, 3));
            if (p < 1) requestAnimationFrame(tick);
            else items.forEach(({ node, original }) => (node.nodeValue = original));
          };
          requestAnimationFrame(tick);
          countObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.6 }
    );
    countTargets.forEach((el) => countObserver.observe(el));

    // hero phones tilt toward the pointer on devices with a mouse
    const hero = document.querySelector(".hero");
    const phones = document.querySelector(".hero-phones");
    if (hero && phones && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      hero.addEventListener("mousemove", (e) => {
        const r = hero.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        phones.style.setProperty("--ry", `${(x * 10).toFixed(2)}deg`);
        phones.style.setProperty("--rx", `${(-y * 8).toFixed(2)}deg`);
      });
      hero.addEventListener("mouseleave", () => {
        phones.style.setProperty("--ry", "0deg");
        phones.style.setProperty("--rx", "0deg");
      });
    }

    // printing shows every animated element in its final state
    window.addEventListener("beforeprint", () => {
      document.documentElement.classList.remove("fx");
    });
  }
});
