export interface UserProfile {
  id: string;
  name: string;
  age?: number;
  location?: string;
  interests: string[];
  triggerThresholds: {
    [term: string]: number; // term -> min_conf threshold
  };
  keywordSets: {
    [category: string]: string[]; // category -> keywords
  };
  researchData: {
    topics: string[];
    lastUpdated: string;
    sources: string[];
  };
  preferences: {
    assistiveActions: boolean;
    feedbackFrequency: 'low' | 'medium' | 'high';
    preferredModalities: ('visual' | 'audio' | 'text')[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProfileUpdate {
  name?: string;
  age?: number;
  location?: string;
  interests?: string[];
  triggerThresholds?: Partial<Record<string, number>>;
  keywordSets?: Partial<Record<string, string[]>>;
  researchData?: Partial<{
    topics: string[];
    lastUpdated: string;
    sources: string[];
  }>;
  preferences?: Partial<{
    assistiveActions: boolean;
    feedbackFrequency: 'low' | 'medium' | 'high';
    preferredModalities: ('visual' | 'audio' | 'text')[];
  }>;
}

export const DEFAULT_PROFILE: UserProfile = {
  id: 'default',
  name: 'User',
  age: undefined,
  location: undefined,
  interests: [],
  triggerThresholds: {},
  keywordSets: {},
  researchData: {
    topics: [],
    lastUpdated: new Date().toISOString(),
    sources: [],
  },
  preferences: {
    assistiveActions: true,
    feedbackFrequency: 'medium',
    preferredModalities: ['visual', 'audio', 'text'],
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
