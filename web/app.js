/**
 * CORTEX INTERACTIVE ENGINE
 * Ambient cursor physics, 60fps morphing particles with mouse gravity,
 * interactive 3D card tilts, dual-layer DAG, and compactor sandbox.
 */

// =============================================================================
// 1. SMOOTH CURSOR AMBIENT GLOW TRACKER
// =============================================================================
function initCursorGlow() {
  const glow = document.getElementById('cursor-glow');
  if (!glow) return;

  let currentX = window.innerWidth / 2;
  let currentY = window.innerHeight / 2;
  let targetX = currentX;
  let targetY = currentY;

  window.addEventListener('mousemove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
  });

  function updateGlow() {
    currentX += (targetX - currentX) * 0.12;
    currentY += (targetY - currentY) * 0.12;
    glow.style.transform = `translate3d(${currentX - 240}px, ${currentY - 240}px, 0)`;
    requestAnimationFrame(updateGlow);
  }

  updateGlow();
}

// =============================================================================
// 2. MORPHING PARTICLES SIMULATION WITH MOUSE GRAVITY & CONSTELLATIONS
// =============================================================================
function initParticles(canvasId, isDark = false) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = canvas.parentElement.offsetWidth);
  let height = (canvas.height = canvas.parentElement.offsetHeight);

  window.addEventListener('resize', () => {
    if (!canvas.parentElement) return;
    width = canvas.width = canvas.parentElement.offsetWidth;
    height = canvas.height = canvas.parentElement.offsetHeight;
  });

  const count = Math.min(Math.floor((width * height) / 10000), 60);
  const particles = [];

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: Math.random() * 2.2 + 1.2,
      baseAlpha: Math.random() * 0.5 + 0.25
    });
  }

  let mouseX = -1000;
  let mouseY = -1000;

  window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });

  function render() {
    ctx.clearRect(0, 0, width, height);

    const dotColor = isDark ? '255, 255, 255' : '26, 115, 232';
    const lineColor = isDark ? '255, 255, 255' : '170, 177, 204';

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      // Mouse interactive gravity
      const dx = mouseX - p.x;
      const dy = mouseY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 140) {
        // Elastic pull towards cursor
        p.x += (dx / dist) * 0.7;
        p.y += (dy / dist) * 0.7;

        // Line to cursor
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(mouseX, mouseY);
        ctx.strokeStyle = `rgba(${dotColor}, ${(1 - dist / 140) * 0.25})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${dotColor}, ${p.baseAlpha})`;
      ctx.fill();

      // Connect nearby particles
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const d = Math.hypot(p.x - p2.x, p.y - p2.y);
        if (d < 120) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(${lineColor}, ${(1 - d / 120) * 0.2})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(render);
  }

  render();
}

// =============================================================================
// 3. 3D TILT EFFECT ON INTERACTIVE CARDS
// =============================================================================
function initTiltCards() {
  const cards = document.querySelectorAll('.feature-media-frame, .use-case-card, .simulator-card');
  
  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -3;
      const rotateY = ((x - centerX) / centerX) * 3;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
    });
  });
}

