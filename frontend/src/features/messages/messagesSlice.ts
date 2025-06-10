import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../api/axios';
import { toast } from 'react-toastify';

// Define types
export interface Message {
  id: string;
  from: string;
  fromName?: string;
  fromRole?: 'admin' | 'member';
  to: string;
  toName?: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface Thread {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserRole: 'admin' | 'member';
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
  messages: Message[];
}

interface MessagesState {
  threads: Thread[];
  selectedThreadId: string | null;
  loading: boolean;
  error: string | null;
}

interface SendMessageParams {
  from: string;
  to: string;
  text: string;
}

// Thunks
export const fetchMessageThreads = createAsyncThunk(
  'messages/fetchThreads',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/messages/threads/${userId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch message threads');
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async ({ userId, otherUserId }: { userId: string; otherUserId: string }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/messages/thread/${userId}/${otherUserId}`);
      return { messages: response.data, threadId: otherUserId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async (messageData: SendMessageParams, { rejectWithValue }) => {
    try {
      const response = await api.post('/messages/send', messageData);
      return { message: response.data, threadId: messageData.to };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

export const broadcastMessage = createAsyncThunk(
  'messages/broadcastMessage',
  async ({ text, sendEmail = false }: { text: string; sendEmail?: boolean }, { rejectWithValue }) => {
    try {
      const response = await api.post('/admin/messages/broadcast', { text, sendEmail });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to broadcast message');
    }
  }
);

// Initial state
const initialState: MessagesState = {
  threads: [],
  selectedThreadId: null,
  loading: false,
  error: null,
};

// Slice
const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    selectThread: (state, action: PayloadAction<string>) => {
      state.selectedThreadId = action.payload;
    },
    clearMessageError: (state) => {
      state.error = null;
    },
    markThreadAsRead: (state, action: PayloadAction<string>) => {
      const threadId = action.payload;
      const thread = state.threads.find(t => t.id === threadId);
      if (thread) {
        thread.unreadCount = 0;
        thread.messages = thread.messages.map(message => ({
          ...message,
          read: true
        }));
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch Message Threads
    builder
      .addCase(fetchMessageThreads.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessageThreads.fulfilled, (state, action: PayloadAction<Thread[]>) => {
        state.threads = action.payload;
        state.loading = false;
      })
      .addCase(fetchMessageThreads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      });

    // Fetch Messages for a Thread
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action: PayloadAction<{ messages: Message[]; threadId: string }>) => {
        const { messages, threadId } = action.payload;
        const threadIndex = state.threads.findIndex(thread => thread.id === threadId);
        
        if (threadIndex !== -1) {
          state.threads[threadIndex].messages = messages;
          state.threads[threadIndex].unreadCount = 0; // Mark as read when fetched
        }
        
        state.loading = false;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      });

    // Send Message
    builder
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action: PayloadAction<{ message: Message; threadId: string }>) => {
        const { message, threadId } = action.payload;
        const threadIndex = state.threads.findIndex(thread => thread.id === threadId);
        
        if (threadIndex !== -1) {
          // Add message to existing thread
          state.threads[threadIndex].messages.push(message);
          state.threads[threadIndex].lastMessage = message.text;
          state.threads[threadIndex].lastMessageTimestamp = message.timestamp;
          
          // Move this thread to the top of the list
          const thread = state.threads[threadIndex];
          state.threads.splice(threadIndex, 1);
          state.threads.unshift(thread);
        } else {
          // This is a new thread, we should handle it by creating a new thread
          // This would typically come from the backend, but we can handle it here
          const newThread: Thread = {
            id: threadId,
            otherUserId: threadId,
            otherUserName: 'New Contact', // This should come from the backend
            otherUserRole: 'member', // This should come from the backend
            lastMessage: message.text,
            lastMessageTimestamp: message.timestamp,
            unreadCount: 0,
            messages: [message],
          };
          state.threads.unshift(newThread);
        }
        
        state.loading = false;
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      });

    // Broadcast Message (Admin only)
    builder
      .addCase(broadcastMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(broadcastMessage.fulfilled, (state) => {
        state.loading = false;
        toast.success('Message broadcast to all members');
      })
      .addCase(broadcastMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      });
  },
});

export const { selectThread, clearMessageError, markThreadAsRead } = messagesSlice.actions;
export default messagesSlice.reducer;