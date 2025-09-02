import {createBrowserRouter, RouterProvider} from "react-router-dom"
import Landing from "./features/general/pages/Landing"
import About from "./features/general/pages/About"
import Team from "./features/general/pages/Team"
import Gallery from "./features/general/pages/Gallery"
import Contact from "./features/general/pages/Contact"
import Fees from "./features/fees/pages/Fees"
import SignIn from "./features/auth/pages/SignIn"
import Dashboard from "./components/layout/Dashboard"
import Class from "./features/class/pages/Class"
import Inventory from "./features/inventory/pages/Inventory"
import ExpenseLayout from "./features/expenses/pages/ExpenseLayout"
import ExpenseDashboard from "./features/expenses/pages/Expense"
import ExpenseSettings from "./features/expenses/pages/ExpenseSettings"
import VendorDashboard from "./features/vendors/pages/VendorDashboard"
import VendorDetail from "./features/vendors/pages/VendorDetail"
import SellProductsPage from "./features/inventory/pages/SellProductsPage"
import TransactionHistory from "./features/inventory/pages/TransactionHistory"
import StaffManagement from "./features/staff/pages/StaffManagement"
import AddTeachingStaff from "./features/staff/pages/AddTeachingStaff"
import AddNonTeachingStaff from "./features/staff/pages/AddNonTeachingStaff"
import ViewStaffDetails from "./features/staff/pages/ViewStaffDetails"
import EditStaffDetails from "./features/staff/pages/EditStaffDetails"
import FeeCategories from "./features/fees/pages/FeeCategories"


const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />
  },
  {
    path:"/about",
    element: <About />
  },
  {
    path:"/team",
    element: <Team />
  },
  {
    path:"/gallery",
    element: <Gallery />
  },
  {
    path:"/contact",
    element: <Contact />
  },
  {
    path:"/fees",
    element: <Fees />
  },
  {
    path:"/sign-in",
    element: <SignIn/>
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
    children: [
      {
        path: "expense",
        element: <ExpenseLayout />,
        children: [
          {
            index: true,
            element: <ExpenseDashboard />
          },
          {
            path: "dashboard",
            element: <ExpenseDashboard />
          },
          {
            path: "settings",
            element: <ExpenseSettings />
          },
          {
            path: "vendors",
            element: <VendorDashboard />
          },
          {
            path: "vendors/:id",
            element: <VendorDetail />
          }
        ]
      },
      {
        path: "class",
        element: <Class />
      },
      {
        path: "inventory",
        element: <Inventory />
      },
      {
        path: "sell-products",
        element: <SellProductsPage />
      },
      {
        path: "transaction-history",
        element: <TransactionHistory />
      },
      {
        path: "staff",
        element: <StaffManagement />
      },
      {
        path: "staff/add-teaching",
        element: <AddTeachingStaff />
      },
      {
        path: "staff/add-non-teaching",
        element: <AddNonTeachingStaff />
      },
      {
        path: "staff/view/:type/:id",
        element: <ViewStaffDetails />
      },
      {
        path: "staff/edit/:type/:id",
        element: <EditStaffDetails />
      },
      {
        path: "fee/categories",
        element: <FeeCategories />
      }
    ]
  }
])

function App() {

  return (
    <RouterProvider  router={router}/>
  )
}

export default App
