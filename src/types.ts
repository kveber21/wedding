export interface PhotoAttachment {
  id: string;
  url: string;
  name: string;
  size?: number;
}

export interface GuestbookEntry {
  id: string | number;
  author: string;
  message: string;
  date: string;
  timestamp: number;
  isPrivate?: boolean;
  photos?: PhotoAttachment[];
  reactions?: {
    heart?: number;
    toast?: number;
    lemon?: number;
    sparkle?: number;
  };
}
