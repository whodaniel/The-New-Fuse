var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OnboardingWizardPreview } from '../OnboardingWizardPreview';
import { OnboardingAdminService } from '../../../../services/onboarding-admin.service';
import { BrowserRouter } from 'react-router-dom';
// Mock the service
jest.mock('../../../../services/onboarding-admin.service');
// Mock the iframe
jest.mock('react-iframe', function () { return ({
    __esModule: true,
    default: function () { return _jsx("div", { "data-testid": "mock-iframe", children: "Mock iframe content" }); }
}); });
var mockValidationResult = {
    valid: true,
    status: 'success',
    message: 'Configuration is valid',
    details: []
};
describe('OnboardingWizardPreview', function () {
    beforeEach(function () {
        // Reset mocks
        jest.clearAllMocks();
        // Setup mock implementations
        OnboardingAdminService.validateConfiguration.mockResolvedValue(mockValidationResult);
    });
    it('renders loading state initially', function () {
        render(_jsx(BrowserRouter, { children: _jsx(OnboardingWizardPreview, {}) }));
        expect(screen.getByText('Loading preview...')).toBeInTheDocument();
    });
    it('renders preview after loading', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    render(_jsx(BrowserRouter, { children: _jsx(OnboardingWizardPreview, {}) }));
                    // Wait for loading to complete
                    return [4 /*yield*/, waitFor(function () {
                            expect(screen.queryByText('Loading preview...')).not.toBeInTheDocument();
                        })];
                case 1:
                    // Wait for loading to complete
                    _a.sent();
                    // Check if preview tabs are rendered
                    expect(screen.getByText('Preview')).toBeInTheDocument();
                    expect(screen.getByText('Validation')).toBeInTheDocument();
                    expect(screen.getByText('Analytics')).toBeInTheDocument();
                    return [2 /*return*/];
            }
        });
    }); });
    it('allows switching user types', function () { return __awaiter(void 0, void 0, void 0, function () {
        var userTypeSelect;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    render(_jsx(BrowserRouter, { children: _jsx(OnboardingWizardPreview, {}) }));
                    // Wait for loading to complete
                    return [4 /*yield*/, waitFor(function () {
                            expect(screen.queryByText('Loading preview...')).not.toBeInTheDocument();
                        })];
                case 1:
                    // Wait for loading to complete
                    _a.sent();
                    userTypeSelect = screen.getByLabelText('Select user type');
                    fireEvent.change(userTypeSelect, { target: { value: 'ai_agent' } });
                    // Check if validation is triggered
                    expect(OnboardingAdminService.validateConfiguration).toHaveBeenCalled();
                    return [2 /*return*/];
            }
        });
    }); });
    it('runs validation when validation button is clicked', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    render(_jsx(BrowserRouter, { children: _jsx(OnboardingWizardPreview, {}) }));
                    // Wait for loading to complete
                    return [4 /*yield*/, waitFor(function () {
                            expect(screen.queryByText('Loading preview...')).not.toBeInTheDocument();
                        })];
                case 1:
                    // Wait for loading to complete
                    _a.sent();
                    // Switch to validation tab
                    fireEvent.click(screen.getByText('Validation'));
                    // Click run validation button
                    fireEvent.click(screen.getByText('Run Validation'));
                    // Check if validation service method was called
                    return [4 /*yield*/, waitFor(function () {
                            expect(OnboardingAdminService.validateConfiguration).toHaveBeenCalled();
                        })];
                case 2:
                    // Check if validation service method was called
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('handles validation errors gracefully', function () { return __awaiter(void 0, void 0, void 0, function () {
        var errorValidationResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    errorValidationResult = {
                        valid: false,
                        status: 'error',
                        message: 'Configuration has errors',
                        details: ['Missing required field in step 2']
                    };
                    OnboardingAdminService.validateConfiguration.mockResolvedValue(errorValidationResult);
                    render(_jsx(BrowserRouter, { children: _jsx(OnboardingWizardPreview, {}) }));
                    // Wait for loading to complete
                    return [4 /*yield*/, waitFor(function () {
                            expect(screen.queryByText('Loading preview...')).not.toBeInTheDocument();
                        })];
                case 1:
                    // Wait for loading to complete
                    _a.sent();
                    // Switch to validation tab
                    fireEvent.click(screen.getByText('Validation'));
                    // Click run validation button
                    fireEvent.click(screen.getByText('Run Validation'));
                    // Check if error message is displayed
                    return [4 /*yield*/, waitFor(function () {
                            expect(screen.getByText('Configuration has errors')).toBeInTheDocument();
                        })];
                case 2:
                    // Check if error message is displayed
                    _a.sent();
                    // Check if error details are displayed
                    expect(screen.getByText('Missing required field in step 2')).toBeInTheDocument();
                    return [2 /*return*/];
            }
        });
    }); });
});
