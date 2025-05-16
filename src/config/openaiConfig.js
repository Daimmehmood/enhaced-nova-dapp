// src/config/openaiConfig.js
// Improved version with better error handling and implementation

/**
 * OpenAI API configuration file
 * Handles both standard and project-style API keys
 */

// Get API key from environment
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY; 

// Configuration object
export const OPENAI_CONFIG = {
  apiKey: OPENAI_API_KEY,
  isProjectKey: OPENAI_API_KEY?.startsWith('sk-proj-'),
  
  // API endpoint options
  baseUrl: 'https://api.openai.com/v1',
  
  // Models
  models: {
    default: 'gpt-3.5-turbo',
    advanced: 'gpt-4',
    fast: 'gpt-3.5-turbo'
  },
  
  // Function to get appropriate headers based on key type
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    };
    
    return headers;
  },
  
  // Helper method specifically for chat completions
  async createChatCompletion(messages, options = {}) {
    const model = options.model || this.models.default;
    const temperature = options.temperature !== undefined ? options.temperature : 0.3;
    const maxTokens = options.maxTokens || 800;
    
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          top_p: options.topP || 1,
          frequency_penalty: options.frequencyPenalty || 0,
          presence_penalty: options.presencePenalty || 0,
          ...(options.responseFormat && { response_format: options.responseFormat })
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OpenAI API error (${response.status}):`, errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error?.message || `API error ${response.status}`);
        } catch (e) {
          throw new Error(`API error ${response.status}: ${errorText.substring(0, 100)}`);
        }
      }
      
      return await response.json();
    } catch (error) {
      console.error('OpenAI API request failed:', error);
      throw error;
    }
  }
};

// Export direct access to API key check
export const isOpenAIAvailable = () => {
  return !!OPENAI_API_KEY && OPENAI_API_KEY.length > 20;
};

export default OPENAI_CONFIG;