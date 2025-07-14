import React from 'react';
import {Link, useLocation, useNavigate} from 'react-router-dom';
import {DASHBOARD_SIDEBAR_LINKS} from '../../lib/constants';
import classNames from 'classnames';
import { HiOutlineLogout } from 'react-icons/hi';
import { useMutation, useQueryClient } from 'react-query';
import * as apiClient from '../../api';
import { useAppContext } from '../../providers/AppContext';

const linkClass =
	'flex items-center gap-2 font-light px-3 py-2 hover:bg-neutral-700 hover:no-underline active:bg-neutral-600 rounded-sm text-base'


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
		<div className="bg-neutral-900 w-60 p-3 flex flex-col">
			<div className="flex items-center gap-2 px-1 py-3">
				<span className="text-neutral-200 text-lg">OpenShop</span>
			</div>
			<div className="py-8 flex flex-1 flex-col gap-0.5">

				{DASHBOARD_SIDEBAR_LINKS.map((link) => (
					<SidebarLink key={link.key} path={link.path} label={link.label} />
				))}

			</div>
			<div className="flex flex-col gap-0.5 pt-2 border-t border-neutral-700">
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
    path: string,
    label: string,
}

const SidebarLink: React.FC<SidebarLinkProps> = ({path, label}) => {
	const { pathname } = useLocation()

	return (
		<Link
			to={path}
			className={classNames(pathname === path ? 'bg-neutral-700 text-white' : 'text-neutral-400', linkClass)}
		>
			{label}
		</Link>
	)
}

export default Sidebar;
