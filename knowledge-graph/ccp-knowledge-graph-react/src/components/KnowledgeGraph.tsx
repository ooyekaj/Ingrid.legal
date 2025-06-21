import React, { useEffect, useRef, useState, useCallback } from 'react';
import cytoscape, { Core, NodeSingular, EdgeSingular } from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';
import { 
  CCPGraphData, 
  CCPNodeData, 
  LayoutOptions, 
  LAYOUT_PRESETS, 
  CATEGORY_COLORS 
} from '../types/graph';
import { calculateNodeSize, getRelationshipColor } from '../utils/graphAnalysis';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Card,
  CardContent,
  Fade,
  SelectChangeEvent
} from '@mui/material';

// Register the layout extension
cytoscape.use(coseBilkent);

interface KnowledgeGraphProps {
  data: CCPGraphData;
  selectedLayout: string;
  selectedCategory: string;
  onNodeSelect: (nodeData: CCPNodeData | null) => void;
  onLayoutChange: (layout: string) => void;
  onCategoryChange: (category: string) => void;
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  data,
  selectedLayout,
  selectedCategory,
  onNodeSelect,
  onLayoutChange,
  onCategoryChange
}) => {
  const cyRef = useRef<HTMLDivElement>(null);
  const cyInstance = useRef<Core | null>(null);
  const [selectedNode, setSelectedNode] = useState<CCPNodeData | null>(null);
  const [hoveredNode, setHoveredNode] = useState<CCPNodeData | null>(null);

  // Get unique categories
  const categories = Array.from(new Set(data.nodes.map(node => node.data.category)));

  // Filter data based on selected category
  const filteredData = React.useMemo(() => {
    if (!selectedCategory) return data;
    
    // Get nodes from the selected category
    const categoryNodes = data.nodes.filter(node => node.data.category === selectedCategory);
    const categoryNodeIds = new Set(categoryNodes.map(node => node.data.id));
    
    // Find all edges connected to nodes in the selected category
    const connectedEdges = data.edges.filter(edge => 
      categoryNodeIds.has(edge.data.source) || categoryNodeIds.has(edge.data.target)
    );
    
    // Find all nodes that are connected to the category nodes (including the category nodes themselves)
    const connectedNodeIds = new Set<string>();
    categoryNodeIds.forEach(id => connectedNodeIds.add(id)); // Add original category nodes
    
    connectedEdges.forEach(edge => {
      connectedNodeIds.add(edge.data.source);
      connectedNodeIds.add(edge.data.target);
    });
    
    // Get all connected nodes
    const filteredNodes = data.nodes.filter(node => connectedNodeIds.has(node.data.id));
    
    return { nodes: filteredNodes, edges: connectedEdges };
  }, [data, selectedCategory]);

  // Initialize Cytoscape
  useEffect(() => {
    if (!cyRef.current || !filteredData) return;

    // Destroy existing instance
    if (cyInstance.current) {
      cyInstance.current.destroy();
    }

    const cy = cytoscape({
      container: cyRef.current,
      elements: filteredData,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': (ele: NodeSingular) => {
              const category = ele.data('category');
              const categoryIndex = categories.indexOf(category);
              return CATEGORY_COLORS[categoryIndex % CATEGORY_COLORS.length];
            },
            'label': 'data(id)',
            'width': (ele: NodeSingular) => calculateNodeSize(ele.data('wordCount')),
            'height': (ele: NodeSingular) => calculateNodeSize(ele.data('wordCount')),
            'font-size': '11px',
            'font-weight': 'bold',
            'text-valign': 'center',
            'text-halign': 'center',
            'color': 'white',
            'text-outline-width': 2,
            'text-outline-color': '#000000',
            'border-width': 2,
            'border-color': '#ffffff',
            'border-opacity': 0.8
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#ffd700',
            'border-opacity': 1
          }
        },
        {
          selector: 'node.highlighted',
          style: {
            'border-width': 3,
            'border-color': '#ff6b6b',
            'border-opacity': 1
          }
        },
        {
          selector: 'edge',
          style: {
            'width': (ele: EdgeSingular) => Math.max(1, ele.data('weight')),
            'line-color': (ele: EdgeSingular) => getRelationshipColor(ele.data('type')),
            'target-arrow-color': (ele: EdgeSingular) => getRelationshipColor(ele.data('type')),
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'opacity': 0.6
          }
        },
        {
          selector: 'edge:selected, edge.highlighted',
          style: {
            'opacity': 1,
            'width': (ele: EdgeSingular) => Math.max(3, ele.data('weight') + 2)
          }
        }
      ],
      layout: LAYOUT_PRESETS[selectedLayout] || LAYOUT_PRESETS['force-directed']
    });

    // Event handlers
    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      const nodeData = node.data() as CCPNodeData;
      
      // Clear previous highlights
      cy.elements().removeClass('highlighted');
      
      // Highlight connected elements
      const connectedEdges = node.connectedEdges();
      const connectedNodes = connectedEdges.connectedNodes();
      
      node.addClass('highlighted');
      connectedNodes.addClass('highlighted');
      connectedEdges.addClass('highlighted');
      
      setSelectedNode(nodeData);
      onNodeSelect(nodeData);
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        cy.elements().removeClass('highlighted');
        setSelectedNode(null);
        onNodeSelect(null);
      }
    });

    cy.on('mouseover', 'node', (evt) => {
      const nodeData = evt.target.data() as CCPNodeData;
      setHoveredNode(nodeData);
    });

    cy.on('mouseout', 'node', () => {
      setHoveredNode(null);
    });

    cyInstance.current = cy;

    return () => {
      if (cyInstance.current) {
        cyInstance.current.destroy();
      }
    };
  }, [filteredData, categories, onNodeSelect]);

  // Handle layout changes
  useEffect(() => {
    if (cyInstance.current) {
      const layoutOptions = LAYOUT_PRESETS[selectedLayout] || LAYOUT_PRESETS['force-directed'];
      cyInstance.current.layout(layoutOptions).run();
    }
  }, [selectedLayout]);

  const handleLayoutChange = useCallback((event: SelectChangeEvent) => {
    onLayoutChange(event.target.value);
  }, [onLayoutChange]);

  const handleCategoryChange = useCallback((event: SelectChangeEvent) => {
    onCategoryChange(event.target.value);
  }, [onCategoryChange]);

  const resetView = useCallback(() => {
    if (cyInstance.current) {
      cyInstance.current.fit();
      cyInstance.current.center();
    }
  }, []);

  const exportImage = useCallback(() => {
    if (cyInstance.current) {
      const png64 = cyInstance.current.png({ scale: 2, full: true });
      const link = document.createElement('a');
      link.href = png64;
      link.download = 'ccp_knowledge_graph.png';
      link.click();
    }
  }, []);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Controls */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Layout</InputLabel>
            <Select
              value={selectedLayout}
              label="Layout"
              onChange={handleLayoutChange}
            >
              {Object.keys(LAYOUT_PRESETS).map(layout => (
                <MenuItem key={layout} value={layout}>
                  {layout.charAt(0).toUpperCase() + layout.slice(1).replace('-', ' ')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Category Filter</InputLabel>
            <Select
              value={selectedCategory}
              label="Category Filter"
              onChange={handleCategoryChange}
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map(category => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip 
              label="Reset View" 
              onClick={resetView} 
              variant="outlined" 
              clickable 
            />
            <Chip 
              label="Export PNG" 
              onClick={exportImage} 
              variant="outlined" 
              clickable 
            />
          </Box>
        </Box>
      </Paper>

      {/* Graph Container */}
      <Paper sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <div
          ref={cyRef}
          style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
          }}
        />
        
        {/* Hover tooltip */}
        {hoveredNode && (
          <Fade in={Boolean(hoveredNode)}>
            <Card
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                maxWidth: 300,
                zIndex: 1000,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="h6" component="div" gutterBottom>
                  CCP {hoveredNode.id}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {hoveredNode.title}
                </Typography>
                <Chip 
                  label={hoveredNode.category} 
                  size="small" 
                  sx={{ 
                    backgroundColor: CATEGORY_COLORS[categories.indexOf(hoveredNode.category) % CATEGORY_COLORS.length],
                    color: 'white'
                  }}
                />
              </CardContent>
            </Card>
          </Fade>
        )}
      </Paper>

      {/* Legend */}
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Categories
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {categories.map((category, index) => (
            <Chip
              key={category}
              label={category}
              size="small"
              sx={{
                backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                color: 'white',
                '&:hover': {
                  opacity: 0.8
                }
              }}
              onClick={() => onCategoryChange(selectedCategory === category ? '' : category)}
            />
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default KnowledgeGraph; 