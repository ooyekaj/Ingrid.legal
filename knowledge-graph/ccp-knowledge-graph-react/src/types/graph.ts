export interface CCPNodeData {
  id: string;
  label: string;
  title: string;
  category: string;
  wordCount: number;
  filingRelevance: number;
  proceduralRequirements: number;
  crossReferences: number;
}

export interface CCPNode {
  data: CCPNodeData;
}

export interface CCPEdgeData {
  id: string;
  source: string;
  target: string;
  type: string;
  weight: number;
  label: string;
  description: string;
}

export interface CCPEdge {
  data: CCPEdgeData;
}

export interface CCPGraphData {
  nodes: CCPNode[];
  edges: CCPEdge[];
}

export interface CategoryStats {
  name: string;
  count: number;
  color: string;
  sections: string[];
}

export interface NetworkStats {
  totalNodes: number;
  totalEdges: number;
  networkDensity: number;
  averageDegree: number;
  categories: CategoryStats[];
}

export interface CentralNode {
  section: string;
  degree: number;
  title: string;
  category: string;
}

export interface GraphFilters {
  category: string;
  searchTerm: string;
  minWordCount: number;
  maxWordCount: number;
  minRelevance: number;
  relationshipTypes: string[];
}

export interface LayoutOptions {
  name: string;
  animate: boolean;
  animationDuration?: number;
  nodeRepulsion?: number;
  idealEdgeLength?: number;
  edgeElasticity?: number;
  gravity?: number;
  numIter?: number;
}

export const CATEGORY_COLORS = [
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', 
  '#dda0dd', '#98d8c8', '#f7dc6f', '#bb8fce', '#85c1e9',
  '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43'
] as const;

export const RELATIONSHIP_TYPES = [
  'cross_reference',
  'procedural_dependency', 
  'timing_relationship',
  'category_similarity',
  'content_similarity'
] as const;

export const LAYOUT_PRESETS: Record<string, LayoutOptions> = {
  'force-directed': {
    name: 'cose-bilkent',
    animate: true,
    animationDuration: 2000,
    nodeRepulsion: 8000,
    idealEdgeLength: 80,
    edgeElasticity: 0.45,
    gravity: 0.25,
    numIter: 2500
  },
  'circle': {
    name: 'circle',
    animate: true,
    animationDuration: 1000
  },
  'grid': {
    name: 'grid',
    animate: true,
    animationDuration: 1000
  },
  'hierarchical': {
    name: 'breadthfirst',
    animate: true,
    animationDuration: 1000
  },
  'concentric': {
    name: 'concentric',
    animate: true,
    animationDuration: 1000
  }
}; 