import { GraphEdge, GraphNode, ProjectGraphData, RelationType } from '../types.js';

export class KnowledgeGraphEngine {
  private nodes = new Map<string, GraphNode>();
  private edges: GraphEdge[] = [];
  private data: ProjectGraphData;

  constructor(initialData?: ProjectGraphData) {
    this.data = initialData || {
      version: '1.0.0',
      projectName: 'project',
      rootPath: process.cwd(),
      updatedAt: new Date().toISOString(),
      blueprint: {
        framework: 'Generic',
        pattern: 'Modular',
        designSystem: {},
        invariants: []
      },
      nodes: [],
      edges: []
    };

    if (initialData) {
      for (const node of initialData.nodes) {
        this.nodes.set(node.id, node);
      }
      this.edges = [...initialData.edges];
    }
  }

  public addNode(node: GraphNode): void {
    this.nodes.set(node.id, node);
    this.data.updatedAt = new Date().toISOString();
  }

  public getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  public getAllNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  public addEdge(from: string, to: string, relation: RelationType, weight: number = 1.0): void {
    const existing = this.edges.find(e => e.from === from && e.to === to && e.relation === relation);
    if (!existing) {
      this.edges.push({ from, to, relation, weight });
      this.data.updatedAt = new Date().toISOString();
    }
  }

  public getAllEdges(): GraphEdge[] {
    return [...this.edges];
  }

  public getBlueprint() {
    return this.data.blueprint;
  }

  public recordDecision(topic: string, decision: string, affectedFiles: string[], author: string = 'agent'): GraphNode {
    const id = `decision:${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const node: GraphNode = {
      id,
      type: 'decision',
      label: topic,
      summary: decision,
      status: 'verified',
      weight: 1.0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: { author, affectedFiles }
    };

    this.addNode(node);

    for (const filePath of affectedFiles) {
      const fileId = filePath.startsWith('file:') ? filePath : `file:${filePath}`;
      this.addEdge(id, fileId, 'affects', 1.0);
    }

    return node;
  }

  public recordGotcha(topic: string, warning: string, affectedFiles: string[]): GraphNode {
    const id = `gotcha:${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const node: GraphNode = {
      id,
      type: 'gotcha',
      label: topic,
      summary: warning,
      status: 'verified',
      weight: 1.2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: { affectedFiles }
    };

    this.addNode(node);

    for (const filePath of affectedFiles) {
      const fileId = filePath.startsWith('file:') ? filePath : `file:${filePath}`;
      this.addEdge(id, fileId, 'constrains', 1.0);
    }

    return node;
  }

  public querySubgraph(queryOrFile: string, depth: number = 2): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const matchedRootIds = this.findMatchingNodes(queryOrFile);
    if (matchedRootIds.length === 0) {
      return { nodes: [], edges: [] };
    }

    const visited = new Set<string>();
    const queue: [string, number][] = matchedRootIds.map(id => [id, 0]);
    for (const id of matchedRootIds) visited.add(id);

    while (queue.length > 0) {
      const [currId, currDepth] = queue.shift()!;
      if (currDepth >= depth) continue;

      const neighborEdges = this.edges.filter(e => e.from === currId || e.to === currId);
      for (const edge of neighborEdges) {
        const neighborId = edge.from === currId ? edge.to : edge.from;
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push([neighborId, currDepth + 1]);
        }
      }
    }

    const resultNodes = Array.from(visited)
      .map(id => this.nodes.get(id)!)
      .filter(Boolean);

    const resultEdges = this.edges.filter(e => visited.has(e.from) && visited.has(e.to));

    return { nodes: resultNodes, edges: resultEdges };
  }

  public calculateBlastRadius(filePath: string): { affectedFiles: string[]; totalDirect: number; totalIndirect: number } {
    const fileId = filePath.startsWith('file:') ? filePath : `file:${filePath}`;
    const direct = new Set<string>();
    const indirect = new Set<string>();

    for (const edge of this.edges) {
      if (edge.to === fileId && edge.relation === 'imports') {
        direct.add(edge.from);
      }
    }

    for (const directId of direct) {
      for (const edge of this.edges) {
        if (edge.to === directId && edge.relation === 'imports' && !direct.has(edge.from) && edge.from !== fileId) {
          indirect.add(edge.from);
        }
      }
    }

    return {
      affectedFiles: Array.from(new Set([...direct, ...indirect])),
      totalDirect: direct.size,
      totalIndirect: indirect.size
    };
  }

  private findMatchingNodes(query: string): string[] {
    const q = query.toLowerCase();
    const matches: string[] = [];

    for (const [id, node] of this.nodes.entries()) {
      if (
        id.toLowerCase().includes(q) ||
        node.label.toLowerCase().includes(q) ||
        node.summary.toLowerCase().includes(q) ||
        (node.path && node.path.toLowerCase().includes(q))
      ) {
        matches.push(id);
      }
    }
    return matches;
  }

  public exportData(): ProjectGraphData {
    return {
      ...this.data,
      nodes: Array.from(this.nodes.values()),
      edges: [...this.edges],
      updatedAt: new Date().toISOString()
    };
  }
}
