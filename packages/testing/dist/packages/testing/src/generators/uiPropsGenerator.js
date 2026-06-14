"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTableProps = exports.generateModalProps = exports.generateListProps = exports.generateFormProps = exports.generateCardProps = exports.generateButtonProps = void 0;
const utils_1 = require("./utils");
const generateButtonProps = (options = {}) => ({
    id: (0, utils_1.generateId)(),
    'data-testid': 'button-test',
    variant: options.variant || 'default',
    size: options.size || 'medium',
    disabled: options.disabled,
    loading: options.loading,
    ...(options.withChildren && { children: 'Click me' }),
    ...(options.withCallbacks && { onClick: () => console.log('Button clicked') })
});
exports.generateButtonProps = generateButtonProps;
const generateCardProps = (options = {}) => ({
    id: (0, utils_1.generateId)(),
    'data-testid': 'card-test',
    title: 'Test Card',
    subtitle: options.withChildren ? 'Test Subtitle' : undefined,
    elevation: Math.floor(Math.random() * 5),
    ...(options.withChildren && {
        children: '<div>Card content</div>'
    })
});
exports.generateCardProps = generateCardProps;
const generateFormProps = (options = {}) => ({
    id: (0, utils_1.generateId)(),
    'data-testid': 'form-test',
    initialValues: {
        username: '',
        email: '',
        password: '',
        remember: false
    },
    ...(options.withCallbacks && {
        onSubmit: (values) => console.log('Form submitted:', values),
        validate: (values) => {
            const errors = {};
            if (!values.email) {
                errors.email = 'Required';
            }
            return errors;
        }
    })
});
exports.generateFormProps = generateFormProps;
const generateListProps = (data = []) => ({
    id: (0, utils_1.generateId)(),
    'data-testid': 'list-test',
    items: data.length > 0 ? data : [
        { id: '1', title: 'Item 1' },
        { id: '2', title: 'Item 2' },
        { id: '3', title: 'Item 3' }
    ],
    renderItem: (item) => `<div>${item.title}</div>`,
    keyExtractor: (item) => item.id,
    onItemClick: (item) => console.log('Item clicked:', item)
});
exports.generateListProps = generateListProps;
const generateModalProps = (options = {}) => ({
    id: (0, utils_1.generateId)(),
    'data-testid': 'modal-test',
    isOpen: true,
    title: 'Test Modal',
    size: options.size || 'medium',
    ...(options.withCallbacks && {
        onClose: () => console.log('Modal closed')
    }),
    ...(options.withChildren && {
        children: '<div>Modal content</div>'
    })
});
exports.generateModalProps = generateModalProps;
const generateTableProps = (data = []) => ({
    id: (0, utils_1.generateId)(),
    'data-testid': 'table-test',
    columns: [
        { id: 'id', header: 'ID', accessor: 'id', sortable: true },
        { id: 'name', header: 'Name', accessor: 'name', sortable: true },
        { id: 'status', header: 'Status', accessor: 'status' }
    ],
    data: data.length > 0 ? data : [
        { id: '1', name: 'Item 1', status: 'active' },
        { id: '2', name: 'Item 2', status: 'inactive' },
        { id: '3', name: 'Item 3', status: 'pending' }
    ],
    onSort: (column) => console.log('Sort by:', column),
    onRowClick: (row) => console.log('Row clicked:', row)
});
exports.generateTableProps = generateTableProps;
//# sourceMappingURL=uiPropsGenerator.js.map