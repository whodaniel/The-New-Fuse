/**
 * Service for managing onboarding configuration settings
 */
export declare const OnboardingAdminService: {
    /**
     * Get general onboarding settings
     */
    getGeneralSettings(): Promise<any>;
    /**
     * Update general onboarding settings
     */
    updateGeneralSettings(data: any): Promise<any>;
    /**
     * Get user types configuration
     */
    getUserTypes(): Promise<any>;
    /**
     * Update user types configuration
     */
    updateUserTypes(data: any): Promise<any>;
    /**
     * Get onboarding steps configuration
     */
    getSteps(): Promise<any>;
    /**
     * Update onboarding steps configuration
     */
    updateSteps(data: any): Promise<any>;
    /**
     * Get AI settings for onboarding
     */
    getAISettings(): Promise<any>;
    /**
     * Update AI settings for onboarding
     */
    updateAISettings(data: any): Promise<any>;
    /**
     * Validate onboarding configuration
     */
    validateConfiguration(): Promise<any>;
    /**
     * Get onboarding analytics
     */
    getAnalytics(): Promise<any>;
};
