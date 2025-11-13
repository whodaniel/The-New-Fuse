/**
 * Login form props
 */
export interface LoginFormProps {
    /**
     * Callback when login is successful
     */
    onSuccess?: () => void;
    /**
     * Callback when login is cancelled
     */
    onCancel?: () => void;
    /**
     * Whether to show the cancel button
     * @default false
     */
    showCancel?: boolean;
    /**
     * Additional CSS class name
     */
    className?: string;
}
/**
 * Login form component
 * @param props Login form props
 * @returns Login form component
 *
 * @example
 * // Basic usage
 * <LoginForm onSuccess={() => navigate('/dashboard')} />
 *
 * // With cancel button
 * <LoginForm
 *   onSuccess={() => navigate('/dashboard')}
 *   onCancel={() => navigate('/')}
 *   showCancel
 * />
 */
export declare function LoginForm({ onSuccess, onCancel, showCancel, className, }: LoginFormProps): JSX.Element;
//# sourceMappingURL=LoginForm.d.ts.map