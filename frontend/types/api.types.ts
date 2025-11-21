export interface BoundingBox {
  label: string;
  box: number[];
}

export interface AnalysisResults {
  description: string;
  detected_objects: BoundingBox[];
}

export interface ImageData {
  data: string;
  type: string;
  preview: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface ChatHistory {
  role: string;
  parts: { text: string }[];
}
