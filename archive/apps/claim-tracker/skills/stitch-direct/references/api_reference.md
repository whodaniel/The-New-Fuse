# Stitch MCP API Reference

## Tools Overview

### `create_project`

Creates a new Stitch project.

- **Inputs**: `title` (string, optional)
- **Outputs**: Project metadata including `name` (format: `projects/{id}`).

### `list_projects`

Lists all Stitch projects for the authenticated account.

- **Inputs**: None
- **Outputs**: List of project objects.

### `generate_screen_from_text`

Generates a UI screen based on a text prompt.

- **Inputs**:
  - `projectId` (string, required): The ID part of `projects/{id}`.
  - `prompt` (string, required): The UI description.
  - `deviceType` (string, optional): `DESKTOP`, `MOBILE`, `TABLET`, `AGNOSTIC`.
- **Outputs**: Design session metadata including screen IDs.

### `list_screens`

Lists all screens in a specific project.

- **Inputs**: `projectId` (string, required).
- **Outputs**: List of screen objects.

### `fetch_screen_code`

Retrieves the HTML/CSS code for a specific screen.

- **Inputs**:
  - `projectId` (string, required)
  - `screenId` (string, required)
- **Outputs**: The full HTML content.

### `fetch_screen_image`

Retrieves the screenshot/preview image for a specific screen.

- **Inputs**:
  - `projectId` (string, required)
  - `screenId` (string, required)
- **Outputs**: Image metadata and download URL.

## Authentication

The `stitch-mcp` server requires the `STITCH_API_KEY` environment variable to be
set.
