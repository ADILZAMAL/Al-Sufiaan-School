import { HiOutlineViewGrid, HiOutlineCube, HiOutlineShoppingCart, HiOutlineUsers, HiOutlineUserGroup, HiOutlineChartBar, HiOutlineCog, HiOutlineCurrencyDollar, HiOutlineTruck, HiOutlineUserCircle, HiOutlineAcademicCap, HiOutlineLibrary, HiOutlineBell, HiOutlineCalendar, HiOutlineSun } from 'react-icons/hi'

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
		key: 'students',
		label: 'Students',
		path: 'students',
		icon: <HiOutlineAcademicCap />
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
				key: 'fee-dashboard',
				label: 'Fee Dashboard',
				path: 'fee/dashboard',
				icon: <HiOutlineChartBar />
			},
			{
				key: 'class-pricing',
				label: 'Class Pricing',
				path: 'fee/class-pricing',
				icon: <HiOutlineChartBar />
			},
			{
				key: 'transportation-pricing',
				label: 'Transportation Pricing',
				path: 'fee/transportation-pricing',
				icon: <HiOutlineTruck />
			},
			{
				key: 'incoming-payments',
				label: 'Incoming Payments',
				path: 'fee/incoming-payments',
				icon: <HiOutlineCurrencyDollar />
			},
			{
				key: 'payment-reminder',
				label: 'Payment Reminder',
				path: 'fee/payment-reminder',
				icon: <HiOutlineBell />
			},
			{
				key: 'students-with-dues',
				label: 'Students With Dues',
				path: 'fee/students-with-dues',
				icon: <HiOutlineUsers />
			}
		]
	},
	{
		key: 'users',
		label: 'User Management',
		path: 'users',
		icon: <HiOutlineUserCircle />
	},
	{
		key: 'school',
		label: 'School',
		path: 'school-settings',
		icon: <HiOutlineLibrary />
	},
	{
		key: 'attendance',
		label: 'Attendance',
		path: 'attendance',
		icon: <HiOutlineCalendar />
	},
	{
		key: 'holidays',
		label: 'Holidays',
		path: 'holidays',
		icon: <HiOutlineSun />
	},
]
