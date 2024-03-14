import {createSlice} from "@reduxjs/toolkit"

const schoolSlice = createSlice({
    name: 'school',
    initialState: {
        "id": null,
        "name": null,
        "address": null,
        "mobile": null,
        "udice_no": null,
        "email": null,
        "class": null 
    },
    reducers: {
        setSchool:  (state, action) => {
            const {id, name, address, mobile, udice_no, email} = action.payload
            state.id = id
            state.name = name
            state.address = address
            state.mobile = mobile
            state.udice_no = udice_no
            state.email = email            
        },
        setClass: (state, action) => {
            state.class = action.payload
        }
    }
})

export const {setSchool, setClass} = schoolSlice.actions

export default schoolSlice.reducer

export const selectCurrentSchool = (state) => state.school