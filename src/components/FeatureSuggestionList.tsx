import React, { useState } from "react";
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
} from "@mui/icons-material";

interface Feature {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedEffort: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface FeatureSuggestionListProps {
  features: Feature[];
  onFeatureSelect: (feature: Feature) => void;
  onCreateFeature: (featureData: Omit<Feature, 'id'>) => Promise<void>;
}

const FeatureSuggestionList: React.FC<FeatureSuggestionListProps> = ({
  features,
  onFeatureSelect,
  onCreateFeature,
}) => {
  const [open, setOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [newFeature, setNewFeature] = useState<Omit<Feature, 'id'>>({
    title: '',
    description: '',
    priority: 'medium',
    estimatedEffort: '',
    status: 'pending',
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleCreateFeature = async () => {
    try {
      await onCreateFeature(newFeature);
      setOpen(false);
      setNewFeature({
        title: '',
        description: '',
        priority: 'medium',
        estimatedEffort: '',
        status: 'pending',
      });
      setSnackbarMessage('Feature created successfully!');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Error creating feature');
      setSnackbarOpen(true);
    }
  };

  const handleEditFeature = (feature: Feature) => {
    setEditingFeature(feature);
    setNewFeature({
      title: feature.title,
      description: feature.description,
      priority: feature.priority,
      estimatedEffort: feature.estimatedEffort,
      status: feature.status,
    });
    setOpen(true);
  };

  return (
    <>
      <Typography variant="h6" gutterBottom>
        Feature Suggestions
      </Typography>
      
      <Button
        variant="contained"
        startIcon={<Add />}
        onClick={() => setOpen(true)}
        sx={{ mb: 2 }}
      >
        Add Feature
      </Button>

      <List>
        {features.map((feature) => (
          <ListItem key={feature.id} button onClick={() => onFeatureSelect(feature)}>
            <ListItemText
              primary={feature.title}
              secondary={`${feature.description} - Priority: ${feature.priority}`}
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                aria-label="edit"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditFeature(feature);
                }}
              >
                <Edit />
              </IconButton>
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={(e) => {
                  e.stopPropagation();
                  // Add delete functionality here
                }}
              >
                <Delete />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingFeature ? 'Edit Feature' : 'Create New Feature'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            variant="outlined"
            value={newFeature.title}
            onChange={(e) => setNewFeature({ ...newFeature, title: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newFeature.description}
            onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Priority"
            fullWidth
            variant="outlined"
            select
            SelectProps={{ native: true }}
            value={newFeature.priority}
            onChange={(e) => setNewFeature({ ...newFeature, priority: e.target.value as 'high' | 'medium' | 'low' })}
            sx={{ mb: 2 }}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </TextField>
          <TextField
            margin="dense"
            label="Estimated Effort"
            fullWidth
            variant="outlined"
            value={newFeature.estimatedEffort}
            onChange={(e) => setNewFeature({ ...newFeature, estimatedEffort: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateFeature} variant="contained">
            {editingFeature ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default FeatureSuggestionList;