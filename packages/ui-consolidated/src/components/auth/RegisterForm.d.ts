/**
 * Register form props
 */
export interface RegisterFormProps {
    /**
     * Callback when registration is successful
     */
    onSuccess?: () => void;
    /**
     * Callback when registration is cancelled
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
 * Register form component
 * @param props Register form props
 * @returns Register form component
 *
 * @example
 * // Basic usage
 * <RegisterForm onSuccess={() => navigate('/dashboard')} />
 *
 * // With cancel button
 * <RegisterForm
 *   onSuccess={() => navigate('/dashboard')}
 *   onCancel={() => navigate('/')}
 *   showCancel
 * />
 */
export declare function RegisterForm({ onSuccess, onCancel, showCancel, className, }: RegisterFormProps): JSX.Element;
//# sourceMappingURL=RegisterForm.d.ts.map