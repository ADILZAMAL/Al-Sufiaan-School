import { Box, Button, IconButton, Typography, useTheme } from "@mui/material";
import { tokens } from "../../theme";
// import { mockTransactions } from "../../data/mockData";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
// import EmailIcon from "@mui/icons-material/Email";
// import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
// import PersonAddIcon from "@mui/icons-material/PersonAdd";
// import TrafficIcon from "@mui/icons-material/Traffic";
// import Header from "../../Components/DashboardHeader";
// import LineChart from "../../components/LineChart";
// import GeographyChart from "../../components/GeographyChart";
// import BarChart from "../../components/BarChart";
// import StatBox from "../../components/StatBox";
// import ProgressCircle from "../../components/ProgressCircle";
import { useGetClassQuery } from "../../app/api/schoolApiSlice";
import { setClass } from "../../app/store/school";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import Header from "../../Components/Header";
import Footer from "../../Components/Footer";
import { DataGrid } from "@mui/x-data-grid";
import { feeStructure } from "../../data/feeStructure";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Grid from "@mui/system/Unstable_Grid";

function createData(className, fee) {
  return { className, fee };
}

const schoolFees = [
  createData("Nursery", 650),
  createData("Prep", 700),
  createData("One", 750),
  createData("Two", 800),
  createData("Three", 850),
  createData("Four", 900),
  createData("Five", 950),
  createData("Six", 1000),
  createData("Seven", 1100),
];

const hostelFees = [
  createData("Nursery", 3650),
  createData("Prep", 3700),
  createData("One", 3750),
  createData("Two", 3800),
  createData("Three", 3850),
  createData("Four", 3900),
  createData("Five", 3950),
  createData("Six", 4000),
  createData("Seven", 4100),
];

const dayBoardingFees = [
    createData("Nursery", 1800),
    createData("Prep", 1850),
    createData("One", 1900),
    createData("Two", 1950),
    createData("Three", 2000),
    createData("Four", 2050),
    createData("Five", 2100),
    createData("Six", 2150),
    createData("Seven", 2250),
  ];

  const dayBoardingWithLunchFees = [
    createData("Nursery", 2200),
    createData("Prep", 2250),
    createData("One", 2300),
    createData("Two", 2350),
    createData("Three", 2400),
    createData("Four", 2450),
    createData("Five", 2500),
    createData("Six", 2550),
    createData("Seven", 2650),
  ];

const Class = () => {
    const theme = useTheme();
  return (
    <Box>
      <Header />
      <Grid container spacing={10} disableEqualOverflow m="20px">
        <Grid xs={6}>
          <Typography
            variant="h4"
            p="20px"
            color={theme.palette.grey[100]}
            fontWeight="bold"
            align="center"
          >
            School Fee Structure
          </Typography>
          <TableContainer component={Paper}>
            <Table aria-label="School fee structure">
              <TableHead>
                <TableRow>
                  <TableCell>Class</TableCell>
                  <TableCell>Fee</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {schoolFees.map((row) => (
                  <TableRow
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell>{row.className}</TableCell>
                    <TableCell>{row.fee}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        <Grid xs={6}>
          <Typography
            variant="h4"
            p="20px"
            color={theme.palette.grey[100]}
            fontWeight="bold"
            align="center"
          >
            Hostel Fee Structure Including School Fee
          </Typography>
          <TableContainer
            component={Paper}
          >
            <Table aria-label="School fee structure">
              <TableHead>
                <TableRow>
                  <TableCell>Class</TableCell>
                  <TableCell>Fee</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {hostelFees.map((row) => (
                  <TableRow
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell>{row.className}</TableCell>
                    <TableCell>{row.fee}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        <Grid xs={6}>
          <Typography
            variant="h4"
            p="20px"
            color={theme.palette.grey[100]}
            fontWeight="bold"
            align="center"
          >
            Day boarding + School Fee + Snacks
          </Typography>
          <TableContainer
            component={Paper}
          >
            <Table aria-label="School fee structure">
              <TableHead>
                <TableRow>
                  <TableCell>Class</TableCell>
                  <TableCell>Fee</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dayBoardingFees.map((row) => (
                  <TableRow
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell>{row.className}</TableCell>
                    <TableCell>{row.fee}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        <Grid xs={6}>
          <Typography
            variant="h4"
            p="20px"
            color={theme.palette.grey[100]}
            fontWeight="bold"
            align="center"
          >
            Day boarding + School Fee + Lunch + Snacks 
          </Typography>
          <TableContainer
            component={Paper}
          >
            <Table aria-label="School fee structure">
              <TableHead>
                <TableRow>
                  <TableCell>Class</TableCell>
                  <TableCell>Fee</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dayBoardingWithLunchFees.map((row) => (
                  <TableRow
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell>{row.className}</TableCell>
                    <TableCell>{row.fee}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
      <Footer />
    </Box>
  );
};

export default Class;
