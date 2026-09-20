// Cortex — Dual-Layer Codebase Knowledge Graph & Episodic Memory Controller

const GRAPH_DATA = {
  nodes: [
    // LAYER 1: CODE AST TOPOLOGY
    {
      id: "file:src/auth/jwt.ts",
      layer: "ast",
      type: "file",
      label: "jwt.ts",
      path: "src/auth/jwt.ts",
      status: "verified",
      x: 15,
      y: 20,
      summary: "Handles token signing, RSA256 public key verification, and JWT claims validation.",
      exports: ["verifyToken", "generateToken", "Claims"]
    },
    {
      id: "file:src/routes/auth.ts",
      layer: "ast",
      type: "file",
      label: "routes/auth.ts",
      path: "src/routes/auth.ts",
      status: "verified",
      x: 48,
      y: 20,
      summary: "Express/Next.js API route handler for login, refresh, and session revocation.",
      exports: ["authRouter", "handleLogin"]
    },
    {
      id: "file:src/db/redis.ts",
      layer: "ast",
      type: "file",
      label: "db/redis.ts",
      path: "src/db/redis.ts",
      status: "verified",
      x: 80,
      y: 20,
      summary: "Redis client wrapper configured for session cache and distributed locks.",
      exports: ["redisClient", "setWithExpiry"]
    },
    {
      id: "file:src/services/billing.ts",
      layer: "ast",
      type: "file",
      label: "services/billing.ts",
      path: "src/services/billing.ts",
      status: "verified",
      x: 15,
      y: 65,
      summary: "Subscription lifecycle, Stripe webhook processing, and usage charge calculations.",
      exports: ["processSubscription", "calculateOverage"]
    },
    {
      id: "file:src/db/postgres.ts",
      layer: "ast",
      type: "file",
      label: "db/postgres.ts",
      path: "src/db/postgres.ts",
      status: "verified",
      x: 48,
      y: 65,
      summary: "Prisma ORM connection pool and database query client.",
      exports: ["db", "runTransaction"]
    },

    // LAYER 2: EPISODIC INTENT MEMORY
    {
      id: "decision:dec_001",
      layer: "memory",
      type: "decision",
      label: "Redis Token Revocation",
      status: "verified",
      x: 80,
      y: 65,
      summary: "Do not store revoked JWTs in Postgres. Use Redis with 24h TTL to avoid database lock contention on auth checks.",
      author: "agent_claude_sonnet"
    },
    {
      id: "gotcha:gotcha_002",
      layer: "memory",
      type: "gotcha",
      label: "Batch DB Inserts",
      status: "verified",
      x: 32,
      y: 42,
      summary: "Never call db.query inside a Promise.all map loop in billing.ts; use bulkInsert helper instead.",
      author: "agent_cursor"
    }
  ],
  edges: [
    { from: "file:src/auth/jwt.ts", to: "file:src/routes/auth.ts", relation: "imported_by" },
    { from: "file:src/routes/auth.ts", to: "file:src/db/redis.ts", relation: "queries" },
    { from: "decision:dec_001", to: "file:src/auth/jwt.ts", relation: "affects" },
    { from: "decision:dec_001", to: "file:src/db/redis.ts", relation: "utilizes" },
    { from: "gotcha:gotcha_002", to: "file:src/services/billing.ts", relation: "constrains" },
    { from: "gotcha:gotcha_002", to: "file:src/db/postgres.ts", relation: "protects" },
    { from: "file:src/services/billing.ts", to: "file:src/db/postgres.ts", relation: "queries" }
  ]
};

