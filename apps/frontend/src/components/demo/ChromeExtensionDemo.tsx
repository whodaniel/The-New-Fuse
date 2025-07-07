import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Fade,
} from "@mui/material";
import { PopupContainer } from "../ui/popup";
import ExtensionIcon from "@mui/icons-material/Extension";
import CloseIcon from "@mui/icons-material/Close";

export interface ChromeExtensionDemoProps {
  /** Whether to show the demo by default */
  defaultOpen?: boolean;
}

const ChromeExtensionDemo: React.FC<ChromeExtensionDemoProps> = ({
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleThemeChange = (darkMode: boolean) => {
    setIsDarkMode(darkMode);
  };

  if (!isOpen) {
    return (
      <Card sx={{ m: 2, maxWidth: 400 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <ExtensionIcon color="primary" />
            <Typography variant="h6">Chrome Extension UI Demo</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" paragraph>
            Experience the recovered Chrome extension interface integrated into
            the main application.
          </Typography>
          <Button
            variant="contained"
            onClick={() => setIsOpen(true)}
            startIcon={<ExtensionIcon />}
          >
            Open Extension Interface
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Fade in={isOpen}>
      <Box
        sx={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 9999,
          boxShadow: 8,
          borderRadius: 2,
          overflow: "hidden",
          backgroundColor: "background.paper",
        }}
      >
        {/* Close Button */}
        <Box
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 10000,
          }}
        >
          <Button
            size="small"
            onClick={() => setIsOpen(false)}
            sx={{
              minWidth: "auto",
              p: 0.5,
              bgcolor: "rgba(0,0,0,0.1)",
              "&:hover": { bgcolor: "rgba(0,0,0,0.2)" },
            }}
          >
            <CloseIcon fontSize="small" />
          </Button>
        </Box>

        {/* Popup Container */}
        <PopupContainer
          isMainApp={true}
          initialDarkMode={isDarkMode}
          onThemeChange={handleThemeChange}
          containerSx={{
            width: 420,
            height: 620,
            maxHeight: "90vh",
          }}
        />
      </Box>
    </Fade>
  );
};

export default ChromeExtensionDemo;
