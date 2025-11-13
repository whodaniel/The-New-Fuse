import { Checkbox } from './Checkbox';
const meta = {
    title: 'Components/Checkbox',
    component: Checkbox,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        label: { control: 'text' },
        helperText: { control: 'text' },
        error: { control: 'text' },
        size: {
            control: { type: 'select' },
            options: ['default', 'sm', 'lg'],
        },
        disabled: { control: 'boolean' },
        checked: { control: 'boolean' },
        defaultChecked: { control: 'boolean' },
        onChange: { action: 'changed' },
    },
};
export default meta;
export const Default = {
    args: {
        label: 'Accept terms and conditions',
    },
};
export const WithHelperText = {
    args: {
        label: 'Subscribe to newsletter',
        helperText: 'We\'ll send you weekly updates',
    },
};
export const WithError = {
    args: {
        label: 'Accept terms',
        error: 'You must accept the terms to continue',
    },
};
export const Disabled = {
    args: {
        label: 'Disabled checkbox',
        disabled: true,
    },
};
export const Checked = {
    args: {
        label: 'Checked checkbox',
        defaultChecked: true,
    },
};
export const Small = {
    args: {
        label: 'Small checkbox',
        size: 'sm',
    },
};
export const Large = {
    args: {
        label: 'Large checkbox',
        size: 'lg',
    },
};
export const Group = {
    render: () => (<div className="space-y-2">
      <Checkbox label="Option 1" name="group" value="option1"/>
      <Checkbox label="Option 2" name="group" value="option2"/>
      <Checkbox label="Option 3" name="group" value="option3"/>
    </div>),
};
//# sourceMappingURL=Checkbox.stories.js.map