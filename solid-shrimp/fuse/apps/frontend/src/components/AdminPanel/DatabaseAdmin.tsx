import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/shared/ui/core/Card';
import { Button } from '@/shared/ui/core/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/core/Tabs';
import { Alert, AlertTitle, AlertDescription } from '@/shared/ui/core/Alert';
import { Input } from '@/shared/ui/core/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/core/Dialog';
import { Label } from '@/shared/ui/core/Label';
import { useToast } from '@/shared/ui/core/Toast';
import { DatabaseService } from '@/services/database.service';
import { DatabaseStats, DatabaseConfig } from '@/types/database';
import { retry } from '@/utils/retry';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const TIMEOUT = 5000;

export function DatabaseAdmin() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [configs, setConfigs] = useState<DatabaseConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<DatabaseConfig | null>(null);
  const [isAddingConfig, setIsAddingConfig] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    fetchDatabaseStats();
    fetchDatabaseConfigs();
  }, []);

  const fetchDatabaseStats = async () => {
    try {
      const result = await retry(
        async () => await DatabaseService.getStats(),
        {
          maxRetries: MAX_RETRIES,
          delay: RETRY_DELAY,
          timeout: TIMEOUT
        }
      );
      setStats(result);
    } catch (err) {
      setError('Failed to fetch database statistics');
      console.error(err);
    }
  };

  const fetchDatabaseConfigs = async () => {
    try {
      const result = await retry(
        async () => await DatabaseService.getConfigurations(),
        {
          maxRetries: MAX_RETRIES,
          delay: RETRY_DELAY,
          timeout: TIMEOUT
        }
      );
      setConfigs(result);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to fetch database configurations');
      setIsLoading(false);
      console.error(err);
    }
  };

  const handleBackup = async () => {
    try {
      await DatabaseService.createBackup();
      toast({
        title: 'Success',
        description: 'Database backup created successfully',
        variant: 'success',
      });
    } catch (err) {
      setError('Failed to create database backup');
      toast({
        title: 'Error',
        description: 'Failed to create database backup',
        variant: 'destructive',
      });
      console.error(err);
    }
  };

  const handleRestore = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('backup', file);
      await DatabaseService.restoreFromBackup(formData);
      toast({
        title: 'Success',
        description: 'Database restored successfully',
        variant: 'success',
      });
    } catch (err) {
      setError('Failed to restore database');
      toast({
        title: 'Error',
        description: 'Failed to restore database',
        variant: 'destructive',
      });
      console.error(err);
    }
  };

  const handleRunMigrations = async () => {
    try {
      await DatabaseService.runMigrations();
      await fetchDatabaseStats();
      toast({
        title: 'Success',
        description: 'Database migrations completed successfully',
        variant: 'success',
      });
    } catch (err) {
      setError('Failed to run database migrations');
      toast({
        title: 'Error',
        description: 'Failed to run database migrations',
        variant: 'destructive',
      });
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Database Administration</h1>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="migrations">Migrations</TabsTrigger>
          <TabsTrigger value="backup">Backup/Restore</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardContent>
                  <h3 className="font-semibold mb-2">Connections</h3>
                  <div className="space-y-2">
                    <p>Active: {stats.connections.active}</p>
                    <p>Idle: {stats.connections.idle}</p>
                    <p>Total: {stats.connections.total}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <h3 className="font-semibold mb-2">Queries</h3>
                  <div className="space-y-2">
                    <p>Total: {stats.queries.total}</p>
                    <p>Failed: {stats.queries.failed}</p>
                    <p>Avg Duration: {stats.queries.avgDuration.toFixed(2)}ms</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <h3 className="font-semibold mb-2">Tables</h3>
                  <div className="space-y-2">
                    <p>Count: {stats.tables.count}</p>
                    <p>Total Rows: {stats.tables.totalRows}</p>
                    <p>Size: {(stats.tables.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="connections">
          <div className="space-y-4">
            <Button onClick={() => setIsAddingConfig(true)}>Add Connection</Button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {configs.map((config) => (
                <Card key={config.database}>
                  <CardContent>
                    <h3 className="font-semibold">{config.database}</h3>
                    <p>Type: {config.type}</p>
                    <p>Host: {config.host}:{config.port}</p>
                    <Button variant="secondary" onClick={() => setSelectedConfig(config)}>
                      Edit
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="migrations">
          <Card>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Migration Status</h3>
                  {stats && (
                    <div className="space-y-2">
                      <p>Pending: {stats.migrations.pending}</p>
                      <p>Executed: {stats.migrations.executed}</p>
                      <p>Failed: {stats.migrations.failed}</p>
                    </div>
                  )}
                </div>

                <Button onClick={handleRunMigrations}>Run Migrations</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup">
          <Card>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Backup</h3>
                  <Button onClick={handleBackup}>Create Backup</Button>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Restore</h3>
                  <Input
                    type="file"
                    accept=".sql"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleRestore(file);
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isAddingConfig} onOpenChange={setIsAddingConfig}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Database Connection</DialogTitle>
          </DialogHeader>
          <form className="space-y-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <select id="type" className="w-full">
                <option value="postgres">PostgreSQL</option>
                <option value="mysql">MySQL</option>
                <option value="sqlite">SQLite</option>
              </select>
            </div>
            <div>
              <Label htmlFor="host">Host</Label>
              <Input id="host" />
            </div>
            <div>
              <Label htmlFor="port">Port</Label>
              <Input id="port" type="number" />
            </div>
            <div>
              <Label htmlFor="database">Database</Label>
              <Input id="database" />
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input id="username" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" />
            </div>
            <Button type="submit">Add Connection</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
