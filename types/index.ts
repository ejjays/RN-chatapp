export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  lastSeen: Date;
  isOnline: boolean;
}

export interface Message {
  id: string;
  text?: string;
  imageUrl?: string;
  senderId: string;
  senderName: string;
  senderPhotoURL?: string;
  timestamp: Date;
  chatId: string;
  readBy: string[];
  type: 'text' | 'image';
}

export interface Chat {
  id: string;
  name?: string;
  participants: string[];
  participantDetails: User[];
  lastMessage?: Message;
  lastMessageTime: Date;
  isGroup: boolean;
  createdBy?: string;
  createdAt: Date;
  unreadCount: { [userId: string]: number };
  typingUsers: string[];
}

export interface TypingIndicator {
  chatId: string;
  userId: string;
  userName: string;
  timestamp: Date;
}