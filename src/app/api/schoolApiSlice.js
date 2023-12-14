import {apiSlice} from "./apiSlice"

export const schoolApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getSchool: builder.query({
            query: (id) => ({
                url: `/school/${id}`,
                method: 'GET'
            }),
        }),
        getClass: builder.query({
            query: () => ({
                url: "/class",
                method: 'GET'
            })
        })
    })
})

export const { useGetSchoolQuery, useGetClassQuery } = schoolApiSlice