import toast from 'react-hot-toast';

export const showSuccessToast = (message: string): void => {
  toast.success(message, {
    duration: 4000,
    position: 'bottom-right',
  });
};
export const showErrorToast = (message: string): void => {
  toast.error(message, {
    duration: 4000,
    position: 'bottom-right',
  });
};
export const showInfoToast = (message: string): void => {
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
