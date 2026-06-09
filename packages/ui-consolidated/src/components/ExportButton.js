import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export const ExportButton = ({ conversation, format = 'pdf', apiUrl = '/api/v1/export/conversation', buttonLabel = 'Export to PDF', }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const handleExport = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ conversation, format }),
            });
            if (!response.ok) {
                throw new Error(`Export failed: ${response.statusText}`);
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `conversation.${format}`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        }
        catch (err) {
            setError(err.message || 'Export failed');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { children: [_jsx("button", { type: "button", onClick: handleExport, disabled: loading, className: "px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/80 transition", "aria-busy": loading, children: loading ? 'Exporting…' : buttonLabel }), error && _jsx("div", { className: "mt-2 text-destructive text-sm", children: error })] }));
};
