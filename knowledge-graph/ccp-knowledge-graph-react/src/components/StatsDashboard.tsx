import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { NetworkStats, CentralNode, CATEGORY_COLORS } from '../types/graph';
import { formatNetworkDensity, formatAverageDegree } from '../utils/graphAnalysis';

interface StatsDashboardProps {
  stats: NetworkStats;
  centralNodes: CentralNode[];
}

const StatsDashboard: React.FC<StatsDashboardProps> = ({ stats, centralNodes }) => {
  const categoryChartData = stats.categories.map(cat => ({
    name: cat.name,
    count: cat.count,
    color: cat.color
  }));

  const centralNodesChartData = centralNodes.slice(0, 10).map(node => ({
    section: `CCP ${node.section}`,
    degree: node.degree,
    category: node.category
  }));

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        📊 Network Analysis Dashboard
      </Typography>
      
      {/* Overview Cards */}
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 4 }}>
        <Box sx={{ flex: '1 1 250px' }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Sections
              </Typography>
              <Typography variant="h4" component="div">
                {stats.totalNodes}
              </Typography>
              <Typography variant="body2">
                CCP sections analyzed
              </Typography>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: '1 1 250px' }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Relationships
              </Typography>
              <Typography variant="h4" component="div">
                {stats.totalEdges}
              </Typography>
              <Typography variant="body2">
                Interdependencies found
              </Typography>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: '1 1 250px' }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Network Density
              </Typography>
              <Typography variant="h4" component="div">
                {formatNetworkDensity(stats.networkDensity)}
              </Typography>
              <Typography variant="body2">
                Interconnectedness level
              </Typography>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: '1 1 250px' }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg. Connections
              </Typography>
              <Typography variant="h4" component="div">
                {formatAverageDegree(stats.averageDegree)}
              </Typography>
              <Typography variant="body2">
                Per section
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {/* Category Distribution */}
        <Box sx={{ flex: '1 1 45%', minWidth: '400px' }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              📋 Category Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Box>

        {/* Most Connected Sections */}
        <Box sx={{ flex: '1 1 45%', minWidth: '400px' }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              🔗 Most Connected Sections
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={centralNodesChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="section" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="degree" fill="#667eea" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Box>

        {/* Category Details */}
        <Box sx={{ flex: '1 1 45%', minWidth: '400px' }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              🏷️ Category Analysis
            </Typography>
            <List>
              {stats.categories.map((category, index) => (
                <ListItem key={category.name} divider>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={category.name}
                          size="small"
                          sx={{
                            backgroundColor: category.color,
                            color: 'white'
                          }}
                        />
                        <Typography variant="body1">
                          {category.count} sections
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={(category.count / stats.totalNodes) * 100}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {((category.count / stats.totalNodes) * 100).toFixed(1)}% of total
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>

        {/* Central Nodes List */}
        <Box sx={{ flex: '1 1 45%', minWidth: '400px' }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              ⭐ Central Nodes (Most Connected)
            </Typography>
            <List>
              {centralNodes.slice(0, 10).map((node, index) => (
                <ListItem key={node.section} divider>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight="bold">
                          #{index + 1} CCP {node.section}
                        </Typography>
                        <Chip
                          label={`${node.degree} connections`}
                          size="small"
                          color="primary"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {node.title}
                        </Typography>
                        <Chip
                          label={node.category}
                          size="small"
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>
      </Box>

      {/* Network Insights */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          💡 Key Insights
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ flex: '1 1 300px', p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              🔗 Highly Interconnected
            </Typography>
            <Typography variant="body2">
              The network density of {formatNetworkDensity(stats.networkDensity)} indicates 
              a highly interconnected system where changes to one section can have 
              cascading effects throughout the procedural framework.
            </Typography>
          </Box>
          
          <Box sx={{ flex: '1 1 300px', p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              📋 Pleadings Dominance
            </Typography>
            <Typography variant="body2">
              Pleadings sections dominate the central nodes, suggesting they form 
              the backbone of California's civil procedure system and are most 
              likely to be referenced by other rules.
            </Typography>
          </Box>
          
          <Box sx={{ flex: '1 1 300px', p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              🌐 Cross-Category Links
            </Typography>
            <Typography variant="body2">
              The average of {formatAverageDegree(stats.averageDegree)} connections 
              per section shows significant cross-category relationships, indicating 
              integrated procedural requirements.
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default StatsDashboard; 