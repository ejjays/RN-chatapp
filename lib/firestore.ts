import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore';
import { db } from './firebase';
import { User, Message, Chat, TypingIndicator } from '@/types';

// Users
export const getUsers = async (): Promise<User[]> => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    } as User));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const getUserById = async (uid: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return { uid: userDoc.id, ...userDoc.data() } as User;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};

// Chats
export const createOrGetChat = async (participantIds: string[], isGroup: boolean = false, groupName?: string): Promise<string> => {
  try {
    // For one-on-one chats, check if chat already exists
    if (!isGroup && participantIds.length === 2) {
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('participants', 'array-contains', participantIds[0]),
        where('isGroup', '==', false)
      );
      
      const snapshot = await getDocs(q);
      const existingChat = snapshot.docs.find(doc => {
        const data = doc.data();
        return data.participants.includes(participantIds[1]);
      });
      
      if (existingChat) {
        return existingChat.id;
      }
    }

    // Create new chat
    const chatData = {
      participants: participantIds,
      isGroup,
      name: groupName || null,
      createdAt: serverTimestamp(),
      lastMessageTime: serverTimestamp(),
      unreadCount: Object.fromEntries(participantIds.map(id => [id, 0])),
      typingUsers: []
    };

    const docRef = await addDoc(collection(db, 'chats'), chatData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
};

export const getUserChats = (userId: string, callback: (chats: Chat[]) => void) => {
  const chatsRef = collection(db, 'chats');
  const q = query(
    chatsRef,
    where('participants', 'array-contains', userId),
    orderBy('lastMessageTime', 'desc')
  );

  return onSnapshot(q, async (snapshot) => {
    const chats: Chat[] = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Get participant details
      const participantDetails: User[] = [];
      for (const participantId of data.participants) {
        const user = await getUserById(participantId);
        if (user) participantDetails.push(user);
      }
      
      // Get last message if exists
      let lastMessage: Message | undefined;
      if (data.lastMessage) {
        lastMessage = data.lastMessage as Message;
      }
      
      chats.push({
        id: doc.id,
        participants: data.participants,
        participantDetails,
        isGroup: data.isGroup,
        name: data.name,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastMessage,
        lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
        unreadCount: data.unreadCount || {},
        typingUsers: data.typingUsers || []
      });
    }
    
    callback(chats);
  });
};

// Messages
export const sendMessage = async (chatId: string, senderId: string, senderName: string, text?: string, imageUrl?: string): Promise<void> => {
  try {
    const messageData = {
      text: text || null,
      imageUrl: imageUrl || null,
      senderId,
      senderName,
      timestamp: serverTimestamp(),
      chatId,
      readBy: [senderId],
      type: imageUrl ? 'image' : 'text'
    };

    // Add message to messages collection
    await addDoc(collection(db, 'messages'), messageData);

    // Update chat's last message
    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage: messageData,
      lastMessageTime: serverTimestamp()
    });

    // Clear typing indicator
    await setTypingStatus(chatId, senderId, false);
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const getChatMessages = (chatId: string, callback: (messages: Message[]) => void, limitCount: number = 50) => {
  const messagesRef = collection(db, 'messages');
  const q = query(
    messagesRef,
    where('chatId', '==', chatId),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );

  return onSnapshot(q, (snapshot) => {
    const messages: Message[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date()
    } as Message)).reverse();
    
    callback(messages);
  });
};

export const markMessagesAsRead = async (chatId: string, userId: string): Promise<void> => {
  try {
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('chatId', '==', chatId),
      where('readBy', 'not-in', [[userId]])
    );

    const snapshot = await getDocs(q);
    const batch = snapshot.docs.map(doc => 
      updateDoc(doc.ref, {
        readBy: arrayUnion(userId)
      })
    );

    await Promise.all(batch);

    // Reset unread count for this user
    await updateDoc(doc(db, 'chats', chatId), {
      [`unreadCount.${userId}`]: 0
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
};

// Typing indicators
export const setTypingStatus = async (chatId: string, userId: string, isTyping: boolean): Promise<void> => {
  try {
    const chatRef = doc(db, 'chats', chatId);
    
    if (isTyping) {
      await updateDoc(chatRef, {
        typingUsers: arrayUnion(userId)
      });
    } else {
      await updateDoc(chatRef, {
        typingUsers: arrayRemove(userId)
      });
    }
  } catch (error) {
    console.error('Error updating typing status:', error);
  }
};