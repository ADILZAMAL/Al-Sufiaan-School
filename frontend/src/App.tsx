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
import Expense from "./features/expenses/pages/Expense"
import SellProductsPage from "./features/inventory/pages/SellProductsPage"
import TransactionHistory from "./features/inventory/pages/TransactionHistory"


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
        element: <Expense />
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
