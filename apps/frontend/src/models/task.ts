export class TaskUtils {
    static isOverdue(task) {
        if (!task.dueDate)
            return false;
        return new Date() > new Date(task.dueDate);
    }
    static calculateProgress(task) {
        const statusWeights = {
            [TaskStatus.PENDING]: 0,
            [TaskStatus.IN_PROGRESS]: 50,
            [TaskStatus.COMPLETED]: 100,
            [TaskStatus.FAILED]: 0,
            [TaskStatus.CANCELLED]: 0
        };
        return statusWeights[task.status];
    }
    static getPriorityLevel(task) {
        const priorityWeights = {
            [TaskPriority.LOW]: 1,
            [TaskPriority.MEDIUM]: 2,
            [TaskPriority.HIGH]: 3,
            [TaskPriority.CRITICAL]: 4
        };
        return priorityWeights[task.priority];
    }
    static calculateTimeSpent(timeTrackings) {
        return timeTrackings.reduce((total, tracking) => {
            if (tracking.duration) {
                return total + tracking.duration;
            }
            if (tracking.endTime) {
                return (total +
                    (new Date(tracking.endTime).getTime() -
                        new Date(tracking.startTime).getTime()));
            }
            return total;
        }, 0);
    }
    static sortTasks(tasks, sortBy, order) {
        return [...tasks].sort((a, b) => {
            const aValue = a[sortBy];
            const bValue = b[sortBy];
            if (aValue < bValue)
                return order === 'asc' ? -1 : 1;
            if (aValue > bValue)
                return order === 'asc' ? 1 : -1;
            return 0;
        });
    }
    static filterTasks(tasks, filters) {
        return tasks.filter(task => {
            if (filters.status && !filters.status.includes(task.status))
                return false;
            if (filters.priority && !filters.priority.includes(task.priority))
                return false;
            if (filters.assigneeId &&
                task.assigneeId &&
                !filters.assigneeId.includes(task.assigneeId))
                return false;
            if (filters.departmentId &&
                task.departmentId &&
                !filters.departmentId.includes(task.departmentId))
                return false;
            if (filters.tags &&
                !filters.tags.some(tag => task.tags.includes(tag)))
                return false;
            return true;
        });
    }
}
//# sourceMappingURL=task.js.map