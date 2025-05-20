// Import using dynamic import to work around ESM/CommonJS compatibility
import React from 'react';

// Using regular components instead of icons from phosphor-icons with properly typed props
interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  weight?: string; // Add support for the "weight" property
}

const User = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const Robot = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="11" width="18" height="10" rx="2"></rect>
    <circle cx="12" cy="5" r="2"></circle>
    <path d="M12 7v4"></path>
    <line x1="8" y1="16" x2="8" y2="16"></line>
    <line x1="16" y1="16" x2="16" y2="16"></line>
  </svg>
);

interface UserData {
  uid?: string;
  profileImage?: string;
}

interface UserIconProps {
  user?: UserData;
  role?: "user" | "assistant" | "system";
  className?: string;
}

export default function UserIcon({ user, role = "user", className = "" }: UserIconProps): JSX.Element {
  if (role === "assistant") {
    return (
      <div className={`w-[35px] h-[35px] flex-shrink-0 ${className}`}>
        <Robot
          className="w-full h-full text-white"
          weight="fill"
        />
      </div>
    );
  }

  if (user?.profileImage) {
    return (
      <div className={`relative w-[35px] h-[35px] rounded-full flex-shrink-0 overflow-hidden ${className}`}>
        <img
          src={user.profileImage}
          alt="User profile"
          className="absolute top-0 left-0 w-full h-full object-cover rounded-full"
        />
      </div>
    );
  }

  return (
    <div className={`w-[35px] h-[35px] flex-shrink-0 ${className}`}>
      <User
        className="w-full h-full text-white"
        weight="fill"
      />
    </div>
  );
}