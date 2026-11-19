export type MediaFormat = 'mp4' | 'mp3';

export type Mp4Quality = '1080' | '720' | '480' | '360';
export type Mp3Quality = '320' | '192' | '128';
export type MediaQuality = Mp4Quality | Mp3Quality;

export type QueueItemStatus = 'ready' | 'downloading' | 'completed' | 'error';

export type BatchDownloadMode = 'individual' | 'zip';

export type Language = 'bn' | 'en';

export interface VideoQueueItem {
  id: string;
  url: string;
  title: string;
  author: string;
  durationText: string;
  thumbnail: string;
  format: MediaFormat;
  quality: MediaQuality;
  status: QueueItemStatus;
  errorMessage?: string;
}

export interface VideoInfoResponse {
  id: string;
  url: string;
  title: string;
  author: string;
  durationText: string;
  thumbnail: string;
}
