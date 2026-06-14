"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_hooks_1 = require("@testing-library/react-hooks");
const useFeatureSuggestions_1 = require("./useFeatureSuggestions");
const types_1 = require("../types");
// Mock suggestion service
const mockSuggestionService = {
    getPopularSuggestions: jest.fn(),
    getSuggestionsByStatus: jest.fn(),
    getAllTodos: jest.fn(),
    updateSuggestionStatus: jest.fn(),
    updateTodoStatus: jest.fn(),
    submitSuggestion: jest.fn(),
    voteSuggestion: jest.fn(),
    convertToFeature: jest.fn(),
    addTodo: jest.fn(),
    addComment: jest.fn()
};
describe('useFeatureSuggestions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should load suggestions on init', async () => {
        const mockSuggestions = [
            {
                id: '1',
                title: 'Test Suggestion',
                description: 'Test Description',
                submittedBy: 'user1',
                submittedAt: new Date(),
                status: types_1.SuggestionStatus.PENDING,
                priority: types_1.SuggestionPriority.MEDIUM,
                votes: 5,
                tags: ['test'],
                relatedTodoIds: [],
                updatedAt: new Date()
            }
        ];
        mockSuggestionService.getPopularSuggestions.mockResolvedValue(mockSuggestions);
        const { result, waitForNextUpdate } = (0, react_hooks_1.renderHook)(() => (0, useFeatureSuggestions_1.useFeatureSuggestions)({ suggestionService: mockSuggestionService }));
        // Initial state
        expect(result.current.loading).toBe(true);
        expect(result.current.suggestions).toEqual([]);
        expect(result.current.error).toBeNull();
        await waitForNextUpdate();
        // After loading
        expect(result.current.loading).toBe(false);
        expect(result.current.suggestions).toEqual(mockSuggestions);
        expect(result.current.error).toBeNull();
        expect(mockSuggestionService.getPopularSuggestions).toHaveBeenCalledTimes(1);
    });
    it('should handle errors when loading suggestions', async () => {
        const error = new Error('Failed to load suggestions');
        mockSuggestionService.getPopularSuggestions.mockRejectedValue(error);
        const { result, waitForNextUpdate } = (0, react_hooks_1.renderHook)(() => (0, useFeatureSuggestions_1.useFeatureSuggestions)({ suggestionService: mockSuggestionService }));
        await waitForNextUpdate();
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toEqual(error);
    });
    it('should submit a suggestion', async () => {
        const newSuggestion = {
            id: '2',
            title: 'New Suggestion',
            description: 'New Description',
            submittedBy: 'user1',
            submittedAt: new Date(),
            status: types_1.SuggestionStatus.PENDING,
            priority: types_1.SuggestionPriority.HIGH,
            votes: 0,
            tags: ['new'],
            relatedTodoIds: [],
            updatedAt: new Date()
        };
        mockSuggestionService.submitSuggestion.mockResolvedValue(newSuggestion);
        mockSuggestionService.getPopularSuggestions.mockResolvedValue([newSuggestion]);
        const { result, waitForNextUpdate } = (0, react_hooks_1.renderHook)(() => (0, useFeatureSuggestions_1.useFeatureSuggestions)({ suggestionService: mockSuggestionService }));
        await waitForNextUpdate();
        await (0, react_hooks_1.act)(async () => {
            await result.current.submitSuggestion('New Suggestion', 'New Description', 'user1', types_1.SuggestionPriority.HIGH, ['new']);
        });
        expect(mockSuggestionService.submitSuggestion).toHaveBeenCalledWith({
            title: 'New Suggestion',
            description: 'New Description',
            submittedBy: 'user1',
            priority: types_1.SuggestionPriority.HIGH,
            tags: ['new'],
            status: types_1.SuggestionStatus.PENDING
        });
        expect(mockSuggestionService.getPopularSuggestions).toHaveBeenCalledTimes(2);
    });
});
//# sourceMappingURL=useFeatureSuggestions.test.js.map