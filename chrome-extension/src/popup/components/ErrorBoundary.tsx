import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error("Uncaught error in popup:", error, errorInfo);
    // Here you could also send the error to a logging service
  }

  private handleReload = () => {
    // Attempt to reload the extension's popup
    // For a popup, usually closing and reopening is the way.
    // Alternatively, can try to force a re-render if the error is recoverable.
    // For simplicity, we'll just log and show a message.
    // A more robust solution might involve chrome.runtime.reload() for the whole extension,
    // but that's too disruptive for a popup error.
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    // Or, if you want to try reloading the popup window:
    // window.location.reload(); // This might not work as expected in all popup contexts
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          height="100%"
          p={2}
          textAlign="center"
        >
          <Typography variant="h5" color="error" gutterBottom>
            Oops! Something went wrong.
          </Typography>
          <Typography variant="body1" gutterBottom>
            An unexpected error occurred in the extension popup.
          </Typography>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <Box mt={2} p={2} bgcolor="grey.200" borderRadius={1} width="100%" overflow="auto">
              <Typography variant="caption" display="block" gutterBottom>
                {this.state.error.toString()}
              </Typography>
              {this.state.errorInfo && (
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.75rem' }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </Box>
          )}
          <Button
            variant="contained"
            onClick={this.handleReload}
            sx={{ mt: 2 }}
          >
            Try to Recover
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;