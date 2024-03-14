import { Box, Button, IconButton, Typography, useTheme } from "@mui/material";
import { tokens } from "../../theme";
// import { mockTransactions } from "../../data/mockData";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
// import EmailIcon from "@mui/icons-material/Email";
// import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
// import PersonAddIcon from "@mui/icons-material/PersonAdd";
// import TrafficIcon from "@mui/icons-material/Traffic";
import Header from "../../Components/DashboardHeader";
// import LineChart from "../../components/LineChart";
// import GeographyChart from "../../components/GeographyChart";
// import BarChart from "../../components/BarChart";
// import StatBox from "../../components/StatBox";
// import ProgressCircle from "../../components/ProgressCircle";
import {useGetClassQuery} from "../../app/api/schoolApiSlice"
import {setClass} from "../../app/store/school"
import { useEffect } from "react";
import {useDispatch} from "react-redux"

const Class = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode)
  const dispatch = useDispatch()
  const {
    data,
    isLoading,
    isSuccess, 
    isError,
    error} = useGetClassQuery()

    useEffect(() => {
        if(isSuccess){
            dispatch(setClass(data.data))
        }
    }, [isSuccess])
  
  return (
    <Box m="20px">
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="Class" subtitle="Welcome to your Class" />
      </Box>
    </Box>
  );
};

export default Class;