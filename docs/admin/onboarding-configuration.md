# Onboarding Configuration Guide

This guide explains how to configure the onboarding experience for users of The New Fuse platform using the Admin Control Panel.

## Overview

The onboarding configuration allows you to customize the onboarding experience for different types of users. You can configure:

- General settings for the onboarding process
- User types and detection methods
- Onboarding steps and their content
- AI capabilities used during onboarding
- Preview and validate the onboarding experience

## Accessing the Onboarding Configuration

1. Log in to The New Fuse platform with an administrator account
2. Navigate to the Admin Control Panel
3. Click on "Onboarding" in the sidebar navigation

## General Settings

The General Settings tab allows you to configure basic settings for the onboarding process:

### General Options

- **Enable onboarding for new users**: Turn onboarding on or off for all new users
- **Skip onboarding for returning users**: Allow returning users to bypass onboarding
- **Allow users to skip onboarding**: Let users skip the onboarding process
- **Require email verification**: Require users to verify their email before starting onboarding

### Appearance

- **Logo URL**: URL to your organization's logo
- **Primary Color**: Main color used in the onboarding UI
- **Secondary Color**: Accent color used in the onboarding UI
- **Background Image URL**: Optional background image for the onboarding screens

### Content

- **Welcome Title**: Main heading shown on the welcome screen
- **Welcome Message**: Introductory message explaining your platform

### Behavior

- **Session Timeout**: How long (in minutes) before an inactive onboarding session expires
- **Save progress automatically**: Automatically save user progress during onboarding
- **Redirect After Completion**: Where to send users after completing onboarding

### Analytics

- **Track onboarding analytics**: Collect data about onboarding completion rates
- **Collect user feedback**: Ask users for feedback about the onboarding process

## User Types

The User Types tab allows you to define different types of users and how they are detected:

### Managing User Types

- **Add User Type**: Create a new user type
- **Edit User Type**: Modify an existing user type
- **Delete User Type**: Remove a user type

### User Type Properties

- **ID**: Unique identifier for the user type
- **Name**: Display name for the user type
- **Description**: Explanation of this user type
- **Enabled**: Whether this user type is active
- **Detection Method**: How to identify users of this type
  - **HTTP Header**: Detect based on HTTP headers
  - **Authentication Type**: Detect based on authentication method
  - **Behavior Analysis**: Detect based on user behavior
  - **Manual Selection**: Let users select their type
- **Onboarding Flow**: Which onboarding flow to use for this user type
- **Priority**: Order in which detection methods are evaluated (higher numbers = higher priority)

## Onboarding Steps

The Onboarding Steps tab allows you to configure the steps in the onboarding wizard:

### Managing Steps

- **Add Step**: Create a new step in the wizard
- **Edit Step**: Modify an existing step
- **Delete Step**: Remove a step
- **Reorder Steps**: Drag and drop to change the order of steps
- **Enable/Disable Steps**: Toggle steps on or off without deleting them

### Step Properties

- **Step Type**: The type of step (welcome, profile, workspace, etc.)
- **Title**: Display name for the step
- **Description**: Brief explanation of the step
- **Enabled**: Whether this step is active
- **Required**: Whether users must complete this step
- **User Types**: Which user types will see this step
- **Content**: The content shown in this step
  - **Heading**: Main title for the step
  - **Subheading**: Secondary text for the step
  - **Image URL**: Optional image to display
  - **Button Text**: Text for the primary button

## AI Settings

The AI Settings tab allows you to configure the AI capabilities used during onboarding:

### RAG Settings

- **Enable RAG**: Turn on Retrieval Augmented Generation
- **Default Embedding Model**: Model used to convert text to vector embeddings
- **Vector Database**: Database used to store and retrieve embeddings
- **Vector Database Configuration**: Connection settings for the vector database

### LLM Settings

- **Default LLM Provider**: Provider for language models (OpenAI, Anthropic, etc.)
- **Default Model**: Specific language model to use
- **Default Temperature**: Controls randomness in responses (0-1)
- **Default Max Tokens**: Maximum length of generated responses

### Greeter Agent

- **Enable Greeter Agent**: Turn on the AI assistant for onboarding
- **Agent Name**: Name of the assistant
- **Agent Avatar URL**: Image for the assistant
- **System Prompt**: Instructions that define the assistant's behavior
- **Knowledge Base**: Sources of information the assistant can access

### Multimodal Settings

- **Enable Multimodal Support**: Allow processing of images, audio, etc.
- **Supported Modalities**: Which modalities are supported (text, image, audio)
- **Image Analysis Model**: Model used to analyze images
- **Audio Transcription Model**: Model used to transcribe audio

### Advanced Settings

- **Enable Debug Mode**: Show debugging information during onboarding
- **Log User Interactions**: Record user interactions with AI
- **Max Concurrent Requests**: Maximum number of simultaneous AI requests
- **Request Timeout**: How long to wait for AI responses
- **Fallback Behavior**: What to do if AI services are unavailable

## Wizard Preview

The Wizard Preview tab allows you to see how the onboarding experience will look to users:

### Preview Options

- **User Type**: Switch between different user types to see their experience
- **Refresh Preview**: Update the preview with the latest configuration
- **Fullscreen**: View the preview in fullscreen mode
- **Open in New Tab**: Open the preview in a separate browser tab

### Validation

- **Run Validation**: Check your configuration for errors or warnings
- **Validation Results**: See any issues with your configuration
- **Best Practices**: Tips for creating an effective onboarding experience

### Analytics

- **Completion Rate**: Percentage of users who complete onboarding
- **Average Time Spent**: How long users spend in onboarding
- **Drop-off Points**: Where users abandon the onboarding process
- **User Type Distribution**: Breakdown of user types

## Best Practices

- Keep the onboarding process short (5-7 steps for humans, 3-4 for AI agents)
- Use clear, concise language in all steps
- Include visual cues to guide users
- Show progress indicators so users know how far they've come
- Allow users to skip non-essential steps
- Test the onboarding experience with real users
- Regularly review analytics to identify areas for improvement

## Troubleshooting

- **Configuration not saving**: Ensure you have admin privileges and check your network connection
- **Preview not updating**: Try refreshing the preview or clearing your browser cache
- **Validation errors**: Address all issues listed in the validation results
- **AI features not working**: Check your API keys and connection settings
- **Users not seeing correct steps**: Verify user type detection and step assignments
