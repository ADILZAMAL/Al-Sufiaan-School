import React, { useState } from 'react';
import {Link, useLocation, useNavigate} from 'react-router-dom';
import {DASHBOARD_SIDEBAR_LINKS} from '../../lib/constants/index.tsx';
import classNames from 'classnames';
import { HiOutlineLogout, HiOutlineLockClosed, HiChevronDown, HiChevronRight } from 'react-icons/hi';
import { useMutation, useQueryClient } from 'react-query';
import * as apiClient from '../../features/auth/api';
import { useAppContext } from '../../providers/AppContext';
import ChangePasswordModal from '../../features/auth/components/ChangePasswordModal';

const linkClass =
	'flex items-center gap-2 font-light px-3 py-2 hover:no-underline rounded-sm text-base'


const Sidebar: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expandedItems, setExpandedItems] = useState<string[]>(['expense']); // Default expand expense
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
            isSidebarOpen ? "w-64" : "w-24"
        )}>
			<div className="flex items-center gap-3 px-1 py-3">
				<img src="/img/school-logo.png" alt="Al Sufiaan School" className="w-12 h-12 flex-shrink-0" />
				{isSidebarOpen && (
                    <span className="text-lg font-bold text-slate-800 leading-tight">
                        AL SUFIAAN SCHOOL
                    </span>
                )}
			</div>
			<div className="py-8 flex flex-col gap-4">

				{DASHBOARD_SIDEBAR_LINKS.map((link) => (
					<SidebarLink 
						key={link.key} 
						item={link} 
						expandedItems={expandedItems}
						setExpandedItems={setExpandedItems}
					/>
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
		children?: {
			key: string;
			label: string;
			path: string;
			icon: JSX.Element;
		}[];
	};
	expandedItems: string[];
	setExpandedItems: (items: string[]) => void;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({item, expandedItems, setExpandedItems}) => {
	const { pathname } = useLocation()
	const { isSidebarOpen } = useAppContext()
	const isExpanded = expandedItems.includes(item.key);
	const hasChildren = item.children && item.children.length > 0;
	
	// Check if this item or any of its children are active
	const isActive = item.path === '/' ? pathname === '/' : pathname.split('/')[1] === item.path;
	const hasActiveChild = hasChildren && item.children?.some(child => 
		pathname === `/dashboard/${child.path}`
	);

	const toggleExpanded = () => {
		if (hasChildren) {
			if (isExpanded) {
				setExpandedItems(expandedItems.filter(key => key !== item.key));
			} else {
				setExpandedItems([...expandedItems, item.key]);
			}
		}
	};

	if (hasChildren) {
		return (
			<div>
				<div
					onClick={toggleExpanded}
					className={classNames(
						(isActive || hasActiveChild) ? 'bg-blue-100 text-blue-600 font-semibold' : 'text-slate-600', 
						linkClass, 
						'relative cursor-pointer',
						!isSidebarOpen && 'justify-center'
					)}
					title={!isSidebarOpen ? item.label : undefined}
				>
					{(isActive || hasActiveChild) && <span className="absolute left-0 top-0 h-full w-1 bg-blue-600 rounded-r-full"></span>}
					<span className="text-xl flex-shrink-0">{item.icon}</span>
					{isSidebarOpen && (
						<>
							<span className="flex-1">{item.label}</span>
							<span className="text-sm">
								{isExpanded ? <HiChevronDown /> : <HiChevronRight />}
							</span>
						</>
					)}
				</div>
				{isExpanded && isSidebarOpen && (
					<div className="ml-4 mt-1 space-y-1">
						{item.children?.map((child) => (
							<Link
								key={child.key}
								to={`/dashboard/${child.path}`}
								className={classNames(
									pathname === `/dashboard/${child.path}` 
										? 'bg-blue-50 text-blue-600 font-medium' 
										: 'text-slate-600 hover:text-slate-800', 
									'flex items-center gap-2 px-3 py-2 rounded-sm text-sm transition-colors'
								)}
							>
								<span className="text-lg flex-shrink-0">{child.icon}</span>
								<span>{child.label}</span>
							</Link>
						))}
					</div>
				)}
			</div>
		);
	}

	return (
		<Link
			to={item.path === '/' ? '/' : `/dashboard/${item.path}`}
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
