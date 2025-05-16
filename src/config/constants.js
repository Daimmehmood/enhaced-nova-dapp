// src/config/constants.js
// Replace this with your actual OpenAI API key
export const OPENAI_API_KEY = "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";

// Character-specific configuration
export const CHARACTER_CONFIG = {
  nova: {
    aiTemperature: 0.3,  // More focused, analytical responses
    responseStyle: "analytical",
    topicFocus: "data-driven analysis",
    defaultPrompt: "I'm Nova, your Logic-Driven Analyst. How can I help you with crypto analysis today?"
  },
  luna: {
    aiTemperature: 0.7,  // More creative responses
    responseStyle: "innovative",
    topicFocus: "creative investment strategies",
    defaultPrompt: "Luna here! I'm excited to explore creative crypto opportunities with you. What unique possibilities shall we discover today?"
  },
  vega: {
    aiTemperature: 0.4, 
    responseStyle: "technical",
    topicFocus: "chart patterns and indicators",
    defaultPrompt: "Vega online. Ready to analyze technical patterns and market indicators. What charts would you like me to examine?"
  },
  ember: {
    aiTemperature: 0.5,
    responseStyle: "protective",
    topicFocus: "risk management",
    defaultPrompt: "This is Ember, your protective guardian. I'm here to help you navigate crypto risks safely. What concerns can I address for you?"
  },
  astra: {
    aiTemperature: 0.8, // Higher temperature for more varied, speculative responses
    responseStyle: "visionary",
    topicFocus: "high-risk opportunities",
    defaultPrompt: "Astra activated! Ready to spot those high-risk, high-reward opportunities most would miss. What moonshot are we hunting today?"
  }
};