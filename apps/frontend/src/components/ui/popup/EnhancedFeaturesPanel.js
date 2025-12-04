var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
var EnhancedFeaturesPanel = function (_a) {
    var _b = _a.isMainApp, isMainApp = _b === void 0 ? true : _b;
    // Enhanced Features State
    var _c = useState({
        aiAssistant: true,
        smartSuggestions: false,
        autoComplete: true,
        voiceCommands: false,
        gestureControls: false,
        smartSync: true,
        advancedAnalytics: false,
        contextAware: true,
        predictiveText: false,
        intelligentRouting: true,
    }), features = _c[0], setFeatures = _c[1];
    // Performance Settings
    var _d = useState({
        processingSpeed: 75,
        memoryOptimization: 80,
        batchSize: 50,
        cacheLevel: 60,
    }), performance = _d[0], setPerformance = _d[1];
    // Personalization Settings
    var _e = useState({
        theme: "auto",
        language: "en",
        notifications: true,
        soundEffects: false,
        animations: true,
        compactMode: false,
    }), personalization = _e[0], setPersonalization = _e[1];
    // Status messages
    var _f = useState(""), status = _f[0], setStatus = _f[1];
    var _g = useState("info"), statusType = _g[0], setStatusType = _g[1];
    // Helper function to add status messages
    var addStatus = function (message, type) {
        if (type === void 0) { type = "info"; }
        setStatus(message);
        setStatusType(type);
        setTimeout(function () { return setStatus(""); }, 3000);
    };
    // Handle feature toggle
    var handleFeatureToggle = function (feature) {
        setFeatures(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[feature] = !prev[feature], _a)));
        });
        addStatus("".concat(feature, " ").concat(!features[feature] ? "enabled" : "disabled"), "success");
    };
    // Handle performance change
    var handlePerformanceChange = function (setting, value) {
        setPerformance(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[setting] = value, _a)));
        });
    };
    // Handle personalization change
    var handlePersonalizationChange = function (setting, value) {
        setPersonalization(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[setting] = value, _a)));
        });
        addStatus("".concat(setting, " updated"), "success");
    };
    // Save settings
    var saveSettings = function () {
        // Here you would save to chrome.storage or your app's state management
        addStatus("Settings saved successfully", "success");
    };
    // Reset to defaults
    var resetToDefaults = function () {
        setFeatures({
            aiAssistant: true,
            smartSuggestions: false,
            autoComplete: true,
            voiceCommands: false,
            gestureControls: false,
            smartSync: true,
            advancedAnalytics: false,
            contextAware: true,
            predictiveText: false,
            intelligentRouting: true,
        });
        setPerformance({
            processingSpeed: 75,
            memoryOptimization: 80,
            batchSize: 50,
            cacheLevel: 60,
        });
        setPersonalization({
            theme: "auto",
            language: "en",
            notifications: true,
            soundEffects: false,
            animations: true,
            compactMode: false,
        });
        addStatus("Settings reset to defaults", "info");
    };
    var featureList = [
        {
            key: "aiAssistant",
            label: "AI Assistant",
            icon: _jsx(PsychologyIcon, {}),
            description: "Intelligent assistance and recommendations",
        },
        {
            key: "smartSuggestions",
            label: "Smart Suggestions",
            icon: _jsx(AutoAwesomeIcon, {}),
            description: "Context-aware suggestions",
        },
        {
            key: "autoComplete",
            label: "Auto Complete",
            icon: _jsx(KeyboardIcon, {}),
            description: "Predictive text completion",
        },
        {
            key: "voiceCommands",
            label: "Voice Commands",
            icon: _jsx(VolumeUpIcon, {}),
            description: "Voice-activated controls",
        },
        {
            key: "gestureControls",
            label: "Gesture Controls",
            icon: _jsx(SpeedIcon, {}),
            description: "Touch and gesture navigation",
        },
        {
            key: "smartSync",
            label: "Smart Sync",
            icon: _jsx(CloudSyncIcon, {}),
            description: "Intelligent data synchronization",
        },
        {
            key: "advancedAnalytics",
            label: "Advanced Analytics",
            icon: _jsx(AnalyticsIcon, {}),
            description: "Detailed usage analytics",
        },
        {
            key: "contextAware",
            label: "Context Awareness",
            icon: _jsx(SecurityIcon, {}),
            description: "Context-sensitive features",
        },
        {
            key: "predictiveText",
            label: "Predictive Text",
            icon: _jsx(LanguageIcon, {}),
            description: "Smart text prediction",
        },
        {
            key: "intelligentRouting",
            label: "Intelligent Routing",
            icon: _jsx(SpeedIcon, {}),
            description: "Optimized request routing",
        },
    ];
    return (_jsxs(Box, { sx: { p: 2, height: "100%", overflow: "auto" }, children: [status && (_jsx(Alert, { severity: statusType, sx: { mb: 2 }, onClose: function () { return setStatus(""); }, children: status })), _jsx(Card, { sx: { mb: 2 }, children: _jsxs(CardBody, { children: [_jsxs(Text, { variant: "h6", gutterBottom: true, sx: { display: "flex", alignItems: "center", gap: 1 }, children: [_jsx(AutoAwesomeIcon, {}), "Enhanced Features"] }), _jsx(List, { dense: true, children: featureList.map(function (feature) { return (_jsxs(ListItem, { sx: { px: 0 }, children: [_jsx(ListItem, { sx: { minWidth: 40 }, children: feature.icon }), _jsx(ListItem, { primary: feature.label, secondary: feature.description, primaryTypographyProps: { variant: "body2", fontWeight: 500 }, secondaryTypographyProps: { variant: "caption" } }), _jsx(Switch, { checked: features[feature.key], onChange: function () {
                                            return handleFeatureToggle(feature.key);
                                        }, size: "small" })] }, feature.key)); }) })] }) }), _jsx(Card, { sx: { mb: 2 }, children: _jsxs(CardBody, { children: [_jsxs(Text, { variant: "h6", gutterBottom: true, sx: { display: "flex", alignItems: "center", gap: 1 }, children: [_jsx(SpeedIcon, {}), "Performance Settings"] }), _jsxs(SimpleGrid, { container: true, columns: 3, children: [_jsxs(SimpleGrid, { item: true, xs: 12, sm: 6, children: [_jsxs(Text, { variant: "body2", gutterBottom: true, children: ["Processing Speed: ", performance.processingSpeed, "%"] }), _jsx(Slider, { value: performance.processingSpeed, onChange: function (_, value) {
                                                return handlePerformanceChange("processingSpeed", value);
                                            }, min: 10, max: 100, step: 5, marks: true, size: "small" })] }), _jsxs(SimpleGrid, { item: true, xs: 12, sm: 6, children: [_jsxs(Text, { variant: "body2", gutterBottom: true, children: ["Memory Optimization: ", performance.memoryOptimization, "%"] }), _jsx(Slider, { value: performance.memoryOptimization, onChange: function (_, value) {
                                                return handlePerformanceChange("memoryOptimization", value);
                                            }, min: 10, max: 100, step: 5, marks: true, size: "small" })] }), _jsxs(SimpleGrid, { item: true, xs: 12, sm: 6, children: [_jsxs(Text, { variant: "body2", gutterBottom: true, children: ["Batch Size: ", performance.batchSize] }), _jsx(Slider, { value: performance.batchSize, onChange: function (_, value) {
                                                return handlePerformanceChange("batchSize", value);
                                            }, min: 10, max: 100, step: 10, marks: true, size: "small" })] }), _jsxs(SimpleGrid, { item: true, xs: 12, sm: 6, children: [_jsxs(Text, { variant: "body2", gutterBottom: true, children: ["Cache Level: ", performance.cacheLevel, "%"] }), _jsx(Slider, { value: performance.cacheLevel, onChange: function (_, value) {
                                                return handlePerformanceChange("cacheLevel", value);
                                            }, min: 0, max: 100, step: 10, marks: true, size: "small" })] })] })] }) }), _jsx(Card, { sx: { mb: 2 }, children: _jsxs(CardBody, { children: [_jsxs(Text, { variant: "h6", gutterBottom: true, sx: { display: "flex", alignItems: "center", gap: 1 }, children: [_jsx(PaletteIcon, {}), "Personalization"] }), _jsxs(SimpleGrid, { container: true, columns: 2, children: [_jsx(SimpleGrid, { item: true, xs: 12, sm: 6, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Theme" }), _jsxs(Select, { value: personalization.theme, label: "Theme", onChange: function (e) {
                                                    return handlePersonalizationChange("theme", e.target.value);
                                                }, children: [_jsx(Option, { value: "light", children: "Light" }), _jsx(Option, { value: "dark", children: "Dark" }), _jsx(Option, { value: "auto", children: "Auto" })] })] }) }), _jsx(SimpleGrid, { item: true, xs: 12, sm: 6, children: _jsxs(FormControl, { fullWidth: true, size: "small", children: [_jsx(InputLabel, { children: "Language" }), _jsxs(Select, { value: personalization.language, label: "Language", onChange: function (e) {
                                                    return handlePersonalizationChange("language", e.target.value);
                                                }, children: [_jsx(Option, { value: "en", children: "English" }), _jsx(Option, { value: "es", children: "Spanish" }), _jsx(Option, { value: "fr", children: "French" }), _jsx(Option, { value: "de", children: "German" }), _jsx(Option, { value: "zh", children: "Chinese" })] })] }) }), _jsx(SimpleGrid, { item: true, xs: 12, children: _jsxs(Box, { sx: { display: "flex", gap: 2, flexWrap: "wrap" }, children: [_jsx(FormLabel, { control: _jsx(Switch, { checked: personalization.notifications, onChange: function (e) {
                                                        return handlePersonalizationChange("notifications", e.target.checked);
                                                    }, size: "small" }), label: "Notifications" }), _jsx(FormLabel, { control: _jsx(Switch, { checked: personalization.soundEffects, onChange: function (e) {
                                                        return handlePersonalizationChange("soundEffects", e.target.checked);
                                                    }, size: "small" }), label: "Sound Effects" }), _jsx(FormLabel, { control: _jsx(Switch, { checked: personalization.animations, onChange: function (e) {
                                                        return handlePersonalizationChange("animations", e.target.checked);
                                                    }, size: "small" }), label: "Animations" }), _jsx(FormLabel, { control: _jsx(Switch, { checked: personalization.compactMode, onChange: function (e) {
                                                        return handlePersonalizationChange("compactMode", e.target.checked);
                                                    }, size: "small" }), label: "Compact Mode" })] }) })] })] }) }), _jsx(Card, { children: _jsxs(CardBody, { children: [_jsx(Text, { variant: "h6", gutterBottom: true, children: "Current Status" }), _jsxs(Box, { sx: { display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }, children: [_jsx(Tag, { label: "".concat(Object.values(features).filter(Boolean).length, "/").concat(Object.keys(features).length, " Features Active"), color: "primary", size: "small" }), _jsx(Tag, { label: "Performance: ".concat(Math.round(Object.values(performance).reduce(function (a, b) { return a + b; }, 0) / Object.keys(performance).length), "%"), color: "success", size: "small" }), _jsx(Tag, { label: "Theme: ".concat(personalization.theme), color: "info", size: "small" })] }), _jsx(Divider, { sx: { my: 2 } }), _jsxs(Box, { sx: { display: "flex", gap: 1 }, children: [_jsx(Button, { variant: "contained", size: "small", onClick: saveSettings, startIcon: _jsx(SettingsIcon, {}), children: "Save Settings" }), _jsx(Button, { variant: "outlined", size: "small", onClick: resetToDefaults, startIcon: _jsx(RefreshIcon, {}), children: "Reset to Defaults" })] })] }) })] }));
};
export default EnhancedFeaturesPanel;
