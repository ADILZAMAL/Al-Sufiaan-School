import {ColorModeContext, useMode} from "../../theme"
import {CssBaseline, ThemeProvider} from "@mui/material"
import Topbar from "../Global/Topbar"
import Sidebar from "../Global/Sidebar"
const Dashboard = () => {
    const [theme, colorMode] = useMode()
    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <div className="app">
                    <main className="content">
                        <Topbar />
                        <Sidebar />
                    </main>
                </div>
            </ThemeProvider>
        </ColorModeContext.Provider>
    )
}

export default Dashboard;