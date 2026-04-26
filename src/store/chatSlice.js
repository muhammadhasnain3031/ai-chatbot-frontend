import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getH = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

// Conversations fetch karo
export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (token) => (await axios.get(`${API}/api/chat/conversations`, getH(token))).data
);

// Conversation messages fetch karo
export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async ({ id, token }) =>
    (await axios.get(`${API}/api/chat/conversations/${id}`, getH(token))).data
);

// Naya message bhejo
export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ convId, message, token }, { rejectWithValue }) => {
    try {
      return (await axios.post(
        `${API}/api/chat/conversations/${convId}/message`,
        { message },
        getH(token)
      )).data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Error');
    }
  }
);

// Naya conversation banao
export const createConversation = createAsyncThunk(
  'chat/createConversation',
  async (token) =>
    (await axios.post(`${API}/api/chat/conversations`, {}, getH(token))).data
);

// Conversation delete karo
export const deleteConversation = createAsyncThunk(
  'chat/deleteConversation',
  async ({ id, token }) => {
    await axios.delete(`${API}/api/chat/conversations/${id}`, getH(token));
    return id;
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    conversations:    [],
    activeConvo:      null,
    messages:         [],
    loading:          false,
    sending:          false,
    error:            null,
  },
  reducers: {
    setActiveConvo: (state, { payload }) => {
      state.activeConvo = payload;
    },
    clearError: (state) => { state.error = null; }
  },
  extraReducers: (builder) => {
    builder
      // Conversations
      .addCase(fetchConversations.fulfilled, (s, a) => { s.conversations = a.payload; })

      // Messages
      .addCase(fetchMessages.pending,   (s) => { s.loading = true; })
      .addCase(fetchMessages.fulfilled, (s, a) => {
        s.loading  = false;
        s.messages = a.payload.messages;
        s.activeConvo = a.payload;
      })

      // Send message
      .addCase(sendMessage.pending,   (s) => { s.sending = true; s.error = null; })
      .addCase(sendMessage.fulfilled, (s, a) => {
        s.sending  = false;
        s.messages = a.payload.conversation.messages;
        // Conversation title update karo sidebar mein
        const idx = s.conversations.findIndex(c => c._id === a.payload.conversation._id);
        if (idx !== -1) s.conversations[idx].title = a.payload.conversation.title;
      })
      .addCase(sendMessage.rejected, (s, a) => {
        s.sending = false;
        s.error   = a.payload;
      })

      // Create conversation
      .addCase(createConversation.fulfilled, (s, a) => {
        s.conversations.unshift(a.payload);
        s.activeConvo = a.payload;
        s.messages    = [];
      })

      // Delete
      .addCase(deleteConversation.fulfilled, (s, a) => {
        s.conversations = s.conversations.filter(c => c._id !== a.payload);
        if (s.activeConvo?._id === a.payload) {
          s.activeConvo = null;
          s.messages    = [];
        }
      });
  }
});

export const { setActiveConvo, clearError } = chatSlice.actions;
export default chatSlice.reducer;