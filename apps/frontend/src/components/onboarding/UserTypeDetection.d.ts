import React from 'react';
interface UserTypeDetectionProps {
    onDetectionComplete: (userType: 'human' | 'ai_agent' | 'unknown') => void;
}
export declare const UserTypeDetection: React.FC<UserTypeDetectionProps>;
export {};
