import React, { FC } from 'react';
import {
  Box,
  TextField,
  Autocomplete,
  Chip,
  useTheme,
} from '@mui/material';

interface SearchFilterBarProps {
  searchTerm: string;
  priority: string[];
  selectedTags: string[];
  availableTags: string[];
  onSearchChange: (term: string) => void;
  onPriorityChange: (priorities: string[]) => void;
  onTagsChange: (tags: string[]) => void;
}

const PRIORITY_OPTIONS = ['High', 'Medium', 'Low'];

export const SearchFilterBar: FC<SearchFilterBarProps> = ({
  searchTerm,
  priority,
  selectedTags,
  availableTags,
  onSearchChange,
  onPriorityChange,
  onTagsChange,
}) => {
  const theme = useTheme();

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        gap: 2, 
        alignItems: 'center',
        flexWrap: 'wrap',
        p: 2,
        backgroundColor: theme.palette.background.paper,
        borderRadius: 1,
      }}
    >
      <TextField
        size="small"
        placeholder="Search features..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        sx={{ minWidth: 200 }}
        InputProps={{
          'aria-label': 'Search features',
        }}
      />

      <Autocomplete
        multiple
        size="small"
        options={PRIORITY_OPTIONS}
        value={priority}
        onChange={(_, newValue) => onPriorityChange(newValue)}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Priority"
            sx={{ minWidth: 150 }}
          />
        )}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip
              {...getTagProps({ index })}
              key={option}
              label={option}
              size="small"
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
              }}
            />
          ))
        }
      />

      <Autocomplete
        multiple
        size="small"
        options={availableTags}
        value={selectedTags}
        onChange={(_, newValue) => onTagsChange(newValue)}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Tags"
            sx={{ minWidth: 200 }}
          />
        )}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip
              {...getTagProps({ index })}
              key={option}
              label={option}
              size="small"
            />
          ))
        }
      />
    </Box>
  );
};