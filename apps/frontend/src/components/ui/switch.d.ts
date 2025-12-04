interface SwitchProps {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
    className?: string;
    id?: string;
}
export declare function Switch({ checked, onCheckedChange, disabled, className, id }: SwitchProps): import("react/jsx-runtime").JSX.Element;
export default Switch;
