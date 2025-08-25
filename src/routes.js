import Tables from "layouts/tables";
import Sheet2 from "layouts/sheet2";
import CityName from "layouts/cityName"
import Sheet1 from "layouts/sheet1"

import Login from "auth/login";
import Register from "auth/register";

// @mui icons
import Icon from "@mui/material/Icon";

// Base routes that all users can access
const baseRoutes = [
  {
    type: "collapse",
    name: "Dashboard",
    key: "tables/dashboard",
    icon: <Icon fontSize="small">dashboard</Icon>,
    route: "/tables/dashboard",
    component: <Sheet2 />,
  },
  {
    type: "collapse",
    name: "Boiler Details",
    key: "tables/boiler-details",
    icon: <Icon fontSize="small">delivery_dining</Icon>,
    route: "/tables/boiler-details",
    component: <Sheet1 />,
  },
];

// Admin-only routes
const adminRoutes = [
  {
    type: "collapse",
    name: "User table",
    key: "tables/users",
    icon: <Icon fontSize="small">table_view</Icon>,
    route: "/tables/users",
    component: <Tables />,
    adminOnly: true,
  },
  {
    type: "collapse",
    name: "CityName Tables",
    key: "tables/city",
    icon: <Icon fontSize="small">grading</Icon>,
    route: "/tables/city",
    component: <CityName />,
    adminOnly: true,
  },
];

// Auth routes
const authRoutes = [
  {
    type: "auth",
    name: "Login",
    key: "login",
    icon: <Icon fontSize="small">login</Icon>,
    route: "/auth/login",
    component: <Login />,
  },
  {
    type: "auth",
    name: "Register",
    key: "register",
    icon: <Icon fontSize="small">reigster</Icon>,
    route: "/auth/register",
    component: <Register />,
  }
];

// Function to get routes based on admin status
export const getRoutes = (isAdmin = false) => {
  const routes = [...baseRoutes];
  
  if (isAdmin) {
    routes.push(...adminRoutes);
  }
  
  return routes;
};

// Default export for backward compatibility
const routes = getRoutes();
export default routes;
