/**
 * CORTEX — DEVELOPER PORTAL & INTERACTIVE CLIENT ENGINE
 * Strictly zero emojis, clean developer-friendly interactions.
 */

// 1. Terminal Demo Content Map
const DEMO_OUTPUTS = {
  init: `[+] Scanning repository AST...
[+] Found 142 source files (TypeScript, Python, Go)
[+] Discovered 488 exported functions, classes, and interfaces
[+] Generated dual-layer graph in .project-cortex.json (38KB)
[+] Initialized append-only ledger in .cortex/ledger/0001_genesis.jsonl
[+] Registered MCP server endpoints

Cortex initialized successfully. Run 'cortex context <file>' to test.`,

  context: `Target: src/auth/token.service.ts::TokenService
Raw repository scan: 48,290 tokens across 18 dependencies

=== COMPACTED CONTEXT SLICE ===
Exported Signatures:
  - class TokenService { verify(token: string): Promise<TokenPayload>; revoke(jti: string): Promise<void>; }
  - interface TokenPayload { sub: string; role: string; jti: string; exp: number; }

Direct Callers:
  - src/api/auth.controller.ts (AuthController.refreshToken)
  - src/middleware/session.ts (SessionMiddleware.validate)

Active Rules & Invariants:
  - [RULE-01] Redis blacklist lookup MUST precede Postgres user fetch.
  - [RULE-02] Rotated refresh tokens must invalidate child family jtis.

Known Gotchas:
  - [GOTCHA-01] Cluster failover requires 50ms redis timeout retry loop.

Result: 1,180 tokens (97.5% compaction ratio)`,

  decision: `Recording architectural decision...
Title: "Use Redis cluster for distributed token revocation"
Target: "src/auth"
Attached Invariant: "auth:revoked:{jti} with TTL 86400s"
Verification Command: "npm test tests/auth/revocation.test.ts"

Running verification test...
[PASS] tests/auth/revocation.test.ts (4 tests passed in 182ms)

Committed to .cortex/ledger/0002_decision.jsonl (SHA: e9f28a1)
Graph synchronized: 4 symbols updated. AI agents will now enforce this rule.`,

  blast: `Analyzing blast radius for: src/auth/token.service.ts
Graph traversal depth: 2 hops

[Hop 1] Direct Callers:
  - src/api/auth.controller.ts (AuthController.login, AuthController.refresh)
  - src/middleware/auth.guard.ts (AuthGuard.canActivate)

[Hop 2] Downstream Services:
  - src/routes/user.routes.ts
  - src/routes/billing.routes.ts

Affected Test Suites:
  - tests/unit/token.service.test.ts
  - tests/integration/auth.e2e.test.ts

Risk Assessment: LOW RISK (2 direct callers, 2 test suites require re-run)`
};

// 2. Demo Tab Switcher
function switchDemoTab(tabKey, btn) {
  const container = document.getElementById('demo-terminal-output');
  if (!container) return;

  // Update active tab buttons
  document.querySelectorAll('.workbench-tab-btn').forEach((b) => b.classList.remove('active'));
  if (btn) {
    btn.classList.add('active');
  }

  // Set output
  const content = DEMO_OUTPUTS[tabKey] || '// Select a command tab above to view live execution.';
  container.textContent = content;
}

// 3. Copy Workbench Output
function copyWorkbenchOutput() {
  const container = document.getElementById('demo-terminal-output');
  if (!container) return;

  navigator.clipboard.writeText(container.textContent).then(() => {
    const btn = document.querySelector('.workbench-header .btn-copy');
    if (!btn) return;
    const originalText = btn.textContent;
    btn.textContent = 'Copied!';
    btn.style.color = '#10b981';
    btn.style.borderColor = '#10b981';

    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.color = '';
      btn.style.borderColor = '';
    }, 2000);
  });
}

