# Custom Modes for The New Fuse VSCode Extension

## Overview

The New Fuse VSCode extension now supports custom modes (agent types) that allow you to define specialized AI agents with specific capabilities, tools, and role definitions. This feature enables you to create domain-specific AI assistants tailored to your development workflow.

## Features

- **Custom Mode Management**: Create, edit, delete, import, and export custom modes
- **Configuration Integration**: Seamlessly integrates with VSCode settings
- **Multiple Mode Support**: Support for multiple specialized modes simultaneously
- **Import/Export**: Share custom modes between different environments
- **Default Modes**: Pre-configured modes for common development tasks

## Available Commands

The extension provides several commands for managing custom modes:

- `The New Fuse: Manage Custom Modes` - Interactive mode management interface
- `The New Fuse: Import Custom Modes` - Import modes from JSON file
- `The New Fuse: Export Custom Modes` - Export modes to JSON file
- `The New Fuse: Create Default Modes` - Initialize with default mode set

## Default Custom Modes

The extension includes 7 pre-configured modes:

### 1. Codebase Pathway Tracer
- **Purpose**: Technical analysis and architecture mapping
- **Color**: Purple
- **Capabilities**: Code flow tracing, dependency mapping, architectural pattern recognition

### 2. Meta Agent Architect
- **Purpose**: Agent creation and system design
- **Color**: Cyan
- **Capabilities**: Agent creation, workflow optimization, system integration

### 3. Visual Asset Creator
- **Purpose**: Visual design and asset management
- **Color**: Green
- **Capabilities**: Image generation, web optimization, brand compliance

### 4. Frontend Specialist ⭐
- **Purpose**: UI/UX design and frontend development
- **Color**: Blue
- **Capabilities**: Responsive design, accessibility, usability optimization

### 5. Graph Writer
- **Purpose**: Code visualization and diagramming
- **Color**: Orange
- **Capabilities**: Interactive graph creation, pathway visualization

### 6. Gemini CLI
- **Purpose**: Advanced code analysis and research
- **Color**: Blue
- **Capabilities**: Multimodal processing, real-time research

### 7. Agent Registry Manager
- **Purpose**: Agent management and discovery
- **Color**: Green
- **Capabilities**: Agent registration, performance tracking

## Configuration Schema

Custom modes are configured in VSCode settings under `theNewFuse.customModes`:

```json
{
  "theNewFuse.customModes": [
    {
      "name": "Mode Display Name",
      "slug": "mode-unique-identifier",
      "roleDefinition": "Detailed description of the mode's capabilities and role",
      "color": "Blue",
      "model": "preferred-model",
      "tools": ["tool1", "tool2"],
      "capabilities": ["capability1", "capability2"]
    }
  ]
}
```

### Properties

- **name** (required): Display name for the custom mode
- **slug** (required): Unique identifier (kebab-case)
- **roleDefinition** (required): Detailed role and capability description
- **color** (optional): Theme color from: Red, Blue, Green, Yellow, Purple, Orange, Pink, Cyan
- **model** (optional): Preferred AI model for the mode
- **tools** (optional): Array of available tools
- **capabilities** (optional): Array of mode capabilities

## Usage

### Managing Modes

1. Open Command Palette (`Ctrl+Shift+P`)
2. Run "The New Fuse: Manage Custom Modes"
3. Select from available actions:
   - View All Modes
   - Add New Mode
   - Edit Mode
   - Delete Mode

### Importing Modes

1. Run "The New Fuse: Import Custom Modes"
2. Select a JSON file containing mode definitions
3. Modes will be automatically loaded and saved

### Exporting Modes

1. Run "The New Fuse: Export Custom Modes"
2. Choose location to save the JSON file
3. All current modes will be exported

### Creating Default Modes

Run "The New Fuse: Create Default Modes" to initialize with the 7 pre-configured modes.

## Integration with External Systems

The VSCode extension custom modes are designed to work seamlessly with:

- **Kilo Code Settings**: The external `custom_modes.yaml` file
- **Agent System**: Integration with `.claude/agents` directory
- **MCP Servers**: Support for MCP-based tools and resources

## File Structure

```
src/vscode-extension/
├── src/
│   ├── services/
│   │   └── CustomModesManager.ts    # Core modes management
│   ├── config/
│   │   └── ConfigurationManager.ts  # VSCode config integration
│   └── extension.ts                 # Command registration
├── custom-modes-config.json         # Default modes configuration
└── package.json                     # VSCode extension manifest
```

## Best Practices

1. **Descriptive Names**: Use clear, descriptive names for your custom modes
2. **Unique Slugs**: Ensure slugs are unique and URL-friendly
3. **Detailed Role Definitions**: Provide comprehensive role definitions for better AI behavior
4. **Tool Selection**: Only include tools that are relevant to the mode's purpose
5. **Regular Backups**: Export your custom modes regularly for backup

## Troubleshooting

### Common Issues

1. **Modes Not Appearing**: Run "Create Default Modes" to initialize
2. **Import Failures**: Ensure JSON file format is valid
3. **Permission Errors**: Check VSCode workspace settings permissions

### Debug Information

Enable debug logging in VSCode settings:
```json
{
  "theNewFuse.enableDebugLogging": true
}
```

## Migration from External YAML

If you're migrating from the external `custom_modes.yaml` file:

1. Export your current modes from the external system
2. Use "Import Custom Modes" in the VSCode extension
3. The extension will automatically handle the conversion

## Contributing

To add new default modes to the extension:

1. Edit `custom-modes-config.json`
2. Update this README with the new mode information
3. Test the new mode thoroughly
4. Submit a pull request

## Support

For issues or questions about custom modes:
1. Check the troubleshooting section
2. Review VSCode extension logs
3. Open an issue in the project repository