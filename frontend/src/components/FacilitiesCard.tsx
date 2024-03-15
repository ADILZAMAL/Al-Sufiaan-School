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
                className="d-flex bg-light shadow-sm border-top rounded mb-4"
                style={{ padding: "30px" }}
            >
                <i className={`${iconName} h1 font-weight-normal text-primary mb-3`}></i>
                <div className="pl-4">
                    <h4>{title}</h4>
                    <p className="m-0 text-secondary">
                        {description}
                    </p>
                </div>
            </div>
        </div>
    )
}

export default FacilitiesCard