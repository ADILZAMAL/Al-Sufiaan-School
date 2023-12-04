import {
  Box,
  Button,
  Typography,
  useTheme
} from "@mui/material";
import InputBase from "@mui/material/InputBase";
const Login = () => {
  // const [theme, colorMode] = useMode();
  const theme = useTheme()
  console.log("testing",theme)
  return (
        <Box
          height="100%"
          sx={{
            display: "flex", 
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Box
            display="flex"
            flexDirection="column"
            sx={{ 
              backgroundColor: theme.palette.primary[900],
              borderRadius: 3,
              width: "500px",
              padding: "32px"
            }}
          >
            <Typography
                  variant="h2"
                  color={theme.palette.grey[100]}
                  fontWeight="bold"
                  align="center"
                  gutterBottom={true}
                >
                  Login
                </Typography>
            <InputBase name="username" sx={{borderRadius:"8px", backgroundColor: theme.palette.primary[500], marginBottom: "32px", padding: "8px"}} autoFocus={true} required={true} placeholder="username" />
            <InputBase name="username" sx={{borderRadius:"8px", backgroundColor: theme.palette.primary[500], marginBottom: "32px", padding: "8px"}} required={true} placeholder="password" />
              <Button sx={{padding:"8px"}} type="submit" color="secondary" variant="contained">
                Login
              </Button>
          </Box>
        </Box>
  );
};

export default Login;
