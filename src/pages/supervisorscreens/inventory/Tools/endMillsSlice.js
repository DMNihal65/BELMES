<<<<<<< HEAD
=======



>>>>>>> e0790644a9d7edae155b19e538d87c4330e695a1
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunks
export const fetchEndMills = createAsyncThunk(
  'endMills/fetchEndMills',
  async () => {
    // Replace with your API call
    return [
      {
        key: '1',
        bel_part_number: '3105 120 201 59',
        bel_part_description: 'High precision end mill',
        tool_diameter: 8,
        shank_diameter: 6,
        no_of_flutes: 4,
        flute_length: 50,
        clearance_length: 50,
        total_length: 100,
        corner_radius: 0.5,
        suitable_for: 'Aluminum',
        type_project: 'Milling',
        stock: 10,
        status: 'Available',
      },
      // Add more initial data
    ];
  }
);

export const createEndMill = createAsyncThunk(
  'endMills/createEndMill',
  async (endMillData) => {
    // Replace with your API call
    return endMillData;
  }
);

export const updateEndMill = createAsyncThunk(
  'endMills/updateEndMill',
  async ({ id, ...updates }) => {
    // Replace with your API call
    return { id, ...updates };
  }
);

export const deleteEndMill = createAsyncThunk(
  'endMills/deleteEndMill',
  async (id) => {
    // Replace with your API call
    return id;
  }
);

const endMillsSlice = createSlice({
  name: 'endMills',
  initialState: {
    endMills: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch EndMills
      .addCase(fetchEndMills.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchEndMills.fulfilled, (state, action) => {
        state.loading = false;
        state.endMills = action.payload;
      })
      .addCase(fetchEndMills.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Create EndMill
      .addCase(createEndMill.fulfilled, (state, action) => {
        state.endMills.push(action.payload);
      })
      // Update EndMill
      .addCase(updateEndMill.fulfilled, (state, action) => {
        const index = state.endMills.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.endMills[index] = action.payload;
        }
      })
      // Delete EndMill
      .addCase(deleteEndMill.fulfilled, (state, action) => {
        state.endMills = state.endMills.filter(item => item.id !== action.payload);
      });
  },
});

export default endMillsSlice.reducer;