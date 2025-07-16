import React from 'react';
import {Link, useLocation, useNavigate} from 'react-router-dom';
import {DASHBOARD_SIDEBAR_LINKS} from '../../lib/constants/index.tsx';
import classNames from 'classnames';
import { HiOutlineLogout } from 'react-icons/hi';
import { useMutation, useQueryClient } from 'react-query';
import * as apiClient from '../../features/auth/api';
import { useAppContext } from '../../providers/AppContext';

const linkClass =
	'flex items-center gap-2 font-light px-3 py-2 hover:no-underline rounded-sm text-base'


const Sidebar: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useAppContext();
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
		<div className="bg-gray-50 w-60 p-3 flex flex-col font-sans border-r border-gray-200">
			<div className="flex items-center gap-3 px-1 py-3">
				<img src="/img/school-logo.png" alt="Al Sufiaan School" className="w-12 h-12" />
				<span className="text-xl font-bold text-slate-800">AL SUFIAAN SCHOOL</span>
			</div>
			<div className="py-8 flex flex-1 flex-col gap-4">

				{DASHBOARD_SIDEBAR_LINKS.map((link) => (
					<SidebarLink key={link.key} item={link} />
				))}

			</div>
			<div className="flex flex-col gap-0.5 pt-2 border-t border-gray-200">
				<div onClick={handleClick} className={classNames(linkClass, 'cursor-pointer text-red-500')}>
					<span className="text-xl">
						<HiOutlineLogout />
					</span>
					Logout
				</div>
			</div>
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
	const isActive = item.path === '/' ? pathname === '/' : pathname.split('/')[1] === item.path;


	return (
		<Link
			to={item.path}
			className={classNames(isActive ? 'bg-blue-100 text-blue-600 font-semibold' : 'text-slate-600', linkClass, 'relative')}
		>
			{isActive && <span className="absolute left-0 top-0 h-full w-1 bg-blue-600 rounded-r-full"></span>}
			<span className="text-xl">{item.icon}</span>
			{item.label}
		</Link>
	)
}

export default Sidebar;
