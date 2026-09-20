import { ArchitecturalBlueprint, GraphEdge, GraphNode } from '../types.js';
export interface ScanResult {
    blueprint: ArchitecturalBlueprint;
    nodes: GraphNode[];
    edges: GraphEdge[];
}
export declare class CodebaseScanner {
    private rootDir;
    private ignoreDirs;
    constructor(rootDir?: string);
    scan(): Promise<ScanResult>;
    private collectFiles;
    private parseFile;
    private resolveImportPath;
    private detectBlueprint;
}
