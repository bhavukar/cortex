export class KnowledgeGraphEngine {
    nodes = new Map();
    edges = [];
    data;
    constructor(initialData) {
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
    addNode(node) {
        this.nodes.set(node.id, node);
        this.data.updatedAt = new Date().toISOString();
    }
    getNode(id) {
        return this.nodes.get(id);
    }
    getAllNodes() {
        return Array.from(this.nodes.values());
    }
    addEdge(from, to, relation, weight = 1.0) {
        const existing = this.edges.find(e => e.from === from && e.to === to && e.relation === relation);
        if (!existing) {
            this.edges.push({ from, to, relation, weight });
            this.data.updatedAt = new Date().toISOString();
        }
    }
    getAllEdges() {
        return [...this.edges];
    }
    getBlueprint() {
        return this.data.blueprint;
    }
    recordDecision(topic, decision, affectedFiles, author = 'agent') {
        const id = `decision:${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const node = {
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
    recordGotcha(topic, warning, affectedFiles) {
        const id = `gotcha:${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const node = {
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
    querySubgraph(queryOrFile, depth = 2) {
        const matchedRootIds = this.findMatchingNodes(queryOrFile);
        if (matchedRootIds.length === 0) {
            return { nodes: [], edges: [] };
        }
        const visited = new Set();
        const queue = matchedRootIds.map(id => [id, 0]);
        for (const id of matchedRootIds)
            visited.add(id);
        while (queue.length > 0) {
            const [currId, currDepth] = queue.shift();
            if (currDepth >= depth)
                continue;
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
            .map(id => this.nodes.get(id))
            .filter(Boolean);
        const resultEdges = this.edges.filter(e => visited.has(e.from) && visited.has(e.to));
        return { nodes: resultNodes, edges: resultEdges };
    }
    calculateBlastRadius(filePath) {
        const fileId = filePath.startsWith('file:') ? filePath : `file:${filePath}`;
        const direct = new Set();
        const indirect = new Set();
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
    findMatchingNodes(query) {
        const q = query.toLowerCase();
        const matches = [];
        for (const [id, node] of this.nodes.entries()) {
            if (id.toLowerCase().includes(q) ||
                node.label.toLowerCase().includes(q) ||
                node.summary.toLowerCase().includes(q) ||
                (node.path && node.path.toLowerCase().includes(q))) {
                matches.push(id);
            }
        }
        return matches;
    }
    exportData() {
        return {
            ...this.data,
            nodes: Array.from(this.nodes.values()),
            edges: [...this.edges],
            updatedAt: new Date().toISOString()
        };
    }
}
