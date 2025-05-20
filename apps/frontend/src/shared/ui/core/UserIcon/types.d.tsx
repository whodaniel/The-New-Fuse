import { VariantProps } from 'class-variance-authority';
import { userIconVariants } from './UserIcon.js';
export type UserRole = 'user' | 'system' | 'assistant' | 'bot';
export interface UserIconProps extends VariantProps<typeof userIconVariants> {
    role?: UserRole;
    src?: string;
    fallbackSrc?: string;
    alt?: string;
    className?: string;
    status?: 'online' | 'offline' | 'away' | 'busy';
    showStatus?: boolean;
    loading?: boolean;
    onClick?: () => void;
}
