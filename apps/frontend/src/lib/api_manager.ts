    async updateLLMConfig(provider, apiKey, modelName, parameters) {
        try {
            const response = await fetch('/api/llm/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    provider: provider,
                    api_key: apiKey,
                    model_name: modelName,
                    parameters: parameters
                })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update LLM config');
            }
            showToast('LLM configuration updated successfully', 'success');
        }
        catch (error) {
            showToast('Error updating LLM configuration: ' + error.message, 'error');
        }
    }
}
document.addEventListener('DOMContentLoaded', () => {
    window.apiManager = new APIManager();
});
export {};
//# sourceMappingURL=api_manager.js.map