const COMPACTOR_SCENARIOS = {
  auth: {
    unoptimizedTokens: "48,200",
    optimizedTokens: "1,240",
    reduction: "97% REDUCTION",
    unoptimizedText: `// 12 full files loaded into context...
// src/auth/jwt.ts (820 lines)
// src/routes/auth.ts (1,240 lines)
// src/db/postgres.ts (3,400 lines)
// src/db/redis.ts (650 lines)
// ... 43,000 more lines ...
// Token cost: ~$0.15 per turn
// Attention dilution: High (LLM misses earlier decisions)`,
    optimizedText: `## CORTEX PROJECT CONTEXT SLICE [Query: "auth & token revocation"]
- Framework: Next.js App Router + Prisma + Redis

### Core Architectural Invariants
- All form inputs must use custom TextInput component.
- JWT verification occurs in middleware before controller dispatch.

### Verified Decisions & Gotchas
- [DECISION] Redis 24h TTL for token revocation to avoid Postgres locks.
- [WARNING] Never decode token without signature verification check.

### Module Interfaces
- jwt.ts: verifyToken(token: string): Promise<Claims>
- redis.ts: setWithExpiry(key: string, val: string, ttl: number): Promise<void>`
  },
  billing: {
    unoptimizedTokens: "52,600",
    optimizedTokens: "1,180",
    reduction: "98% REDUCTION",
    unoptimizedText: `// 15 full files loaded into context...
// src/services/billing.ts (2,100 lines)
// src/db/postgres.ts (3,400 lines)
// prisma/schema.prisma (1,800 lines)
// src/webhooks/stripe.ts (950 lines)
// ... 44,000 more lines ...
// Token cost: ~$0.16 per turn
// Attention dilution: High`,
    optimizedText: `## CORTEX PROJECT CONTEXT SLICE [Query: "billing & database batching"]
- Framework: Next.js + Stripe SDK + PostgreSQL

### Core Architectural Invariants
- Always use bulkInsert helper for usage record ingests.
- Stripe webhook signature verification must check raw request buffer.

### Verified Decisions & Gotchas
- [WARNING] Never map over arrays with db.insert without batchChunk helper.
- [DECISION] Billing overages calculated on 1st of every month via cron worker.

### Module Interfaces
- billing.ts: processSubscription(subId: string): Promise<Invoice>`
  },
  event: {
    unoptimizedTokens: "41,500",
    optimizedTokens: "980",
    reduction: "97% REDUCTION",
    unoptimizedText: `// 10 full files loaded into context...
// lib/models/event_ip_response.dart (450 lines)
// lib/screens/event_details_page.dart (1,600 lines)
// lib/blocs/event_bloc.dart (890 lines)
// ... 38,000 more lines ...
// Token cost: ~$0.13 per turn`,
    optimizedText: `## CORTEX PROJECT CONTEXT SLICE [Query: "event IP branding"]
- Framework: Flutter / Dart (Clean Architecture)

### Core Architectural Invariants
- Custom TextInput component located at lib/components/text_input.dart must be used.

### Verified Decisions & Gotchas
- [DECISION] EventIpResponse class contains 'sceneType' field ('ip' | 'venue'). Logic for displaying event IP branding (poster/logo) vs Event Title strictly depends on sceneType == 'ip'.

### Module Interfaces
- event_ip_response.dart: class EventIpResponse { String sceneType; String? posterUrl; }`
  }
};

let activeNodeId = "decision:dec_001";

document.addEventListener('DOMContentLoaded', () => {
  renderGraph();
  setupCompactorScenarios();
  setupIntegrationTabs();
});

// Render Dual-Layer Knowledge Graph
function renderGraph() {
  const container = document.getElementById('graph-nodes-layer');
  if (!container) return;
  container.innerHTML = '';

  GRAPH_DATA.nodes.forEach(node => {
    const el = document.createElement('div');
    el.className = `g-node layer-${node.layer} ${node.id === activeNodeId ? 'active' : ''}`;
    el.style.left = `${node.x}%`;
    el.style.top = `${node.y}%`;
    el.dataset.id = node.id;

    const layerTag = node.layer === 'ast' ? 'AST // CODE' : 'EPISODIC // MEMORY';
    el.innerHTML = `
      <span class="gn-type">${layerTag}</span>
      <div class="gn-title">${node.label}</div>
      <div class="gn-meta">${node.type.toUpperCase()}</div>
    `;

    el.addEventListener('click', () => {
      activeNodeId = node.id;
      document.querySelectorAll('.g-node').forEach(n => n.classList.remove('active'));
      el.classList.add('active');
      updateInspector(node);
      drawConnectors();
    });

    container.appendChild(el);
  });

  setTimeout(() => drawConnectors(), 50);
}

