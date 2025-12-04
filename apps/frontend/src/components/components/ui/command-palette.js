import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
export var CommandPalette = function () {
    var _a = useState(false), isOpen = _a[0], setIsOpen = _a[1];
    var _b = useState(''), search = _b[0], setSearch = _b[1];
    var _c = useState([]), commands = _c[0], setCommands = _c[1];
    var _d = useState([]), filteredCommands = _d[0], setFilteredCommands = _d[1];
    var router = useRouter();
    useEffect(function () {
        var handleKeyDown = function (e) {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsOpen(function (prev) { return !prev; });
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return function () { return window.removeEventListener('keydown', handleKeyDown); };
    }, []);
    useEffect(function () {
        var allCommands = [
            {
                id: 'home',
                name: 'Go to Home',
                shortcut: '⌘H',
                action: function () { return router.push('/'); },
                category: 'navigation'
            },
            {
                id: 'agents',
                name: 'View Agents',
                shortcut: '⌘A',
                action: function () { return router.push('/agents'); },
                category: 'navigation'
            },
            {
                id: 'workflow',
                name: 'Open Workflow Editor',
                shortcut: '⌘W',
                action: function () { return router.push('/workflow'); },
                category: 'tool'
            },
            {
                id: 'settings',
                name: 'Open Settings',
                shortcut: '⌘,',
                action: function () { return router.push('/settings'); },
                category: 'navigation'
            },
            {
                id: 'new-agent',
                name: 'Create New Agent',
                shortcut: '⌘N',
                action: function () { return router.push('/agents/new'); },
                category: 'action'
            },
            {
                id: 'marketplace',
                name: 'Browse Marketplace',
                shortcut: '⌘M',
                action: function () { return router.push('/marketplace'); },
                category: 'navigation'
            }
        ];
        setCommands(allCommands);
    }, [router]);
    useEffect(function () {
        var filtered = commands.filter(function (command) {
            return command.name.toLowerCase().includes(search.toLowerCase());
        });
        setFilteredCommands(filtered);
    }, [search, commands]);
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 z-50 overflow-y-auto", children: _jsxs("div", { className: "min-h-screen px-4 text-center", children: [_jsx("div", { className: "fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity", onClick: function () { return setIsOpen(false); } }), _jsxs("div", { className: "inline-block w-full max-w-2xl my-8 text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-xl", children: [_jsx("div", { className: "p-4", children: _jsx("input", { type: "text", className: "w-full px-4 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-blue-500", placeholder: "Search commands... (ESC to close)", value: search, onChange: function (e) { return setSearch(e.target.value); }, autoFocus: true }) }), _jsx("div", { className: "max-h-96 overflow-y-auto", children: filteredCommands.map(function (command) { return (_jsxs("button", { className: "w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between", onClick: function () {
                                    command.action();
                                    setIsOpen(false);
                                }, children: [_jsxs("div", { children: [_jsx("span", { className: "text-gray-900 dark:text-white", children: command.name }), _jsx("span", { className: "ml-2 text-sm text-gray-500", children: command.category })] }), command.shortcut && (_jsx("span", { className: "text-sm text-gray-500", children: command.shortcut }))] }, command.id)); }) })] })] }) }));
};
