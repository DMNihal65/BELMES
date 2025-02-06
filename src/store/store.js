import { configureStore } from '@reduxjs/toolkit';
import endMillsReducer from '../pages/supervisorscreens/inventory/Tools/endMillsSlice';

export const store = configureStore({
  reducer: {
    endMills: endMillsReducer,
    // ... other reducers
  },
});

export default store;