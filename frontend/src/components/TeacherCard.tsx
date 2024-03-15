import React from 'react'

interface TeacherCardProps {
    name: string;
    designation: string;
    imageUrl: string;
}

const TeacherCard: React.FC<TeacherCardProps> = ({ name, designation, imageUrl }) => {
    return (
        <div className="text-center mb-5 p-3 w-full">
            <div
                className=" overflow-hidden mb-4 rounded-full"
            >
                <img className="w-full" src={imageUrl} alt="" />
            </div>
            <h4 className="text-cyan-600">{name}</h4>
            <i className='text-gray-600 text-sm'>{designation}</i>
        </div>
    )
}

export default TeacherCard