import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../config/api.js';

const API_ENDPOINT = `${API_BASE_URL}/api/admin/onboarding`;

/**
 * Service for managing onboarding configuration settings
 */
export const OnboardingAdminService = {
  /**
   * Get general onboarding settings
   */
  async getGeneralSettings() {
    try {
      const response = await axios.get(`${API_ENDPOINT}/general`, {
        timeout: API_TIMEOUT,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting general onboarding settings:', error);
      throw error;
    }
  },
  
  /**
   * Update general onboarding settings
   */
  async updateGeneralSettings(data: any) {
    try {
      const response = await axios.put(`${API_ENDPOINT}/general`, data, {
        timeout: API_TIMEOUT,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error updating general onboarding settings:', error);
      throw error;
    }
  },
  
  /**
   * Get user types configuration
   */
  async getUserTypes() {
    try {
      const response = await axios.get(`${API_ENDPOINT}/user-types`, {
        timeout: API_TIMEOUT,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting user types configuration:', error);
      throw error;
    }
  },
  
  /**
   * Update user types configuration
   */
  async updateUserTypes(data: any) {
    try {
      const response = await axios.put(`${API_ENDPOINT}/user-types`, data, {
        timeout: API_TIMEOUT,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error updating user types configuration:', error);
      throw error;
    }
  },
  
  /**
   * Get onboarding steps configuration
   */
  async getSteps() {
    try {
      const response = await axios.get(`${API_ENDPOINT}/steps`, {
        timeout: API_TIMEOUT,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting onboarding steps configuration:', error);
      throw error;
    }
  },
  
  /**
   * Update onboarding steps configuration
   */
  async updateSteps(data: any) {
    try {
      const response = await axios.put(`${API_ENDPOINT}/steps`, data, {
        timeout: API_TIMEOUT,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error updating onboarding steps configuration:', error);
      throw error;
    }
  },
  
  /**
   * Get AI settings for onboarding
   */
  async getAISettings() {
    try {
      const response = await axios.get(`${API_ENDPOINT}/ai-settings`, {
        timeout: API_TIMEOUT,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting AI settings for onboarding:', error);
      throw error;
    }
  },
  
  /**
   * Update AI settings for onboarding
   */
  async updateAISettings(data: any) {
    try {
      const response = await axios.put(`${API_ENDPOINT}/ai-settings`, data, {
        timeout: API_TIMEOUT,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error updating AI settings for onboarding:', error);
      throw error;
    }
  },
  
  /**
   * Validate onboarding configuration
   */
  async validateConfiguration() {
    try {
      const response = await axios.post(`${API_ENDPOINT}/validate`, {}, {
        timeout: API_TIMEOUT,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error validating onboarding configuration:', error);
      throw error;
    }
  },
  
  /**
   * Get onboarding analytics
   */
  async getAnalytics() {
    try {
      const response = await axios.get(`${API_ENDPOINT}/analytics`, {
        timeout: API_TIMEOUT,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting onboarding analytics:', error);
      throw error;
    }
  }
};
