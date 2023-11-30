import Landing from "./pages/Landing"
import About from "./pages/About"
import Team from "./pages/Team"
import {createBrowserRouter, RouterProvider} from "react-router-dom"
import Gallery from "./pages/Gallery"
import Contact from "./pages/Contact"
import {ThemeProvider, CssBaseline} from "@mui/material"
import Dashboard from "./pages/Dashboard"

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
    path:"/dashboard",
    element: <Dashboard/>
  }
])
function App() {
  return (
      <RouterProvider router={router} />
  );
}

export default App;
