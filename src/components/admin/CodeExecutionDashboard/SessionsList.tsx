import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Code as CodeIcon
} from '@mui/icons-material';

interface SessionsListProps {
  sessions: any[];
}

export default function SessionsList({ sessions }: SessionsListProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewSession = (session: any) => {
    setSelectedSession(session);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (!sessions || sessions.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography>No sessions available</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Paper elevation={2} sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="sessions table">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Collaborators</TableCell>
                <TableCell>Files</TableCell>
                <TableCell>Visibility</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Updated</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((session) => (
                  <TableRow key={session.id} hover>
                    <TableCell component="th" scope="row">
                      {session.name}
                    </TableCell>
                    <TableCell>{session.ownerId}</TableCell>
                    <TableCell>{session.collaborators.length}</TableCell>
                    <TableCell>{session.files.length}</TableCell>
                    <TableCell>
                      <Chip
                        label={session.isPublic ? 'Public' : 'Private'}
                        color={session.isPublic ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(session.createdAt)}</TableCell>
                    <TableCell>{formatDate(session.updatedAt)}</TableCell>
                    <TableCell>
                      <IconButton
                        aria-label="view"
                        size="small"
                        onClick={() => handleViewSession(session)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton aria-label="edit" size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton aria-label="delete" size="small">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={sessions.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Session Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        aria-labelledby="session-details-dialog-title"
        maxWidth="md"
        fullWidth
      >
        {selectedSession && (
          <>
            <DialogTitle id="session-details-dialog-title">
              Session: {selectedSession.name}
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">Details</Typography>
                <Typography variant="body2">ID: {selectedSession.id}</Typography>
                <Typography variant="body2">Owner: {selectedSession.ownerId}</Typography>
                <Typography variant="body2">
                  Visibility: {selectedSession.isPublic ? 'Public' : 'Private'}
                </Typography>
                <Typography variant="body2">
                  Created: {formatDate(selectedSession.createdAt)}
                </Typography>
                <Typography variant="body2">
                  Updated: {formatDate(selectedSession.updatedAt)}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1">Collaborators</Typography>
              {selectedSession.collaborators.length > 0 ? (
                <List dense>
                  {selectedSession.collaborators.map((collaborator: string) => (
                    <ListItem key={collaborator}>
                      <ListItemText primary={collaborator} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2">No collaborators</Typography>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1">Files</Typography>
              <List dense>
                {selectedSession.files.map((file: any) => (
                  <ListItem key={file.id}>
                    <CodeIcon sx={{ mr: 1 }} fontSize="small" />
                    <ListItemText
                      primary={file.name}
                      secondary={`Language: ${file.language}`}
                    />
                  </ListItem>
                ))}
              </List>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
