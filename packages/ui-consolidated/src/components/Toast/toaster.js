import { Toaster as HotToaster } from 'react-hot-toast';
import { jsx as _jsx } from 'react/jsx-runtime';
export function Toaster() {
  return _jsx(HotToaster, {
    position: 'top-right',
    toastOptions: {
      duration: 5000,
      style: {
        background: 'var(--background)',
        color: 'var(--foreground)',
        border: '1px solid var(--border)',
      },
    },
  });
}
