import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { DASHBOARD_SIDEBAR_LINKS } from '../../lib/constants/index.tsx';
import classNames from 'classnames';
import { HiOutlineLogout, HiOutlineLockClosed, HiChevronDown } from 'react-icons/hi';
import { useMutation, useQueryClient } from 'react-query';
import * as apiClient from '../../features/auth/api';
import { useAppContext } from '../../providers/AppContext';
import ChangePasswordModal from '../../features/auth/components/ChangePasswordModal';

const Sidebar: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expandedItems, setExpandedItems] = useState<string[]>(['expense']);
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

    return (
        <div className={classNames(
            "bg-slate-900 flex flex-col h-screen sticky top-0 flex-shrink-0 transition-all duration-300 ease-in-out",
            isSidebarOpen ? "w-64" : "w-16"
        )}>
            {/* Logo / Brand */}
            <div className={classNames(
                "flex items-center gap-3 px-3 h-16 border-b border-slate-700/60 flex-shrink-0",
                !isSidebarOpen && "justify-center"
            )}>
                <img
                    src="/img/school-logo.png"
                    alt="Al Sufiaan School"
                    className="w-8 h-8 flex-shrink-0 rounded-md object-contain"
                />
                {isSidebarOpen && (
                    <div className="leading-tight overflow-hidden">
                        <p className="text-sm font-bold text-white whitespace-nowrap">Al Sufiaan</p>
                        <p className="text-xs text-slate-400 whitespace-nowrap">School Management</p>
                    </div>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin">
                {DASHBOARD_SIDEBAR_LINKS.map((link) => (
                    <SidebarLink
                        key={link.key}
                        item={link}
                        expandedItems={expandedItems}
                        setExpandedItems={setExpandedItems}
                    />
                ))}
            </nav>

            {/* Footer actions */}
            <div className={classNames(
                "px-2 py-3 border-t border-slate-700/60 space-y-0.5 flex-shrink-0"
            )}>
                <button
                    onClick={() => setIsModalOpen(true)}
                    title={!isSidebarOpen ? 'Change Password' : undefined}
                    className={classNames(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg",
                        "text-slate-400 hover:bg-slate-800 hover:text-slate-100",
                        "transition-colors duration-150 text-sm",
                        !isSidebarOpen && "justify-center"
                    )}
                >
                    <HiOutlineLockClosed className="text-lg flex-shrink-0" />
                    {isSidebarOpen && <span>Change Password</span>}
                </button>

                <button
                    onClick={() => mutation.mutate()}
                    title={!isSidebarOpen ? 'Logout' : undefined}
                    className={classNames(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg",
                        "text-red-400 hover:bg-red-500/10 hover:text-red-300",
                        "transition-colors duration-150 text-sm",
                        !isSidebarOpen && "justify-center"
                    )}
                >
                    <HiOutlineLogout className="text-lg flex-shrink-0" />
                    {isSidebarOpen && <span>Logout</span>}
                </button>
            </div>

            <ChangePasswordModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
};

interface SidebarLinkItem {
    key: string;
    label: string;
    path: string;
    icon: JSX.Element;
    children?: SidebarLinkItem[];
}

interface SidebarLinkProps {
    item: SidebarLinkItem;
    expandedItems: string[];
    setExpandedItems: (items: string[]) => void;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ item, expandedItems, setExpandedItems }) => {
    const { pathname } = useLocation();
    const { isSidebarOpen } = useAppContext();

    const isExpanded = expandedItems.includes(item.key);
    const hasChildren = !!(item.children && item.children.length > 0);

    const isActive = item.path === '/' ? pathname === '/' : pathname.split('/')[1] === item.path;
    const hasActiveChild = hasChildren && item.children?.some(
        child => pathname === `/dashboard/${child.path}`
    );

    const toggleExpanded = () => {
        if (!hasChildren) return;
        setExpandedItems(
            isExpanded
                ? expandedItems.filter(k => k !== item.key)
                : [...expandedItems, item.key]
        );
    };

    const baseItem = classNames(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150 select-none",
        !isSidebarOpen && "justify-center"
    );

    if (hasChildren) {
        const active = isActive || hasActiveChild;
        return (
            <div>
                <button
                    onClick={toggleExpanded}
                    title={!isSidebarOpen ? item.label : undefined}
                    className={classNames(
                        baseItem,
                        active
                            ? "bg-blue-600 text-white"
                            : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                    )}
                >
                    <span className="text-lg flex-shrink-0">{item.icon}</span>
                    {isSidebarOpen && (
                        <>
                            <span className="flex-1 text-left font-medium">{item.label}</span>
                            <HiChevronDown
                                className={classNames(
                                    "text-base transition-transform duration-200",
                                    isExpanded ? "rotate-0" : "-rotate-90"
                                )}
                            />
                        </>
                    )}
                </button>

                {/* Accordion children */}
                <div className={classNames(
                    "overflow-hidden transition-all duration-200",
                    isExpanded && isSidebarOpen ? "max-h-96 mt-0.5" : "max-h-0"
                )}>
                    <div className="ml-3 pl-3 border-l border-slate-700/60 space-y-0.5 py-1">
                        {item.children?.map((child) => {
                            const childActive = pathname === `/dashboard/${child.path}`;
                            return (
                                <Link
                                    key={child.key}
                                    to={`/dashboard/${child.path}`}
                                    className={classNames(
                                        "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors duration-150",
                                        childActive
                                            ? "bg-blue-500/20 text-blue-300 font-medium"
                                            : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                                    )}
                                >
                                    <span className="text-base flex-shrink-0">{child.icon}</span>
                                    <span>{child.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <Link
            to={item.path === '/' ? '/' : `/dashboard/${item.path}`}
            title={!isSidebarOpen ? item.label : undefined}
            className={classNames(
                baseItem,
                isActive
                    ? "bg-blue-600 text-white font-medium"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            )}
        >
            <span className="text-lg flex-shrink-0">{item.icon}</span>
            {isSidebarOpen && <span className="font-medium">{item.label}</span>}
        </Link>
    );
};

export default Sidebar;
