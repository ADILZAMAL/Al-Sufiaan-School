import React from 'react'

interface PrincipleCardProps {
    imageUrl: string;
    title: string;
    description: string
}


//    position: relative;
// display: flex;
// flex-direction: column;
// min-width: 0;
// word-wrap: break-word;
// background-color: #fff;
// background-clip: border-box;
// border: 1px solid rgba(0, 0, 0, 0.125);
// border-radius: 5px;


const PrincipleCard: React.FC<PrincipleCardProps> = ({ imageUrl, title, description }) => {
    return (
        <div className="border rounded-md border-0 bg-gray-50 shadow-sm pb-2">
            <img className="mb-2 rounded-t-md" src={imageUrl} alt="" />
            <div className="flex-col p-2 text-center">
                <h4 className="text-cyan-600 text-lg font-moto">{title}</h4>
                <p className="text-gray-500">
                    {description}
                </p>
            </div>
        </div>
    )
}

export default PrincipleCard