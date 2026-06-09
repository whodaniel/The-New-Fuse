import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../Card/Card';
import { Input } from '../../Input/Input';
import { Badge } from '../../Badge/Badge';
import { Skeleton } from '../../Skeleton/Skeleton';
import { Alert, AlertDescription, AlertTitle } from '../../Alert/Alert';
const POWER_PHRASE_GROUPS = [
    {
        title: 'Agent Directives',
        icon: '\u{1F916}',
        patterns: ['directive', 'autonomy', 'orchestrat', 'self_prompt', 'agent_loop', 'prime_directive', 'self_improve', 'coordination', 'heartbeat', 'consciousness'],
    },
    {
        title: 'Communication Patterns',
        icon: '\u{1F4AC}',
        patterns: ['broadcast', 'relay', 'dispatch', 'subscribe', 'emit', 'notify', 'handoff', 'bridge', 'channel', 'message', 'protocol', 'negotiate'],
    },
    {
        title: 'Effective Vocabulary',
        icon: '\u{1F3AF}',
        patterns: ['execute', 'actualiz', 'optimize', 'validate', 'enrich', 'transform', 'orchestrat', 'compounding', 'cascade', 'amplif', 'accelerat', 'operationaliz'],
    },
    {
        title: 'System Intelligence',
        icon: '\u{1F9E0}',
        patterns: ['embedding', 'vector', 'similarity', 'retrieval', 'rag', 'semantic', 'knowledge', 'memory', 'context_pack', 'skill_bank', 'blueprint'],
    },
    {
        title: 'Resilience Patterns',
        icon: '\u{1F6E1}\uFE0F',
        patterns: ['retry', 'fallback', 'circuit', 'degraded', 'graceful', 'recovery', 'resilien', 'timeout', 'backoff', 'health_check', 'watchdog'],
    },
    {
        title: 'Governance and Control',
        icon: '\u2696\uFE0F',
        patterns: ['authorize', 'permission', 'policy', 'compliance', 'audit', 'govern', 'enforce', 'constraint', 'mandate', 'escalat'],
    },
];
const CAT_BG = {
    'Keywords & Reserved': 'bg-blue-500/10 border-blue-500/20',
    'Types & Interfaces': 'bg-violet-500/10 border-violet-500/20',
    'Function Names': 'bg-emerald-500/10 border-emerald-500/20',
    'Agent & System': 'bg-amber-500/10 border-amber-500/20',
    'UI & Components': 'bg-pink-500/10 border-pink-500/20',
    'Data & State': 'bg-cyan-500/10 border-cyan-500/20',
    'Error & Status': 'bg-red-500/10 border-red-500/20',
    'Config & Env': 'bg-orange-500/10 border-orange-500/20',
    'Network & API': 'bg-indigo-500/10 border-indigo-500/20',
    'Domain-Specific': 'bg-slate-500/10 border-slate-500/20',
};
function useConcordanceData(url, initialData) {
    const [data, setData] = useState(initialData ?? null);
    const [loading, setLoading] = useState(!initialData && !!url);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (initialData || !url)
            return;
        let cancelled = false;
        setLoading(true);
        fetch(url)
            .then(r => {
            if (!r.ok)
                throw new Error(`HTTP ${r.status}`);
            return r.json();
        })
            .then((json) => {
            if (!cancelled) {
                setData(json);
                setLoading(false);
            }
        })
            .catch(err => {
            if (!cancelled) {
                setError(err.message);
                setLoading(false);
            }
        });
        return () => { cancelled = true; };
    }, [url, initialData]);
    return { data, loading, error };
}
export const ConcordanceViewer = ({ dataUrl = 'https://wslydgtgindrywldatbv.supabase.co/storage/v1/object/public/concordance/20260508_124525/concordance_viz_data.json', data: propData, className = '', }) => {
    const { data, loading, error } = useConcordanceData(dataUrl, propData);
    const [view, setView] = useState('cloud');
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('count');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedWord, setSelectedWord] = useState(null);
    const filteredWords = useMemo(() => {
        if (!data)
            return [];
        let words = data.topWords;
        if (search) {
            const q = search.toLowerCase();
            words = words.filter(w => w.word.toLowerCase().includes(q));
        }
        if (selectedCategory && data.categories[selectedCategory]) {
            const catWords = new Set(data.categories[selectedCategory].topWords.map(w => w.word));
            words = words.filter(w => catWords.has(w.word));
        }
        return [...words].sort((a, b) => {
            if (sortBy === 'alpha')
                return a.word.localeCompare(b.word);
            if (sortBy === 'length')
                return a.word.length - b.word.length;
            return b.count - a.count;
        });
    }, [data, search, sortBy, selectedCategory]);
    const maxCount = useMemo(() => {
        if (!data)
            return 1;
        return Math.max(...data.topWords.slice(0, 100).map(w => w.count), 1);
    }, [data]);
    const wordSize = useCallback((count) => {
        const ratio = count / maxCount;
        return 0.65 + ratio * 0.95;
    }, [maxCount]);
    const powerPhraseData = useMemo(() => {
        if (!data)
            return [];
        return POWER_PHRASE_GROUPS.map(group => {
            const matches = [];
            group.patterns.forEach(pat => {
                const found = data.topWords.filter(w => w.word.toLowerCase().includes(pat.toLowerCase()));
                matches.push(...found.slice(0, 3));
            });
            const unique = [...new Map(matches.map(m => [m.word, m])).values()].slice(0, 6);
            return { ...group, matches: unique };
        });
    }, [data]);
    const freqChartData = useMemo(() => {
        if (!data)
            return [];
        return Object.entries(data.distribution.byFrequency).map(([name, value]) => ({ name, value }));
    }, [data]);
    const lengthChartData = useMemo(() => {
        if (!data)
            return [];
        return Object.entries(data.distribution.byLength).map(([name, value]) => ({ name, value }));
    }, [data]);
    if (loading)
        return _jsx(Skeleton, {});
    if (error || !data)
        return _jsxs(Alert, { children: [_jsx(AlertTitle, { children: "Error" }), _jsx(AlertDescription, { children: error })] });
    const m = data.metadata;
    return (_jsxs("div", { className: `space-y-6 ${className}`, children: [_jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [
                    { val: m.totalWords.toLocaleString(), label: 'Unique Identifiers' },
                    { val: (m.totalOccurrences / 1000).toFixed(1) + 'K', label: 'Total Occurrences' },
                    { val: m.filesIndexed.toLocaleString(), label: 'Source Files' },
                    { val: Object.keys(data.categories).length, label: 'Categories' },
                ].map(s => (_jsx(Card, { className: "bg-slate-950/60 border-white/[0.08] backdrop-blur-xl", children: _jsxs(CardContent, { className: "p-4", children: [_jsx("div", { className: "text-2xl font-extrabold font-mono text-white", children: s.val }), _jsx("div", { className: "text-xs font-bold uppercase tracking-wider text-slate-500 mt-1", children: s.label })] }) }, s.label))) }), _jsxs(Card, { className: "bg-slate-950/60 border-white/[0.08] backdrop-blur-xl", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-slate-100", children: "Power Phrases & Communication Patterns" }) }), _jsx(CardContent, { children: _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3", children: powerPhraseData.map(group => (_jsxs("div", { className: "bg-slate-900/40 border border-white/[0.06] rounded-xl p-3", children: [_jsxs("h4", { className: "text-sm font-bold text-slate-200 mb-2", children: [group.icon, " ", group.title] }), _jsx("div", { className: "flex flex-wrap gap-1.5", children: group.matches.map(w => (_jsxs("button", { onClick: () => setSelectedWord(w.word), className: "text-xs bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] rounded px-2 py-1 text-slate-300 transition-colors", children: [w.word, " ", _jsxs("span", { className: "text-slate-600", children: ["(", w.count.toLocaleString(), ")"] })] }, w.word))) })] }, group.title))) }) })] }), _jsxs(Card, { className: "bg-slate-950/60 border-white/[0.08] backdrop-blur-xl", children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { className: "text-slate-100", children: "Categories" }), selectedCategory && (_jsx("button", { onClick: () => setSelectedCategory(null), className: "text-xs text-slate-500 hover:text-slate-300", children: "Clear filter" }))] }) }), _jsx(CardContent, { children: _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2", children: Object.entries(data.categories).map(([name, cat]) => (_jsxs("button", { onClick: () => setSelectedCategory(selectedCategory === name ? null : name), className: `text-left p-3 rounded-xl border transition-all ${selectedCategory === name
                                    ? 'border-blue-500 bg-blue-500/10'
                                    : `border-white/[0.06] ${CAT_BG[name] || 'bg-slate-900/40'} hover:border-white/[0.15]`}`, children: [_jsx("div", { className: "text-sm font-bold text-slate-200", children: name }), _jsxs("div", { className: "text-xs text-slate-500 mt-1", children: [cat.count, " identifiers"] }), _jsx("div", { className: "flex flex-wrap gap-1 mt-2", children: cat.topWords.slice(0, 3).map(w => (_jsx("span", { className: "text-[10px] text-slate-400 bg-white/[0.05] rounded px-1.5 py-0.5", children: w.word }, w.word))) })] }, name))) }) })] }), _jsxs(Card, { className: "bg-slate-950/60 border-white/[0.08] backdrop-blur-xl", children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3", children: [_jsx(CardTitle, { className: "text-slate-100", children: "Word Explorer" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Input, { placeholder: "Search identifiers...", value: search, onChange: e => setSearch(e.target.value), className: "w-56 bg-slate-900/50 border-white/10 text-slate-100 placeholder:text-slate-600" }), _jsx("div", { className: "flex gap-1", children: ['cloud', 'list'].map(v => (_jsx("button", { onClick: () => setView(v), className: `px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${view === v ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`, children: v === 'cloud' ? 'Cloud' : 'List' }, v))) }), _jsxs("select", { value: sortBy, onChange: e => setSortBy(e.target.value), className: "bg-slate-800 border border-white/10 text-slate-300 text-xs rounded-lg px-2 py-1.5", children: [_jsx("option", { value: "count", children: "By Frequency" }), _jsx("option", { value: "alpha", children: "Alphabetical" }), _jsx("option", { value: "length", children: "By Length" })] })] })] }) }), _jsx(CardContent, { children: view === 'cloud' ? (_jsx("div", { className: "flex flex-wrap gap-1.5", children: filteredWords.slice(0, 200).map(w => {
                                const scale = wordSize(w.count);
                                const opacity = 0.4 + (w.count / maxCount) * 0.6;
                                return (_jsxs("button", { onClick: () => setSelectedWord(w.word), className: "hover:bg-white/[0.08] rounded px-1.5 py-0.5 transition-colors", style: { fontSize: `${scale}rem`, opacity }, children: [_jsx("span", { className: "text-slate-100", children: w.word }), _jsxs("span", { className: "text-slate-600 ml-1", style: { fontSize: '0.65rem' }, children: ["(", w.count.toLocaleString(), ")"] })] }, w.word));
                            }) })) : (_jsx("div", { className: "max-h-96 overflow-y-auto space-y-1", children: filteredWords.slice(0, 100).map(w => {
                                const barWidth = (w.count / maxCount) * 100;
                                return (_jsxs("div", { className: "flex items-center gap-3 text-sm", children: [_jsx("button", { onClick: () => setSelectedWord(w.word), className: "w-28 text-right text-slate-300 hover:text-white truncate transition-colors", children: w.word }), _jsx("div", { className: "flex-1 h-5 bg-white/[0.03] rounded overflow-hidden", children: _jsx("div", { className: "h-full rounded bg-gradient-to-r from-blue-600 to-violet-600", style: { width: `${barWidth}%` } }) }), _jsx("span", { className: "text-xs text-slate-500 font-mono w-16 text-right", children: w.count.toLocaleString() })] }, w.word));
                            }) })) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs(Card, { className: "bg-slate-950/60 border-white/[0.08] backdrop-blur-xl", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-slate-100 text-sm", children: "Frequency Distribution" }) }), _jsx(CardContent, { children: _jsx(ResponsiveContainer, { width: "100%", height: 200, children: _jsxs(BarChart, { data: freqChartData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#1e293b" }), _jsx(XAxis, { dataKey: "name", tick: { fill: '#64748b', fontSize: 11 } }), _jsx(YAxis, { tick: { fill: '#64748b', fontSize: 11 } }), _jsx(Tooltip, { contentStyle: { background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }, labelStyle: { color: '#f1f5f9' } }), _jsx(Bar, { dataKey: "value", fill: "#3b82f6", radius: [4, 4, 0, 0] })] }) }) })] }), _jsxs(Card, { className: "bg-slate-950/60 border-white/[0.08] backdrop-blur-xl", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-slate-100 text-sm", children: "Length Distribution" }) }), _jsx(CardContent, { children: _jsx(ResponsiveContainer, { width: "100%", height: 200, children: _jsxs(BarChart, { data: lengthChartData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#1e293b" }), _jsx(XAxis, { dataKey: "name", tick: { fill: '#64748b', fontSize: 11 } }), _jsx(YAxis, { tick: { fill: '#64748b', fontSize: 11 } }), _jsx(Tooltip, { contentStyle: { background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }, labelStyle: { color: '#f1f5f9' } }), _jsx(Bar, { dataKey: "value", fill: "#7c3aed", radius: [4, 4, 0, 0] })] }) }) })] })] }), _jsxs(Card, { className: "bg-slate-950/60 border-white/[0.08] backdrop-blur-xl", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-slate-100 text-sm", children: "Top Files by Identifier Density" }) }), _jsx(CardContent, { children: _jsx("div", { className: "max-h-64 overflow-y-auto space-y-1", children: data.topFiles.slice(0, 30).map(f => {
                                const maxFileId = data.topFiles[0]?.identifiers || 1;
                                const barWidth = (f.identifiers / maxFileId) * 100;
                                const shortPath = f.file.split('/').slice(-2).join('/');
                                return (_jsxs("div", { className: "flex items-center gap-3 text-xs", children: [_jsx("span", { className: "w-40 text-right text-slate-400 truncate font-mono", title: f.file, children: shortPath }), _jsx("div", { className: "flex-1 h-4 bg-white/[0.03] rounded overflow-hidden", children: _jsx("div", { className: "h-full rounded bg-gradient-to-r from-cyan-600 to-blue-600", style: { width: `${barWidth}%` } }) }), _jsx("span", { className: "text-slate-500 font-mono w-12 text-right", children: f.identifiers })] }, f.file));
                            }) }) })] }), selectedWord && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm", onClick: () => setSelectedWord(null), children: _jsxs("div", { className: "bg-slate-950 border border-white/10 rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl", onClick: e => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-bold text-white font-mono", children: selectedWord }), _jsx("button", { onClick: () => setSelectedWord(null), className: "text-slate-500 hover:text-white transition-colors text-xl", children: "\u00D7" })] }), (() => {
                            const wordData = data.topWords.find(w => w.word === selectedWord);
                            if (!wordData)
                                return _jsx("p", { className: "text-slate-500 text-sm", children: "No data available." });
                            return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex gap-3", children: [_jsxs(Badge, { className: "bg-blue-600", children: [wordData.count.toLocaleString(), " occurrences"] }), _jsxs(Badge, { className: "bg-violet-600", children: [wordData.files?.length ?? 0, " files"] })] }), wordData.files && wordData.files.length > 0 && (_jsxs("div", { children: [_jsx("p", { className: "text-xs font-bold uppercase tracking-wider text-slate-500 mb-2", children: "Files" }), _jsx("div", { className: "space-y-1.5", children: wordData.files.slice(0, 5).map(f => (_jsxs("div", { className: "text-xs text-slate-400 font-mono bg-white/[0.03] rounded px-3 py-1.5", children: [f.file, f.lines && f.lines.length > 0 && (_jsxs("span", { className: "text-slate-600 ml-2", children: ["lines ", f.lines.slice(0, 5).join(', ')] }))] }, f.file))) })] }))] }));
                        })()] }) }))] }));
};
