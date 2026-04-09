import React, { useEffect, useState } from 'react';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import { useDebounce } from '../../hooks/useDebounce';

export const AuditLogs: React.FC = () => {
  const { logs, filters, setFilters, loading } = useAuditLogs();

  // ⚡ Bolt: Debounced local state for search input to prevent API calls on every keystroke
  const [searchTerm, setSearchTerm] = useState(filters.search);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Sync external filter changes to local state (e.g. clear filters)
  useEffect(() => {
    setSearchTerm(filters.search);
  }, [filters.search]);

  useEffect(() => {
    setFilters((prev: any) => {
      if (prev.search === debouncedSearchTerm) return prev;
      return { ...prev, search: debouncedSearchTerm };
    });
  }, [debouncedSearchTerm, setFilters]);

  return (
    <div>
      <div className="flex gap-4 mb-4">
        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-transparent dark:bg-transparent"
        >
          <option value="">All Types</option>
          <option value="user">User</option>
          <option value="system">System</option>
          <option value="security">Security</option>
        </select>
        <input
          type="text"
          placeholder="Search logs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-transparent dark:bg-transparent"
        />
      </div>

      <div className="bg-transparent dark:bg-transparent rounded-md shadow-none-none overflow-hidden">
        <table className="min-w-full divide-y divide-border/50 dark:divide-border/40">
          <thead className="bg-transparent dark:bg-neutral-900">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                Type
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                User
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                Action
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-transparent dark:bg-transparent divide-y divide-border/50 dark:divide-border/40">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-transparent dark:hover:bg-muted/20">
                <td className="px-3 py-2 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-100">
                  {log.timestamp}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-muted-foreground dark:text-muted-foreground">
                  {log.type}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-muted-foreground dark:text-muted-foreground">
                  {log.user}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-muted-foreground dark:text-muted-foreground">
                  {log.action}
                </td>
                <td className="px-3 py-2 text-sm text-muted-foreground dark:text-muted-foreground">
                  {log.details}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
