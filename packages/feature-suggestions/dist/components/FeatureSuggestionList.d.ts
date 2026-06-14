import React from 'react';
import { FeatureSuggestion, SuggestionStatus } from '../types';
interface FeatureSuggestionListProps {
    suggestionService: {
        getSuggestionsByStatus: (status: SuggestionStatus) => Promise<FeatureSuggestion[]>;
    };
    suggestions: FeatureSuggestion[];
    onUpdateStatus: (suggestionId: string, status: SuggestionStatus) => Promise<void>;
    onConvertToFeature: (suggestionId: string) => Promise<void>;
    onRefresh: () => Promise<void>;
}
declare const FeatureSuggestionList: React.FC<FeatureSuggestionListProps>;
export { FeatureSuggestionList };
//# sourceMappingURL=FeatureSuggestionList.d.ts.map