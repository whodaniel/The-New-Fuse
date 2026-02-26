import { Task } from '@/types/core'; // Assuming Task interface is available from core
import axios from 'axios'; // Import axios
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { Calendar as ReactCalendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Base URL for your API - adjust as needed
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const fetchScheduledTasks = async (): Promise<Task[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/tasks`);
    // Filter for tasks that are 'pending' or have a 'scheduledAt' date in the future
    return response.data.filter(
      (task: Task) =>
        task.status === 'pending' || (task.scheduledAt && new Date(task.scheduledAt) > new Date())
    );
  } catch (error) {
    console.error('Failed to fetch scheduled tasks:', error);
    return [];
  }
};

const localizer = momentLocalizer(moment);

const TaskCalendar: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getTasks = async () => {
      try {
        setLoading(true);
        const fetchedTasks = await fetchScheduledTasks();
        setTasks(fetchedTasks);
      } catch (err) {
        setError('Failed to fetch tasks.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    getTasks();
  }, []);

  const events = tasks.map((task) => ({
    id: task.id,
    title: `Task: ${task.type} (${task.status})`,
    start: task.scheduledAt ? new Date(task.scheduledAt) : new Date(task.createdAt),
    end: moment(task.scheduledAt ? new Date(task.scheduledAt) : new Date(task.createdAt))
      .add(1, 'hour')
      .toDate(), // Assuming 1 hour duration for display
    allDay: false,
    resource: task,
  }));

  if (loading) {
    return <div className="p-4">Loading scheduled tasks...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Scheduled Agent Tasks</h1>
      <div style={{ height: 700 }}>
        <ReactCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 500 }}
        />
      </div>
    </div>
  );
};

export default TaskCalendar;
