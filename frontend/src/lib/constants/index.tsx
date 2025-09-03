import { HiOutlineViewGrid, HiOutlineCube, HiOutlineShoppingCart, HiOutlineUsers, HiOutlineUserGroup, HiOutlineChartBar, HiOutlineCog, HiOutlineCurrencyDollar } from 'react-icons/hi'

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
			},
			{
				key: 'vendors',
				label: 'Vendors',
				path: 'expense/vendors',
				icon: <HiOutlineUsers />
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
	{
		key: 'fee',
		label: 'Fee',
		path: 'fee',
		icon: <HiOutlineCurrencyDollar />,
		children: [
			{
				key: 'fee-categories',
				label: 'Fee Categories',
				path: 'fee/categories',
				icon: <HiOutlineCog />
			},
			{
				key: 'class-pricing',
				label: 'Class Pricing',
				path: 'fee/class-pricing',
				icon: <HiOutlineChartBar />
			}
		]
	},
]