function drawConnectors() {
  const svg = document.getElementById('graph-svg-layer');
  if (!svg) return;
  svg.innerHTML = '';
  const width = svg.clientWidth || 700;
  const height = svg.clientHeight || 480;

  const nodeMap = new Map(GRAPH_DATA.nodes.map(n => [n.id, n]));

  GRAPH_DATA.edges.forEach(edge => {
    const fromNode = nodeMap.get(edge.from);
    const toNode = nodeMap.get(edge.to);

    if (fromNode && toNode) {
      const x1 = (fromNode.x / 100) * width + 95;
      const y1 = (fromNode.y / 100) * height + 30;
      const x2 = (toNode.x / 100) * width + 95;
      const y2 = (toNode.y / 100) * height + 30;

      const isConnectedToActive = fromNode.id === activeNodeId || toNode.id === activeNodeId;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const cx1 = x1 + (x2 - x1) * 0.5;
      const cy1 = y1;
      const cx2 = x1 + (x2 - x1) * 0.5;
      const cy2 = y2;

      path.setAttribute('d', `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`);
      path.setAttribute('stroke', isConnectedToActive ? '#181816' : '#e6e5dd');
      path.setAttribute('stroke-width', isConnectedToActive ? '2.5' : '1.5');
      path.setAttribute('fill', 'none');
      if (!isConnectedToActive) {
        path.setAttribute('stroke-dasharray', '3 3');
      }

      svg.appendChild(path);
    }
  });
}

function updateInspector(node) {
  if (!node) return;
  document.getElementById('node-tag').textContent = `LAYER ${node.layer === 'ast' ? '1 // CODE AST' : '2 // EPISODIC MEMORY'}`;
  document.getElementById('node-label').textContent = node.label;
  document.getElementById('node-id').textContent = node.id;
  document.getElementById('node-summary').textContent = node.summary;

  const chipsContainer = document.getElementById('node-chips');
  chipsContainer.innerHTML = '';

  const relatedEdges = GRAPH_DATA.edges.filter(e => e.from === node.id || e.to === node.id);
  if (relatedEdges.length === 0) {
    chipsContainer.innerHTML = '<span class="chip">No immediate edge connections</span>';
  } else {
    relatedEdges.forEach(e => {
      const target = e.from === node.id ? e.to : e.from;
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = `${e.relation} -> ${target.replace('file:', '')}`;
      chipsContainer.appendChild(chip);
    });
  }
}

// Compactor Scenario Switcher
function setupCompactorScenarios() {
  const pills = document.querySelectorAll('.sc-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const scKey = pill.dataset.scenario;
      const data = COMPACTOR_SCENARIOS[scKey] || COMPACTOR_SCENARIOS.auth;

      document.getElementById('tok-unopt').textContent = data.unoptimizedTokens;
      document.getElementById('tok-opt').textContent = data.optimizedTokens;
      document.querySelector('.token-meter.green .tok-lbl').textContent = `TOKENS (${data.reduction})`;

      document.getElementById('unopt-code-view').querySelector('code').textContent = data.unoptimizedText;
      document.getElementById('compact-slice-code').textContent = data.optimizedText;
    });
  });
}

// Integration Tabs
function setupIntegrationTabs() {
  const tabs = document.querySelectorAll('.m-tab');
  const title = document.getElementById('term-title');
  const body = document.getElementById('term-body');

  const configs = {
    claude: {
      title: 'claude_desktop_config.json',
      code: `{
  "mcpServers": {
    "cortex-memory": {
      "command": "npx",
      "args": ["-y", "cortex-memory", "mcp"]
    }
  }
}`
    },
    cursor: {
      title: '.cursor/mcp.json',
      code: `{
  "mcpServers": {
    "cortex-memory": {
      "command": "npx",
      "args": ["-y", "cortex-memory", "mcp"]
    }
  }
}`
    },
    cline: {
      title: 'cline_mcp_settings.json',
      code: `{
  "mcpServers": {
    "cortex-memory": {
      "command": "npx",
      "args": ["-y", "cortex-memory", "mcp"],
      "disabled": false,
      "autoApprove": ["cortex_get_context", "cortex_record_decision"]
    }
  }
}`
    },
    sdk: {
      title: 'Node.js SDK',
      code: `import { KnowledgeGraphEngine, ContextCompactor } from 'cortex-memory';

const engine = new KnowledgeGraphEngine();
const compactor = new ContextCompactor(engine);

// Extract sub-2.5k token compacted context slice
const slice = compactor.compact('refactor payment webhooks');
console.log(slice.rawMarkdown);`
    }
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const cfg = configs[tab.dataset.tab] || configs.claude;
      title.textContent = cfg.title;
      body.textContent = cfg.code;
    });
  });
}

window.copyCli = function() {
  navigator.clipboard.writeText('npx cortex-memory init').then(() => {
    alert('Copied "npx cortex-memory init" to clipboard.');
  });
};

window.copySnippet = function() {
  const code = document.getElementById('term-body').textContent;
  navigator.clipboard.writeText(code).then(() => {
    alert('Configuration snippet copied to clipboard.');
  });
};

window.addEventListener('resize', () => {
  drawConnectors();
});
