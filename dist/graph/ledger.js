import * as fs from 'fs';
import * as path from 'path';
import { KnowledgeGraphEngine } from './engine.js';
export class EventLedger {
    cortexDir;
    ledgerDir;
    graphFile;
    constructor(rootDir = process.cwd()) {
        this.cortexDir = path.join(rootDir, '.cortex');
        this.ledgerDir = path.join(this.cortexDir, 'ledger');
        this.graphFile = path.join(this.cortexDir, 'graph.json');
        this.ensureDirs();
    }
    ensureDirs() {
        if (!fs.existsSync(this.cortexDir))
            fs.mkdirSync(this.cortexDir, { recursive: true });
        if (!fs.existsSync(this.ledgerDir))
            fs.mkdirSync(this.ledgerDir, { recursive: true });
    }
    recordEvent(event) {
        const fullEvent = {
            id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            timestamp: new Date().toISOString(),
            ...event
        };
        const dateStr = new Date().toISOString().slice(0, 10);
        const logFile = path.join(this.ledgerDir, `${dateStr}.jsonl`);
        fs.appendFileSync(logFile, JSON.stringify(fullEvent) + '\n', 'utf-8');
        return fullEvent;
    }
    loadGraph() {
        if (fs.existsSync(this.graphFile)) {
            try {
                const raw = fs.readFileSync(this.graphFile, 'utf-8');
                const parsed = JSON.parse(raw);
                return new KnowledgeGraphEngine(parsed);
            }
            catch {
                // Fallback to empty
            }
        }
        return new KnowledgeGraphEngine();
    }
    saveGraph(engine) {
        const data = engine.exportData();
        fs.writeFileSync(this.graphFile, JSON.stringify(data, null, 2), 'utf-8');
        // Also write snapshot to project root for easy git commit
        const rootSnapshot = path.join(path.dirname(this.cortexDir), '.project-cortex.json');
        fs.writeFileSync(rootSnapshot, JSON.stringify(data, null, 2), 'utf-8');
    }
    hasGraph() {
        return fs.existsSync(this.graphFile) || fs.existsSync(path.join(path.dirname(this.cortexDir), '.project-cortex.json'));
    }
}
