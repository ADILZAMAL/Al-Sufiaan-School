import {createBrowserRouter, RouterProvider} from "react-router-dom"
import Landing from "./pages/Landing"
import About from "./pages/About"
import Team from "./pages/Team"
import Gallery from "./pages/Gallery"
import Contact from "./pages/Contact"
import Fees from "./pages/Fees"
import SignIn from "./pages/SignIn"


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
  }
  // {
  //   path:"/dashboard",
  //   element: <RequireAuth/>,
  //   children: [
  //     {
  //       path: "",
  //       element: <Global><Dashboard/></Global>
  //     }, 
  //     {
  //       path: "class",
  //       element: <Global><Class/></Global>
  //     }
  //   ]
  // },
  // {
  //   path: "/login",
  //   element: <Login />
  // }
])

function App() {

  return (
    <RouterProvider  router={router}/>
  )
}

export default App
