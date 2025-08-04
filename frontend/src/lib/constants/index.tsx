import { HiOutlineViewGrid, HiOutlineCube, HiOutlineShoppingCart, HiOutlineUsers, HiOutlineUserGroup } from 'react-icons/hi'

export const DASHBOARD_SIDEBAR_LINKS = [
	{
		key: 'dashboard',
		label: 'Dashboard',
		path: '/',
		icon: <HiOutlineViewGrid />
	},
	{
		key: 'expense',
		label: 'Expense',
		path: 'expense',
		icon: <HiOutlineShoppingCart />
	},
    {
		key: 'class',
		label: 'Class',
		path: 'class',
		icon: <HiOutlineUsers />
	},
	{
		key: 'staff',
		label: 'Staff',
		path: 'staff',
		icon: <HiOutlineUserGroup />
	},
	{
		key: 'inventory',
		label: 'Inventory',
		path: 'inventory',
		icon: <HiOutlineCube />
	},
]
