import { ContextSlice } from '../types.js';
import { KnowledgeGraphEngine } from './engine.js';
export interface CompactionOptions {
    maxTokenBudget?: number;
    includeBlueprint?: boolean;
}
export declare class ContextCompactor {
    private engine;
    constructor(engine: KnowledgeGraphEngine);
    compact(queryOrTopic: string, options?: CompactionOptions): ContextSlice;
}
