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
  TextField,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';

interface SecurityLogsProps {
  logs: any[];
}

export default function SecurityLogs({ logs }: SecurityLogsProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'success';
      default:
        return 'default';
    }
  };

  const getResultColor = (result: string) => {
    switch (result.toUpperCase()) {
      case 'BLOCKED':
        return 'error';
      case 'ALLOWED':
        return 'success';
      case 'WARNING':
        return 'warning';
      default:
        return 'default';
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    
    const searchTermLower = searchTerm.toLowerCase();
    return (
      log.clientId.toLowerCase().includes(searchTermLower) ||
      log.action.toLowerCase().includes(searchTermLower) ||
      log.result.toLowerCase().includes(searchTermLower) ||
      log.details.toLowerCase().includes(searchTermLower) ||
      log.severity.toLowerCase().includes(searchTermLower)
    );
  });

  if (!logs || logs.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography>No security logs available</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search logs..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton>
                  <FilterListIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Paper elevation={2} sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="security logs table">
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Client ID</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Result</TableCell>
                <TableCell>Details</TableCell>
                <TableCell>Severity</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLogs
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>{formatDate(log.timestamp)}</TableCell>
                    <TableCell>{log.clientId}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>
                      <Chip
                        label={log.result}
                        color={getResultColor(log.result) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{log.details}</TableCell>
                    <TableCell>
                      <Chip
                        label={log.severity}
                        color={getSeverityColor(log.severity) as any}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredLogs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
}
