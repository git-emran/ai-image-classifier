export interface IDetectionResult {
  class_name: string;
  confidence: number;
  box: [number, number, number, number]; // [x1, y1, x2, y2]
}

type ChatRole = "user" | "ai" | "info";

export interface IChatMessage {
  role: ChatRole;
  text: string;
}
