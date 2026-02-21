import React, { useState, useEffect } from 'react';
import { Box, Button, Card, CardContent, Chip, Divider, FormControl, FormHelperText, Grid, InputLabel, MenuItem, Select, TextField, Typography, Accordion, AccordionSummary, AccordionDetails, IconButton, List, ListItem, ListItemText, ListItemSecondaryAction } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { predefinedTools } from '../../../agents/function-calling/predefined-tools.js';
import { FunctionCallingAgentService } from '../../../agents/function-calling/FunctionCallingAgentService.js';

// Initialize the agent service (in a real app, this would be provided through a context or dependency injection)
const agentService = new FunctionCallingAgentService();

/**
 * Component for creating and configuring function-calling agents
 */
const FunctionCallingAgentCreator = () => {
  // Agent configuration state
  const [agentName, setAgentName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [model, setModel] = useState('gpt-3.5-turbo');
  const [apiKey, setApiKey] = useState('');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  
  // All available predefined tools
  const [availableTools, setAvailableTools] = useState<any[]>([]);
  
  // Custom tool configuration
  const [showCustomToolForm, setShowCustomToolForm] = useState(false);
  const [customToolName, setCustomToolName] = useState('');
  const [customToolDescription, setCustomToolDescription] = useState('');
  const [customToolParameters, setCustomToolParameters] = useState('');
  const [customToolError, setCustomToolError] = useState('');
  
  // Created agents
  const [agents, setAgents] = useState<string[]>([]);
  
  // Error and success messages
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load available tools and agents on component mount
  useEffect(() => {
    // Get all predefined tools
    const tools = Object.entries(agentService.getPredefinedTools()).map(([key, value]) => ({
      key,
      name: (value as any).function.name,
      description: (value as any).function.description,
      tool: value
    }));
    
    setAvailableTools(tools);
    
    // Get list of existing agents
    setAgents(agentService.listAgents());
  }, []);

  // Handle agent creation
  const handleCreateAgent = async () => {
    try {
      // Validate inputs
      if (!agentName) {
        setError('Agent name is required');
        return;
      }
      
      if (!instructions) {
        setError('Instructions are required');
        return;
      }
      
      if (!apiKey) {
        setError('API Key is required');
        return;
      }
      
      // Collect selected tools
      const toolsToAdd = availableTools
        .filter(tool => selectedTools.includes(tool.name))
        .map(tool => tool.tool);
      
      // Create the agent
      const agentId = await agentService.createAgent({
        name: agentName,
        instructions,
        model,
        functions: toolsToAdd,
        apiKey
      });
      
      // Update agents list
      setAgents(agentService.listAgents());
      
      // Show success message
      setSuccess(`Agent ${agentId} created successfully`);
      
      // Reset form
      setAgentName('');
      setInstructions('');
      setModel('gpt-3.5-turbo');
      setApiKey('');
      setSelectedTools([]);
      setError('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(`Error creating agent: ${error.message}`);
    }
  };

  // Handle adding a custom tool
  const handleAddCustomTool = () => {
    try {
      // Validate inputs
      if (!customToolName) {
        setCustomToolError('Tool name is required');
        return;
      }
      
      if (!customToolDescription) {
        setCustomToolError('Tool description is required');
        return;
      }
      
      // Parse parameters JSON
      let parsedParameters;
      try {
        parsedParameters = JSON.parse(customToolParameters);
      } catch (error) {
        setCustomToolError('Parameters must be valid JSON');
        return;
      }
      
      // Create custom tool
      const customTool = {
        type: 'function',
        function: {
          name: customToolName,
          description: customToolDescription,
          parameters: parsedParameters
        }
      };
      
      // Add to available tools
      setAvailableTools([
        ...availableTools,
        {
          key: `custom-${Date.now()}`,
          name: customToolName,
          description: customToolDescription,
          tool: customTool
        }
      ]);
      
      // Reset form
      setCustomToolName('');
      setCustomToolDescription('');
      setCustomToolParameters('');
      setCustomToolError('');
      setShowCustomToolForm(false);
    } catch (error: any) {
      setCustomToolError(`Error creating custom tool: ${error.message}`);
    }
  };

  // Handle tool selection change
  const handleToolSelectionChange = (toolName: string) => {
    if (selectedTools.includes(toolName)) {
      setSelectedTools(selectedTools.filter(name => name !== toolName));
    } else {
      setSelectedTools([...selectedTools, toolName]);
    }
  };

  // Handle deleting an agent
  const handleDeleteAgent = (agentId: string) => {
    try {
      agentService.deleteAgent(agentId);
      setAgents(agentService.listAgents());
      setSuccess(`Agent ${agentId} deleted successfully`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(`Error deleting agent: ${error.message}`);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Function Calling Agent Creator
      </Typography>
      
      <Grid container spacing={3}>
        {/* Agent Configuration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Agent Configuration
              </Typography>
              
              <TextField
                fullWidth
                label="Agent Name"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                margin="normal"
                variant="outlined"
              />
              
              <TextField
                fullWidth
                label="Instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                margin="normal"
                variant="outlined"
                multiline
                rows={4}
                helperText="Provide detailed instructions for the agent"
              />
              
              <FormControl fullWidth margin="normal" variant="outlined">
                <InputLabel>Model</InputLabel>
                <Select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  label="Model"
                >
                  <MenuItem value="gpt-3.5-turbo">GPT-3.5 Turbo</MenuItem>
                  <MenuItem value="gpt-4">GPT-4</MenuItem>
                  <MenuItem value="gpt-4-turbo">GPT-4 Turbo</MenuItem>
                </Select>
                <FormHelperText>Select the OpenAI model to use</FormHelperText>
              </FormControl>
              
              <TextField
                fullWidth
                label="OpenAI API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                margin="normal"
                variant="outlined"
                type="password"
                helperText="Your OpenAI API key"
              />
              
              {error && (
                <Typography color="error" sx={{ mt: 2 }}>
                  {error}
                </Typography>
              )}
              
              {success && (
                <Typography color="success" sx={{ mt: 2 }}>
                  {success}
                </Typography>
              )}
              
              <Button
                variant="contained"
                color="primary"
                onClick={handleCreateAgent}
                sx={{ mt: 2 }}
                fullWidth
              >
                Create Agent
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Tools Configuration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Available Tools
              </Typography>
              
              <List>
                {availableTools.map((tool) => (
                  <ListItem key={tool.key}>
                    <ListItemText
                      primary={tool.name}
                      secondary={tool.description}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleToolSelectionChange(tool.name)}
                        color={selectedTools.includes(tool.name) ? 'primary' : 'default'}
                      >
                        {selectedTools.includes(tool.name) ? (
                          <DeleteIcon />
                        ) : (
                          <AddIcon />
                        )}
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Selected Tools:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedTools.map((toolName) => (
                    <Chip
                      key={toolName}
                      label={toolName}
                      onDelete={() => handleToolSelectionChange(toolName)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                  {selectedTools.length === 0 && (
                    <Typography variant="body2" color="textSecondary">
                      No tools selected
                    </Typography>
                  )}
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Button
                variant="outlined"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setShowCustomToolForm(!showCustomToolForm)}
                fullWidth
              >
                {showCustomToolForm ? 'Hide Custom Tool Form' : 'Add Custom Tool'}
              </Button>
              
              {showCustomToolForm && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Create Custom Tool
                  </Typography>
                  
                  <TextField
                    fullWidth
                    label="Tool Name"
                    value={customToolName}
                    onChange={(e) => setCustomToolName(e.target.value)}
                    margin="normal"
                    variant="outlined"
                    helperText="e.g., search_database"
                  />
                  
                  <TextField
                    fullWidth
                    label="Tool Description"
                    value={customToolDescription}
                    onChange={(e) => setCustomToolDescription(e.target.value)}
                    margin="normal"
                    variant="outlined"
                    helperText="Describe what the tool does"
                  />
                  
                  <TextField
                    fullWidth
                    label="Parameters Schema (JSON)"
                    value={customToolParameters}
                    onChange={(e) => setCustomToolParameters(e.target.value)}
                    margin="normal"
                    variant="outlined"
                    multiline
                    rows={4}
                    helperText="JSON schema for the parameters"
                  />
                  
                  {customToolError && (
                    <Typography color="error" sx={{ mt: 1 }}>
                      {customToolError}
                    </Typography>
                  )}
                  
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleAddCustomTool}
                    sx={{ mt: 2 }}
                    fullWidth
                  >
                    Add Tool
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Existing Agents */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Existing Function Calling Agents</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {agents.length > 0 ? (
                <List>
                  {agents.map((agentId) => (
                    <ListItem key={agentId}>
                      <ListItemText
                        primary={agentId}
                        secondary={`Model: ${agentService.getAgent(agentId)?.getInstructions()?.substring(0, 50)}...`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteAgent(agentId)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No agents created yet
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FunctionCallingAgentCreator;