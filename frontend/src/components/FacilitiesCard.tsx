import React from 'react'

interface FacilitiesCardProp {
    title: string;
    description: string;
    iconName: string
}

const FacilitiesCard: React.FC<FacilitiesCardProp> = ({ title, description, iconName }) => {
    return (
        <div className="m-2">
            <div
                className="flex bg-gray-50 drop-shadow-sm border-t rounded mb-4 p-7"
            >
                <i className={`${iconName} text-cyan-600 mb-3`}></i>
                <div className="pl-4">
                    <h4 className='text-gray-600'>{title}</h4>
                    <p className="m-0 text-gray-500">
                        {description}
                    </p>
                </div>
            </div>
        </div>
    )
}

export default FacilitiesCard