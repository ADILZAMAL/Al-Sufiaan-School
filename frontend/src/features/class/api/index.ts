const API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL || "";

export type ClassType = {
    id: number;
    name: string;
    schoolId: number;
    sections?: SectionType[];
}

export type SectionType = {
    id: number;
    name: string;
    classId: number;
    schoolId: number;
}

export const fetchClasses = async (): Promise<ClassType[]> => {
    const response = await fetch(`${API_BASE_URL}/api/classes`, {
        credentials: "include"
    })
    const body = await response.json();
    if (!body.success) {
        throw new Error(body.error.message)
    }
    return body.data;
}

export const addClass = async (formData: { name: string }) => {
    const response = await fetch(`${API_BASE_URL}/api/classes`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })

    const body = await response.json()
    if(!body.success) {
        throw new Error(body.error.message)
    }
    return body
}

export const addSection = async (formData: { name: string, classId: number }) => {
    const response = await fetch(`${API_BASE_URL}/api/sections`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })

    const body = await response.json()
    if(!body.success) {
        throw new Error(body.error.message)
    }
    return body
}
