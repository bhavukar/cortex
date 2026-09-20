import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { KnowledgeGraphEngine } from '../graph/engine.js';
import { ContextCompactor } from '../graph/compactor.js';
import { EventLedger } from '../graph/ledger.js';
import { CodebaseScanner } from '../ast/scanner.js';
import * as fs from 'fs';
import * as path from 'path';

describe('Cortex Knowledge Graph Engine', () => {
  let engine: KnowledgeGraphEngine;

  beforeEach(() => {
    engine = new KnowledgeGraphEngine({
      version: '1.0.0',
      projectName: 'cortex-test',
      rootPath: '/test/repo',
      updatedAt: new Date().toISOString(),
      blueprint: {
        framework: 'Node/TypeScript',
        pattern: 'Modular MCP Server',
        designSystem: {
          rules: ['Zero emojis', 'Sub-2.5k context']
        },
        invariants: ['Strict type safety']
      },
      nodes: [
        {
          id: 'file:src/auth/token.ts',
          type: 'file',
          label: 'src/auth/token.ts',
          summary: 'Handles JWT signing and verification',
          status: 'verified',
          path: 'src/auth/token.ts',
          exports: ['TokenService', 'TokenPayload'],
          imports: ['src/db/redis.ts'],
          weight: 1.0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'file:src/api/auth.controller.ts',
          type: 'file',
          label: 'src/api/auth.controller.ts',
          summary: 'HTTP Controller for auth endpoints',
          status: 'verified',
          path: 'src/api/auth.controller.ts',
          exports: ['AuthController'],
          imports: ['src/auth/token.ts'],
          weight: 1.0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      edges: [
        {
          from: 'file:src/api/auth.controller.ts',
          to: 'file:src/auth/token.ts',
          relation: 'imports',
          weight: 1.0
        }
      ]
    });
  });

  it('calculates blast radius for upstream consumers', () => {
    const blast = engine.calculateBlastRadius('src/auth/token.ts');
    assert.equal(blast.totalDirect, 1);
    assert.ok(blast.affectedFiles.includes('file:src/api/auth.controller.ts'));
  });

  it('records architectural decisions with file links', () => {
    const node = engine.recordDecision(
      'Redis Revocation Strategy',
      'Use atomic Redis DEL with key prefix auth:jti',
      ['src/auth/token.ts'],
      'test_runner'
    );
    assert.ok(node.id.startsWith('decision:'));
    assert.equal(node.type, 'decision');
    assert.equal(node.label, 'Redis Revocation Strategy');

    const allEdges = engine.getAllEdges();
    const link = allEdges.find(e => e.from === node.id && e.to === 'file:src/auth/token.ts');
    assert.ok(link);
    assert.equal(link.relation, 'affects');
  });

  it('queries 2-hop causal subgraphs', () => {
    const subgraph = engine.querySubgraph('token', 2);
    assert.ok(subgraph.nodes.length > 0);
    assert.ok(subgraph.nodes.some(n => n.id === 'file:src/auth/token.ts'));
  });
});

describe('Cortex Context Compactor', () => {
  let engine: KnowledgeGraphEngine;
  let compactor: ContextCompactor;

  beforeEach(() => {
    engine = new KnowledgeGraphEngine({
      version: '1.0.0',
      projectName: 'cortex-test',
      rootPath: '/test/repo',
      updatedAt: new Date().toISOString(),
      blueprint: {
        framework: 'Node/TypeScript',
        pattern: 'Modular Architecture',
        designSystem: {
          rules: ['Strict token limits']
        },
        invariants: ['Sub-2.5k context budget']
      },
      nodes: [
        {
          id: 'file:src/services/payment.ts',
          type: 'file',
          label: 'src/services/payment.ts',
          summary: 'Processes Stripe and PayPal charges',
          status: 'verified',
          path: 'src/services/payment.ts',
          exports: ['PaymentService', 'ChargeRequest'],
          imports: ['src/db/models.ts'],
          weight: 1.0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      edges: []
    });
    compactor = new ContextCompactor(engine);
  });

  it('produces context slices under the 2,500 token limit', () => {
    const slice = compactor.compact('payment');
    assert.ok(slice.totalEstimatedTokens < 2500);
    assert.ok(slice.rawMarkdown.includes('src/services/payment.ts'));
    assert.ok(slice.rawMarkdown.includes('CORTEX PROJECT CONTEXT SLICE'));
  });
});

describe('Cortex Event Ledger', () => {
  it('creates append-only event records without corruption', () => {
    const ledger = new EventLedger();
    const event = ledger.recordEvent({
      author: 'unit_test',
      action: 'RECORD_DECISION',
      payload: { topic: 'Unit Test Event' }
    });

    assert.ok(event.id);
    assert.equal(event.author, 'unit_test');
    assert.equal(event.action, 'RECORD_DECISION');
  });
});

describe('Cortex Codebase Scanner', () => {
  it('scans current workspace files and generates blueprint', async () => {
    const scanner = new CodebaseScanner();
    const result = await scanner.scan();
    assert.ok(result.nodes.length > 0);
    assert.ok(result.blueprint.framework);
    assert.ok(Array.isArray(result.edges));
  });
});
