import { HiOutlineViewGrid, HiOutlineCube, HiOutlineShoppingCart, HiOutlineUsers, HiOutlineUserGroup, HiOutlineChartBar, HiOutlineCog } from 'react-icons/hi'

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
		icon: <HiOutlineShoppingCart />,
		children: [
			{
				key: 'expense-dashboard',
				label: 'Dashboard',
				path: 'expense/dashboard',
				icon: <HiOutlineChartBar />
			},
			{
				key: 'expense-settings',
				label: 'Settings',
				path: 'expense/settings',
				icon: <HiOutlineCog />
			}
		]
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