// =============================================================================
// 4. DUAL-LAYER KNOWLEDGE GRAPH DATA & VISUALIZATION
// =============================================================================
const GRAPH_NODES = [
  // Layer 1: AST Symbols
  {
    id: 'ast-token-svc',
    label: 'TokenService',
    layer: 'ast',
    symbol: 'src/auth/token.service.ts::TokenService',
    test: 'auth.test.ts',
    x: 25,
    y: 30,
    notes: 'Handles JWT lifecycle, token issuance, session refresh, and revocation state in Redis.',
    status: 'ACTIVE'
  },
  {
    id: 'ast-auth-controller',
    label: 'AuthController',
    layer: 'ast',
    symbol: 'src/auth/auth.controller.ts::AuthController',
    test: 'api.spec.ts',
    x: 65,
    y: 22,
    notes: 'Exposes /api/v1/auth endpoints. Enforces bearer schema and rate limits.',
    status: 'ACTIVE'
  },
  {
    id: 'ast-text-input',
    label: 'TextInput Component',
    layer: 'ast',
    symbol: 'lib/components/text_input.dart::TextInput',
    test: 'widget_test.dart',
    x: 18,
    y: 75,
    notes: 'Custom UI component wrapping FormBuilderTextField with standard design styling.',
    status: 'INVARIANT'
  },
  {
    id: 'ast-event-ip',
    label: 'EventIpResponse',
    layer: 'ast',
    symbol: 'src/models/event.ts::EventIpResponse',
    test: 'event.test.ts',
    x: 75,
    y: 78,
    notes: 'Response model with sceneType ("ip" | "venue"). Branding renders when sceneType is "ip".',
    status: 'ACTIVE'
  },

  // Layer 2: Episodic Memory Decisions & Invariants
  {
    id: 'mem-redis-revocation',
    label: 'Redis Revocation Cache',
    layer: 'memory',
    symbol: 'src/auth/token.service.ts::TokenService',
    test: 'auth.test.ts (exit 0)',
    x: 42,
    y: 48,
    notes: 'JWT blacklisting stored in Redis cache with 15-minute sliding TTL to eliminate DB bottlenecks.',
    status: 'VERIFIED'
  },
  {
    id: 'mem-text-input-gotcha',
    label: 'Never Use Raw TextField',
    layer: 'invariant',
    symbol: 'lib/components/text_input.dart',
    test: 'linter.spec.ts',
    x: 35,
    y: 84,
    notes: 'Global invariant: AI agents must never inject raw Flutter TextField; always use custom TextInput.',
    status: 'VERIFIED'
  },
  {
    id: 'mem-scene-type-rule',
    label: 'Event IP Branding Logic',
    layer: 'memory',
    symbol: 'src/models/event.ts::EventIpResponse',
    test: 'ip_branding.test.ts',
    x: 82,
    y: 45,
    notes: 'Logic for displaying event IP branding (poster/logo) vs Event Title depends on sceneType being "ip".',
    status: 'VERIFIED'
  }
];

const GRAPH_EDGES = [
  { from: 'ast-auth-controller', to: 'ast-token-svc' },
  { from: 'ast-token-svc', to: 'mem-redis-revocation' },
  { from: 'ast-text-input', to: 'mem-text-input-gotcha' },
  { from: 'ast-event-ip', to: 'mem-scene-type-rule' },
  { from: 'mem-redis-revocation', to: 'ast-auth-controller' }
];

