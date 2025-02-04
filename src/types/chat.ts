export interface Message {
  type: 'user' | 'system';
  username?: string;
  content: string;
  timestamp: Date;
}

export interface Room {
  id: string;
  name: string;
}