interface UserData {
    uid?: string;
    profileImage?: string;
}
interface UserIconProps {
    user?: UserData;
    role?: "user" | "assistant" | "system";
    className?: string;
}
export default function UserIcon({ user, role, className }: UserIconProps): JSX.Element;
export {};
//# sourceMappingURL=UserIcon.d.ts.map