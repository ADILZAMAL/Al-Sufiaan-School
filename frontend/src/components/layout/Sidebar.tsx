import React, { useState } from 'react';
import {Link, useLocation, useNavigate} from 'react-router-dom';
import {DASHBOARD_SIDEBAR_LINKS} from '../../lib/constants/index.tsx';
import classNames from 'classnames';
import { HiOutlineLogout, HiOutlineLockClosed } from 'react-icons/hi';
import { useMutation, useQueryClient } from 'react-query';
import * as apiClient from '../../features/auth/api';
import { useAppContext } from '../../providers/AppContext';
import ChangePasswordModal from '../../features/auth/components/ChangePasswordModal';

const linkClass =
	'flex items-center gap-2 font-light px-3 py-2 hover:no-underline rounded-sm text-base'


const Sidebar: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();
    const { showToast, isSidebarOpen } = useAppContext();
    const queryClient = useQueryClient();
    const mutation = useMutation(apiClient.signOut, {
        onSuccess: async () => {
            await queryClient.invalidateQueries("validateToken");
            showToast({ message: "Signed Out!", type: "SUCCESS" });
            navigate("/");
        },
        onError: (error: Error) => {
            showToast({ message: error.message, type: "ERROR" });
        },
    });

    const handleClick = () => {
        mutation.mutate();
    };

    return (
		<div className={classNames(
            "bg-gray-50 p-3 flex flex-col font-sans border-r border-gray-200 transition-all duration-300 ease-in-out",
            isSidebarOpen ? "w-64" : "w-16"
        )}>
			<div className="flex items-center gap-3 px-1 py-3">
				<img src="/img/school-logo.png" alt="Al Sufiaan School" className="w-12 h-12 flex-shrink-0" />
				{isSidebarOpen && (
                    <span className="text-lg font-bold text-slate-800 leading-tight">
                        AL SUFIAAN SCHOOL
                    </span>
                )}
			</div>
			<div className="py-8 flex flex-1 flex-col gap-4">

				{DASHBOARD_SIDEBAR_LINKS.map((link) => (
					<SidebarLink key={link.key} item={link} />
				))}

			</div>
			<div className="flex flex-col gap-0.5 pt-2 border-t border-gray-200">
                <div 
                    onClick={() => setIsModalOpen(true)} 
                    className={classNames(
                        linkClass, 
                        'cursor-pointer text-gray-600',
                        !isSidebarOpen && 'justify-center'
                    )}
                    title={!isSidebarOpen ? 'Change Password' : undefined}
                >
                    <span className="text-xl flex-shrink-0">
                        <HiOutlineLockClosed />
                    </span>
                    {isSidebarOpen && <span>Change Password</span>}
                </div>
				<div 
                    onClick={handleClick} 
                    className={classNames(
                        linkClass, 
                        'cursor-pointer text-red-500',
                        !isSidebarOpen && 'justify-center'
                    )}
                    title={!isSidebarOpen ? 'Logout' : undefined}
                >
					<span className="text-xl flex-shrink-0">
						<HiOutlineLogout />
					</span>
					{isSidebarOpen && <span>Logout</span>}
				</div>
			</div>
            <ChangePasswordModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
		</div>
    )
}

interface SidebarLinkProps {
    item: {
		key: string;
		label: string;
		path: string;
		icon: JSX.Element;
	}
}

const SidebarLink: React.FC<SidebarLinkProps> = ({item}) => {
	const { pathname } = useLocation()
	const { isSidebarOpen } = useAppContext()
	const isActive = item.path === '/' ? pathname === '/' : pathname.split('/')[1] === item.path;


	return (
		<Link
			to={item.path}
			className={classNames(
				isActive ? 'bg-blue-100 text-blue-600 font-semibold' : 'text-slate-600', 
				linkClass, 
				'relative',
				!isSidebarOpen && 'justify-center'
			)}
			title={!isSidebarOpen ? item.label : undefined}
		>
			{isActive && <span className="absolute left-0 top-0 h-full w-1 bg-blue-600 rounded-r-full"></span>}
			<span className="text-xl flex-shrink-0">{item.icon}</span>
			{isSidebarOpen && <span>{item.label}</span>}
		</Link>
	)
}

export default Sidebar;
