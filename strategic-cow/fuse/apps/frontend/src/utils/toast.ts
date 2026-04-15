import { toast } from 'react-hot-toast';
export const showSuccessToast = (message: any): any => {
    toast.success(message, {
        duration: 4000,
        position: 'bottom-right',
    });
};
export const showErrorToast = (message: any): any => {
    toast.error(message, {
        duration: 4000,
        position: 'bottom-right',
    });
};
export const showInfoToast = (message: any): any => {
    toast(message, {
        duration: 4000,
        position: 'bottom-right',
    });
};
export default {
    showSuccessToast,
    showErrorToast,
    showInfoToast,
};
