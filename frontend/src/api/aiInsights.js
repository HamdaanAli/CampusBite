
import api from './axios';

// ==================== ASK CAMPUSBITE AI INSIGHTS ====================
// Backend: POST /api/v1/ai-insights/ask
// Sends a customer question and receives an AI-generated answer.
export const askAIInsights = async (question) => {
  const response = await api.post('/ai-insights/ask', {
    question: question.trim(),
  });

  return response.data;
};