function initGraphViewer() {
  const container = document.getElementById('graph-nodes');
  const svg = document.getElementById('graph-svg');
  if (!container || !svg) return;

  container.innerHTML = '';
  svg.innerHTML = '';

  const nodeMap = {};

  GRAPH_NODES.forEach((node, idx) => {
    const el = document.createElement('div');
    el.className = `graph-node layer-${node.layer} ${idx === 4 ? 'active' : ''}`;
    el.id = `node-${node.id}`;
    el.style.left = `${node.x}%`;
    el.style.top = `${node.y}%`;

    el.innerHTML = `
      <span class="node-indicator"></span>
      <span>${node.label}</span>
    `;

    el.addEventListener('click', () => selectNode(node, el));
    container.appendChild(el);
    nodeMap[node.id] = { node, el, x: node.x, y: node.y };
  });

  function drawEdges() {
    svg.innerHTML = '';
    const width = svg.clientWidth;
    const height = svg.clientHeight;

    GRAPH_EDGES.forEach((edge) => {
      const from = nodeMap[edge.from];
      const to = nodeMap[edge.to];
      if (!from || !to) return;

      const x1 = (from.x / 100) * width;
      const y1 = (from.y / 100) * height;
      const x2 = (to.x / 100) * width;
      const y2 = (to.y / 100) * height;

      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2 - 15;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`);
      path.setAttribute('stroke', '#b7bfd9');
      path.setAttribute('stroke-width', '1.5');
      path.setAttribute('stroke-opacity', '0.45');
      path.setAttribute('stroke-dasharray', '4 4');
      path.setAttribute('fill', 'none');
      svg.appendChild(path);
    });
  }

  setTimeout(drawEdges, 100);
  window.addEventListener('resize', drawEdges);
}

function selectNode(node, el) {
  document.querySelectorAll('.graph-node').forEach((n) => n.classList.remove('active'));
  if (el) el.classList.add('active');

  const inspType = document.getElementById('insp-type');
  const inspTitle = document.getElementById('insp-title');
  const inspStatusBox = document.getElementById('insp-status-box');
  const inspSymbol = document.getElementById('insp-symbol');
  const inspNotes = document.getElementById('insp-notes');

  if (inspType) inspType.textContent = `LAYER ${node.layer === 'ast' ? '1 // AST SYMBOL' : '2 // EPISODIC MEMORY'}`;
  if (inspTitle) inspTitle.textContent = node.label;
  if (inspSymbol) inspSymbol.textContent = node.symbol;
  if (inspNotes) inspNotes.textContent = node.notes;

  if (inspStatusBox) {
    if (node.status === 'VERIFIED') {
      inspStatusBox.style.borderLeftColor = 'var(--palette-emerald-600)';
      inspStatusBox.innerHTML = `<strong style="color: var(--palette-emerald-600);">VERIFIED</strong> — Passed verification suite <code>${node.test}</code>.`;
    } else if (node.status === 'INVARIANT') {
      inspStatusBox.style.borderLeftColor = 'var(--palette-blue-600)';
      inspStatusBox.innerHTML = `<strong style="color: var(--palette-blue-600);">INVARIANT</strong> — Core repository rule locked in knowledge graph.`;
    } else {
      inspStatusBox.style.borderLeftColor = 'var(--palette-amber-600)';
      inspStatusBox.innerHTML = `<strong style="color: var(--palette-amber-600);">ACTIVE</strong> — Synced with live AST index.`;
    }
  }
}

// =============================================================================
// 5. WORKBENCH TAB SWITCHER
// =============================================================================
function switchWbTab(tabKey, btn) {
  document.querySelectorAll('.wb-tab').forEach((t) => t.classList.remove('active'));
  if (btn) btn.classList.add('active');

  if (tabKey === 'ast') {
    document.querySelectorAll('.graph-node.layer-ast').forEach((n) => (n.style.opacity = '1'));
    document.querySelectorAll('.graph-node.layer-memory, .graph-node.layer-invariant').forEach((n) => (n.style.opacity = '0.15'));
  } else if (tabKey === 'memory') {
    document.querySelectorAll('.graph-node.layer-ast').forEach((n) => (n.style.opacity = '0.15'));
    document.querySelectorAll('.graph-node.layer-memory, .graph-node.layer-invariant').forEach((n) => (n.style.opacity = '1'));
  } else {
    document.querySelectorAll('.graph-node').forEach((n) => (n.style.opacity = '1'));
  }
}

// =============================================================================
// 6. CONTEXT COMPACTOR SIMULATOR SCENARIOS
// =============================================================================
const SCENARIOS = {
  auth: {
    rawTokens: '48,200 TOKENS',
    compactTokens: '1,180 TOKENS',
    ratio: '97.5%',
    latency: '< 1.2ms',
    rawCode: `// RAW AGENT DUMP (8 FULL FILES DUMPED INTO CONTEXT)
// 1. src/auth/token.service.ts (840 lines)
// 2. src/auth/auth.controller.ts (620 lines)
// 3. src/auth/strategies/jwt.strategy.ts (380 lines)
// 4. src/user/user.entity.ts (450 lines)
// 5. src/user/user.repository.ts (510 lines)
// 6. src/redis/redis.provider.ts (310 lines)
// 7. src/config/auth.config.ts (220 lines)
// 8. test/auth/auth.e2e.spec.ts (950 lines)

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.provider';
... [4,200 lines truncated across 8 files] ...`,
    compactCode: `### CORTEX SUB-2.5K COMPACTED SLICE // TARGET: TokenService

### 1. REPOSITORY INVARIANTS & GOTCHAS
- [INVARIANT] TokenService: Redis cache required for token revocation (TTL 15m).
- [GOTCHA] TextInput: Always use custom wrapper at lib/components/text_input.dart.
- [RULE] sceneType "ip" enables event branding poster display.

### 2. 2-HOP CODEBASE BLUEPRINTS (Signatures Only)
export interface TokenService {
  revokeToken(userId: string, jti: string): Promise<boolean>;
  validateSession(token: string): Promise<SessionPayload>;
  refreshTokens(refreshToken: string): Promise<TokenPair>;
}

export interface AuthController {
  postLogout(req: Request): Promise<{ success: boolean }>;
}

### 3. ACTIVE BLAST RADIUS
- Downstream Callers: AuthController.postLogout -> TokenService.revokeToken
- Upstream Dependencies: RedisProvider.setex -> TokenService`
  },

  payment: {
    rawTokens: '39,400 TOKENS',
    compactTokens: '920 TOKENS',
    ratio: '97.6%',
    latency: '< 0.9ms',
    rawCode: `// RAW AGENT DUMP (6 FULL PAYMENT & STRIPE FILES)
// 1. src/billing/stripe.webhook.ts (740 lines)
// 2. src/billing/subscription.service.ts (1,120 lines)
// 3. src/billing/invoice.generator.ts (650 lines)
// 4. src/models/customer.model.ts (410 lines)
// 5. src/integrations/tax.service.ts (530 lines)
// 6. test/billing/webhook.spec.ts (890 lines)

... [3,400 lines of boilerplate, internal loops & legacy handlers] ...`,
    compactCode: `### CORTEX SUB-2.5K COMPACTED SLICE // TARGET: StripeWebhook

### 1. REPOSITORY INVARIANTS & GOTCHAS
- [INVARIANT] Stripe Webhooks must verify signature with STRIPE_WEBHOOK_SECRET before body parsing.
- [IDEMPOTENCY] Record event_id to PostgreSQL idempotency table before initiating invoice dispatch.

### 2. 2-HOP CODEBASE BLUEPRINTS
export interface StripeWebhookHandler {
  handleInvoicePaid(event: Stripe.Event): Promise<InvoiceResult>;
  handleSubscriptionCanceled(event: Stripe.Event): Promise<void>;
}

### 3. ACTIVE BLAST RADIUS
- Downstream: SubscriptionService.markActive -> StripeWebhookHandler
- Security Gate: verifyStripeSignature(rawBody, sig)`
  },

  database: {
    rawTokens: '52,100 TOKENS',
    compactTokens: '1,420 TOKENS',
    ratio: '97.3%',
    latency: '< 1.4ms',
    rawCode: `// RAW AGENT DUMP (9 DATABASE & MIGRATION FILES)
// 1. src/database/migrations/20260920_user_sessions.ts (380 lines)
// 2. src/database/schema.prisma (1,400 lines)
// 3. src/database/connection.pool.ts (290 lines)
// 4. src/models/session.entity.ts (440 lines)
... [5,100 lines of migration dumps & type definitions] ...`,
    compactCode: `### CORTEX SUB-2.5K COMPACTED SLICE // TARGET: SessionSchema

### 1. REPOSITORY INVARIANTS & GOTCHAS
- [INVARIANT] Never run schema migrations without transactional locks (pg_advisory_lock).
- [GOTCHA] Foreign key onDelete must cascade only to soft-deletable child tables.

### 2. 2-HOP CODEBASE BLUEPRINTS
export interface SessionEntity {
  id: string;
  userId: string;
  expiresAt: Date;
  metadata: Record<string, unknown>;
}

### 3. ACTIVE BLAST RADIUS
- Migrations: 20260920_user_sessions -> SessionEntity`
  }
};

function switchScenario(scenarioKey, btn) {
  document.querySelectorAll('.scenario-pill').forEach((p) => p.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const scenario = SCENARIOS[scenarioKey];
  if (!scenario) return;

  const rawTokens = document.getElementById('raw-tokens');
  const compactTokens = document.getElementById('compact-tokens');
  const rawCodeBox = document.getElementById('raw-code-box');
  const compactCodeBox = document.getElementById('compact-code-box');
  const metricRatio = document.getElementById('metric-ratio');
  const metricLatency = document.getElementById('metric-latency');

  if (rawTokens) rawTokens.textContent = scenario.rawTokens;
  if (compactTokens) compactTokens.textContent = scenario.compactTokens;
  if (rawCodeBox) rawCodeBox.textContent = scenario.rawCode;
  if (compactCodeBox) compactCodeBox.textContent = scenario.compactCode;
  if (metricRatio) metricRatio.textContent = scenario.ratio;
  if (metricLatency) metricLatency.textContent = scenario.latency;
}

// =============================================================================
// 7. CLIPBOARD HELPER
// =============================================================================
function copyCliCommand() {
  const text = document.getElementById('cli-command-text')?.innerText || 'npx cortex-graph init';
  navigator.clipboard.writeText(text).then(() => {
    const label = document.getElementById('cli-copy-label');
    if (label) {
      label.textContent = 'COPIED!';
      label.style.background = 'var(--palette-emerald-50)';
      label.style.color = 'var(--palette-emerald-600)';
      setTimeout(() => {
        label.textContent = 'COPY';
        label.style.background = '#ffffff';
        label.style.color = 'var(--palette-grey-800)';
      }, 2000);
    }
  });
}

// =============================================================================
// 8. INITIALIZATION
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
  initCursorGlow();
  initParticles('morphing-particles-canvas', false);
  initParticles('liftoff-particles-canvas', true);
  initGraphViewer();
  initTiltCards();
  switchScenario('auth', document.querySelector('.scenario-pill'));
});
