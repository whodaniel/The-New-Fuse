import { Dropdown } from './Dropdown';
const meta = {
    title: 'Components/Dropdown',
    component: Dropdown,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        width: {
            control: { type: 'select' },
            options: ['auto', 'full'],
        },
    },
};
export default meta;
export const Default = {
    args: {
        options: [
            { value: 'profile', label: 'Profile' },
            { value: 'settings', label: 'Settings' },
            { value: 'help', label: 'Help' },
            { value: 'logout', label: 'Logout' },
        ],
        placeholder: 'Select an option',
    },
};
export const WithIcons = {
    args: {
        options: [
            { value: 'profile', label: 'Profile', icon: 'user' },
            { value: 'settings', label: 'Settings', icon: 'settings' },
            { value: 'help', label: 'Help', icon: 'help-circle' },
            { value: 'logout', label: 'Logout', icon: 'log-out' },
        ],
        placeholder: 'Select an option',
    },
};
export const WithLabel = {
    args: {
        options: [
            { value: 'small', label: 'Small' },
            { value: 'medium', label: 'Medium' },
            { value: 'large', label: 'Large' },
        ],
        label: 'Size',
        placeholder: 'Choose a size',
    },
};
export const Disabled = {
    args: {
        options: [
            { value: 'option1', label: 'Option 1' },
            { value: 'option2', label: 'Option 2' },
        ],
        disabled: true,
        placeholder: 'Disabled dropdown',
    },
};
export const WithError = {
    args: {
        options: [
            { value: 'option1', label: 'Option 1' },
            { value: 'option2', label: 'Option 2' },
        ],
        error: 'This field is required',
        placeholder: 'Select an option',
    },
};
//# sourceMappingURL=Dropdown.stories.js.map