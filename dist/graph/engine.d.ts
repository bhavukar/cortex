import { GraphEdge, GraphNode, ProjectGraphData, RelationType } from '../types.js';
export declare class KnowledgeGraphEngine {
    private nodes;
    private edges;
    private data;
    constructor(initialData?: ProjectGraphData);
    addNode(node: GraphNode): void;
    getNode(id: string): GraphNode | undefined;
    getAllNodes(): GraphNode[];
    addEdge(from: string, to: string, relation: RelationType, weight?: number): void;
    getAllEdges(): GraphEdge[];
    getBlueprint(): import("../types.js").ArchitecturalBlueprint;
    recordDecision(topic: string, decision: string, affectedFiles: string[], author?: string): GraphNode;
    recordGotcha(topic: string, warning: string, affectedFiles: string[]): GraphNode;
    querySubgraph(queryOrFile: string, depth?: number): {
        nodes: GraphNode[];
        edges: GraphEdge[];
    };
    calculateBlastRadius(filePath: string): {
        affectedFiles: string[];
        totalDirect: number;
        totalIndirect: number;
    };
    private findMatchingNodes;
    exportData(): ProjectGraphData;
}
