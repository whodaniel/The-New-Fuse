import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  IconButton, 
  Tooltip, 
  Menu, 
  MenuItem, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Select,
  FormControl,
  InputLabel,
  Divider,
  Tabs,
  Tab,
  Grid,
  Chip,
  Autocomplete,
  CircularProgress,
  Paper,
  Switch,
  FormControlLabel
} from '@mui/material';
import { 
  Add as AddIcon,
  CloudOutlined as ApiIcon,
  StorageOutlined as VectorIcon,
  DescriptionOutlined as DocumentIcon,
  WebhookOutlined as WebhookIcon,
  Code as CodeIcon,
  SmartToyOutlined as AIIcon,
  TextFields as TextIcon,
  FilterAlt as FilterIcon,
  Dashboard as DashboardIcon,
  Transform as TransformIcon,
  Schedule as ScheduleIcon,
  DataObject as DataIcon,
  Search as SearchIcon,
  Storage as DatabaseIcon,
  Speed as PerformanceIcon
} from '@mui/icons-material';
import { Node, WorkflowEditor } from './types.js';
import axios from 'axios';

interface NodeToolbarProps {
  editor: WorkflowEditor;
  onAddNode: (nodeType: string, config: any) => void;
}

interface NodeTypeCategory {
  name: string;
  icon: React.ReactNode;
  types: {
    id: string;
    name: string;
    description: string;
    defaultConfig: any;
  }[];
}

