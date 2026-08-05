import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import type { RootState } from '../index'; 

export interface FetchFeedbackParams {
  page?: number;
  sort_by?: string;
  status?: string;
  search?: string;
  category_id?: string;
}

// 1. Fetch Feedback Thunk
export const fetchFeedback = createAsyncThunk(
  'feedback/fetchFeedback',
  async ({ page = 1, sort_by = 'most_voted', status = 'All', search = '', category_id = 'All' }: FetchFeedbackParams) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    if (sort_by) params.append('sort_by', sort_by);
    if (status && status !== 'All') params.append('status', status);
    if (category_id && category_id !== 'All') params.append('category_id', category_id);
    if (search) params.append('search', search);

    const response = await axios.get(`http://localhost:5000/api/v1/feedback?${params.toString()}`);
    return response.data.data;
  }
);

// 2. Toggle Vote Thunk
export const toggleVote = createAsyncThunk(
  'feedback/toggleVote',
  async (postId: number, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth.token;

    if (!token) {
      alert("You must be logged in to vote!");
      throw new Error("No token found");
    }

    const response = await axios.post(
      `http://localhost:5000/api/v1/feedback/${postId}/vote`,
      {}, 
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    return response.data.data;
  }
);

// 3. Admin Update Thunk
export interface AdminUpdatePayload {
  postId: number;
  status: string;
  adminResponse: string;
  priorityRating: number;
}

export const updateFeedbackAdmin = createAsyncThunk(
  'feedback/updateAdmin',
  async ({ postId, status, adminResponse, priorityRating }: AdminUpdatePayload, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token;

      const response = await fetch(`http://localhost:5000/api/v1/feedback/${postId}/admin`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          admin_response: adminResponse,
          admin_priority_rating: priorityRating,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message);
      }

      const data = await response.json();
      return data.data; 
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// 4. Create Feedback Thunk
export const createFeedback = createAsyncThunk(
  'feedback/createFeedback',
  async (newPost: { title: string; description: string; category_id: number }, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth.token;

    if (!token) {
      alert("You must be logged in to post feedback!");
      throw new Error("No token found");
    }

    const response = await axios.post(
      'http://localhost:5000/api/v1/feedback',
      newPost,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    return response.data.data; 
  }
);

interface FeedbackState {
  posts: any[];
  pagination: { current_page: number; total_pages: number; total_items: number } | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
}

const initialState: FeedbackState = {
  posts: [],
  pagination: null,
  status: 'idle',
};

const feedbackSlice = createSlice({
  name: 'feedback',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeedback.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchFeedback.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.posts = action.payload.feedback_posts;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchFeedback.rejected, (state) => { state.status = 'failed'; })
      
      .addCase(toggleVote.fulfilled, (state, action) => {
        const post = state.posts.find((p) => Number(p.post_id) === Number(action.payload.post_id));
        if (post) {
          post.upvote_count = Number(action.payload.new_upvote_count);
          post.has_voted = action.payload.user_has_voted;
        }
      })

      .addCase(updateFeedbackAdmin.fulfilled, (state, action) => {
        const updatedPost = action.payload;
        const index = state.posts.findIndex((p) => Number(p.post_id) === Number(updatedPost.post_id));
        if (index !== -1) {
          state.posts[index] = { ...state.posts[index], ...updatedPost };
        }
      });
  },
});

export default feedbackSlice.reducer;