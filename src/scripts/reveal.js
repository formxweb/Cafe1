// Adds .is-in to [data-reveal] elements the first time they come into view.
// The styles in global.css only hide them while JS runs and motion is welcome.

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      observer.unobserve(entry.target);
    });
  },
  { rootMargin: '0px 0px -12% 0px' },
);

document.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));
