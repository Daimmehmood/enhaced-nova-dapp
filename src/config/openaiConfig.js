// src/config/openaiConfig.js

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
    
    // Add any additional headers needed for project keys
    // This is just a template - customize if your specific project key requires more
    if (this.isProjectKey) {
      // Uncomment and customize if needed:
      // headers['OpenAI-Organization'] = 'your-org-id';
    }
    
    return headers;
  },
  
  // Helper method to make API requests
  async makeRequest(endpoint, requestData) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('OpenAI API request failed:', error);
      throw error;
    }
  },
  
  // Helper method specifically for chat completions
  async createChatCompletion(messages, options = {}) {
    const model = options.model || this.models.default;
    const temperature = options.temperature !== undefined ? options.temperature : 0.3;
    const maxTokens = options.maxTokens || 800;
    
    return this.makeRequest('/chat/completions', {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      top_p: options.topP || 1,
      frequency_penalty: options.frequencyPenalty || 0,
      presence_penalty: options.presencePenalty || 0,
      ...(options.responseFormat && { response_format: options.responseFormat })
    });
  }
};

// Export direct access to API key check
export const isOpenAIAvailable = () => {
  return !!OPENAI_API_KEY && OPENAI_API_KEY.length > 20;
};

export default OPENAI_CONFIG;