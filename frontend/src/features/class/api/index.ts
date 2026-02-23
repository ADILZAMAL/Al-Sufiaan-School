const API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL || "";

export type ClassType = {
    id: number;
    name: string;
    schoolId: number;
    sessionId?: number;
    sections?: SectionType[];
}

export type SectionType = {
    id: number;
    name: string;
    classId: number;
    schoolId: number;
}

export const fetchClasses = async (sessionId?: number): Promise<ClassType[]> => {
    const url = sessionId
        ? `${API_BASE_URL}/api/classes?sessionId=${sessionId}`
        : `${API_BASE_URL}/api/classes`;
    const response = await fetch(url, { credentials: "include" });
    const body = await response.json();
    if (!body.success) {
        throw new Error(body.error?.message || body.message || 'Failed to fetch classes');
    }
    return body.data;
}

export const addClass = async (formData: { name: string; sessionId?: number }) => {
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
        throw new Error(body.error?.message || body.message || 'Failed to add class')
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
