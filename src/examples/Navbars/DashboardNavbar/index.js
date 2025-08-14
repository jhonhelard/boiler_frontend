import { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";
import MDBox from "components/MDBox";
import Grid from "@mui/material/Grid";

import AuthService from "services/auth-service";
import {
  navbar,
  navbarContainer,
  navbarRow,
  navbarMobileMenu,
} from "examples/Navbars/DashboardNavbar/styles";
import { useDispatch } from 'react-redux';
import { notification } from "antd";

import {
  useMaterialUIController,
  setTransparentNavbar,
  setMiniSidenav,
} from "context";
import MDButton from "components/MDButton";
import { AuthContext } from "context";
import logo from "assets/images/logo.png";
import logo1 from "assets/images/logo1.png";
import header from "assets/images/header.png";
import logo2 from "assets/images/log2.png";


function DashboardNavbar({ absolute = false, light = false, isMini = false }) {
  const authContext = useContext(AuthContext);
  const [navbarType, setNavbarType] = useState();
  const [controller, dispatch] = useMaterialUIController();
  const { miniSidenav, transparentNavbar, fixedNavbar, openConfigurator, darkMode } = controller;
  const route = useLocation().pathname.split("/").slice(1);

  const [searchValue, setSearchValue] = useState("");
  const dispatch1 = useDispatch(); // Initialize Redux dispatch
  
  useEffect(() => {
    if (fixedNavbar) {
      setNavbarType("sticky");
    } else {
      setNavbarType("static");
    }

    function handleTransparentNavbar() {
      setTransparentNavbar(dispatch, (fixedNavbar && window.scrollY === 0) || !fixedNavbar);
    }

    window.addEventListener("scroll", handleTransparentNavbar);

    handleTransparentNavbar();

    return () => window.removeEventListener("scroll", handleTransparentNavbar);
  }, [dispatch, fixedNavbar]);

  const handleMiniSidenav = () => setMiniSidenav(dispatch, !miniSidenav);
  
  const handleLogOut = async () => {
    try {


      // Call the logout service (which now just returns success)
      await AuthService.logout();
      
      // Show success notification
      notification.success({
        message: 'Logged Out Successfully!',
        description: 'You have been logged out successfully.',
        placement: 'topRight',
        duration: 3,
      });

      // Call the context logout function to clear state and redirect
      authContext.logout();
    } catch (error) {
      console.error('Logout error:', error);
      
      // Show error notification
      notification.error({
        message: 'Logout Error',
        description: 'An error occurred during logout, but you have been logged out locally.',
        placement: 'topRight',
        duration: 4,
      });
      
      // Even if there's an error, we should still logout locally
      authContext.logout();
    }
  };
  // Styles for the navbar icons
  const iconsStyle = ({ palette: { dark, white, text }, functions: { rgba } }) => ({
    color: () => {
      let colorValue = light || darkMode ? white.main : dark.main;

      if (transparentNavbar && !light) {
        colorValue = darkMode ? rgba(text.main, 0.6) : text.main;
      }

      return colorValue;
    },
  });

  return (
    <AppBar
      position={absolute ? "absolute" : navbarType}
      color="inherit"
      sx={(theme) => navbar(theme, { transparentNavbar, absolute, light, darkMode })}
    >
      <Toolbar sx={(theme) => navbarContainer(theme)}>
          <Grid container spacing={2} pt={3}> 
            {/* First Logo - Hidden on mobile/tablet, visible on desktop */}
            <Grid item xs={0} md={2} lg={2} sx={{ display: { xs: 'none', md: 'block' } }}>
                <MDBox mb={1.5} textAlign='center'>
                  <img src={logo} alt="logo" style={{width: "80px", height: "80px"}}/>
                </MDBox>
            </Grid>
            
            {/* Header Image - Full width on mobile/tablet, 4 columns on desktop */}
            <Grid item xs={6} md={6} lg={6}>
                <MDBox mb={1.5} textAlign='center' display="flex" alignItems="center" justifyContent="space-between">
                  <img src={header} alt="header" style={{width: "100%", height: "100px"}}/>
                  
                  {/* Mobile Buttons Container - Only visible on mobile/tablet */}
                  <MDBox sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1, ml: 2 }}>
                    {/* Hamburger Menu Button */}
                    <IconButton
                      size="small"
                      disableRipple
                      color="inherit"
                      onClick={handleMiniSidenav}
                      sx={{
                        color: light || darkMode ? 'white' : 'inherit',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,0.2)',
                        }
                      }}
                    >
                      <Icon fontSize="small">
                        {miniSidenav ? "menu_open" : "menu"}
                      </Icon>
                    </IconButton>
                    
                    {/* Logout Button */}
                    <MDButton
                      variant="gradient"
                      color="info"
                      size="small"
                      onClick={handleLogOut}
                    >
                      Log Out
                    </MDButton>
                  </MDBox>
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
        {isMini ? null : (
          <MDBox sx={(theme) => navbarRow(theme, { isMini })}>
            <MDBox display="flex" alignItems="center" color={light ? "white" : "inherit"}>
              {/* Desktop Hamburger Menu Button - Only visible on desktop */}
              <MDBox sx={{ display: { xs: 'none', md: 'block' } }}>
                <IconButton
                  size="small"
                  disableRipple
                  color="inherit"
                  sx={navbarMobileMenu}
                  onClick={handleMiniSidenav}
                >
                  <Icon sx={iconsStyle} fontSize="medium">
                    {miniSidenav ? "menu_open" : "menu"}
                  </Icon>
                </IconButton>
              </MDBox>
              
              {/* Desktop Logout Button - Only visible on desktop */}
              <MDBox sx={{ display: { xs: 'none', md: 'block' } }}>
                <MDButton
                  variant="gradient"
                  color="info"
                  fullWidth
                  type="button"
                  onClick={handleLogOut}
                >
                  Log Out
                </MDButton>
              </MDBox>
            </MDBox>
          </MDBox>
        )}
      </Toolbar>
    </AppBar>
  );
}

// Typechecking props for the DashboardNavbar
DashboardNavbar.propTypes = {
  absolute: PropTypes.bool,
  light: PropTypes.bool,
  isMini: PropTypes.bool,
};

export default DashboardNavbar;
