/**
 * CORTEX DOCUMENTATION PORTAL
 * Minimalist interaction helpers: 1-click copy, search filter, and TOC scrollspy.
 */

// 1. 1-Click Code Copying Helper
function copyCode(btn) {
  const card = btn.closest('.code-card');
  if (!card) return;
  const codeEl = card.querySelector('code');
  if (!codeEl) return;

  navigator.clipboard.writeText(codeEl.innerText).then(() => {
    const originalText = btn.textContent;
    btn.textContent = 'Copied!';
    btn.style.color = '#34d399';
    btn.style.borderColor = '#10b981';

    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.color = '';
      btn.style.borderColor = '';
    }, 2000);
  });
}

// 2. Keyboard shortcut '/' to focus search bar
document.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
    e.preventDefault();
    const searchInput = document.getElementById('doc-search');
    if (searchInput) searchInput.focus();
  }
});

// 3. Search Filter functionality
const searchInput = document.getElementById('doc-search');
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
      document.querySelectorAll('.section-block').forEach((s) => (s.style.display = ''));
      return;
    }

    document.querySelectorAll('.section-block').forEach((section) => {
      const text = section.innerText.toLowerCase();
      if (text.includes(query)) {
        section.style.display = '';
      } else {
        section.style.display = 'none';
      }
    });
  });
}

// 4. Active Scrollspy for Sidebar & TOC
const observerOptions = {
  root: null,
  rootMargin: '-20% 0px -70% 0px',
  threshold: 0
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      if (!id) return;

      document.querySelectorAll('.sidebar-link, .toc-link').forEach((link) => {
        if (link.getAttribute('href') === `#${id}`) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }
  });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.section-block').forEach((section) => {
    observer.observe(section);
  });
});
