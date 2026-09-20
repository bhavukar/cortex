import { ContextSlice } from '../types.js';
import { KnowledgeGraphEngine } from './engine.js';

export interface CompactionOptions {
  maxTokenBudget?: number;
  includeBlueprint?: boolean;
}

export class ContextCompactor {
  private engine: KnowledgeGraphEngine;

  constructor(engine: KnowledgeGraphEngine) {
    this.engine = engine;
  }

  public compact(queryOrTopic: string, options: CompactionOptions = {}): ContextSlice {
    const maxBudget = options.maxTokenBudget || 2500;
    const blueprint = this.engine.getBlueprint();
    const { nodes } = this.engine.querySubgraph(queryOrTopic, 2);

    const verifiedDecisions: ContextSlice['verifiedDecisions'] = [];
    const gotchas: ContextSlice['gotchas'] = [];
    const targetSymbols: ContextSlice['targetSymbols'] = [];
    const connectedFiles: string[] = [];

    // Prioritize nodes
    for (const node of nodes) {
      if (node.type === 'decision' && node.status === 'verified') {
        verifiedDecisions.push({ id: node.id, label: node.label, summary: node.summary });
      } else if (node.type === 'gotcha') {
        gotchas.push({ id: node.id, label: node.label, summary: node.summary });
      } else if (node.type === 'file') {
        if (node.path) connectedFiles.push(node.path);
        targetSymbols.push({
          id: node.id,
          label: node.label,
          summary: node.summary,
          exports: node.exports
        });
      }
    }

    // Build compact Markdown slice
    const lines: string[] = [];
    lines.push(`## CORTEX PROJECT CONTEXT SLICE [Query: "${queryOrTopic}"]`);
    lines.push(`- Framework: ${blueprint.framework} (${blueprint.pattern})`);
    
    if (blueprint.invariants.length > 0) {
      lines.push('### Core Architectural Invariants');
      for (const inv of blueprint.invariants.slice(0, 4)) {
        lines.push(`- ${inv}`);
      }
    }

    if (gotchas.length > 0) {
      lines.push('### Active Gotchas & Critical Constraints');
      for (const g of gotchas.slice(0, 5)) {
        lines.push(`- [WARNING: ${g.label}] ${g.summary}`);
      }
    }

    if (verifiedDecisions.length > 0) {
      lines.push('### Verified Historical Decisions');
      for (const d of verifiedDecisions.slice(0, 5)) {
        lines.push(`- [DECISION: ${d.label}] ${d.summary}`);
      }
    }

    if (targetSymbols.length > 0) {
      lines.push('### Relevant Module Interfaces');
      for (const s of targetSymbols.slice(0, 8)) {
        const exportsStr = s.exports && s.exports.length > 0 ? ` (Exports: ${s.exports.join(', ')})` : '';
        lines.push(`- \`${s.label}\`: ${s.summary}${exportsStr}`);
      }
    }

    const rawMarkdown = lines.join('\n');
    // Approximate token count: words * 1.33
    const estimatedTokens = Math.round(rawMarkdown.split(/\s+/).length * 1.35);

    return {
      totalEstimatedTokens: Math.min(estimatedTokens, maxBudget),
      blueprint: blueprint.invariants,
      verifiedDecisions,
      gotchas,
      targetSymbols,
      connectedFiles,
      rawMarkdown
    };
  }
}
