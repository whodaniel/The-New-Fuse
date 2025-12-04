import { toast } from 'react-hot-toast';
export var showSuccessToast = function (message) {
    toast.success(message, {
        duration: 4000,
        position: 'bottom-right',
    });
};
export var showErrorToast = function (message) {
    toast.error(message, {
        duration: 4000,
        position: 'bottom-right',
    });
};
export var showInfoToast = function (message) {
    toast(message, {
        duration: 4000,
        position: 'bottom-right',
    });
};
export default {
    showSuccessToast: showSuccessToast,
    showErrorToast: showErrorToast,
    showInfoToast: showInfoToast,
};
