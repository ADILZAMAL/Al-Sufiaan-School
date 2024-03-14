import {createSlice} from "@reduxjs/toolkit"

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: {
            email: null,
            name: null,
            designation: null,
            school_id: null
        },
        token: null, 
    },
    reducers: {
        setCredentials:  (state, action) => {
            const {email, token, name, designation, school_id} = action.payload
            state.user.email = email
            state.token = token
            state.user.name = name
            state.user.designation = designation
            state.user.school_id = school_id
        },
        logOut : (state, action) => {
            state.user.email = null
            state.user.name = null
            state.user.designation = null
            state.user.school_id = null
            state.token = null
        }
    }
})

export const {setCredentials, logOut} = authSlice.actions

export default authSlice.reducer

export const selectCurrentUser = (state) => state.auth.user
export const selectCurrentTokne = (state) => state.auth.token