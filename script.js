document.addEventListener("DOMContentLoaded", () => {
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
    { threshold: 0.12 }
  );
  targets.forEach((el) => observer.observe(el));

  document.querySelectorAll("h2.toggle").forEach((h2) => {
    h2.addEventListener("click", () => {
      h2.closest("section.block").classList.toggle("collapsed");
    });
  });

  document.querySelectorAll("#career-detail .proj-item").forEach((item) => {
    item.addEventListener("click", () => {
      item.classList.toggle("open");
    });
  });

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

});
