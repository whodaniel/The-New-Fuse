# Monitoring Roo's Output

This guide explains how to use the monitoring system to view and track Roo's output in real-time.

## Components Overview

1. **RooMonitoringService**
   - Handles all Roo's output events
   - Processes tasks, notifications, and commands
   - Emits processed events for other services

2. **NotificationService**
   - Subscribes to Roo's processed output
   - Provides logging and error handling
   - Can be extended for custom notifications

3. **RooOutputViewer Component**
   - Visual interface for monitoring Roo's output
   - Displays output logs and errors in real-time
   - Provides timestamp and type information

## How to Use

1. **Start the Application**
   The monitoring system is automatically initialized when the application starts, as it's configured in the AppModule.

2. **Access the Output Viewer**
   - Navigate to the monitoring interface where the RooOutputViewer component is implemented
   - The viewer will automatically display new outputs as they occur

3. **Understanding the Output**
   The viewer displays two main sections:
   - **Output Log**: Shows all processed outputs from Roo with timestamps and types
   - **Error Log**: Displays any errors that occur during Roo's operation

4. **Output Types**
   Roo's output is categorized into:
   - Tasks: Processed task-related outputs
   - Notifications: System notifications
   - Commands: Command execution results

## Extending the System

The monitoring system can be extended by:
1. Adding custom event handlers in NotificationService
2. Implementing additional UI components
3. Creating custom notification channels

## Troubleshooting

If you're not seeing Roo's output:
1. Verify that the EventEmitterModule is properly configured
2. Check that the RooMonitoringService is running
3. Ensure the RooOutputViewer component is properly integrated