const NodeToolbar: React.FC<NodeToolbarProps> = ({ editor, onAddNode }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedNodeType, setSelectedNodeType] = useState('');
  const [nodeName, setNodeName] = useState('');
  const [nodeConfig, setNodeConfig] = useState<any>({});
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [nodeTypes, setNodeTypes] = useState<NodeTypeCategory[]>([]);
  const [advancedMode, setAdvancedMode] = useState(false);
  
  // Default node categories if API call fails
  const defaultNodeCategories: NodeTypeCategory[] = [
    {
      name: 'Data Sources',
      icon: <DatabaseIcon />,
      types: [
        {
          id: 'api',
          name: 'API',
          description: 'Make HTTP requests to external APIs',
          defaultConfig: { method: 'GET' }
        },
        {
          id: 'vectorStore',
          name: 'Vector Store',
          description: 'Store and retrieve vector embeddings',
          defaultConfig: { operation: 'store', collectionName: 'default' }
        }
      ]
    },
    {
      name: 'Processing',
      icon: <TransformIcon />,
      types: [
        {
          id: 'documentProcessing',
          name: 'Document Processing',
          description: 'Process documents and extract information',
          defaultConfig: { operation: 'parse', outputFormat: 'text' }
        },
        {
          id: 'ai',
          name: 'AI',
          description: 'Use AI models for text generation, classification, etc.',
          defaultConfig: { model: 'gpt-3.5-turbo' }
        }
      ]
    },
    {
      name: 'Integrations',
      icon: <WebhookIcon />,
      types: [
        {
          id: 'webhook',
          name: 'Webhook',
          description: 'Send and receive data via webhooks',
          defaultConfig: { operation: 'trigger', method: 'POST' }
        },
        {
          id: 'zapier',
          name: 'Zapier',
          description: 'Integrate with Zapier automations',
          defaultConfig: { service: 'zapier' }
        }
      ]
    },
    {
      name: 'Utilities',
      icon: <CodeIcon />,
      types: [
        {
          id: 'code',
          name: 'Code',
          description: 'Run custom JavaScript code',
          defaultConfig: { language: 'javascript' }
        },
        {
          id: 'text',
          name: 'Text',
          description: 'Create and manipulate text content',
          defaultConfig: { operation: 'transform' }
        },
        {
          id: 'filter',
          name: 'Filter',
          description: 'Filter data based on conditions',
          defaultConfig: { condition: 'equals' }
        }
      ]
    }
  ];
  
  useEffect(() => {
    // Fetch available node types from the server
    const fetchNodeTypes = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/node-types');
        setNodeTypes(response.data);
      } catch (error) {
        console.error('Failed to fetch node types:', error);
        // Fallback to default node types if API fails
        setNodeTypes(defaultNodeCategories);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNodeTypes();
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNodeTypeSelect = (nodeType: string, defaultConfig: any = {}) => {
    setSelectedNodeType(nodeType);
    setNodeName(`New ${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} Node`);
    setNodeConfig(defaultConfig);
    setDialogOpen(true);
    handleClose();
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAddNode = () => {
    onAddNode(selectedNodeType, {
      name: nodeName,
      ...nodeConfig
    });
    setDialogOpen(false);
  };

  const filteredNodeTypes = searchTerm.length > 0
    ? nodeTypes.map(category => ({
        ...category,
        types: category.types.filter(type => 
          type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          type.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })).filter(category => category.types.length > 0)
    : nodeTypes;

  const renderConfigFields = () => {
    switch (selectedNodeType) {
      case 'api':
        return (
          <>
            <TextField
              margin="dense"
              label="URL"
              fullWidth
              variant="outlined"
              value={nodeConfig.url || ''}
              onChange={(e) => setNodeConfig({...nodeConfig, url: e.target.value})}
            />
            <FormControl fullWidth margin="dense">
              <InputLabel>Method</InputLabel>
              <Select
                value={nodeConfig.method || 'GET'}
                label="Method"
                onChange={(e) => setNodeConfig({...nodeConfig, method: e.target.value})}
              >
                <MenuItem value="GET">GET</MenuItem>
                <MenuItem value="POST">POST</MenuItem>
                <MenuItem value="PUT">PUT</MenuItem>
                <MenuItem value="DELETE">DELETE</MenuItem>
                <MenuItem value="PATCH">PATCH</MenuItem>
              </Select>
            </FormControl>
            
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Authentication</Typography>
            <FormControl fullWidth margin="dense">
              <InputLabel>Authentication Type</InputLabel>
              <Select
                value={nodeConfig.authentication?.type || 'None'}
                label="Authentication Type"
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'None') {
                    const { authentication, ...rest } = nodeConfig;
                    setNodeConfig(rest);
                  } else {
                    setNodeConfig({
                      ...nodeConfig, 
                      authentication: { 
                        ...nodeConfig.authentication,
                        type: value 
                      }
                    });
                  }
                }}
              >
                <MenuItem value="None">None</MenuItem>
                <MenuItem value="Basic">Basic Auth</MenuItem>
                <MenuItem value="Bearer">Bearer Token</MenuItem>
                <MenuItem value="API Key">API Key</MenuItem>
              </Select>
            </FormControl>
            
            {nodeConfig.authentication?.type === 'Basic' && (
              <>
                <TextField
                  margin="dense"
                  label="Username"
                  fullWidth
                  variant="outlined"
                  value={nodeConfig.authentication?.username || ''}
                  onChange={(e) => setNodeConfig({
                    ...nodeConfig, 
                    authentication: { 
                      ...nodeConfig.authentication,
                      username: e.target.value 
                    }
                  })}
                />
                <TextField
                  margin="dense"
                  label="Password"
                  type="password"
                  fullWidth
                  variant="outlined"
                  value={nodeConfig.authentication?.password || ''}
                  onChange={(e) => setNodeConfig({
                    ...nodeConfig, 
                    authentication: { 
                      ...nodeConfig.authentication,
                      password: e.target.value 
                    }
                  })}
                />
              </>
            )}
            
            {nodeConfig.authentication?.type === 'Bearer' && (
              <TextField
                margin="dense"
                label="Token"
                fullWidth
                variant="outlined"
                value={nodeConfig.authentication?.token || ''}
                onChange={(e) => setNodeConfig({
                  ...nodeConfig, 
                  authentication: { 
                    ...nodeConfig.authentication,
                    token: e.target.value 
                  }
                })}
              />
            )}
            
            {nodeConfig.authentication?.type === 'API Key' && (
              <>
                <TextField
                  margin="dense"
                  label="Key Name"
                  fullWidth
                  variant="outlined"
                  value={nodeConfig.authentication?.keyName || ''}
                  onChange={(e) => setNodeConfig({
                    ...nodeConfig, 
                    authentication: { 
                      ...nodeConfig.authentication,
                      keyName: e.target.value 
                    }
                  })}
                />
                <TextField
                  margin="dense"
                  label="Key Value"
                  fullWidth
                  variant="outlined"
                  value={nodeConfig.authentication?.keyValue || ''}
                  onChange={(e) => setNodeConfig({
                    ...nodeConfig, 
                    authentication: { 
                      ...nodeConfig.authentication,
                      keyValue: e.target.value 
                    }
                  })}
                />
                <FormControl fullWidth margin="dense">
                  <InputLabel>Key Location</InputLabel>
                  <Select
                    value={nodeConfig.authentication?.keyLocation || 'header'}
                    label="Key Location"
                    onChange={(e) => setNodeConfig({
                      ...nodeConfig, 
                      authentication: { 
                        ...nodeConfig.authentication,
                        keyLocation: e.target.value 
                      }
                    })}
                  >
                    <MenuItem value="header">Header</MenuItem>
                    <MenuItem value="query">Query Parameter</MenuItem>
                  </Select>
                </FormControl>
              </>
            )}
            
            {advancedMode && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Advanced Options</Typography>
                <TextField
                  margin="dense"
                  label="Body Template (JSON)"
                  fullWidth
                  multiline
                  rows={4}
                  variant="outlined"
                  value={nodeConfig.bodyTemplate || '{}'}
                  onChange={(e) => setNodeConfig({...nodeConfig, bodyTemplate: e.target.value})}
                />
                <TextField
                  margin="dense"
                  label="Response Mapping (JSON)"
                  fullWidth
                  multiline
                  rows={2}
                  variant="outlined"
                  value={nodeConfig.responseMapping ? JSON.stringify(nodeConfig.responseMapping) : '{}'}
                  onChange={(e) => {
                    try {
                      const mapping = JSON.parse(e.target.value);
                      setNodeConfig({...nodeConfig, responseMapping: mapping});
                    } catch {
                      // Allow invalid JSON during typing
                    }
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  Example: {"{ \"result\": \"data.items[0].value\" }"}
                </Typography>
                
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Error Handling</Typography>
                <TextField
                  margin="dense"
                  label="Retry Count"
                  type="number"
                  InputProps={{ inputProps: { min: 0, max: 10 } }}
                  fullWidth
                  variant="outlined"
                  value={nodeConfig.errorHandling?.retryCount || 0}
                  onChange={(e) => setNodeConfig({
                    ...nodeConfig, 
                    errorHandling: { 
                      ...nodeConfig.errorHandling,
                      retryCount: parseInt(e.target.value) 
                    }
                  })}
                />
                <TextField
                  margin="dense"
                  label="Retry Delay (ms)"
                  type="number"
                  InputProps={{ inputProps: { min: 100, max: 60000 } }}
                  fullWidth
                  variant="outlined"
                  value={nodeConfig.errorHandling?.retryDelay || 1000}
                  onChange={(e) => setNodeConfig({
                    ...nodeConfig, 
                    errorHandling: { 
                      ...nodeConfig.errorHandling,
                      retryDelay: parseInt(e.target.value) 
                    }
                  })}
                />
                <TextField
                  margin="dense"
                  label="Fallback Value (JSON)"
                  fullWidth
                  variant="outlined"
                  value={nodeConfig.errorHandling?.fallbackValue ? JSON.stringify(nodeConfig.errorHandling.fallbackValue) : ''}
                  onChange={(e) => {
                    try {
                      const fallbackValue = e.target.value ? JSON.parse(e.target.value) : undefined;
                      setNodeConfig({
                        ...nodeConfig, 
                        errorHandling: { 
                          ...nodeConfig.errorHandling,
                          fallbackValue
                        }
                      });
                    } catch {
                      // Allow invalid JSON during typing
                    }
                  }}
                />
              </>
            )}
          </>
        );

      case 'vectorStore':
        return (
          <>
            <TextField
              margin="dense"
              label="Collection Name"
              fullWidth
              variant="outlined"
              value={nodeConfig.collectionName || ''}
              onChange={(e) => setNodeConfig({...nodeConfig, collectionName: e.target.value})}
            />
            <FormControl fullWidth margin="dense">
              <InputLabel>Operation</InputLabel>
              <Select
                value={nodeConfig.operation || 'store'}
                label="Operation"
                onChange={(e) => setNodeConfig({...nodeConfig, operation: e.target.value})}
              >
                <MenuItem value="store">Store</MenuItem>
                <MenuItem value="retrieve">Retrieve</MenuItem>
                <MenuItem value="update">Update</MenuItem>
                <MenuItem value="delete">Delete</MenuItem>
                <MenuItem value="similarity">Similarity</MenuItem>
                <MenuItem value="cluster">Cluster</MenuItem>
              </Select>
            </FormControl>
            
            {(nodeConfig.operation === 'retrieve') && (
              <>
                <TextField
                  margin="dense"
                  label="Search Top K"
                  type="number"
                  InputProps={{ inputProps: { min: 1, max: 100 } }}
                  fullWidth
                  variant="outlined"
                  value={nodeConfig.searchTopK || 5}
                  onChange={(e) => setNodeConfig({...nodeConfig, searchTopK: parseInt(e.target.value)})}
                />
                <TextField
                  margin="dense"
                  label="Similarity Threshold"
                  type="number"
                  InputProps={{ inputProps: { min: 0, max: 1, step: 0.1 } }}
                  fullWidth
                  variant="outlined"
                  value={nodeConfig.searchThreshold || 0.7}
                  onChange={(e) => setNodeConfig({...nodeConfig, searchThreshold: parseFloat(e.target.value)})}
                />
              </>
            )}
            
            {(nodeConfig.operation === 'similarity') && (
              <FormControl fullWidth margin="dense">
                <InputLabel>Similarity Metric</InputLabel>
                <Select
                  value={nodeConfig.similarityMetric || 'cosine'}
                  label="Similarity Metric"
                  onChange={(e) => setNodeConfig({...nodeConfig, similarityMetric: e.target.value})}
                >
                  <MenuItem value="cosine">Cosine</MenuItem>
                  <MenuItem value="euclidean">Euclidean</MenuItem>
                  <MenuItem value="dot">Dot Product</MenuItem>
                </Select>
              </FormControl>
            )}
            
            {(nodeConfig.operation === 'cluster') && (
              <TextField
                margin="dense"
                label="Cluster Count"
                type="number"
                InputProps={{ inputProps: { min: 2, max: 20 } }}
                fullWidth
                variant="outlined"
                value={nodeConfig.clusterCount || 3}
                onChange={(e) => setNodeConfig({...nodeConfig, clusterCount: parseInt(e.target.value)})}
              />
            )}
            
            {advancedMode && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Advanced Options</Typography>
                <TextField
                  margin="dense"
                  label="Embedding Model"
                  fullWidth
                  variant="outlined"
                  value={nodeConfig.embeddingModel || 'default'}
                  onChange={(e) => setNodeConfig({...nodeConfig, embeddingModel: e.target.value})}
                />
                <TextField
                  margin="dense"
                  label="Metadata (JSON)"
                  fullWidth
                  multiline
                  rows={3}
                  variant="outlined"
                  value={nodeConfig.metadata ? JSON.stringify(nodeConfig.metadata) : '{}'}
                  onChange={(e) => {
                    try {
                      const metadata = JSON.parse(e.target.value);
                      setNodeConfig({...nodeConfig, metadata});
                    } catch {
                      // Allow invalid JSON during typing
                    }
                  }}
                />
              </>
            )}
          </>
        );
        
      case 'documentProcessing':
        return (
          <>
            <FormControl fullWidth margin="dense">
              <InputLabel>Operation</InputLabel>
              <Select
                value={nodeConfig.operation || 'parse'}
                label="Operation"
                onChange={(e) => setNodeConfig({...nodeConfig, operation: e.target.value})}
              >
                <MenuItem value="parse">Parse</MenuItem>
                <MenuItem value="extract">Extract</MenuItem>
                <MenuItem value="summarize">Summarize</MenuItem>
                <MenuItem value="convert">Convert</MenuItem>
                <MenuItem value="ocr">OCR</MenuItem>
                <MenuItem value="translate">Translate</MenuItem>
                <MenuItem value="split">Split</MenuItem>
              </Select>
            </FormControl>
            
            {nodeConfig.operation === 'parse' && (
              <FormControl fullWidth margin="dense">
                <InputLabel>Output Format</InputLabel>
                <Select
                  value={nodeConfig.outputFormat || 'text'}
                  label="Output Format"
                  onChange={(e) => setNodeConfig({...nodeConfig, outputFormat: e.target.value})}
                >
                  <MenuItem value="text">Text</MenuItem>
                  <MenuItem value="json">JSON</MenuItem>
                  <MenuItem value="markdown">Markdown</MenuItem>
                  <MenuItem value="html">HTML</MenuItem>
                </Select>
              </FormControl>
            )}
            
            {nodeConfig.operation === 'extract' && (
              <TextField
                margin="dense"
                label="Extraction Rules (JSON)"
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                value={nodeConfig.extractionRules ? JSON.stringify(nodeConfig.extractionRules) : '{}'}
                onChange={(e) => {
                  try {
                    const rules = JSON.parse(e.target.value);
                    setNodeConfig({...nodeConfig, extractionRules: rules});
                  } catch {
                    // Allow invalid JSON during typing
                  }
                }}
              />
            )}
            
            {nodeConfig.operation === 'summarize' && (
              <TextField
                margin="dense"
                label="Summary Length"
                type="number"
                InputProps={{ inputProps: { min: 50, max: 1000 } }}
                fullWidth
                variant="outlined"
                value={nodeConfig.summarizationLength || 200}
                onChange={(e) => setNodeConfig({...nodeConfig, summarizationLength: parseInt(e.target.value)})}
              />
            )}
            
            {nodeConfig.operation === 'convert' && (
              <FormControl fullWidth margin="dense">
                <InputLabel>Convert To</InputLabel>
                <Select
                  value={nodeConfig.convertTo || 'pdf'}
                  label="Convert To"
                  onChange={(e) => setNodeConfig({...nodeConfig, convertTo: e.target.value})}
                >
                  <MenuItem value="pdf">PDF</MenuItem>
                  <MenuItem value="docx">DOCX</MenuItem>
                  <MenuItem value="txt">TXT</MenuItem>
                  <MenuItem value="html">HTML</MenuItem>
                  <MenuItem value="markdown">Markdown</MenuItem>
                </Select>
              </FormControl>
            )}
            
            {nodeConfig.operation === 'ocr' && (
              <TextField
                margin="dense"
                label="OCR Language"
                fullWidth
                variant="outlined"
                value={nodeConfig.ocrLanguage || 'eng'}
                onChange={(e) => setNodeConfig({...nodeConfig, ocrLanguage: e.target.value})}
              />
            )}
            
            {nodeConfig.operation === 'translate' && (
              <TextField
                margin="dense"
                label="Translate To"
                fullWidth
                variant="outlined"
                value={nodeConfig.translateTo || 'en'}
                onChange={(e) => setNodeConfig({...nodeConfig, translateTo: e.target.value})}
              />
            )}
            
            {nodeConfig.operation === 'split' && (
              <>
                <FormControl fullWidth margin="dense">
                  <InputLabel>Split Method</InputLabel>
                  <Select
                    value={nodeConfig.splitMethod || 'chunk'}
                    label="Split Method"
                    onChange={(e) => setNodeConfig({...nodeConfig, splitMethod: e.target.value})}
                  >
                    <MenuItem value="chunk">By Size</MenuItem>
                    <MenuItem value="sentence">By Sentence</MenuItem>
                    <MenuItem value="paragraph">By Paragraph</MenuItem>
                  </Select>
                </FormControl>
                
                {nodeConfig.splitMethod === 'chunk' && (
                  <>
                    <TextField
                      margin="dense"
                      label="Chunk Size"
                      type="number"
                      InputProps={{ inputProps: { min: 100, max: 10000 } }}
                      fullWidth
                      variant="outlined"
                      value={nodeConfig.chunkSize || 1000}
                      onChange={(e) => setNodeConfig({...nodeConfig, chunkSize: parseInt(e.target.value)})}
                    />
                    <TextField
                      margin="dense"
                      label="Chunk Overlap"
                      type="number"
                      InputProps={{ inputProps: { min: 0, max: 1000 } }}
                      fullWidth
                      variant="outlined"
                      value={nodeConfig.chunkOverlap || 200}
                      onChange={(e) => setNodeConfig({...nodeConfig, chunkOverlap: parseInt(e.target.value)})}
                    />
                  </>
                )}
              </>
            )}
          </>
        );
        
      case 'webhook':
        return (
          <>
            <FormControl fullWidth margin="dense">
              <InputLabel>Operation</InputLabel>
              <Select
                value={nodeConfig.operation || 'trigger'}
                label="Operation"
                onChange={(e) => setNodeConfig({...nodeConfig, operation: e.target.value})}
              >
                <MenuItem value="trigger">Trigger</MenuItem>
                <MenuItem value="receive">Receive</MenuItem>
                <MenuItem value="listen">Listen</MenuItem>
              </Select>
            </FormControl>
            
            {nodeConfig.operation === 'trigger' && (
              <>
                <FormControl fullWidth margin="dense">
                  <InputLabel>Service</InputLabel>
                  <Select
                    value={nodeConfig.service || 'custom'}
                    label="Service"
                    onChange={(e) => setNodeConfig({...nodeConfig, service: e.target.value})}
                  >
                    <MenuItem value="zapier">Zapier</MenuItem>
                    <MenuItem value="integromat">Integromat</MenuItem>
                    <MenuItem value="n8n">n8n</MenuItem>
                    <MenuItem value="custom">Custom</MenuItem>
                  </Select>
                </FormControl>
                
                {nodeConfig.service === 'zapier' && (
                  <TextField
                    margin="dense"
                    label="Webhook ID"
                    fullWidth
                    variant="outlined"
                    value={nodeConfig.webhookId || ''}
                    onChange={(e) => setNodeConfig({...nodeConfig, webhookId: e.target.value})}
                  />
                )}
                
                {nodeConfig.service === 'custom' && (
                  <>
                    <TextField
                      margin="dense"
                      label="URL"
                      fullWidth
                      variant="outlined"
                      value={nodeConfig.url || ''}
                      onChange={(e) => setNodeConfig({...nodeConfig, url: e.target.value})}
                    />
                    <FormControl fullWidth margin="dense">
                      <InputLabel>Method</InputLabel>
                      <Select
                        value={nodeConfig.method || 'POST'}
                        label="Method"
                        onChange={(e) => setNodeConfig({...nodeConfig, method: e.target.value})}
                      >
                        <MenuItem value="GET">GET</MenuItem>
                        <MenuItem value="POST">POST</MenuItem>
                        <MenuItem value="PUT">PUT</MenuItem>
                        <MenuItem value="DELETE">DELETE</MenuItem>
                      </Select>
                    </FormControl>
                    
                    {advancedMode && (
                      <>
                        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Advanced Options</Typography>
                        <TextField
                          margin="dense"
                          label="Headers (JSON)"
                          fullWidth
                          multiline
                          rows={2}
                          variant="outlined"
                          value={nodeConfig.headers ? JSON.stringify(nodeConfig.headers) : '{}'}
                          onChange={(e) => {
                            try {
                              const headers = JSON.parse(e.target.value);
                              setNodeConfig({...nodeConfig, headers});
                            } catch {
                              // Allow invalid JSON during typing
                            }
                          }}
                        />
                        <TextField
                          margin="dense"
                          label="Body Template (JSON)"
                          fullWidth
                          multiline
                          rows={3}
                          variant="outlined"
                          value={nodeConfig.bodyTemplate || ''}
                          onChange={(e) => setNodeConfig({...nodeConfig, bodyTemplate: e.target.value})}
                        />
                        <TextField
                          margin="dense"
                          label="Retry Count"
                          type="number"
                          InputProps={{ inputProps: { min: 0, max: 10 } }}
                          fullWidth
                          variant="outlined"
                          value={nodeConfig.errorHandling?.retryCount || 0}
                          onChange={(e) => setNodeConfig({
                            ...nodeConfig, 
                            errorHandling: { 
                              ...nodeConfig.errorHandling,
                              retryCount: parseInt(e.target.value) 
                            }
                          })}
                        />
                      </>
                    )}
                  </>
                )}
              </>
            )}
            
            {nodeConfig.operation === 'listen' && (
              <TextField
                margin="dense"
                label="Callback URL Pattern"
                fullWidth
                variant="outlined"
                value={nodeConfig.callbackUrlPattern || ''}
                onChange={(e) => setNodeConfig({...nodeConfig, callbackUrlPattern: e.target.value})}
                helperText="Use {{workflow.id}} or {{node.id}} as placeholders"
              />
            )}
          </>
        );

      // Add more node type configurations as needed

      default:
        return null;
    }
  };

  return (
    <Box sx={{ padding: 2, borderBottom: '1px solid #e0e0e0' }}>
      <Typography variant="h6" sx={{ marginBottom: 2 }}>Nodes</Typography>
      
      <Grid container spacing={2} alignItems="center">
        <Grid item>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleClick}
            color="primary"
          >
            Add Node
          </Button>
        </Grid>
        <Grid item xs>
          <TextField
            placeholder="Search nodes..."
            size="small"
            fullWidth
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Grid>
      </Grid>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: 500,
            width: 350
          }
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}
            >
              <Tab label="All" />
              {filteredNodeTypes.map((category, idx) => (
                <Tab key={idx} icon={category.icon} label={category.name} />
              ))}
            </Tabs>
            
            {tabValue === 0 ? (
              // All categories
              filteredNodeTypes.map((category, categoryIdx) => (
                <React.Fragment key={categoryIdx}>
                  <Typography variant="subtitle2" sx={{ px: 2, py: 1, bgcolor: 'grey.100' }}>
                    {category.name}
                  </Typography>
                  {category.types.map((type, typeIdx) => (
                    <MenuItem 
                      key={`${categoryIdx}-${typeIdx}`} 
                      onClick={() => handleNodeTypeSelect(type.id, type.defaultConfig)}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <Typography variant="body1">{type.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {type.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </React.Fragment>
              ))
            ) : (
              // Specific category
              filteredNodeTypes[tabValue - 1]?.types.map((type, idx) => (
                <MenuItem 
                  key={idx} 
                  onClick={() => handleNodeTypeSelect(type.id, type.defaultConfig)}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <Typography variant="body1">{type.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {type.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))
            )}
          </>
        )}
      </Menu>
      
      <Dialog 
        open={dialogOpen} 
        onClose={handleDialogClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Add {selectedNodeType.charAt(0).toUpperCase() + selectedNodeType.slice(1)} Node
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus
            margin="dense"
            label="Node Name"
            fullWidth
            variant="outlined"
            value={nodeName}
            onChange={(e) => setNodeName(e.target.value)}
          />
          
          <Box sx={{ mb: 2, mt: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={advancedMode}
                  onChange={(e) => setAdvancedMode(e.target.checked)}
                />
              }
              label="Advanced Mode"
            />
          </Box>
          
          <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
            {renderConfigFields()}
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button 
            onClick={handleAddNode} 
            color="primary"
            variant="contained"
            disabled={!nodeName.trim()}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NodeToolbar;
