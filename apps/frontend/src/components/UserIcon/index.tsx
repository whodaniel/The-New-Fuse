import React from 'react';
import { User, Robot } from '@phosphor-icons/react';

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

export default function UserIcon({
  user = {},
  role = 'user',
  size = 'medium',
  className = '',
}: UserIconProps) {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
  };

  const baseClasses = `${sizeClasses[size]} rounded-full flex items-center justify-center bg-white/10 ${className}`;

  if (user?.profilePicture) {
    return (
      <div className={baseClasses}>
        <img
          src={user.profilePicture}
          alt={user.name || user.username || 'User'}
          className="w-full h-full object-cover rounded-full"
        />
      </div>
    );
  }

  // Generate a color based on user ID or username
  const getColorFromString = (str: string = '') => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      'bg-red-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-yellow-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  const colorClass = getColorFromString(user.uid || user.username || '');

  if (role === 'assistant') {
    return (
      <div className={`${baseClasses} ${colorClass}`}>
        <Robot className="w-5 h-5 text-white" />
      </div>
    );
  }

  if (role === 'system') {
    return (
      <div className={`${baseClasses} bg-gray-500`}>
        <div className="w-2 h-2 bg-white rounded-full"></div>
      </div>
    );
  }

  // Default user icon
  return (
    <div className={`${baseClasses} ${colorClass}`}>
      {user.name || user.username ? (
        <span className="text-white font-medium text-sm">
          {(user.name || user.username || '').charAt(0).toUpperCase()}
        </span>
      ) : (
        <User className="w-5 h-5 text-white" />
      )}
    </div>
  );
}