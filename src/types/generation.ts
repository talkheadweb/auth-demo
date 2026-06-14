export type GenerationStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";
export type GenerationInputType = "text" | "audio";

export type Generation = {
  _id           : string;
  userId        : string;
  status        : GenerationStatus;
  inputType     : GenerationInputType;
  voiceId       : string;
  avatarImageKey: string;
  avatarImageUrl?: string;
  inputText    ?: string;
  inputAudioKey?: string;
  inputAudioUrl?: string;
  outputFileKey?: string;
  outputUrl    ?: string;
  errorMessage ?: string;
  queueJobId   ?: string;
  completedAt  ?: string;
  createdAt     : string;
  updatedAt     : string;
};

export type GenerationListResponse = {
  items: Generation[];
  meta : {
    page      : number;
    limit     : number;
    total     : number;
    totalPages: number;
  };
};
