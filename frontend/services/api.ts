import { AnalysisResults, ChatHistory } from "@/types/api.types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const apiService = {
  analyzeImage: async (
    fileData: string,
    fileType: string,
  ): Promise<AnalysisResults> => {
    const response = await fetch(`${API_BASE_URL}/analyze-objects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_data: fileData, file_type: fileType }),
    });
    if (!response.ok) throw new Error("Analysis failed");
    return response.json();
  },

  chat: async (
    fileData: string,
    fileType: string,
    prompt: string,
    history: ChatHistory[],
  ): Promise<{ response: string }> => {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file_data: fileData,
        file_type: fileType,
        prompt,
        history,
      }),
    });
    if (!response.ok) throw new Error("Chat request failed");
    return response.json();
  },
};
