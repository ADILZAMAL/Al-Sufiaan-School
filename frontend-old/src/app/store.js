import { configureStore } from '@reduxjs/toolkit'

import authReducer from "./store/auth"
import {apiSlice} from "./api/apiSlice"
import schoolReducer from "./store/school"

const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer,
    school: schoolReducer,
  },
  middleware: getDefaultMiddleware =>
  getDefaultMiddleware().concat(apiSlice.middleware),
  devTools: true
})

export default store