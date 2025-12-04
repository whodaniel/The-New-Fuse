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
import { OnboardingStepsConfig } from '../OnboardingStepsConfig';
import { OnboardingAdminService } from '../../../../services/onboarding-admin.service';
// Mock the service
jest.mock('../../../../services/onboarding-admin.service');
var mockSteps = [
    {
        id: '1',
        type: 'welcome',
        title: 'Welcome',
        description: 'Introduction to The New Fuse platform',
        enabled: true,
        required: true,
        userTypes: ['human', 'ai_agent'],
        content: {
            heading: 'Welcome to The New Fuse',
            subheading: 'The AI agent coordination platform that enables intelligent interaction between different AI systems.',
            imageUrl: '/assets/images/welcome.png',
            buttonText: 'Get Started'
        }
    },
    {
        id: '2',
        type: 'completion',
        title: 'Complete',
        description: 'Onboarding completion',
        enabled: true,
        required: true,
        userTypes: ['human', 'ai_agent'],
        content: {
            heading: 'All Set!',
            subheading: 'You\'re ready to start using The New Fuse.',
            buttonText: 'Get Started'
        }
    }
];
describe('OnboardingStepsConfig', function () {
    beforeEach(function () {
        // Reset mocks
        jest.clearAllMocks();
        // Setup mock implementations
        OnboardingAdminService.getSteps.mockResolvedValue(mockSteps);
        OnboardingAdminService.updateSteps.mockResolvedValue({ success: true });
    });
    it('renders loading state initially', function () {
        render(_jsx(OnboardingStepsConfig, { onSave: jest.fn(), onChange: jest.fn(), hasUnsavedChanges: false }));
        expect(screen.getByText('Loading onboarding steps...')).toBeInTheDocument();
    });
    it('renders steps after loading', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    render(_jsx(OnboardingStepsConfig, { onSave: jest.fn(), onChange: jest.fn(), hasUnsavedChanges: false }));
                    // Wait for loading to complete
                    return [4 /*yield*/, waitFor(function () {
                            expect(screen.queryByText('Loading onboarding steps...')).not.toBeInTheDocument();
                        })];
                case 1:
                    // Wait for loading to complete
                    _a.sent();
                    // Check if steps are rendered
                    expect(screen.getByText('Welcome')).toBeInTheDocument();
                    expect(screen.getByText('Complete')).toBeInTheDocument();
                    return [2 /*return*/];
            }
        });
    }); });
    it('allows adding a new step', function () { return __awaiter(void 0, void 0, void 0, function () {
        var handleChange;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    handleChange = jest.fn();
                    render(_jsx(OnboardingStepsConfig, { onSave: jest.fn(), onChange: handleChange, hasUnsavedChanges: false }));
                    // Wait for loading to complete
                    return [4 /*yield*/, waitFor(function () {
                            expect(screen.queryByText('Loading onboarding steps...')).not.toBeInTheDocument();
                        })];
                case 1:
                    // Wait for loading to complete
                    _a.sent();
                    // Click add step button
                    fireEvent.click(screen.getByText('Add Step'));
                    // Check if modal is open
                    expect(screen.getByText('Add New Step')).toBeInTheDocument();
                    // Fill in form
                    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'New Test Step' } });
                    // Save the step
                    fireEvent.click(screen.getByText('Add Step'));
                    // Check if onChange was called
                    expect(handleChange).toHaveBeenCalled();
                    return [2 /*return*/];
            }
        });
    }); });
    it('saves changes when save button is clicked', function () { return __awaiter(void 0, void 0, void 0, function () {
        var handleSave;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    handleSave = jest.fn();
                    render(_jsx(OnboardingStepsConfig, { onSave: handleSave, onChange: jest.fn(), hasUnsavedChanges: true }));
                    // Wait for loading to complete
                    return [4 /*yield*/, waitFor(function () {
                            expect(screen.queryByText('Loading onboarding steps...')).not.toBeInTheDocument();
                        })];
                case 1:
                    // Wait for loading to complete
                    _a.sent();
                    // Click save button
                    fireEvent.click(screen.getByText('Save Changes'));
                    // Check if service method was called
                    return [4 /*yield*/, waitFor(function () {
                            expect(OnboardingAdminService.updateSteps).toHaveBeenCalled();
                        })];
                case 2:
                    // Check if service method was called
                    _a.sent();
                    // Check if onSave was called
                    expect(handleSave).toHaveBeenCalled();
                    return [2 /*return*/];
            }
        });
    }); });
    it('handles API errors gracefully', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Setup error mock
                    OnboardingAdminService.getSteps.mockRejectedValue(new Error('API Error'));
                    render(_jsx(OnboardingStepsConfig, { onSave: jest.fn(), onChange: jest.fn(), hasUnsavedChanges: false }));
                    // Wait for error to be displayed
                    return [4 /*yield*/, waitFor(function () {
                            expect(screen.getByText('Error Loading Steps')).toBeInTheDocument();
                        })];
                case 1:
                    // Wait for error to be displayed
                    _a.sent();
                    // Check if retry button is present
                    expect(screen.getByText('Retry')).toBeInTheDocument();
                    return [2 /*return*/];
            }
        });
    }); });
});
