export type NodeType = 'file' | 'symbol' | 'module' | 'decision' | 'gotcha' | 'invariant';

export type NodeStatus = 'active' | 'tentative' | 'verified' | 'deprecated';

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  summary: string;
  status: NodeStatus;
  path?: string;
  exports?: string[];
  imports?: string[];
  weight: number;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export type RelationType = 
  | 'imports'
  | 'imported_by'
  | 'calls'
  | 'implements'
  | 'affects'
  | 'constrains'
  | 'solves'
  | 'supersedes';

export interface GraphEdge {
  from: string;
  to: string;
  relation: RelationType;
  weight: number;
  metadata?: Record<string, unknown>;
}

export interface ArchitecturalBlueprint {
  framework: string;
  pattern: string;
  designSystem: {
    inputs?: string;
    buttons?: string;
    themeTokens?: string;
    rules?: string[];
  };
  invariants: string[];
}

export interface ProjectGraphData {
  version: string;
  projectName: string;
  rootPath: string;
  updatedAt: string;
  blueprint: ArchitecturalBlueprint;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface DeltaEvent {
  id: string;
  timestamp: string;
  author: string;
  action: 'ADD_NODE' | 'UPDATE_NODE' | 'REMOVE_NODE' | 'ADD_EDGE' | 'REMOVE_EDGE' | 'RECORD_DECISION';
  payload: Record<string, unknown>;
}

export interface ContextSlice {
  totalEstimatedTokens: number;
  blueprint: string[];
  verifiedDecisions: Array<{ id: string; label: string; summary: string }>;
  gotchas: Array<{ id: string; label: string; summary: string }>;
  targetSymbols: Array<{ id: string; label: string; summary: string; exports?: string[] }>;
  connectedFiles: string[];
  rawMarkdown: string;
}
