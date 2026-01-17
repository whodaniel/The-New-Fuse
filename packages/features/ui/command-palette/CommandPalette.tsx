import {
  Bot,
  Cloud,
  Code,
  Database,
  Docker,
  FileCode,
  GitBranch,
  Package,
  Play,
  Search,
  Sparkles,
  TestTube,
  Wrench,
  Zap,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Command Category Types
 */
export type CommandCategory =
  | 'development'
  | 'build'
  | 'test'
  | 'database'
  | 'docker'
  | 'deployment'
  | 'agents'
  | 'workflows'
  | 'quality'
  | 'utilities'
  | 'claude'
  | 'scripts';

/**
 * Command Interface
 */
export interface Command {
  id: string;
  name: string;
  description: string;
  command: string;
  category: CommandCategory;
  tags: string[];
  icon?: React.ComponentType<any>;
  dangerous?: boolean;
  requiresConfirmation?: boolean;
  environment?: 'local' | 'docker' | 'production' | 'all';
}

/**
 * Category Configuration
 */
const CATEGORIES: Record<
  CommandCategory,
  {
    label: string;
    icon: React.ComponentType<any>;
    color: string;
    bgColor: string;
  }
> = {
  development: {
    label: 'Development',
    icon: Code,
    color: '#3B82F6',
    bgColor: '#EFF6FF',
  },
  build: {
    label: 'Build',
    icon: Package,
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
  },
  test: {
    label: 'Testing',
    icon: TestTube,
    color: '#10B981',
    bgColor: '#ECFDF5',
  },
  database: {
    label: 'Database',
    icon: Database,
    color: '#F59E0B',
    bgColor: '#FEF3C7',
  },
  docker: {
    label: 'Docker',
    icon: Docker,
    color: '#06B6D4',
    bgColor: '#CFFAFE',
  },
  deployment: {
    label: 'Deployment',
    icon: Cloud,
    color: '#EC4899',
    bgColor: '#FCE7F3',
  },
  agents: {
    label: 'Agents',
    icon: Bot,
    color: '#6366F1',
    bgColor: '#EEF2FF',
  },
  workflows: {
    label: 'Workflows',
    icon: GitBranch,
    color: '#14B8A6',
    bgColor: '#CCFBF1',
  },
  quality: {
    label: 'Code Quality',
    icon: Sparkles,
    color: '#F97316',
    bgColor: '#FFEDD5',
  },
  utilities: {
    label: 'Utilities',
    icon: Wrench,
    color: '#64748B',
    bgColor: '#F1F5F9',
  },
  claude: {
    label: 'Claude Commands',
    icon: Zap,
    color: '#A855F7',
    bgColor: '#FAF5FF',
  },
  scripts: {
    label: 'Scripts',
    icon: FileCode,
    color: '#EF4444',
    bgColor: '#FEE2E2',
  },
};

/**
 * All Available Commands
 */
const COMMANDS: Command[] = [
  // Development Commands
  {
    id: 'dev',
    name: 'Start Development',
    description: 'Start frontend + API gateway with Turbo',
    command: 'pnpm dev',
    category: 'development',
    tags: ['start', 'dev', 'local', 'frontend', 'api'],
    icon: Play,
  },
  {
    id: 'dev-all',
    name: 'Start All Services',
    description: 'Start all services with 50 concurrent processes',
    command: 'pnpm dev:all',
    category: 'development',
    tags: ['start', 'dev', 'all', 'services'],
    icon: Play,
  },
  {
    id: 'dev-api',
    name: 'Start API Server',
    description: 'Start just the API server',
    command: 'pnpm dev:api',
    category: 'development',
    tags: ['start', 'dev', 'api', 'backend'],
  },
  {
    id: 'dev-frontend',
    name: 'Start Frontend',
    description: 'Start just the frontend app',
    command: 'pnpm dev:frontend',
    category: 'development',
    tags: ['start', 'dev', 'frontend', 'react'],
  },
  {
    id: 'dev-gateway',
    name: 'Start API Gateway',
    description: 'Start just the API gateway',
    command: 'pnpm dev:gateway',
    category: 'development',
    tags: ['start', 'dev', 'gateway', 'api'],
  },
  {
    id: 'dev-low-memory',
    name: 'Low Memory Dev Mode',
    description: 'Optimized dev with memory limiting (1GB)',
    command: 'pnpm dev:low-memory',
    category: 'development',
    tags: ['start', 'dev', 'memory', 'optimized'],
  },
  {
    id: 'relay-start',
    name: 'Start Relay Server',
    description: 'Start relay core service',
    command: 'pnpm relay:start',
    category: 'development',
    tags: ['start', 'relay', 'server'],
  },

  // Build Commands
  {
    id: 'build',
    name: 'Production Build',
    description: 'Main production build (excludes specific packages)',
    command: 'pnpm build',
    category: 'build',
    tags: ['build', 'production', 'compile'],
    icon: Package,
  },
  {
    id: 'build-production',
    name: 'Full Production Build',
    description: 'Full production build with cleanup',
    command: 'pnpm build:production',
    category: 'build',
    tags: ['build', 'production', 'clean'],
  },
  {
    id: 'build-packages',
    name: 'Build All Packages',
    description: 'Build all workspace packages',
    command: 'pnpm build:packages',
    category: 'build',
    tags: ['build', 'packages', 'workspace'],
  },
  {
    id: 'build-apps',
    name: 'Build All Apps',
    description: 'Build all applications',
    command: 'pnpm build:apps',
    category: 'build',
    tags: ['build', 'apps', 'applications'],
  },
  {
    id: 'build-adaptive',
    name: 'Adaptive Build',
    description: 'Auto-detect and apply optimal build strategy',
    command: 'pnpm build:adaptive',
    category: 'build',
    tags: ['build', 'adaptive', 'smart', 'optimized'],
  },
  {
    id: 'build-memory-optimized',
    name: 'Memory-Optimized Build',
    description: 'Build with 2GB memory limit',
    command: 'pnpm build:memory-optimized',
    category: 'build',
    tags: ['build', 'memory', 'optimized'],
  },
  {
    id: 'build-health-check',
    name: 'Build Health Check',
    description: 'Comprehensive build health check',
    command: 'pnpm build:health-check',
    category: 'build',
    tags: ['build', 'health', 'check', 'validate'],
  },

  // Test Commands
  {
    id: 'test',
    name: 'Run All Tests',
    description: 'Run all tests via Turbo',
    command: 'pnpm test',
    category: 'test',
    tags: ['test', 'all', 'unit', 'integration'],
    icon: TestTube,
  },
  {
    id: 'test-unit',
    name: 'Unit Tests',
    description: 'Run unit tests only',
    command: 'pnpm test:unit',
    category: 'test',
    tags: ['test', 'unit'],
  },
  {
    id: 'test-integration',
    name: 'Integration Tests',
    description: 'Run integration tests only',
    command: 'pnpm test:integration',
    category: 'test',
    tags: ['test', 'integration'],
  },
  {
    id: 'test-e2e',
    name: 'E2E Tests',
    description: 'Run end-to-end tests with Playwright',
    command: 'pnpm test:e2e',
    category: 'test',
    tags: ['test', 'e2e', 'playwright'],
  },
  {
    id: 'test-watch',
    name: 'Test Watch Mode',
    description: 'Watch mode testing',
    command: 'pnpm test:watch',
    category: 'test',
    tags: ['test', 'watch', 'continuous'],
  },
  {
    id: 'test-coverage',
    name: 'Test Coverage',
    description: 'Generate coverage reports',
    command: 'pnpm test:coverage',
    category: 'test',
    tags: ['test', 'coverage', 'report'],
  },

  // Database Commands
  {
    id: 'db-generate',
    name: 'Generate Migrations',
    description: 'Generate database migrations (Drizzle)',
    command: 'pnpm db:generate',
    category: 'database',
    tags: ['database', 'migration', 'generate', 'drizzle'],
    icon: Database,
  },
  {
    id: 'db-migrate',
    name: 'Run Migrations',
    description: 'Run database migrations',
    command: 'pnpm db:migrate',
    category: 'database',
    tags: ['database', 'migration', 'run'],
  },
  {
    id: 'db-push',
    name: 'Push Schema',
    description: 'Push schema to database',
    command: 'pnpm db:push',
    category: 'database',
    tags: ['database', 'schema', 'push'],
  },
  {
    id: 'db-studio',
    name: 'Drizzle Studio',
    description: 'Open Drizzle Studio',
    command: 'pnpm db:studio',
    category: 'database',
    tags: ['database', 'studio', 'gui', 'drizzle'],
  },
  {
    id: 'db-check',
    name: 'Check Schema',
    description: 'Check database schema',
    command: 'pnpm db:check',
    category: 'database',
    tags: ['database', 'schema', 'check', 'validate'],
  },

  // Docker Commands
  {
    id: 'docker-start',
    name: 'Start Docker',
    description: 'Start Docker containers (PostgreSQL + Redis)',
    command: 'pnpm docker:start',
    category: 'docker',
    tags: ['docker', 'start', 'containers', 'postgres', 'redis'],
    icon: Docker,
  },
  {
    id: 'docker-stop',
    name: 'Stop Docker',
    description: 'Stop Docker containers',
    command: 'pnpm docker:stop',
    category: 'docker',
    tags: ['docker', 'stop', 'containers'],
  },
  {
    id: 'docker-status',
    name: 'Docker Status',
    description: 'Check container status',
    command: 'pnpm docker:status',
    category: 'docker',
    tags: ['docker', 'status', 'check'],
  },
  {
    id: 'docker-logs',
    name: 'Docker Logs',
    description: 'View container logs',
    command: 'pnpm docker:logs',
    category: 'docker',
    tags: ['docker', 'logs', 'debug'],
  },

  // Code Quality Commands
  {
    id: 'lint',
    name: 'Lint Code',
    description: 'Run ESLint across all packages',
    command: 'pnpm lint',
    category: 'quality',
    tags: ['lint', 'eslint', 'code-quality'],
    icon: Sparkles,
  },
  {
    id: 'lint-fix',
    name: 'Lint & Fix',
    description: 'Run ESLint with auto-fix',
    command: 'pnpm lint:fix',
    category: 'quality',
    tags: ['lint', 'fix', 'auto-fix'],
  },
  {
    id: 'format',
    name: 'Format Code',
    description: 'Format code with Prettier',
    command: 'pnpm format',
    category: 'quality',
    tags: ['format', 'prettier', 'code-style'],
  },
  {
    id: 'type-check',
    name: 'Type Check',
    description: 'TypeScript type checking',
    command: 'pnpm type-check',
    category: 'quality',
    tags: ['typescript', 'type-check', 'validate'],
  },
  {
    id: 'health-check',
    name: 'Full Health Check',
    description: 'Full health check (type-check + test + build)',
    command: 'pnpm health-check',
    category: 'quality',
    tags: ['health', 'check', 'validate', 'all'],
  },

  // Utilities
  {
    id: 'clean',
    name: 'Clean Build Artifacts',
    description: 'Clean build artifacts',
    command: 'pnpm clean',
    category: 'utilities',
    tags: ['clean', 'artifacts', 'build'],
    icon: Wrench,
    requiresConfirmation: true,
  },
  {
    id: 'clean-all',
    name: 'Deep Clean',
    description: 'Deep clean (node_modules + reinstall)',
    command: 'pnpm clean:all',
    category: 'utilities',
    tags: ['clean', 'deep', 'node_modules', 'reinstall'],
    dangerous: true,
    requiresConfirmation: true,
  },
  {
    id: 'clear-ports',
    name: 'Clear Ports',
    description: 'Clear stuck ports',
    command: 'pnpm clear-ports',
    category: 'utilities',
    tags: ['ports', 'clear', 'stuck'],
  },

  // Claude Commands
  {
    id: 'claude-agent-register',
    name: 'Register Agent',
    description: 'Register new agent with registry',
    command: '/agent-register',
    category: 'claude',
    tags: ['claude', 'agent', 'register'],
    icon: Zap,
  },
  {
    id: 'claude-agent-status',
    name: 'Agent Status',
    description: 'Check agent status and metrics',
    command: '/agent-status',
    category: 'claude',
    tags: ['claude', 'agent', 'status'],
  },
  {
    id: 'claude-workflow-create',
    name: 'Create Workflow',
    description: 'Create multi-agent workflows',
    command: '/workflow-create',
    category: 'claude',
    tags: ['claude', 'workflow', 'create'],
  },
  {
    id: 'claude-self-improve',
    name: 'Self Improvement',
    description: 'Run improvement cycle with 5 agents',
    command: '/self-improve',
    category: 'claude',
    tags: ['claude', 'improve', 'agents'],
  },
  {
    id: 'claude-skill-load',
    name: 'Load Claude Skill',
    description: 'Load skills from Anthropic repository',
    command: '/skill-load',
    category: 'claude',
    tags: ['claude', 'skill', 'load'],
  },
];

/**
 * Command Palette Component
 */
export const CommandPalette: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onExecute?: (command: Command) => void;
}> = ({ isOpen, onClose, onExecute }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CommandCategory | 'all'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState<Command | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const commandListRef = useRef<HTMLDivElement>(null);

  // Filter commands based on search and category
  const filteredCommands = useMemo(() => {
    let commands = COMMANDS;

    // Filter by category
    if (selectedCategory !== 'all') {
      commands = commands.filter((cmd) => cmd.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      commands = commands.filter(
        (cmd) =>
          cmd.name.toLowerCase().includes(query) ||
          cmd.description.toLowerCase().includes(query) ||
          cmd.command.toLowerCase().includes(query) ||
          cmd.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return commands;
  }, [searchQuery, selectedCategory]);

  // Reset selection when filtered commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev < filteredCommands.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            handleExecute(filteredCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Scroll selected command into view
  useEffect(() => {
    if (commandListRef.current) {
      const selectedElement = commandListRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const handleExecute = useCallback(
    (command: Command) => {
      if (command.requiresConfirmation || command.dangerous) {
        setShowConfirmation(command);
      } else {
        onExecute?.(command);
        onClose();
      }
    },
    [onExecute, onClose]
  );

  const handleConfirmedExecute = useCallback(() => {
    if (showConfirmation) {
      onExecute?.(showConfirmation);
      setShowConfirmation(null);
      onClose();
    }
  }, [showConfirmation, onExecute, onClose]);

  if (!isOpen) return null;

  const categoryConfig = selectedCategory !== 'all' ? CATEGORIES[selectedCategory] : null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Command Palette */}
      <div className="fixed inset-x-0 top-20 mx-auto max-w-4xl z-50 px-4">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
          {/* Search Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search commands... (type to filter)"
                className="flex-1 outline-none text-lg placeholder-gray-400"
              />
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded">
                ESC
              </kbd>
            </div>
          </div>

          {/* Category Filter */}
          <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 overflow-x-auto">
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                All Commands
              </button>
              {(Object.keys(CATEGORIES) as CommandCategory[]).map((category) => {
                const config = CATEGORIES[category];
                const Icon = config.icon;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                      selectedCategory === category
                        ? 'text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                    style={selectedCategory === category ? { backgroundColor: config.color } : {}}
                  >
                    <Icon className="w-4 h-4" />
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Command List */}
          <div ref={commandListRef} className="max-h-96 overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium">No commands found</p>
                <p className="text-sm mt-1">Try a different search term</p>
              </div>
            ) : (
              filteredCommands.map((command, index) => {
                const config = CATEGORIES[command.category];
                const Icon = command.icon || config.icon;
                const isSelected = index === selectedIndex;

                return (
                  <button
                    key={command.id}
                    onClick={() => handleExecute(command)}
                    className={`w-full px-6 py-3 flex items-start gap-4 hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-blue-50' : ''
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{
                        backgroundColor: config.bgColor,
                        color: config.color,
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">{command.name}</h3>
                        {command.dangerous && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
                            DANGER
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">{command.description}</p>
                      <code className="inline-block mt-1.5 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded font-mono">
                        {command.command}
                      </code>
                    </div>

                    {/* Shortcut Hint */}
                    {isSelected && (
                      <kbd className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded flex-shrink-0">
                        ↵
                      </kbd>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded">↓</kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded">↵</kbd>
                <span>Execute</span>
              </div>
            </div>
            <div className="text-gray-400">
              {filteredCommands.length} command{filteredCommands.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  showConfirmation.dangerous ? 'bg-red-100' : 'bg-yellow-100'
                }`}
              >
                {showConfirmation.dangerous ? (
                  <span className="text-2xl">⚠️</span>
                ) : (
                  <span className="text-2xl">❓</span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Confirm Execution</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Are you sure you want to run this command?
                </p>
                <code className="block px-3 py-2 bg-gray-100 text-gray-800 rounded font-mono text-sm mb-4">
                  {showConfirmation.command}
                </code>
                {showConfirmation.dangerous && (
                  <p className="text-sm text-red-600 font-medium mb-4">
                    ⚠️ This is a potentially dangerous operation that may delete files or data.
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowConfirmation(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmedExecute}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  showConfirmation.dangerous
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Execute
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CommandPalette;
