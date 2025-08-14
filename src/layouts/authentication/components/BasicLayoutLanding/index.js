import PropTypes from "prop-types";

// @mui material components
import Grid from "@mui/material/Grid";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";

// Material Dashboard 2 React example components
import DefaultNavbar from "examples/Navbars/DefaultNavbar";
import PageLayout from "examples/LayoutContainers/PageLayout";

import { Typography, List, ListItem, ListItemText } from "@mui/material";
import { useLocation } from "react-router-dom";

import logo from "assets/images/logo.png";
import logo1 from "assets/images/logo1.png";
import header from "assets/images/header.png";
import logo2 from "assets/images/log2.png";
import IconButton from "@mui/material/IconButton";



function BasicLayout({ image, children }) {
  const { pathname } = useLocation();
  return (
    <PageLayout>
      <MDBox
        sx={{ height: "auto", minHeight: "100vh" }}
        display="flex"
        flexDirection="column"
        minHeight="100vh"
      >
        <MDBox
          position="absolute"
          width="100%"
          minHeight="100vh"
          sx={{
            backgroundImage: ({ functions: { linearGradient, rgba }, palette: { gradients } }) =>
              image &&
              `${linearGradient(
                rgba(gradients.dark.main, 0.6),
                rgba(gradients.dark.state, 0.6)
              )}, url(${image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <Grid container spacing={2} pt={3}> 
            {/* First Logo - Hidden on mobile/tablet, visible on desktop */}
            <Grid item xs={0} md={2} lg={2} sx={{ display: { xs: 'none', md: 'block' } }}>
                <MDBox mb={1.5} textAlign='center'>
                  <img src={logo} alt="logo" style={{width: "80px", height: "80px"}}/>
                </MDBox>
            </Grid>

            {/* Third Logo - Hidden on mobile/tablet, visible on desktop */}
            <Grid item xs={0} md={2} lg={2} sx={{ display: { xs: 'none', md: 'block' } }}>
                <MDBox mb={1.5} textAlign='center'>
                <img src={logo1} alt="logo1" style={{width: "80px", height: "80px"}}/>
                </MDBox>
            </Grid>
            
            {/* Header Image - Full width on mobile/tablet, 4 columns on desktop */}
            <Grid item xs={12} md={4} lg={4}>
                <MDBox mb={1.5} textAlign='center' display="flex" alignItems="center" justifyContent="space-between">
                  <img src={header} alt="header" style={{width: "100%", height: "100px"}}/>
                </MDBox>
            </Grid>
            
            {/* Third Logo - Hidden on mobile/tablet, visible on desktop */}
            <Grid item xs={0} md={2} lg={2} sx={{ display: { xs: 'none', md: 'block' } }}>
                <MDBox mb={1.5} textAlign='center'>
                <img src={logo1} alt="logo1" style={{width: "80px", height: "80px"}}/>
                </MDBox>
            </Grid>

            {/* Fourth Logo - Hidden on mobile/tablet, visible on desktop */}
            <Grid item xs={0} md={2} lg={2} sx={{ display: { xs: 'none', md: 'block' } }}>
                <MDBox mb={1.5} textAlign='center'>
                <img src={logo2} alt="logo2" style={{width: "80px", height: "80px"}}/>
                </MDBox>
            </Grid>

          </Grid>

          <MDBox
            position="relative"
            height="100%"
            display="flex"
            flexDirection="column"
            width="100%"
            justifyContent="center"
            paddingTop="4em"
          >
            <MDBox paddingBottom="3rem" sx={{ textAlign: "center" }}>
              {pathname === "/auth/login" && (
                <MDBox display="flex" width="100%" justifyContent="center" sx={{ zIndex: "99" }}>
                  <MDBox
                    display="flex"
                    flexDirection="column"
                    justifyContent="center"
                    alignItems="center"
                    padding="1.5rem"
                    width="80%"
                  >
                    <Typography variant="h3" style={{ color: "white" }}>
                      Log in INDIA-BOILER
                    </Typography>
                  </MDBox>
                </MDBox>
              )}
              <MDBox px={1} width="100%" mx="auto" paddingTop="1rem">
                <Grid container spacing={1} justifyContent="center" alignItems="center">
                  <Grid item xs={11} sm={9} md={5} lg={4} xl={3}>
                    {children}
                  </Grid>
                </Grid>
              </MDBox>
            </MDBox>
          </MDBox>
          {/* <Footer light /> */}
        </MDBox>
      </MDBox>
    </PageLayout>
  );
}

// Typechecking props for the BasicLayout
BasicLayout.propTypes = {
  image: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default BasicLayout;
