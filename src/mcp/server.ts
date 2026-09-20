import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { EventLedger } from '../graph/ledger.js';
import { ContextCompactor } from '../graph/compactor.js';
import { CodebaseScanner } from '../ast/scanner.js';

export function startMcpServer() {
  const ledger = new EventLedger();
  let engine = ledger.loadGraph();
  const compactor = new ContextCompactor(engine);

  const server = new Server(
    {
      name: 'cortex-memory',
      version: '0.1.0'
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'cortex_get_context',
          description: 'Fetch compacted architectural blueprint, verified decisions, gotchas, and symbol interfaces for a query or file path (< 2,500 tokens).',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'File path, feature keyword, or topic (e.g., "auth.service.ts", "payment webhook", "design system")'
              },
              maxTokens: {
                type: 'number',
                description: 'Maximum token budget (default: 2500)'
              }
            },
            required: ['query']
          }
        },
        {
          name: 'cortex_record_decision',
          description: 'Record a verified architectural decision or intent in the project memory graph so future agent turns never forget it.',
          inputSchema: {
            type: 'object',
            properties: {
              topic: { type: 'string', description: 'Headline of the decision' },
              decision: { type: 'string', description: 'Detailed rationale and decision explanation' },
              affectedFiles: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of relative file paths related to this decision'
              }
            },
            required: ['topic', 'decision', 'affectedFiles']
          }
        },
        {
          name: 'cortex_record_gotcha',
          description: 'Record a critical bug warning, edge-case gotcha, or constraint to prevent repeating mistakes.',
          inputSchema: {
            type: 'object',
            properties: {
              topic: { type: 'string', description: 'Headline of the warning/gotcha' },
              warning: { type: 'string', description: 'Explanation of the bug, constraint, or failure mode' },
              affectedFiles: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of relative file paths constrained by this gotcha'
              }
            },
            required: ['topic', 'warning', 'affectedFiles']
          }
        },
        {
          name: 'cortex_blast_radius',
          description: 'Calculate upstream and downstream files that could break before modifying a target file.',
          inputSchema: {
            type: 'object',
            properties: {
              filePath: { type: 'string', description: 'Relative path of the file to inspect' }
            },
            required: ['filePath']
          }
        },
        {
          name: 'cortex_sync',
          description: 'Re-scan codebase AST to update file modules, exports, and imports in the graph.',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        }
      ]
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === 'cortex_get_context') {
      const query = String(args?.query || '');
      const maxTokens = Number(args?.maxTokens || 2500);
      const slice = compactor.compact(query, { maxTokenBudget: maxTokens });

      return {
        content: [
          {
            type: 'text',
            text: slice.rawMarkdown
          }
        ]
      };
    }

    if (name === 'cortex_record_decision') {
      const topic = String(args?.topic || '');
      const decision = String(args?.decision || '');
      const affectedFiles = Array.isArray(args?.affectedFiles) ? (args.affectedFiles as string[]) : [];

      const node = engine.recordDecision(topic, decision, affectedFiles);
      ledger.recordEvent({
        author: 'mcp_agent',
        action: 'RECORD_DECISION',
        payload: { topic, decision, affectedFiles, nodeId: node.id }
      });
      ledger.saveGraph(engine);

      return {
        content: [
          {
            type: 'text',
            text: `Recorded decision "${topic}" attached to ${affectedFiles.length} files in Cortex knowledge graph.`
          }
        ]
      };
    }

    if (name === 'cortex_record_gotcha') {
      const topic = String(args?.topic || '');
      const warning = String(args?.warning || '');
      const affectedFiles = Array.isArray(args?.affectedFiles) ? (args.affectedFiles as string[]) : [];

      const node = engine.recordGotcha(topic, warning, affectedFiles);
      ledger.recordEvent({
        author: 'mcp_agent',
        action: 'ADD_NODE',
        payload: { topic, warning, affectedFiles, nodeId: node.id }
      });
      ledger.saveGraph(engine);

      return {
        content: [
          {
            type: 'text',
            text: `Recorded gotcha "${topic}" in Cortex knowledge graph.`
          }
        ]
      };
    }

    if (name === 'cortex_blast_radius') {
      const filePath = String(args?.filePath || '');
      const blast = engine.calculateBlastRadius(filePath);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(blast, null, 2)
          }
        ]
      };
    }

    if (name === 'cortex_sync') {
      const scanner = new CodebaseScanner();
      const result = await scanner.scan();
      for (const node of result.nodes) engine.addNode(node);
      for (const edge of result.edges) engine.addEdge(edge.from, edge.to, edge.relation, edge.weight);
      ledger.saveGraph(engine);

      return {
        content: [
          {
            type: 'text',
            text: `Cortex sync complete: ${result.nodes.length} files and ${result.edges.length} relationships updated.`
          }
        ]
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  });

  const transport = new StdioServerTransport();
  server.connect(transport);
}

if (import.meta.url.endsWith(process.argv[1])) {
  startMcpServer();
}
