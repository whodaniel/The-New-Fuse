import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { cn } from '../../lib/utils.js';

// Create a simplified Button component to replace the external import
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'outline' | 'primary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'default', 
  size = 'default', 
  className, 
  children,
  ...props 
}) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        // Base styles
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        // Variant styles
        variant === 'default' && 'bg-primary text-primary-foreground hover:bg-primary/90',
        variant === 'ghost' && 'hover:bg-accent hover:text-accent-foreground',
        variant === 'outline' && 'border border-input hover:bg-accent hover:text-accent-foreground',
        // Size styles
        size === 'default' && 'h-10 px-4 py-2',
        size === 'sm' && 'h-9 rounded-md px-3',
        size === 'lg' && 'h-11 rounded-md px-8',
        size === 'icon' && 'h-10 w-10',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

// Mock icons to replace lucide-react imports
const createIconComponent = (name: string): React.FC<{ className?: string }> => {
  return ({ className }) => (
    <div className={cn('w-5 h-5 flex items-center justify-center', className)}>
      {name.charAt(0)}
    </div>
  );
};

const LayoutDashboard = createIconComponent('LayoutDashboard');
const Users = createIconComponent('Users');
const Settings = createIconComponent('Settings');
const HelpCircle = createIconComponent('HelpCircle');
const Bot = createIconComponent('Bot');
const BarChart = createIconComponent('BarChart');
const LogOut = createIconComponent('LogOut');
const Building2 = createIconComponent('Building2');
const Boxes = createIconComponent('Boxes');

interface SidebarProps {
  className?: string
}

interface NavItem {
  icon: React.FC<{ className?: string }>;
  path: string;
  label: string;
}

export function Sidebar({ className }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path: string): boolean => {
    return location.pathname === path
  }

  const navItems: NavItem[] = [
    {
      icon: LayoutDashboard,
      path: '/dashboard',
      label: 'Dashboard'
    },
    {
      icon: Bot,
      path: '/dashboard/agents',
      label: 'Agents'
    },
    {
      icon: BarChart,
      path: '/dashboard/analytics',
      label: 'Analytics'
    },
    {
      icon: Building2,
      path: '/workspace/overview',
      label: 'Workspace'
    },
    {
      icon: Users,
      path: '/workspace/members',
      label: 'Team'
    },
    {
      icon: Boxes,
      path: '/workspace/projects',
      label: 'Projects'
    }
  ]

  const bottomNavItems: NavItem[] = [
    {
      icon: Settings,
      path: '/workspace/settings',
      label: 'Settings'
    },
    {
      icon: HelpCircle,
      path: '/help',
      label: 'Help & Support'
    }
  ]

  return (
    <div className={cn(
      "w-16 bg-background border-r flex flex-col items-center py-4 space-y-4",
      className
    )}>
      <div className="mb-4">
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10"
          onClick={() => navigate('/dashboard')}
        >
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold">NF</span>
          </div>
        </Button>
      </div>

      <div className="space-y-2">
        {navItems.map((item) => (
          <Button
            key={item.path}
            variant={isActive(item.path) ? "default" : "ghost"}
            size="icon"
            className="w-10 h-10 relative group"
            onClick={() => navigate(item.path)}
            title={item.label}
          >
            <item.icon className="h-5 w-5" />
            <span className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {item.label}
            </span>
          </Button>
        ))}
      </div>

      <div className="flex-grow" />

      <div className="space-y-2">
        {bottomNavItems.map((item) => (
          <Button
            key={item.path}
            variant={isActive(item.path) ? "default" : "ghost"}
            size="icon"
            className="w-10 h-10 relative group"
            onClick={() => navigate(item.path)}
            title={item.label}
          >
            <item.icon className="h-5 w-5" />
            <span className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {item.label}
            </span>
          </Button>
        ))}
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 relative group"
          onClick={() => {
            // Add logout logic here
            navigate('/login')
          }}
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
          <span className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Logout
          </span>
        </Button>
      </div>
    </div>
  )
}