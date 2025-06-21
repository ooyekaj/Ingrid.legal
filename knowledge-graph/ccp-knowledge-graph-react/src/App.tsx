import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  Tab,
  Tabs,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Card,
  CardContent,
  Chip,
  SelectChangeEvent,
  Alert,
  CircularProgress
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import KnowledgeGraph from './components/KnowledgeGraph';
import StatsDashboard from './components/StatsDashboard';
import { GraphAnalyzer } from './utils/graphAnalysis';
import { CCPGraphData, CCPNodeData } from './types/graph';
import './App.css';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
      light: '#764ba2'
    },
    secondary: {
      main: '#f093fb'
    },
    background: {
      default: '#f5f7fa'
    }
  },
  typography: {
    h4: {
      fontWeight: 600
    },
    h6: {
      fontWeight: 500
    }
  }
});

function App() {
  const [data, setData] = useState<CCPGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedLayout, setSelectedLayout] = useState('force-directed');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedNode, setSelectedNode] = useState<CCPNodeData | null>(null);
  const [analyzer, setAnalyzer] = useState<GraphAnalyzer | null>(null);

  useEffect(() => {
    // Load the graph data
    import('./data/ccp_knowledge_graph_cytoscape.json')
      .then((graphData) => {
        const typedData = graphData.default as CCPGraphData;
        
        if (!typedData.nodes || !typedData.edges) {
          throw new Error('Invalid graph data format');
        }

        setData(typedData);
        setAnalyzer(new GraphAnalyzer(typedData));
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load graph data');
        setLoading(false);
      });
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleLayoutChange = (layout: string) => {
    setSelectedLayout(layout);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleNodeSelect = (nodeData: CCPNodeData | null) => {
    setSelectedNode(nodeData);
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="100vh"
          flexDirection="column"
        >
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
          Loading CCP Knowledge Graph...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Analyzing rule interdependencies
          </Typography>
        </Box>
      </ThemeProvider>
    );
  }

  if (error) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Alert severity="error">
            <Typography variant="h6">Failed to Load Knowledge Graph</Typography>
            <Typography variant="body2">{error}</Typography>
          </Alert>
        </Container>
      </ThemeProvider>
    );
  }

  if (!data || !analyzer) {
    return null;
  }

  const networkStats = analyzer.analyzeNetwork();
  const centralNodes = analyzer.getCentralNodes(15);
  const categories = Array.from(new Set(data.nodes.map(node => node.data.category)));

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {/* App Bar */}
      <AppBar position="static" sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            🏛️ CCP Knowledge Graph - Interactive Visualization
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Navigation Tabs */}
      <Paper sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="CCP Knowledge Graph tabs">
          <Tab label="📊 Interactive Graph" />
          <Tab label="📈 Analytics Dashboard" />
        </Tabs>
      </Paper>

      <Container maxWidth="xl" sx={{ mt: 2 }}>
        {/* Graph Controls */}
        {activeTab === 0 && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Layout</InputLabel>
                <Select
                  value={selectedLayout}
                  label="Layout"
                  onChange={(e: SelectChangeEvent) => handleLayoutChange(e.target.value)}
                >
                  <MenuItem value="force-directed">Force Directed</MenuItem>
                  <MenuItem value="circle">Circle</MenuItem>
                  <MenuItem value="grid">Grid</MenuItem>
                  <MenuItem value="hierarchical">Hierarchical</MenuItem>
                  <MenuItem value="concentric">Concentric</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Category Filter</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Category Filter"
                  onChange={(e: SelectChangeEvent) => handleCategoryChange(e.target.value)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map(category => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', flexGrow: 1 }}>
                {categories.slice(0, 5).map((category, index) => (
                  <Chip
                    key={category}
                    label={category}
                    size="small"
                    variant={selectedCategory === category ? "filled" : "outlined"}
                    onClick={() => handleCategoryChange(selectedCategory === category ? '' : category)}
                    sx={{ fontSize: '0.7rem' }}
                  />
                ))}
                {categories.length > 5 && (
                  <Chip
                    label={`+${categories.length - 5} more`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                  />
                )}
              </Box>
            </Box>
          </Paper>
        )}

        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {/* Main Graph */}
            <Box sx={{ flexGrow: 1, minWidth: selectedNode ? '60%' : '100%' }}>
              <Paper sx={{ height: '70vh', position: 'relative' }}>
                <KnowledgeGraph
                  data={data}
                  selectedLayout={selectedLayout}
                  selectedCategory={selectedCategory}
                  onNodeSelect={handleNodeSelect}
                  onLayoutChange={handleLayoutChange}
                  onCategoryChange={handleCategoryChange}
                />
              </Paper>
            </Box>

            {/* Node Details Panel */}
            {selectedNode && (
              <Box sx={{ width: selectedNode ? '35%' : '0%', minWidth: '300px' }}>
                <Card sx={{ height: '70vh', overflow: 'auto' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      📋 Section Details
                    </Typography>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      CCP {selectedNode.id}
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {selectedNode.title}
                    </Typography>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>Category</Typography>
                      <Chip 
                        label={selectedNode.category} 
                        size="small" 
                        color="primary" 
                        sx={{ mb: 2 }}
                      />
                      
                      <Typography variant="subtitle2" gutterBottom>Statistics</Typography>
                      <Typography variant="body2">
                        • Word Count: {selectedNode.wordCount.toLocaleString()}
                      </Typography>
                      <Typography variant="body2">
                        • Filing Relevance: {selectedNode.filingRelevance}/10
                      </Typography>
                      <Typography variant="body2">
                        • Procedural Requirements: {selectedNode.proceduralRequirements}/10
                      </Typography>
                      <Typography variant="body2">
                        • Cross References: {selectedNode.crossReferences}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <StatsDashboard
            stats={networkStats}
            centralNodes={centralNodes}
          />
        </TabPanel>

        {/* Quick Stats Bar */}
        <Paper sx={{ p: 2, mt: 3, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box textAlign="center" color="white">
              <Typography variant="h6">{networkStats.totalNodes}</Typography>
              <Typography variant="caption">CCP Sections</Typography>
            </Box>
            <Box textAlign="center" color="white">
              <Typography variant="h6">{networkStats.totalEdges}</Typography>
              <Typography variant="caption">Relationships</Typography>
            </Box>
            <Box textAlign="center" color="white">
              <Typography variant="h6">{networkStats.categories.length}</Typography>
              <Typography variant="caption">Categories</Typography>
            </Box>
            <Box textAlign="center" color="white">
              <Typography variant="h6">
                {(networkStats.networkDensity * 100).toFixed(1)}%
              </Typography>
              <Typography variant="caption">Network Density</Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </ThemeProvider>
  );
}

export default App;
