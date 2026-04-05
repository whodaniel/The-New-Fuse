# Log File Cleanup Skill

## Purpose

This skill scans the system for large log files and deletes them to free up disk space, ensuring efficient system performance and preventing potential issues due to full disks.

## Prerequisites

- Access to the system's file system
- Permission to read and delete files
- A defined threshold for what constitutes a 'large' log file (e.g., size in MB)

## Implementation Steps

1. **Identify Large Log Files**: Scan the system's log directories for files exceeding the defined size threshold.
2. **Verify Files Are Safe to Delete**: Ensure the identified files are not currently in use by any processes and are indeed log files that can be safely deleted.
3. **Delete Identified Files**: Remove the verified large log files from the system.
4. **Confirm Deletion and Log Results**: Verify the deletion was successful and log the outcome for auditing purposes.

## Success Criteria

- Large log files are successfully identified and deleted.
- Disk space is freed up.
- The system's performance is improved or maintained.
- No critical system files are deleted.