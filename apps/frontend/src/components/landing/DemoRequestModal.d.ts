import React from 'react';
export interface DemoRequestData {
    name: string;
    email: string;
    company: string;
    phone?: string;
    teamSize?: string;
    message?: string;
}
export interface DemoRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit?: (data: DemoRequestData) => Promise<void>;
}
/**
 * Demo Request Modal Component
 *
 * Features:
 * - Multi-field form with validation
 * - Required and optional fields
 * - Loading states
 * - Success feedback
 * - Analytics tracking
 * - Responsive design
 */
export declare const DemoRequestModal: React.FC<DemoRequestModalProps>;
/**
 * Demo Request Button
 *
 * Convenience component that includes the button and modal
 */
export declare const DemoRequestButton: React.FC<{
    buttonText?: string;
    variant?: 'default' | 'outline' | 'secondary';
    size?: 'default' | 'sm' | 'lg';
    onSubmit?: (data: DemoRequestData) => Promise<void>;
    className?: string;
}>;
