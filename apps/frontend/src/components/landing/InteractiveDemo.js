import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Cpu, CheckCircle2, ArrowRight, Sparkles, } from 'lucide-react';
var demoSteps = [
    {
        id: 'input',
        title: 'Natural Language Input',
        description: 'Describe your task in plain English',
        icon: _jsx(MessageSquare, { className: "w-6 h-6" }),
    },
    {
        id: 'processing',
        title: 'AI Agent Processing',
        description: 'Multiple specialized agents analyze and plan',
        icon: _jsx(Cpu, { className: "w-6 h-6" }),
    },
    {
        id: 'execution',
        title: 'Automated Execution',
        description: 'Agents collaborate to execute the workflow',
        icon: _jsx(Sparkles, { className: "w-6 h-6" }),
    },
    {
        id: 'complete',
        title: 'Task Complete',
        description: 'Results delivered with full transparency',
        icon: _jsx(CheckCircle2, { className: "w-6 h-6" }),
    },
];
export var InteractiveDemo = function () {
    var _a = useState(0), activeStep = _a[0], setActiveStep = _a[1];
    var _b = useState(false), isAnimating = _b[0], setIsAnimating = _b[1];
    var handleNext = function () {
        if (activeStep < demoSteps.length - 1 && !isAnimating) {
            setIsAnimating(true);
            setActiveStep(function (prev) { return prev + 1; });
            setTimeout(function () { return setIsAnimating(false); }, 500);
        }
    };
    var handleStepClick = function (index) {
        if (!isAnimating) {
            setIsAnimating(true);
            setActiveStep(index);
            setTimeout(function () { return setIsAnimating(false); }, 500);
        }
    };
    return (_jsx("section", { className: "py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-white to-blue-50 dark:from-gray-800 dark:to-gray-900", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 }, className: "text-center mb-12 sm:mb-16", children: [_jsx("h2", { className: "text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4", children: "See It In Action" }), _jsx("p", { className: "text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto", children: "Watch how The New Fuse transforms your ideas into reality" })] }), _jsxs("div", { className: "grid lg:grid-cols-2 gap-8 lg:gap-12 items-center", children: [_jsxs("div", { className: "space-y-4", children: [demoSteps.map(function (step, index) {
                                    var isActive = index === activeStep;
                                    var isCompleted = index < activeStep;
                                    return (_jsxs(motion.div, { initial: { opacity: 0, x: -20 }, whileInView: { opacity: 1, x: 0 }, viewport: { once: true }, transition: { duration: 0.5, delay: index * 0.1 }, onClick: function () { return handleStepClick(index); }, className: "\n                    relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300\n                    ".concat(isActive
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                                            : isCompleted
                                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300', "\n                  "), children: [_jsxs("div", { className: "flex items-start gap-4", children: [_jsx("div", { className: "\n                      flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center\n                      ".concat(isActive
                                                            ? 'bg-blue-500 text-white'
                                                            : isCompleted
                                                                ? 'bg-green-500 text-white'
                                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300', "\n                    "), children: step.icon }), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-1", children: step.title }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-300", children: step.description })] }), isActive && (_jsx(motion.div, { initial: { scale: 0 }, animate: { scale: 1 }, className: "flex-shrink-0", children: _jsx("div", { className: "w-3 h-3 rounded-full bg-blue-500 animate-pulse" }) }))] }), isActive && (_jsx(motion.div, { initial: { width: 0 }, animate: { width: '100%' }, transition: { duration: 2 }, className: "absolute bottom-0 left-0 h-1 bg-blue-500 rounded-b-xl" }))] }, step.id));
                                }), activeStep < demoSteps.length - 1 && (_jsxs(motion.button, { initial: { opacity: 0 }, animate: { opacity: 1 }, onClick: handleNext, disabled: isAnimating, className: "w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50", children: ["Next Step", _jsx(ArrowRight, { className: "w-5 h-5" })] }))] }), _jsxs("div", { className: "relative", children: [_jsxs(motion.div, { className: "relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden", initial: { opacity: 0, scale: 0.95 }, whileInView: { opacity: 1, scale: 1 }, viewport: { once: true }, transition: { duration: 0.6 }, children: [_jsx("div", { className: "bg-gray-100 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("div", { className: "flex gap-2", children: [_jsx("div", { className: "w-3 h-3 rounded-full bg-red-500" }), _jsx("div", { className: "w-3 h-3 rounded-full bg-yellow-500" }), _jsx("div", { className: "w-3 h-3 rounded-full bg-green-500" })] }), _jsx("div", { className: "flex-1 bg-white dark:bg-gray-600 rounded px-3 py-1 text-xs text-gray-600 dark:text-gray-300", children: "app.thenewfuse.com" })] }) }), _jsx("div", { className: "p-8 min-h-[400px]", children: _jsx(AnimatePresence, { mode: "wait", children: _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, transition: { duration: 0.3 }, children: [_jsx("div", { className: "flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx(motion.div, { initial: { scale: 0 }, animate: { scale: 1 }, transition: { delay: 0.2, type: 'spring' }, className: "inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-6", children: demoSteps[activeStep].icon }), _jsx("h3", { className: "text-2xl font-bold text-gray-900 dark:text-white mb-4", children: demoSteps[activeStep].title }), _jsx("p", { className: "text-gray-600 dark:text-gray-300 max-w-md", children: demoSteps[activeStep].description })] }) }), _jsxs("div", { className: "mt-8", children: [activeStep === 0 && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.4 }, className: "bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4", children: _jsxs("div", { className: "flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300", children: [_jsx(MessageSquare, { className: "w-4 h-4" }), _jsx("span", { className: "typing-animation", children: "Create a data pipeline to process user analytics..." })] }) })), activeStep === 1 && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.4 }, className: "space-y-2", children: ['Planning Agent', 'Data Agent', 'Analytics Agent'].map(function (agent, i) { return (_jsxs(motion.div, { initial: { x: -20, opacity: 0 }, animate: { x: 0, opacity: 1 }, transition: { delay: 0.5 + i * 0.1 }, className: "flex items-center gap-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3", children: [_jsx("div", { className: "w-2 h-2 rounded-full bg-purple-500 animate-pulse" }), _jsx("span", { className: "text-sm text-gray-700 dark:text-gray-300", children: agent })] }, agent)); }) })), activeStep === 2 && (_jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.4 }, className: "bg-green-50 dark:bg-green-900/20 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-4 h-4 rounded-full bg-green-500 animate-pulse" }), _jsx("span", { className: "text-sm text-gray-700 dark:text-gray-300", children: "Workflow executing..." })] }), _jsx("div", { className: "mt-3 bg-white dark:bg-gray-800 rounded h-2 overflow-hidden", children: _jsx(motion.div, { initial: { width: 0 }, animate: { width: '75%' }, transition: { duration: 2 }, className: "h-full bg-green-500" }) })] })), activeStep === 3 && (_jsx(motion.div, { initial: { scale: 0 }, animate: { scale: 1 }, transition: { delay: 0.4, type: 'spring' }, className: "text-center", children: _jsxs("div", { className: "inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full px-6 py-3", children: [_jsx(CheckCircle2, { className: "w-5 h-5" }), _jsx("span", { className: "font-medium", children: "Pipeline Created Successfully!" })] }) }))] })] }, activeStep) }) })] }), _jsx(motion.div, { animate: {
                                        y: [0, -10, 0],
                                        rotate: [0, 5, 0],
                                    }, transition: {
                                        duration: 3,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                    }, className: "absolute -top-4 -right-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl" }), _jsx(motion.div, { animate: {
                                        y: [0, 10, 0],
                                        rotate: [0, -5, 0],
                                    }, transition: {
                                        duration: 4,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                    }, className: "absolute -bottom-4 -left-4 w-32 h-32 bg-purple-500/10 rounded-full blur-xl" })] })] })] }) }));
};
export default InteractiveDemo;
