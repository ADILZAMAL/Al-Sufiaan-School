import { SignInFormData } from "../types";
const API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL || "";

export const signIn = async (formData: SignInFormData) => {
    console.log(API_BASE_URL)
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
    });

    const body = await response.json();
    if (!body.success) {
        throw new Error(body.message);
    }
    return body;
};

export const validateToken = async () => {
    const response = await fetch(`${API_BASE_URL}/api/auth/validate-token`, {
        credentials: "include",
    });

    const body = await response.json();
    if (!body.success) {
        throw new Error(body.message);
    }

    return body;
};

export const signOut = async () => {
    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
    });
    const body = await response.json();
    if (!body.success) {
        throw new Error(body.message);
    }
    return body;
};

export const changePassword = async (formData: any) => {
    const response = await fetch(`${API_BASE_URL}/api/users/change-password`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(formData)
    })

    const body = await response.json()
    if (!body.success) {
        throw new Error(body.message)
    }
    return body
};