interface UserIconProps {
    user?: {
        uid?: string;
        username?: string;
        name?: string;
        profilePicture?: string;
    };
    role?: 'user' | 'assistant' | 'system';
    size?: 'small' | 'medium' | 'large';
    className?: string;
}
export default function UserIcon({ user, role, size, className, }: UserIconProps): import("react/jsx-runtime").JSX.Element;
export {};
