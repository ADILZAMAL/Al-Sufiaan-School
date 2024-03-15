import React from 'react'

interface TeacherCardProps {
    name: string;
    designation: string;
    imageUrl: string;
}

const TeacherCard: React.FC<TeacherCardProps> = ({ name, designation, imageUrl }) => {
    return (
        <div className="text-center team mb-5 p-3 w-full">
            <div
                className="position-relative overflow-hidden mb-4"
                style={{ borderRadius: "100%" }}
            >
                <img className="img-fluid w-100" src={imageUrl} alt="" />
            </div>
            <h4 className="text-primary">{name}</h4>
            <i>{designation}</i>
        </div>
    )
}

export default TeacherCard