// 4. View Switcher (Landing vs Docs)
function switchView(viewName) {
  const landingView = document.getElementById('view-landing');
  const docsView = document.getElementById('view-docs');
  const pillLanding = document.getElementById('pill-landing');
  const pillDocs = document.getElementById('pill-docs');

  if (viewName === 'docs') {
    if (landingView) landingView.classList.remove('active');
    if (docsView) docsView.classList.add('active');
    if (pillLanding) pillLanding.classList.remove('active');
    if (pillDocs) pillDocs.classList.add('active');
  } else {
    if (docsView) docsView.classList.remove('active');
    if (landingView) landingView.classList.add('active');
    if (pillDocs) pillDocs.classList.remove('active');
    if (pillLanding) pillLanding.classList.add('active');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 5. Dark / Light Theme Switcher
const SVG_MOON = `<svg class="theme-icon-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
const SVG_SUN = `<svg class="theme-icon-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;

function updateThemeUI(theme) {
  const iconSlot = document.getElementById('theme-icon-slot');
  const label = document.getElementById('theme-label');

  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    if (iconSlot) iconSlot.innerHTML = SVG_SUN;
    if (label) label.textContent = 'Light';
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (iconSlot) iconSlot.innerHTML = SVG_MOON;
    if (label) label.textContent = 'Dark';
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const target = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem('cortex_theme', target);
  updateThemeUI(target);
}

function initTheme() {
  const saved = localStorage.getItem('cortex_theme');
  if (saved) {
    updateThemeUI(saved);
  } else {
    updateThemeUI('dark');
  }
}

// 6. Quick CLI Copy on Landing Page
function copyCliQuick() {
  const cmdText = 'npx cortex-graph init';
  navigator.clipboard.writeText(cmdText).then(() => {
    const copyTag = document.getElementById('landing-copy-tag');
    if (!copyTag) return;
    const originalText = copyTag.textContent;
    copyTag.textContent = 'COPIED!';
    copyTag.style.background = 'var(--accent-green)';
    copyTag.style.color = '#000000';

    setTimeout(() => {
      copyTag.textContent = originalText;
      copyTag.style.background = '';
      copyTag.style.color = '';
    }, 2000);
  });
}

// 7. Code Block Copy Helper
function copyCode(btn) {
  const card = btn.closest('.code-card');
  if (!card) return;
  const codeEl = card.querySelector('code');
  if (!codeEl) return;

  navigator.clipboard.writeText(codeEl.innerText).then(() => {
    const originalText = btn.textContent;
    btn.textContent = 'Copied!';
    btn.style.color = '#10b981';
    btn.style.borderColor = '#10b981';

    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.color = '';
      btn.style.borderColor = '';
    }, 2000);
  });
}

// 8. Keyboard Shortcut '/' to Focus Docs Search
document.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
    e.preventDefault();
    switchView('docs');
    const searchInput = document.getElementById('docs-search-input');
    if (searchInput) {
      setTimeout(() => searchInput.focus(), 50);
    }
  }
});

// 9. Search Filter Functionality in Docs
function initSearch() {
  const searchInput = document.getElementById('docs-search-input');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const sections = document.querySelectorAll('.section-block');

    if (!query) {
      sections.forEach((s) => (s.style.display = ''));
      return;
    }

    sections.forEach((section) => {
      const text = section.innerText.toLowerCase();
      if (text.includes(query)) {
        section.style.display = '';
      } else {
        section.style.display = 'none';
      }
    });
  });
}

// 10. Active Scrollspy for Sidebar & TOC
function initScrollspy() {
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

  document.querySelectorAll('.section-block').forEach((section) => {
    observer.observe(section);
  });
}

// 11. Auto-switch to Docs if URL contains hash
function checkUrlHash() {
  if (window.location.hash && window.location.hash !== '#') {
    switchView('docs');
    const targetEl = document.querySelector(window.location.hash);
    if (targetEl) {
      setTimeout(() => {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }
}

// 12. Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSearch();
  initScrollspy();
  checkUrlHash();

  // Load initial demo tab output
  switchDemoTab('init', document.querySelector('.workbench-tab-btn'));
});
