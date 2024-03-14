import { Box, Button, Typography, useTheme } from "@mui/material";
import InputBase from "@mui/material/InputBase";
import { useState, useRef, useEffect } from "react";
import {useLoginMutation} from "../../app/api/authApiSlice"
import {setCredentials} from "../../app/store/auth"
import {useDispatch} from "react-redux"
import { useNavigate } from 'react-router-dom'

const Login = () => {
  const userRef = useRef()
  const errRef = useRef()
  const [email, setEmail] = useState("")
  const [pwd, setPwd] = useState("")
  const [errMsg, setErrMsg] = useState('')
  const handleEmailInput = (e) => setEmail(e.target.value)
  const handlePwdInpute = (e) => setPwd(e.target.value)
  const [login, { isLoading }] = useLoginMutation()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  useEffect(() => {
    userRef.current.focus()
  })

  useEffect(() => {
    setErrMsg('')
  })

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userData = await login({ email, password:pwd }).unwrap()
      dispatch(setCredentials({ ...userData, email }))
      setEmail('')
      setPwd('')
      navigate('/dashboard')
  } catch (err) {
      if (!err?.originalStatus) {
          // isLoading: true until timeout occurs
          setErrMsg('No Server Response');
      } else if (err.originalStatus === 400) {
          setErrMsg('Missing Username or Password');
      } else if (err.originalStatus === 401) {
          setErrMsg('Unauthorized');
      } else {
          setErrMsg('Login Failed');
      }
      errRef.current.focus();
  }
  }
  const theme = useTheme();
  return (
    <Box
      height="100%"
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <p ref={errRef} className={errMsg ? "errmsg" : "offscreen"} aria-live="assertive">{errMsg}</p>
      <Box
        display="flex"
        flexDirection="column"
        sx={{
          backgroundColor: theme.palette.primary[900],
          borderRadius: 3,
          width: "500px",
          padding: "32px",
        }}
        component="form"
        onSubmit={handleSubmit}
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
        <InputBase
          name="Email"
          sx={{
            borderRadius: "8px",
            backgroundColor: theme.palette.primary[500],
            marginBottom: "32px",
            padding: "8px",
          }}
          required={true}
          placeholder="Email"
          value={email}
          onChange={handleEmailInput}
          ref={userRef}
        />
        <InputBase
          name="username"
          sx={{
            borderRadius: "8px",
            backgroundColor: theme.palette.primary[500],
            marginBottom: "32px",
            padding: "8px",
          }}
          required={true}
          placeholder="password"
          value={pwd}
          onChange={handlePwdInpute}
        />
        <Button
          sx={{ padding: "8px" }}
          type="submit"
          color="secondary"
          variant="contained"

        >
          Login
        </Button>
      </Box>
    </Box>
  );
};

export default Login;
