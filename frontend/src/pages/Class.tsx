import React, { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import * as apiClient from '../api-client'


const Class: React.FC = () => {
        const { data: classes } = useQuery('fetchQuery', () => apiClient.fetchClasses())
        const [activeClass, setActiveClass] = useState({});
        useEffect(() => {
            if(classes){
                setActiveClass(classes[0]);
            }
        }, [classes])

        useEffect(() => {
            //fetch section
        }, [activeClass])
    return (
        <div className='flex'>
            {classes?.map(x => (
                <button
                    onClick={() => setActiveClass(x)}
                    type="button"
                    className={`ml-4 inline-block rounded px-6 py-3 text-xs font-medium
                    uppercase text-primary transition duration-150 ease-in-out focus:outline-none ${activeClass === x ? '   text-primary-600 bg-blue-900': 'border-2 border-primary'}`}
                  >
                    {x.name}
                </button>
            ))}
        </div>
    )
};

export default Class