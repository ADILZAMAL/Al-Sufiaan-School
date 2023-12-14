import Landing from "./pages/Landing"
import About from "./pages/About"
import Team from "./pages/Team"
import {createBrowserRouter, RouterProvider} from "react-router-dom"
import Gallery from "./pages/Gallery"
import Contact from "./pages/Contact"
import {ThemeProvider, CssBaseline} from "@mui/material"
import {useMode, ColorModeContext} from "./theme"
import Dashboard from "./pages/Dashboard"
import Login from "./pages/Login"
import Global from "./pages/Global"
import RequireAuth from "./pages/Global/RequireAuth"
import Class from "./pages/Class"

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
    element: <RequireAuth/>,
    children: [
      {
        path: "",
        element: <Global><Dashboard/></Global>
      }, 
      {
        path: "class",
        element: <Global><Class/></Global>
      }
    ]
  },
  {
    path: "/login",
    element: <Login />
  }
])
function App() {
  const [theme, colorMode] = useMode()
  return (
    <ColorModeContext.Provider value={colorMode}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
