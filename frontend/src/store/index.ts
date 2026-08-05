import { configureStore } from '@reduxjs/toolkit';
import feedbackReducer from './slices/feedbackSlice';
import authReducer from './slices/signinSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    feedback: feedbackReducer,
  },
});

// These types are super helpful for TypeScript intellisense later
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; // <-- Make sure this line exists!