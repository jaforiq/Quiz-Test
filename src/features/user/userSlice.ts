import { UserState } from "@/type/User";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState = {
  token: "",
  userId: -1, 
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    login: (state, action: PayloadAction<UserState>) => {
      state.token = action.payload.token;
      state.userId = action.payload?.userId;
    },
    logout: (state) => {
      localStorage.removeItem("token");
      state.token = "";
      state.userId = -1;
    },
  },
});

export const { login, logout } = userSlice.actions;
export default userSlice.reducer;
