export * from "./schemas";

export interface PipelineProgressState {
  step: number;
  stage: string;
  detail: string;
  timestamp: string;
}
