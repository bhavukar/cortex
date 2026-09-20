import * as path from 'path';
import * as http from 'http';
import * as fs from 'fs';
import { CodebaseScanner } from './ast/scanner.js';
import { KnowledgeGraphEngine } from './graph/engine.js';
import { ContextCompactor } from './graph/compactor.js';
import { EventLedger } from './graph/ledger.js';
import { startMcpServer } from './mcp/server.js';
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'help';
    const ledger = new EventLedger();
    if (command === 'init') {
        console.log('[Cortex] Scanning repository AST and architecture...');
        const scanner = new CodebaseScanner();
        const result = await scanner.scan();
        const engine = new KnowledgeGraphEngine({
            version: '1.0.0',
            projectName: path.basename(process.cwd()),
            rootPath: process.cwd(),
            updatedAt: new Date().toISOString(),
            blueprint: result.blueprint,
            nodes: result.nodes,
            edges: result.edges
        });
        ledger.saveGraph(engine);
        ledger.recordEvent({
            author: 'cli_init',
            action: 'ADD_NODE',
            payload: { nodeCount: result.nodes.length, edgeCount: result.edges.length }
        });
        console.log(`[Cortex] Initialization complete!`);
        console.log(`- Indexed Files: ${result.nodes.length}`);
        console.log(`- Relationships: ${result.edges.length}`);
        console.log(`- Framework: ${result.blueprint.framework} (${result.blueprint.pattern})`);
        console.log(`- Graph Saved: .project-cortex.json`);
        return;
    }
    if (command === 'sync') {
        console.log('[Cortex] Synchronizing graph with latest code changes...');
        const engine = ledger.loadGraph();
        const scanner = new CodebaseScanner();
        const result = await scanner.scan();
        for (const node of result.nodes)
            engine.addNode(node);
        for (const edge of result.edges)
            engine.addEdge(edge.from, edge.to, edge.relation, edge.weight);
        ledger.saveGraph(engine);
        console.log(`[Cortex] Synced ${result.nodes.length} files successfully.`);
        return;
    }
    if (command === 'context') {
        const query = args[1];
        if (!query) {
            console.error('Usage: cortex context <query_or_file>');
            process.exit(1);
        }
        const engine = ledger.loadGraph();
        const compactor = new ContextCompactor(engine);
        const slice = compactor.compact(query);
        console.log(slice.rawMarkdown);
        console.log(`\n--- Estimated Context Tokens: ~${slice.totalEstimatedTokens} tokens ---`);
        return;
    }
    if (command === 'decision') {
        const topic = args[1];
        const decision = args[2];
        const files = args.slice(3);
        if (!topic || !decision) {
            console.error('Usage: cortex decision "<topic>" "<decision_rationale>" [files...]');
            process.exit(1);
        }
        const engine = ledger.loadGraph();
        const node = engine.recordDecision(topic, decision, files, 'cli_user');
        ledger.recordEvent({
            author: 'cli_user',
            action: 'RECORD_DECISION',
            payload: { topic, decision, files, nodeId: node.id }
        });
        ledger.saveGraph(engine);
        console.log(`[Cortex] Recorded decision: "${topic}" attached to ${files.length} files.`);
        return;
    }
    if (command === 'blast') {
        const file = args[1];
        if (!file) {
            console.error('Usage: cortex blast <file_path>');
            process.exit(1);
        }
        const engine = ledger.loadGraph();
        const blast = engine.calculateBlastRadius(file);
        console.log(`Blast radius for ${file}:`);
        console.log(JSON.stringify(blast, null, 2));
        return;
    }
    if (command === 'mcp') {
        startMcpServer();
        return;
    }
    if (command === 'view') {
        const port = Number(process.env.PORT) || 5005;
        const webDir = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'web');
        const server = http.createServer((req, res) => {
            let reqPath = req.url === '/' ? '/index.html' : req.url;
            const filePath = path.join(webDir, reqPath.split('?')[0]);
            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                const ext = path.extname(filePath);
                const mimeTypes = {
                    '.html': 'text/html',
                    '.css': 'text/css',
                    '.js': 'application/javascript',
                    '.svg': 'image/svg+xml',
                    '.json': 'application/json'
                };
                res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
                fs.createReadStream(filePath).pipe(res);
            }
            else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
            }
        });
        server.listen(port, () => {
            console.log(`[Cortex] Knowledge Graph Studio live at http://localhost:${port}`);
        });
        return;
    }
    console.log(`
Cortex — Dual-Layer Codebase Knowledge Graph & Episodic Memory Engine

Commands:
  cortex init                Scan repo and initialize dual-layer graph (.project-cortex.json)
  cortex sync                Re-scan AST and update graph with latest changes
  cortex context <query>     Extract compacted context slice (< 2,500 tokens)
  cortex decision <t> <d>    Record architectural decision linked to files
  cortex blast <file>        Calculate downstream blast radius before editing
  cortex mcp                 Launch Model Context Protocol stdio server
  cortex view                Launch interactive local visualizer studio
`);
}
main().catch(err => {
    console.error('[Cortex Error]', err);
    process.exit(1);
});
