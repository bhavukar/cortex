import { DeltaEvent } from '../types.js';
import { KnowledgeGraphEngine } from './engine.js';
export declare class EventLedger {
    private cortexDir;
    private ledgerDir;
    private graphFile;
    constructor(rootDir?: string);
    private ensureDirs;
    recordEvent(event: Omit<DeltaEvent, 'id' | 'timestamp'>): DeltaEvent;
    loadGraph(): KnowledgeGraphEngine;
    saveGraph(engine: KnowledgeGraphEngine): void;
    hasGraph(): boolean;
}
