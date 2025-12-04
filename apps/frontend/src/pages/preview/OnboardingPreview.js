import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { OnboardingWizard } from '../../components/wizard/OnboardingWizard';
/**
 * Onboarding Preview Page
 *
 * This page provides a preview of the onboarding wizard for administrators
 * to test and validate the onboarding experience.
 */
var OnboardingPreview = function () {
    var searchParams = useSearchParams()[0];
    var _a = useState(true), loading = _a[0], setLoading = _a[1];
    // Get user type from URL params, default to 'human'
    var userType = searchParams.get('userType') || 'human';
    useEffect(function () {
        // Simulate loading configuration
        var timer = setTimeout(function () {
            setLoading(false);
        }, 1000);
        return function () { return clearTimeout(timer); };
    }, []);
    var handleComplete = function (data) {
        console.log('Onboarding completed with data:', data);
        // In a preview, we don't need to do anything with the data
        alert('Onboarding completed successfully! In a real environment, the user would be redirected to the dashboard.');
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-gray-600", children: "Loading onboarding preview..." })] }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-gray-50 py-8", children: _jsx(OnboardingWizard, { userType: userType, onComplete: handleComplete }) }));
};
export default OnboardingPreview;
