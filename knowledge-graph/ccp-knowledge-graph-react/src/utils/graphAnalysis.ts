import { CCPGraphData, CCPNode, CCPEdge, NetworkStats, CategoryStats, CentralNode, CATEGORY_COLORS } from '../types/graph';

export class GraphAnalyzer {
  private data: CCPGraphData;
  
  constructor(data: CCPGraphData) {
    this.data = data;
  }

  public analyzeNetwork(): NetworkStats {
    const categories = this.analyzeCategoriesWithStats();
    const totalNodes = this.data.nodes.length;
    const totalEdges = this.data.edges.length;
    const maxPossibleEdges = (totalNodes * (totalNodes - 1)) / 2;
    const networkDensity = totalEdges / maxPossibleEdges;
    const averageDegree = (totalEdges * 2) / totalNodes;

    return {
      totalNodes,
      totalEdges,
      networkDensity,
      averageDegree,
      categories
    };
  }

  public getCentralNodes(limit: number = 10): CentralNode[] {
    const nodeDegrees = new Map<string, number>();
    
    // Calculate degree centrality
    this.data.edges.forEach(edge => {
      nodeDegrees.set(edge.data.source, (nodeDegrees.get(edge.data.source) || 0) + 1);
      nodeDegrees.set(edge.data.target, (nodeDegrees.get(edge.data.target) || 0) + 1);
    });

    // Sort by degree and return top nodes
    return Array.from(nodeDegrees.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([nodeId, degree]) => {
        const node = this.data.nodes.find(n => n.data.id === nodeId);
        return {
          section: nodeId,
          degree,
          title: node?.data.title || 'Unknown',
          category: node?.data.category || 'Unknown'
        };
      });
  }

  public getNodesByCategory(category: string): CCPNode[] {
    return this.data.nodes.filter(node => node.data.category === category);
  }

  public getConnectedNodes(nodeId: string): string[] {
    const connected = new Set<string>();
    
    this.data.edges.forEach(edge => {
      if (edge.data.source === nodeId) {
        connected.add(edge.data.target);
      } else if (edge.data.target === nodeId) {
        connected.add(edge.data.source);
      }
    });

    return Array.from(connected);
  }

  public findShortestPath(sourceId: string, targetId: string): string[] {
    // Simple BFS implementation for shortest path
    const queue: string[][] = [[sourceId]];
    const visited = new Set<string>([sourceId]);

    while (queue.length > 0) {
      const path = queue.shift()!;
      const current = path[path.length - 1];

      if (current === targetId) {
        return path;
      }

      const neighbors = this.getConnectedNodes(current);
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([...path, neighbor]);
        }
      }
    }

    return []; // No path found
  }

  public searchNodes(query: string): CCPNode[] {
    const lowerQuery = query.toLowerCase();
    return this.data.nodes.filter(node => 
      node.data.id.toLowerCase().includes(lowerQuery) ||
      node.data.title.toLowerCase().includes(lowerQuery) ||
      node.data.category.toLowerCase().includes(lowerQuery)
    );
  }

  public filterByRelationshipType(relationshipType: string): CCPEdge[] {
    return this.data.edges.filter(edge => edge.data.type === relationshipType);
  }

  public getRelationshipTypes(): string[] {
    const types = new Set<string>();
    this.data.edges.forEach(edge => types.add(edge.data.type));
    return Array.from(types);
  }

  public getNodeStatistics(nodeId: string) {
    const node = this.data.nodes.find(n => n.data.id === nodeId);
    if (!node) return null;

    const connectedEdges = this.data.edges.filter(
      edge => edge.data.source === nodeId || edge.data.target === nodeId
    );

    const relationshipTypes = new Map<string, number>();
    connectedEdges.forEach(edge => {
      const type = edge.data.type;
      relationshipTypes.set(type, (relationshipTypes.get(type) || 0) + 1);
    });

    return {
      node: node.data,
      degree: connectedEdges.length,
      relationshipTypes: Object.fromEntries(relationshipTypes),
      connectedNodes: this.getConnectedNodes(nodeId)
    };
  }

  private analyzeCategoriesWithStats(): CategoryStats[] {
    const categoryMap = new Map<string, string[]>();
    
    this.data.nodes.forEach(node => {
      const category = node.data.category;
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(node.data.id);
    });

    return Array.from(categoryMap.entries()).map(([name, sections], index) => ({
      name,
      count: sections.length,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      sections
    }));
  }

  public exportNetworkData() {
    const stats = this.analyzeNetwork();
    const centralNodes = this.getCentralNodes(20);
    const relationshipTypes = this.getRelationshipTypes();

    return {
      metadata: {
        generatedAt: new Date().toISOString(),
        totalNodes: stats.totalNodes,
        totalEdges: stats.totalEdges,
        networkDensity: stats.networkDensity,
        averageDegree: stats.averageDegree
      },
      categories: stats.categories,
      centralNodes,
      relationshipTypes,
      nodes: this.data.nodes.map(node => ({
        ...node.data,
        connections: this.getConnectedNodes(node.data.id).length
      })),
      edges: this.data.edges.map(edge => edge.data)
    };
  }
}

export const calculateNodeSize = (wordCount: number, min = 20, max = 80): number => {
  return Math.max(min, Math.min(max, wordCount / 15));
};

export const getRelationshipColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    'cross_reference': '#666666',
    'procedural_dependency': '#ff6b6b',
    'timing_relationship': '#4ecdc4',
    'category_similarity': '#dddddd',
    'content_similarity': '#cccccc'
  };
  return colorMap[type] || '#999999';
};

export const formatNetworkDensity = (density: number): string => {
  return `${(density * 100).toFixed(1)}%`;
};

export const formatAverageDegree = (degree: number): string => {
  return degree.toFixed(1);
}; 