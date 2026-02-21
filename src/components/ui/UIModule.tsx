import React, { forwardRef, useState } from "react";
import { Command as CommandPrimitive } from "cmdk";
import { cn } from '../../lib/utils.js';
import { Card, CardContent } from '../core/Card.js';
import MonacoEditor from '../core/MonacoEditor.js';

interface CommandItem {
  id: string;
  name: string;
  shortcut?: string;
  action: () => void;
}

interface Category {
  name: string;
  commands: CommandItem[];
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories?: Category[];
  recentCommands?: CommandItem[];
}

interface MetricItem {
  label: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down" | "neutral";
  description?: string;
  sparkline?: number[];
}

interface MetricsProps {
  metrics: MetricItem[];
  loading?: boolean;
}

interface PlaygroundProps {
  code: string;
  onChange: (code: string) => void;
  onRun: () => void;
  output?: string;
  language?: string;
  theme?: "vs-dark" | "light";
  loading?: boolean;
  error?: string;
}

export const CommandPalette = forwardRef<HTMLDivElement, CommandPaletteProps>(
  ({ open, onOpenChange, categories = [], recentCommands = [] }, _ref) => {
    const [search, setSearch] = useState("");

    return (
      <CommandPrimitive.Dialog
        open={open}
        onOpenChange={onOpenChange}
        className="fixed inset-0 z-50 overflow-hidden p-4 sm:p-6 md:p-20"
      >
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" />
        <CommandPrimitive className="relative bg-popover max-w-2xl mx-auto rounded-xl shadow-lg">
          <CommandPrimitive.Input
            value={search}
            onValueChange={setSearch}
            placeholder="Type a command or search..."
            className="w-full border-none outline-none bg-transparent p-4"
          />
          <CommandPrimitive.List className="max-h-[300px] overflow-y-auto p-2">
            {recentCommands.length > 0 && (
              <CommandPrimitive.Group heading="Recent">
                {recentCommands.map((command) => (
                  <CommandPrimitive.Item
                    key={command.id}
                    onSelect={() => command.action()}
                    className="flex items-center justify-between px-2 py-1"
                  >
                    <span>{command.name}</span>
                    {command.shortcut && (
                      <kbd className="ml-2 text-xs text-muted-foreground">
                        {command.shortcut}
                      </kbd>
                    )}
                  </CommandPrimitive.Item>
                ))}
              </CommandPrimitive.Group>
            )}
            {categories.map((category) => (
              <CommandPrimitive.Group 
                key={category.name}
                heading={category.name}
              >
                {category.commands.map((command) => (
                  <CommandPrimitive.Item
                    key={command.id}
                    onSelect={() => command.action()}
                    className="flex items-center justify-between px-2 py-1"
                  >
                    <span>{command.name}</span>
                    {command.shortcut && (
                      <kbd className="ml-2 text-xs text-muted-foreground">
                        {command.shortcut}
                      </kbd>
                    )}
                  </CommandPrimitive.Item>
                ))}
              </CommandPrimitive.Group>
            ))}
          </CommandPrimitive.List>
        </CommandPrimitive>
      </CommandPrimitive.Dialog>
    );
  }
);

CommandPalette.displayName = "CommandPalette";

export const Metrics = forwardRef<HTMLDivElement, MetricsProps>(
  ({ metrics, loading = false }, ref) => {
    return (
      <div ref={ref} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 w-1/2 bg-muted rounded" />
                  <div className="mt-4 h-8 w-full bg-muted rounded" />
                </CardContent>
              </Card>
            ))
          : metrics.map((metric, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">
                      {metric.label}
                    </p>
                    {metric.trend && (
                      <span
                        className={cn(
                          "text-xs",
                          metric.trend === "up" && "text-green-500",
                          metric.trend === "down" && "text-red-500"
                        )}
                      >
                        {metric.change}%
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold">{metric.value}</span>
                    {metric.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {metric.description}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>
    );
  }
);

Metrics.displayName = "Metrics";

export const Playground = forwardRef<HTMLDivElement, PlaygroundProps>(
  ({
    code,
    onChange,
    onRun,
    output,
    language = "javascript",
    theme = "vs-dark",
    loading = false,
    error,
  }, ref) => {
    return (
      <div ref={ref} className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-card">
          <div className="flex items-center justify-between border-b p-4">
            <h3 className="font-semibold">Code Editor</h3>
            <div className="flex items-center space-x-2">
              <select
                value={language}
                onChange={(e) => onChange(e.target.value)}
                className="rounded border bg-transparent px-2 py-1 text-sm"
                aria-label="Select programming language"
                title="Programming language selector"
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
              </select>
              <button
                onClick={onRun}
                disabled={loading}
                className={cn(
                  "rounded bg-primary px-3 py-1 text-sm text-primary-foreground transition-colors",
                  loading && "opacity-50 cursor-not-allowed"
                )}
              >
                {loading ? "Running..." : "Run"}
              </button>
            </div>
          </div>
          <div className="relative h-[400px]">
            <MonacoEditor
              value={code}
              onChange={onChange}
              language={language}
              height="100%"
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                lineNumbers: "on",
                roundedSelection: false,
                automaticLayout: true,
                theme,
                readOnly: loading,
                folding: true,
                renderLineHighlight: "line",
                formatOnPaste: true,
                formatOnType: true,
                suggestOnTriggerCharacters: true,
                parameterHints: { enabled: true },
              }}
            />
          </div>
        </div>
        <div className="rounded-lg border bg-card">
          <div className="border-b p-4">
            <h3 className="font-semibold">Output</h3>
          </div>
          <div className="p-4">
            {error ? (
              <div className="rounded bg-red-50 p-4 text-red-900">
                <p className="font-medium">Error</p>
                <pre className="mt-2 text-sm">{error}</pre>
              </div>
            ) : (
              <pre className="font-mono text-sm whitespace-pre-wrap">
                {output || "Run your code to see the output"}
              </pre>
            )}
          </div>
        </div>
      </div>
    );
  }
);

Playground.displayName = "Playground";

export { CommandPalette, Metrics, Playground };
