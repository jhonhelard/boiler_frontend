import { useContext, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import CssBaseline from "@mui/material/CssBaseline";
import Icon from "@mui/material/Icon";
import { ThemeProvider } from "@mui/material/styles";
import MDBox from "components/MDBox";
import Configurator from "examples/Configurator";
import Sidenav from "examples/Sidenav";
import theme from "assets/theme";
import themeDark from "assets/theme-dark";
import createCache from "@emotion/cache";
import rtlPlugin from "stylis-plugin-rtl";
import { getRoutes } from "routes";
import { setMiniSidenav, setOpenConfigurator, useMaterialUIController } from "context";
import './App.css';

import Login from "auth/login";
import Register from "auth/register";
import { AuthContext } from "context";
import ProtectedRoute from "examples/ProtectedRoute";
import { setupAxiosInterceptors } from "./services/interceptor";
import { testJWTDecoding } from "./utils/testJWT";

// Make test function available globally for debugging
window.testJWT = testJWTDecoding;

export default function App() {
  const authContext = useContext(AuthContext);
  const [isInitialized, setIsInitialized] = useState(false);

  const [controller, dispatch] = useMaterialUIController();
  const {
    miniSidenav,
    direction,
    layout,
    openConfigurator,
    sidenavColor,
    transparentSidenav,
    whiteSidenav,
    darkMode,
  } = controller;
  const [onMouseEnter, setOnMouseEnter] = useState(false);
  const [rtlCache, setRtlCache] = useState(null);
  const { pathname } = useLocation();

  const [isDemo, setIsDemo] = useState(false);

  // Initialize authentication state
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Token exists, authentication will be handled by AuthContext
      setIsInitialized(true);
    } else {
      // No token, user is not authenticated
      setIsInitialized(true);
    }
  }, []);

  // Get routes based on admin status
  const routes = useMemo(() => getRoutes(authContext.isAdmin), [authContext.isAdmin]);

  useMemo(() => {
    const cacheRtl = createCache({
      key: "rtl",
      stylisPlugins: [rtlPlugin],
    });

    setRtlCache(cacheRtl);
  }, []);

  // Open sidenav when mouse enter on mini sidenav
  const handleOnMouseEnter = () => {
    if (miniSidenav && !onMouseEnter) {
      setMiniSidenav(dispatch, false);
      setOnMouseEnter(true);
    }
  };

  // Close sidenav when mouse leave mini sidenav
  const handleOnMouseLeave = () => {
    if (onMouseEnter) {
      setMiniSidenav(dispatch, true);
      setOnMouseEnter(false);
    }
  };

  // Change the openConfigurator state
  const handleConfiguratorOpen = () => setOpenConfigurator(dispatch, !openConfigurator);

  // if the token expired or other errors it logs out and goes to the login page
  const navigate = useNavigate();
  setupAxiosInterceptors(() => {
    authContext.logout();
    navigate("/auth/login");
  });

  // Setting the dir attribute for the body element
  useEffect(() => {
    document.body.setAttribute("dir", direction);
  }, [direction]);

  // Setting page scroll to 0 when changing the route
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
  }, [pathname]);

  const generateRoutes = (allRoutes) =>
    allRoutes.map((route) => {
      if (route.collapse) {
        return generateRoutes(route.collapse);
      }

      if (route.route && route.type !== "auth") {
        return (
          <Route
            exact
            path={route.route}
            element={
              <ProtectedRoute 
                isAuthenticated={authContext.isAuthenticated}
                requireAdmin={route.adminOnly}
              >
                {route.component}
              </ProtectedRoute>
            }
            key={route.key}
          />
        );
      }
      return null;
    });

  // Handle root path redirect based on authentication status
  const RootRedirect = () => {
    if (!isInitialized) {
      return null; // Show nothing while initializing
    }
    
    if (authContext.isAuthenticated) {
      return <Navigate to="/tables/dashboard" replace />;
    } else {
      return <Navigate to="/auth/login" replace />;
    }
  };

  const configsButton = (
    <MDBox
      display="flex"
      justifyContent="center"
      alignItems="center"
      width="3.25rem"
      height="3.25rem"
      bgColor="white"
      shadow="sm"
      borderRadius="50%"
      position="fixed"
      right="2rem"
      bottom="2rem"
      zIndex={99}
      color="dark"
      sx={{ cursor: "pointer" }}
      onClick={handleConfiguratorOpen}
    >
      <Icon fontSize="small" color="inherit">
        settings
      </Icon>
    </MDBox>
  );

  return (
    <>
      {!isInitialized ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '18px',
          color: '#666'
        }}>
          Loading...
        </div>
      ) : (
        <ThemeProvider theme={darkMode ? themeDark : theme}>
          <CssBaseline />
          {layout === "dashboard" && (
            <>
              <Sidenav
                color={sidenavColor}
                brand=""
                brandName={authContext.userInfo ? (authContext.isAdmin ? `${authContext.userInfo.first_name} (Admin)` : `${authContext.userInfo.first_name} (User)`) : "Dashboard"}
                routes={routes}
                onMouseEnter={handleOnMouseEnter}
                onMouseLeave={handleOnMouseLeave}
              />
              <Configurator />
              {configsButton}
            </>
          )}
          <Routes>
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/" element={<RootRedirect />} />
            {generateRoutes(routes)}
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </ThemeProvider>
      )}
    </>
  );
}
