export type TGenerationUpdatePayload = {
  generationId : string;
  status       : "completed" | "failed";
  outputFileKey?: string;
  outputUrl    ?: string;
  errorMessage ?: string;
};
