import React, { useState, useEffect, useMemo, useContext } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { useSelector, useDispatch } from "react-redux";
import { setSheet1 } from "../../redux/sheet1";
import { setRegions } from "../../redux/regions";
import axios from "axios";
import DataTable from "examples/Tables/DataTable";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import ReportsBarChart from "examples/Charts/BarCharts/VerticalBarChart";
import MDSelect from "components/MDSelect/MDSelect";
import PieChart from "examples/Charts/PieChart";
import { AuthContext } from "context";
import { getUserInfo } from "../../utils/jwtUtils";
import { notification } from "antd";
import MDButton from "components/MDButton";
import { useMaterialUIController } from "context";

// Add global test function
window.testUserRegion = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.log("No token found");
    return;
  }
  
  const decoded = getUserInfo(token);
  console.log("Decoded user info:", decoded);
  
  if (decoded && decoded.id) {
    // Test backend data
    axios.get(`/api/v1/auth/user/${decoded.id}`)
      .then(response => {
      })
      .catch(error => {
        console.error("Backend error:", error);
      });
  }
};

// Custom hook for responsive design
const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 480);
      setIsTablet(window.innerWidth <= 768 && window.innerWidth > 480);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return { isMobile, isTablet };
};

// Registering the necessary chart elements
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function Sheet2() {
  const dispatch = useDispatch();
  const { isMobile, isTablet } = useResponsive();
  const [controller] = useMaterialUIController();
  const { darkMode } = controller;
  const sheetData1 = useSelector((state) => state.sheet1.data);
  const regions = useSelector((state) => state.regions.data);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const [userHasSelectedCity, setUserHasSelectedCity] = useState(false);
  
  const [certificateTablePage, setCertificateTablePage] = useState(0);
  const [certificateTablePage2, setCertificateTablePage2] = useState(0);
  
  const { isAdmin, userInfo } = useContext(AuthContext);
  
  // Reset initialization state when component mounts
  useEffect(() => {
    console.log("Sheet2: Component mounted - resetting initialization state");
    setIsInitialized(false);
    setUserHasSelectedCity(false);
  }, []);
  
  const sheetData2 = sheetData1 && sheetData1.length > 2 ? sheetData1.slice(2, 10) : [];

  // Fetch regions data if not already loaded
  const fetchRegions = async () => {
    try {
      const response = await axios.get("/api/v1/city");
      const citiesData = response.data || response;
      dispatch(setRegions(citiesData));
    } catch (error) {
      console.error('Failed to fetch cities:', error);
    }
  };

  // Get user's assigned regions based on their permissions
  const getUserAssignedRegions = useMemo(() => {
    const token = localStorage.getItem("token");
    if (!token) return [];
    
    const userInfoFromToken = getUserInfo(token);
    if (!userInfoFromToken || !userInfoFromToken.region) return [];
    
    // Convert region to array if it's a string (for backward compatibility)
    let userRegions = userInfoFromToken.region;
    if (typeof userRegions === 'string') {
      userRegions = [userRegions];
    }
    
    if (!Array.isArray(userRegions)) return [];
    
    // Map region IDs to region names using Redux regions data
    if (regions && regions.length > 0) {
      return userRegions
        .map(regionId => {
          const region = regions.find(r => r._id === regionId);
          return region ? region.name : null;
        })
        .filter(regionName => regionName !== null);
    }
    
    return [];
  }, [regions]);

  // Get available regions for select dropdown
  const availableRegions = useMemo(() => {
    if (isAdmin) {
      // Admin can see all regions from sheet data
      if (!sheetData2 || sheetData2.length === 0) return [];
      return sheetData2.slice(1).map(row => row[1]).filter(region => region);
    } else {
      // Regular users can only see their assigned regions
      return getUserAssignedRegions;
    }
  }, [sheetData2, isAdmin, getUserAssignedRegions]);

  // Get user's region from JWT token and set initial selection
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize default region selection
  useEffect(() => {
    // Skip if already initialized or user has manually selected a city
    if (isInitialized || userHasSelectedCity) return;
    
    // Skip if data is not yet loaded
    if (!sheetData2 || sheetData2.length === 0) {
      console.log("Sheet2: Skipping initialization - sheetData2 not loaded yet");
      return;
    }
    if (!regions || regions.length === 0) {
      console.log("Sheet2: Skipping initialization - regions not loaded yet");
      return;
    }
    
    const token = localStorage.getItem("token");
    if (!token) {
      setIsInitialized(true);
      return;
    }
    
    const userInfoFromToken = getUserInfo(token);
    if (!userInfoFromToken) {
      console.log("Failed to decode user information from token");
      setIsInitialized(true);
      return;
    }
    
    if (isAdmin) {
      // Admin can select any region, default to first available
      if (availableRegions.length > 0) {
        console.log("Sheet2: Setting admin default region to:", availableRegions[0]);
        setSelectedCity(availableRegions[0]);
        setIsInitialized(true);
      } else {
        console.log("Sheet2: No available regions for admin");
        setIsInitialized(true);
      }
    } else {
      // Regular user is restricted to their assigned regions
      if (userInfoFromToken.region && availableRegions.length > 0) {
        // Convert region to array if it's a string (for backward compatibility)
        let userRegions = userInfoFromToken.region;
        if (typeof userRegions === 'string') {
          userRegions = [userRegions];
        }
        
        if (Array.isArray(userRegions) && userRegions.length > 0) {
          // Find the first region name that matches user's assigned regions
          const firstAssignedRegion = availableRegions.find(regionName => {
            const region = regions.find(r => r.name === regionName);
            return region && userRegions.includes(region._id);
          });
          
          if (firstAssignedRegion) {
            console.log("Sheet2: Setting user default region to:", firstAssignedRegion);
            setSelectedCity(firstAssignedRegion);
          } else if (availableRegions.length > 0) {
            // Fallback to first available region
            console.log("Sheet2: Setting user fallback region to:", availableRegions[0]);
            setSelectedCity(availableRegions[0]);
          } else {
            console.log("Sheet2: No available regions for user");
          }
        }
        setIsInitialized(true);
      } else {
        // No assigned regions, set to first available if any
        if (availableRegions.length > 0) {
          console.log("Sheet2: Setting user default region (no assigned regions) to:", availableRegions[0]);
          setSelectedCity(availableRegions[0]);
        } else {
          console.log("Sheet2: No available regions for user");
        }
        setIsInitialized(true);
      }
    }
  }, [sheetData2, regions, availableRegions, isAdmin, userHasSelectedCity, isInitialized]);

  // Reset certificate table pages when selected city changes
  useEffect(() => {
    setCertificateTablePage(0);
    setCertificateTablePage2(0);
  }, [selectedCity]);

  // Handle case where selected city is no longer available
  useEffect(() => {
    if (selectedCity && availableRegions.length > 0 && !availableRegions.includes(selectedCity)) {
      // Selected city is no longer available, reset to first available
      setSelectedCity(availableRegions[0]);
      setUserHasSelectedCity(false);
    }
  }, [selectedCity, availableRegions]);

  // Fallback effect to set default region when data loads after initialization
  useEffect(() => {
    // Only run if we have data but no city is selected and user hasn't manually selected one
    if (sheetData2 && sheetData2.length > 0 && 
        regions && regions.length > 0 && 
        !selectedCity && 
        !userHasSelectedCity && 
        availableRegions.length > 0) {
      
      console.log("Sheet2: Fallback effect triggered - setting default region");
      
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const userInfoFromToken = getUserInfo(token);
      if (!userInfoFromToken) return;
      
      if (isAdmin) {
        // Admin can select any region, default to first available
        setSelectedCity(availableRegions[0]);
      } else {
        // Regular user is restricted to their assigned regions
        if (userInfoFromToken.region && availableRegions.length > 0) {
          // Convert region to array if it's a string (for backward compatibility)
          let userRegions = userInfoFromToken.region;
          if (typeof userRegions === 'string') {
            userRegions = [userRegions];
          }
          
          if (Array.isArray(userRegions) && userRegions.length > 0) {
            // Find the first region name that matches user's assigned regions
            const firstAssignedRegion = availableRegions.find(regionName => {
              const region = regions.find(r => r.name === regionName);
              return region && userRegions.includes(region._id);
            });
            
            if (firstAssignedRegion) {
              setSelectedCity(firstAssignedRegion);
            } else if (availableRegions.length > 0) {
              // Fallback to first available region
              setSelectedCity(availableRegions[0]);
            }
          }
        } else {
          // No assigned regions, set to first available if any
          setSelectedCity(availableRegions[0]);
        }
      }
    }
  }, [sheetData2, regions, availableRegions, selectedCity, userHasSelectedCity, isAdmin]);

  const fetchSheet = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/sheet-data");
      dispatch(setSheet1(res.data[1]));
    } catch (err) {
      dispatch(setSheet1([]));
    }
    setLoading(false);
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      const res = await axios.post("/api/refresh-sheet-data");
      if (res.data.success) {
        dispatch(setSheet1(res.data.data[1]));
        notification.success({
          message: 'Data Refreshed Successfully!',
          description: 'Google Sheets data has been updated and synchronized.',
          placement: 'topRight',
          duration: 3,
        });
      } else {
        notification.error({
          message: 'Refresh Failed',
          description: 'Failed to refresh data from Google Sheets.',
          placement: 'topRight',
          duration: 4,
        });
      }
    } catch (err) {
      console.error("Error refreshing data:", err);
      notification.error({
        message: 'Refresh Error',
        description: 'An error occurred while refreshing the data.',
        placement: 'topRight',
        duration: 4,
      });
    }
    setRefreshing(false);
  };

  useEffect(() => {
    fetchSheet();
  }, [dispatch]);

  // Fetch regions data if not already loaded
  useEffect(() => {
    if (!regions || regions.length === 0) {
      fetchRegions();
    }
  }, [regions]);

  // Generate columns and rows for the table with responsive design
  const allKeys = sheetData1 && sheetData1.length > 2 ? Object.keys(sheetData1[2]) : [];
  
  // Responsive column configuration based on screen size
  const getVisibleKeys = () => {
    if (isMobile) {
      // Mobile: Show only 2 most important columns
      return allKeys.slice(1, 3);
    } else if (isTablet) {
      // Tablet: Show 3 columns
      return allKeys.slice(1, 4);
    } else {
      // Desktop: Show all columns
      return allKeys.slice(1, 6);
    }
  };

  const visibleKeys = getVisibleKeys();
  
  const columns = visibleKeys.map((key) => ({
    Header: sheetData1[2][key],
    accessor: key,
    minWidth: isMobile ? 80 : isTablet ? 120 : 150,
    maxWidth: isMobile ? 150 : isTablet ? 200 : 250,
    Cell: ({ value }) => (
      <div style={{
        fontSize: isMobile ? '12px' : '14px',
        lineHeight: '1.3',
        wordBreak: 'break-word',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        padding: isMobile ? '4px 6px' : '6px 8px',
        color: darkMode ? '#ffffff' : '#000000',
        fontWeight: '500',
      }}>
        {value || 'N/A'}
      </div>
    ),
  }));

  const rows =
    sheetData1 && sheetData1.length > 3
      ? sheetData1.slice(3).map((row) => {
        const filteredRow = {};
        visibleKeys.forEach((key) => {
          filteredRow[key] = row[key];
        });
        // Also include the first column (region name)
        filteredRow[allKeys[0]] = row[allKeys[0]];
        return filteredRow;
      }) // Keep all rows for the table (including Total)
      : [];

  // Create chart data from sheetData2
  const data = useMemo(() => {
    if (!sheetData2 || sheetData2.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Skip the first row (header) and extract region names from the second column
    const labels = sheetData2.slice(1).map(row => row[1] || '').filter(label => label !== '');

    // Define colors for different datasets
    const colors = ["info", "success", "error", "warning", "primary"];

    // Extract dataset labels dynamically from the header row (columns 3-6, indices 2-5)
    const datasetLabels = [];
    for (let i = 2; i <= 5; i++) {
      if (sheetData2[0] && sheetData2[0][i]) {
        datasetLabels.push(sheetData2[0][i]);
      }
    }

    // Create datasets for columns 3-6 (indices 2-5)
    const datasets = [];

    for (let i = 2; i <= 5; i++) {
      if (sheetData2[0] && sheetData2[0][i]) {
        const dataset = {
          label: datasetLabels[i - 2], // Use dynamic label from header
          data: sheetData2.slice(1).map(row => {
            const value = parseInt(row[i]) || 0;
            return value;
          }),
          color: colors[i - 2] || "info"
        };
        datasets.push(dataset);
      }
    }

    return {
      labels,
      datasets
    };
  }, [sheetData2]);

  // Create reusable function for bar chart data generation
  const createBarChartData = useMemo(() => {
    return (startColumn, endColumn) => {
      if (!sheetData2 || sheetData2.length === 0) {
        return {
          labels: [],
          datasets: []
        };
      }

      // Get available regions (skip header row)
      const availableRegions = sheetData2.slice(1).map(row => row[1]).filter(region => region);

      // Don't set default selected city here as it can cause infinite loops
      // The default city should only be set in the initialization useEffect

      // Find the selected region's data
      const selectedRegionData = sheetData2.slice(1).find(row => row[1] === selectedCity);

      if (!selectedRegionData) {
        return {
          labels: [],
          datasets: []
        };
      }

      // Extract column headers (labels) from header row
      const chartLabels = [];
      for (let i = startColumn; i <= endColumn; i++) {
        if (sheetData2[0][i]) {
          chartLabels.push(sheetData2[0][i]);
        }
      }

      // Extract data for selected region
      const chartData = [];
      for (let i = startColumn; i <= endColumn; i++) {
        const value = parseInt(selectedRegionData[i]) || 0;
        chartData.push(value);
      }

      return {
        labels: chartLabels,
        datasets: [
          {
            label: selectedCity,
            data: chartData,
            color: "info"
          }
        ]
      };
    };
  }, [sheetData2, selectedCity]);

  // Create regional chart data for selected city (Boiler status as per various region and total)
  const regionalData = useMemo(() => {
    if (!sheetData2 || sheetData2.length === 0 || !selectedCity) {
      return { labels: [], datasets: [] };
    }

    // Find the selected region's data
    const selectedRegionData = sheetData2.slice(1).find(row => row[1] === selectedCity);

    if (!selectedRegionData) {
      return { labels: [], datasets: [] };
    }

    // Extract column headers (labels) from header row
    const chartLabels = [];
    for (let i = 2; i <= 5; i++) {
      if (sheetData2[0][i]) {
        chartLabels.push(sheetData2[0][i]);
      }
    }

    // Extract data for selected region
    const chartData = [];
    for (let i = 2; i <= 5; i++) {
      const value = parseInt(selectedRegionData[i]) || 0;
      chartData.push(value);
    }

    return {
      labels: chartLabels,
      datasets: [
        {
          label: selectedCity,
          data: chartData,
          color: "info"
        }
      ]
    };
  }, [sheetData2, selectedCity]);

  // Create certificate bar chart data (Boiler as per type of certificate according to the region)
  const certificateBarChartData = useMemo(() => {
    if (!sheetData2 || sheetData2.length === 0 || !selectedCity) {
      return { labels: [], datasets: [] };
    }

    // Find the selected region's data
    const selectedRegionData = sheetData2.slice(1).find(row => row[1] === selectedCity);

    if (!selectedRegionData) {
      return { labels: [], datasets: [] };
    }

    // Extract column headers (labels) from header row
    const chartLabels = [];
    for (let i = 81; i <= 103; i++) {
      if (sheetData2[0][i]) {
        chartLabels.push(sheetData2[0][i]);
      }
    }

    // Extract data for selected region
    const chartData = [];
    for (let i = 81; i <= 103; i++) {
      const value = parseInt(selectedRegionData[i]) || 0;
      chartData.push(value);
    }

    return {
      labels: chartLabels,
      datasets: [
        {
          label: selectedCity,
          data: chartData,
          color: "warning"
        }
      ]
    };
  }, [sheetData2, selectedCity]);

  const certificatesBarChartData = useMemo(() => {
    if (!sheetData2 || sheetData2.length === 0 || !selectedCity) {
      return { labels: [], datasets: [] };
    }

    // Find the selected region's data
    const selectedRegionData = sheetData2.slice(1).find(row => row[1] === selectedCity);

    if (!selectedRegionData) {
      return { labels: [], datasets: [] };
    }

    // Extract column headers (labels) from header row
    const chartLabels = [];
    for (let i = 77; i <= 81; i++) {
      if (sheetData2[0][i]) {
        chartLabels.push(sheetData2[0][i]);
      }
    }

    // Extract data for selected region
    const chartData = [];
    for (let i = 77; i <= 81; i++) {
      const value = parseInt(selectedRegionData[i]) || 0;
      chartData.push(value);
    }

    return {
      labels: chartLabels,
      datasets: [
        {
          label: selectedCity,
          data: chartData,
          color: "warning"
        }
      ]
    };
  }, [sheetData2, selectedCity]);

  // Create reusable function for pie chart data generation
  const createPieChartData = useMemo(() => {
    return (startColumn, endColumn, title) => {
      if (!sheetData2 || sheetData2.length === 0) {
        return {
          labels: [],
          datasets: {}
        };
      }
      
      // Find the selected region's data
      const selectedRegionData = sheetData2.slice(1).find(row => row[1] === selectedCity);
      
      if (!selectedRegionData) {
        return {
          labels: [],
          datasets: {}
        };
      }
      
      // Extract column headers (labels) from header row
      const chartLabels = [];
      for (let i = startColumn; i <= endColumn; i++) {
        if (sheetData2[0][i]) {
          chartLabels.push(sheetData2[0][i]);
        }
      }
      
      // Extract data for selected region
      const chartData = [];
      for (let i = startColumn; i <= endColumn; i++) {
        const value = parseInt(selectedRegionData[i]) || 0;
        chartData.push(value);
      }

      // Define colors for pie chart segments (using theme color names)
      const backgroundColors = [
        "info", "success", "error", "warning", "primary", "secondary",
        "light", "dark", "info", "success", "error", "warning",
        "primary", "secondary", "light", "dark", "info", "success",
        "error", "warning", "primary", "secondary", "light", "dark"
      ];

      return {
        labels: chartLabels,
        datasets: {
          label: selectedCity,
          data: chartData,
          backgroundColors: backgroundColors
        }
      };
    };
  }, [sheetData2, selectedCity]);

  // Create pie chart data for selected city (Boiler as per type by region)
  const pieChartData = useMemo(() => {
    if (!sheetData2 || sheetData2.length === 0 || !selectedCity) {
      return { labels: [], datasets: {} };
    }
    
    // Find the selected region's data
    const selectedRegionData = sheetData2.slice(1).find(row => row[1] === selectedCity);
    
    if (!selectedRegionData) {
      return { labels: [], datasets: {} };
    }
    
    // Extract column headers (labels) from header row
    const chartLabels = [];
    for (let i = 6; i <= 20; i++) {
      if (sheetData2[0][i]) {
        chartLabels.push(sheetData2[0][i]);
      }
    }
    
    // Extract data for selected region
    const chartData = [];
    for (let i = 6; i <= 20; i++) {
      const value = parseInt(selectedRegionData[i]) || 0;
      chartData.push(value);
    }

    // Define colors for pie chart segments
    const backgroundColors = [
      "info", "success", "error", "warning", "primary", "secondary",
      "light", "dark", "info", "success", "error", "warning",
      "primary", "secondary", "light", "dark", "info", "success",
      "error", "warning", "primary", "secondary", "light", "dark"
    ];

    return {
      labels: chartLabels,
      datasets: {
        label: selectedCity,
        data: chartData,
        backgroundColors: backgroundColors
      }
    };
  }, [sheetData2, selectedCity]);

  // Create pie chart data for fuel data (Boiler as per fuel by region)
  const fuelPieChartData = useMemo(() => {
    if (!sheetData2 || sheetData2.length === 0 || !selectedCity) {
      return { labels: [], datasets: {} };
    }
    
    // Find the selected region's data
    const selectedRegionData = sheetData2.slice(1).find(row => row[1] === selectedCity);
    
    if (!selectedRegionData) {
      return { labels: [], datasets: {} };
    }
    
    // Extract column headers (labels) from header row
    const chartLabels = [];
    for (let i = 58; i <= 76; i++) {
      if (sheetData2[0][i]) {
        chartLabels.push(sheetData2[0][i]);
      }
    }
    
    // Extract data for selected region
    const chartData = [];
    for (let i = 58; i <= 76; i++) {
      const value = parseInt(selectedRegionData[i]) || 0;
      chartData.push(value);
    }

    // Define colors for pie chart segments
    const backgroundColors = [
      "info", "success", "error", "warning", "primary", "secondary",
      "light", "dark", "info", "success", "error", "warning",
      "primary", "secondary", "light", "dark", "info", "success",
      "error", "warning", "primary", "secondary", "light", "dark"
    ];

    return {
      labels: chartLabels,
      datasets: {
        label: selectedCity,
        data: chartData,
        backgroundColors: backgroundColors
      }
    };
  }, [sheetData2, selectedCity]);

  const industryPieChartData = useMemo(() => {
    if (!sheetData2 || sheetData2.length === 0 || !selectedCity) {
      return { labels: [], datasets: {} };
    }
    
    // Find the selected region's data
    const selectedRegionData = sheetData2.slice(1).find(row => row[1] === selectedCity);
    
    if (!selectedRegionData) {
      return { labels: [], datasets: {} };
    }
    
    // Extract column headers (labels) from header row
    const chartLabels = [];
    for (let i = 29; i <= 50; i++) {
      if (sheetData2[0][i]) {
        chartLabels.push(sheetData2[0][i]);
      }
    }
    
    // Extract data for selected region
    const chartData = [];
    for (let i = 29; i <= 50; i++) {
      const value = parseInt(selectedRegionData[i]) || 0;
      chartData.push(value);
    }

    // Define colors for pie chart segments
    const backgroundColors = [
      "info", "success", "error", "warning", "primary", "secondary",
      "light", "dark", "info", "success", "error", "warning",
      "primary", "secondary", "light", "dark", "info", "success",
      "error", "warning", "primary", "secondary", "light", "dark"
    ];

    return {
      labels: chartLabels,
      datasets: {
        label: selectedCity,
        data: chartData,
        backgroundColors: backgroundColors
      }
    };
  }, [sheetData2, selectedCity]);

  const surfacePieChartData = useMemo(() => {
    if (!sheetData2 || sheetData2.length === 0 || !selectedCity) {
      return { labels: [], datasets: {} };
    }
    
    // Find the selected region's data
    const selectedRegionData = sheetData2.slice(1).find(row => row[1] === selectedCity);
    
    if (!selectedRegionData) {
      return { labels: [], datasets: {} };
    }
    
    // Extract column headers (labels) from header row
    const chartLabels = [];
    for (let i = 51; i <= 57; i++) {
      if (sheetData2[0][i]) {
        chartLabels.push(sheetData2[0][i]);
      }
    }
    
    // Extract data for selected region
    const chartData = [];
    for (let i = 51; i <= 57; i++) {
      const value = parseInt(selectedRegionData[i]) || 0;
      chartData.push(value);
    }

    // Define colors for pie chart segments
    const backgroundColors = [
      "info", "success", "error", "warning", "primary", "secondary",
      "light", "dark", "info", "success", "error", "warning",
      "primary", "secondary", "light", "dark", "info", "success",
      "error", "warning", "primary", "secondary", "light", "dark"
    ];

    return {
      labels: chartLabels,
      datasets: {
        label: selectedCity,
        data: chartData,
        backgroundColors: backgroundColors
      }
    };
  }, [sheetData2, selectedCity]);

  const CapacityPieChartData = useMemo(() => {
    if (!sheetData2 || sheetData2.length === 0 || !selectedCity) {
      return { labels: [], datasets: {} };
    }
    
    // Find the selected region's data
    const selectedRegionData = sheetData2.slice(1).find(row => row[1] === selectedCity);
    
    if (!selectedRegionData) {
      return { labels: [], datasets: {} };
    }
    
    // Extract column headers (labels) from header row
    const chartLabels = [];
    for (let i = 21; i <= 28; i++) {
      if (sheetData2[0][i]) {
        chartLabels.push(sheetData2[0][i]);
      }
    }
    
    // Extract data for selected region
    const chartData = [];
    for (let i = 21; i <= 28; i++) {
      const value = parseInt(selectedRegionData[i]) || 0;
      chartData.push(value);
    }

    // Define colors for pie chart segments
    const backgroundColors = [
      "info", "success", "error", "warning", "primary", "secondary",
      "light", "dark", "info", "success", "error", "warning",
      "primary", "secondary", "light", "dark", "info", "success",
      "error", "warning", "primary", "secondary", "light", "dark"
    ];

    return {
      labels: chartLabels,
      datasets: {
        label: selectedCity,
        data: chartData,
        backgroundColors: backgroundColors
      }
    };
  }, [sheetData2, selectedCity]);

  // Calculate the number of regions from the table data
  const regionCount = useMemo(() => {
    if (!sheetData1 || sheetData1.length === 0) return 0;
    
    // Get all rows from the table (excluding header rows)
    const tableRows = sheetData1.slice(3);
    
    // Count unique regions (excluding the "Total" row)
    const regions = tableRows
      .map(row => row[allKeys[0]]) // Get region name from first column
      .filter(region => region && region !== 'Total' && region.trim() !== '');
    
    return regions.length;
  }, [sheetData1, allKeys]);

  // Calculate total values from the table data
  const totalValues = useMemo(() => {
    if (!sheetData1 || sheetData1.length === 0) return { running: 0, notOffered: 0, idle: 0 };    
    // Find the "Total" row in sheetData2
    const totalRow = sheetData1.find(row => row[1] === 'Total');
    
    if (!totalRow) return { running: 0, notOffered: 0, idle: 0 };
    
    return {
      running: parseInt(totalRow[2]) || 0,      // Running Boilers (column 2)
      notOffered: parseInt(totalRow[3]) || 0,   // Boiler Not Offered Since Last 365 Days (column 3)
      idle: parseInt(totalRow[4]) || 0,         // Idle Boilers (column 4)
    };
  }, [sheetData2]);

  
  // Reusable function to create table data from chart data (works for both bar and pie charts)
  const createTableDataFromChart = useMemo(() => {
    return (chartData, title = "Chart Data") => {
      if (!chartData || !chartData.labels || chartData.labels.length === 0) {
        return { columns: [], rows: [] };
      }

      const columns = [
        {
          Header: "Category",
          accessor: "category",
          Cell: ({ value }) => (
            <div style={{
              fontSize: isMobile ? '12px' : '14px',
              lineHeight: '1.3',
              wordBreak: 'break-word',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              padding: isMobile ? '4px 6px' : '6px 8px',
              color: darkMode ? '#ffffff' : '#000000',
              fontWeight: '600',
            }}>
              {value}
            </div>
          ),
        },
        {
          Header: "Value",
          accessor: "value",
          Cell: ({ value }) => (
            <div style={{
              fontSize: isMobile ? '12px' : '14px',
              lineHeight: '1.3',
              wordBreak: 'break-word',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              padding: isMobile ? '4px 6px' : '6px 8px',
              color: darkMode ? '#ffffff' : '#000000',
              fontWeight: '500',
            }}>
              {value}
            </div>
          ),
        },
      ];

      let rows = [];
      
      // Handle different chart data structures
      if (chartData.datasets && Array.isArray(chartData.datasets)) {
        // Bar chart structure (datasets is an array)
        if (chartData.datasets.length > 0) {
          rows = chartData.labels.map((label, index) => ({
            category: label,
            value: chartData.datasets[0].data[index] || 0,
          })).filter(row => row.category && row.category.trim() !== ''); // Filter out empty categories
        }
      } else if (chartData.datasets && chartData.datasets.data) {
        // Pie chart structure (datasets is an object with data array)
        rows = chartData.labels.map((label, index) => ({
          category: label,
          value: chartData.datasets.data[index] || 0,
        })).filter(row => row.category && row.category.trim() !== ''); // Filter out empty categories
      }

      return { columns, rows };
    };
  }, [isMobile, darkMode]);

  // Create table data from regionalData for the chart
  const regionalTableData = createTableDataFromChart(regionalData, "Regional Data");
  
  // Create table data for pie charts
  const pieChartTableData = createTableDataFromChart(pieChartData, "Boiler Type Data");
  const fuelPieChartTableData = createTableDataFromChart(fuelPieChartData, "Fuel Type Data");
  const industryPieChartTableData = createTableDataFromChart(industryPieChartData, "Industry Type Data");
  const surfacePieChartTableData = createTableDataFromChart(surfacePieChartData, "Heating Surface Data");
  const capacityPieChartTableData = createTableDataFromChart(CapacityPieChartData, "Capacity Data");
  
  // Create table data for certificate bar chart
  const certificateBarChartTableData = createTableDataFromChart(certificateBarChartData, "Certificate Type Data");
  const certificatesBarChartTableData = createTableDataFromChart(certificatesBarChartData, "Certificate Type Data");
  
  // Ensure certificate table data is properly structured
  if (certificateBarChartTableData && certificateBarChartTableData.rows) {
    certificateBarChartTableData.rows = certificateBarChartTableData.rows.filter(row => 
      row && row.category && row.category.trim() !== '' && row.value !== undefined
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      {/* ... existing code ... */}
      <Grid container spacing={3} pt={3}>
        {isAdmin && (
          <>
                      <Grid item xs={12} md={6} lg={4}>
              <MDBox mb={1.5}>
                <ComplexStatisticsCard
                  icon="leaderboard"
                  title="Total Running Boilers"
                  count={totalValues.running.toString()}
                  percentage={{
                    color: "success",
                    amount: "+3%",
                    label: "than last month",
                  }}
                />
              </MDBox>
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <MDBox mb={1.5}>
                <ComplexStatisticsCard
                  icon="store"
                  title="not offered since last 1 years"
                  count={totalValues.notOffered.toString()}
                  color="success"
                  percentage={{
                    color: "success",
                    amount: "+3%",
                    label: "than last month",
                  }}
                />
              </MDBox>
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <MDBox mb={1.5}>
                <ComplexStatisticsCard
                  icon="table"
                  title="Total Idle Boilers"
                  count={totalValues.idle.toString()}
                  color="error"
                  percentage={{
                    color: "success",
                    amount: "+3%",
                    label: "than last month",
                  }}
                />
              </MDBox>
            </Grid>
          </>
          
        )}
      </Grid>
      <MDBox pt={isMobile ? 3 : 6} pb={isMobile ? 2 : 3}>
        <Grid container spacing={isMobile ? 2 : 6}>
          {isAdmin && (
            <Grid item xs={12}>
              <Card>
                <MDBox
                  mx={isMobile ? 1 : 2}
                  mt={isMobile ? -2 : -3}
                  py={isMobile ? 2 : 3}
                  px={isMobile ? 1 : 2}
                  variant="gradient"
                  bgColor="info"
                  borderRadius="lg"
                  coloredShadow="info"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <MDTypography variant="h6" color="white" style={{ fontSize: isMobile ? '14px' : '16px' }}>
                    All Table
                  </MDTypography>
                  
                  <MDButton
                    variant="gradient"
                    color="success"
                    size={isMobile ? "small" : "medium"}
                    onClick={refreshData}
                    disabled={refreshing}
                    style={{
                      fontSize: isMobile ? '10px' : '12px',
                      padding: isMobile ? '6px 12px' : '8px 16px',
                      minWidth: isMobile ? '60px' : '80px',
                    }}
                  >
                    {refreshing ? "..." : isMobile ? "↻" : "Refresh"}
                  </MDButton>
                </MDBox>
                <MDBox pt={isMobile ? 2 : 3}>
                  <div style={{
                    overflowX: 'auto',
                    maxWidth: '100%',
                    WebkitOverflowScrolling: 'touch',
                  }}>
                    <DataTable
                      table={{ columns, rows }}
                      entriesPerPage={{ 
                        defaultValue: isMobile ? 5 : isTablet ? 8 : 10, 
                        entries: isMobile ? [5, 10] : isTablet ? [8, 15] : [10, 20] 
                      }}
                      canSearch={false}
                      showTotalEntries={true}
                      isLoading={loading}
                      isSorted={false}
                      sx={{
                        minWidth: isMobile ? '100%' : 'auto',
                        minHeight: isMobile ? '300px' : isTablet ? '350px' : '400px',
                        fontSize: isMobile ? '12px' : '14px',
                        '& .MuiTableCell-root': {
                          padding: isMobile ? '8px 4px' : isTablet ? '10px 6px' : '12px 8px',
                          borderSpacing: isMobile ? '2px' : '4px',
                          fontSize: isMobile ? '12px' : '14px',
                          color: darkMode ? '#ffffff' : '#000000',
                          fontWeight: '500',
                        },
                        '& .MuiTableHead-root .MuiTableCell-root': {
                          padding: isMobile ? '10px 4px' : isTablet ? '12px 6px' : '14px 8px',
                          fontSize: isMobile ? '12px' : '14px',
                          color: darkMode ? '#ffffff' : '#000000',
                          fontWeight: 600,
                        },
                        '& .MuiTableBody-root .MuiTableCell-root': {
                          fontSize: isMobile ? '12px' : '14px',
                          color: darkMode ? '#ffffff' : '#000000',
                          fontWeight: '500',
                        },
                        '& .MuiTableContainer-root': {
                          minHeight: isMobile ? '250px' : isTablet ? '300px' : '350px',
                        },
                      }}
                    />
                  </div>
                  <MDBox
                    mx={isMobile ? 1 : 2}
                    mt={isMobile ? -2 : -3}
                    py={isMobile ? 2 : 3}
                    px={isMobile ? 1 : 2}
                    variant="gradient"
                    borderRadius="lg"
                  >
                    <MDBox mb={isMobile ? 2 : 3}>
                      <ReportsBarChart
                        color="info"
                        title="Boiler Statistics by Region"
                        description="Regional boiler performance data"
                        date="data updated from Google Sheets"
                        chart={data}
                      />
                    </MDBox>
                  </MDBox>
                </MDBox>
              </Card>
            </Grid>
          )}
        </Grid>
      </MDBox>
      <MDBox pt={isMobile ? 3 : 6} pb={isMobile ? 2 : 3}>
        <Grid container spacing={isMobile ? 2 : 6}>
          <Grid item xs={12}>
            <Card>
              <MDBox
                mx={isMobile ? 1 : 2}
                mt={isMobile ? -2 : -3}
                py={isMobile ? 2 : 3}
                px={isMobile ? 1 : 2}
                variant="gradient"
                bgColor="info"
                borderRadius="lg"
                coloredShadow="info"
              >
                <MDTypography variant="h6" color="white" style={{ fontSize: isMobile ? '14px' : '16px' }}>
                  City Table
                </MDTypography>
              </MDBox>
              <MDBox pt={isMobile ? 2 : 3}>
                <MDBox mx={isMobile ? 1 : 2} mb={isMobile ? 2 : 3}>
                  {isAdmin ? (
                    <MDSelect
                      value={selectedCity}
                      onChange={(e) => {
                        setSelectedCity(e.target.value);
                        setUserHasSelectedCity(true);
                      }}
                      label="Select Region"
                      options={availableRegions}
                      style={{
                        fontSize: isMobile ? '12px' : '14px',
                      }}
                    />
                  ) : (
                    <MDBox>
                      <MDTypography variant="h6" color="text" fontWeight="medium" mb={1}>
                        Your Assigned Regions
                      </MDTypography>
                      <MDSelect
                        value={selectedCity}
                        onChange={(e) => {
                          setSelectedCity(e.target.value);
                          setUserHasSelectedCity(true);
                        }}
                        label="Select Your Region"
                        options={availableRegions}
                        style={{
                          fontSize: isMobile ? '12px' : '14px',
                        }}
                      />
                      {availableRegions.length > 0 && (
                        <MDTypography variant="caption" color="text" fontWeight="light" mt={1}>
                          You can view data for {availableRegions.length} assigned region{availableRegions.length > 1 ? 's' : ''}
                        </MDTypography>
                      )}
                    </MDBox>
                  )}
                </MDBox>
                <MDBox
                  mx={isMobile ? 1 : 2}
                  mt={isMobile ? -2 : -3}
                  py={isMobile ? 2 : 3}
                  px={isMobile ? 1 : 2}
                  variant="gradient"
                  borderRadius="lg"
                >
                  <MDBox mb={isMobile ? 2 : 3}>
                    <Grid container spacing={isMobile ? 1 : 3}>
                      <Grid item xs={12} md={6} lg={6}>
                        <MDBox mb={isMobile ? 1 : 3}>
                          <ReportsBarChart
                            color="info"
                            title={isMobile ? `${selectedCity || 'Region'} : Boiler status` : `${selectedCity || 'Region'} : Boiler status as per various region and total`}
                            description={isMobile ? `Statistics for ${selectedCity || 'selected region'}` : `Detailed statistics for ${selectedCity || 'selected region'}`}
                            date="data updated from Google Sheets"
                            chart={regionalData}
                          />
                        </MDBox >
                          {/* Regional Data Table */}
                          <MDBox mb={isMobile ? 2 : 3} pt={isMobile ? 3 : 6}>
                            <Card>
                              <MDBox
                                mx={isMobile ? 1 : 2}
                                mt={isMobile ? -2 : -3}
                                py={isMobile ? 2 : 3}
                                px={isMobile ? 1 : 2}
                                variant="gradient"
                                bgColor="error"
                                borderRadius="lg"
                                coloredShadow="error"
                              >
                                <MDTypography variant="h6" color="white" style={{ fontSize: isMobile ? '14px' : '16px' }}>
                                  {selectedCity || 'Region'} Boiler Statistics Table
                                </MDTypography>
                              </MDBox>
                              <MDBox pt={isMobile ? 2 : 3}>
                                <div style={{
                                  overflowX: 'auto',
                                  maxWidth: '100%',
                                  WebkitOverflowScrolling: 'touch',
                                }}>
                                  <DataTable
                                    table={regionalTableData}
                                    entriesPerPage={{ 
                                      defaultValue: isMobile ? 5 : isTablet ? 5 : 5, 
                                      entries: isMobile ? [5] : isTablet ? [5] : [5] 
                                    }}
                                    canSearch={false}
                                    showTotalEntries={true}
                                    isLoading={loading}
                                    isSorted={false}
                                    sx={{
                                      minWidth: isMobile ? '100%' : 'auto',
                                      minHeight: isMobile ? '300px' : isTablet ? '350px' : '400px',
                                      fontSize: isMobile ? '12px' : '14px',
                                      '& .MuiTableCell-root': {
                                        padding: isMobile ? '8px 4px' : isTablet ? '10px 6px' : '12px 8px',
                                        borderSpacing: isMobile ? '2px' : '4px',
                                        fontSize: isMobile ? '12px' : '14px',
                                        color: darkMode ? '#ffffff' : '#000000',
                                        fontWeight: '500',
                                      },
                                      '& .MuiTableHead-root .MuiTableCell-root': {
                                        padding: isMobile ? '10px 4px' : isTablet ? '12px 6px' : '14px 8px',
                                        fontSize: isMobile ? '12px' : '14px',
                                        color: darkMode ? '#ffffff' : '#000000',
                                        fontWeight: 600,
                                      },
                                      '& .MuiTableBody-root .MuiTableCell-root': {
                                        fontSize: isMobile ? '12px' : '14px',
                                        color: darkMode ? '#ffffff' : '#000000',
                                        fontWeight: '500',
                                      },
                                      '& .MuiTableContainer-root': {
                                        minHeight: isMobile ? '250px' : isTablet ? '300px' : '350px',
                                      },
                                    }}
                                  />
                                </div>
                              </MDBox>
                            </Card>
                          </MDBox>

                      </Grid>
                      <Grid item xs={12} md={6} lg={6}>
                        <MDBox mb={isMobile ? 1 : 3}>
                          <PieChart
                            color="info"
                            title={isMobile ? `${selectedCity || 'Region'} : Boiler type` : `${selectedCity || 'Region'} : Boiler as per type by region`}
                            description={isMobile ? `Type distribution for ${selectedCity || 'selected region'}` : `Boiler status distribution for ${selectedCity || 'selected region'}`}
                            date="data updated from Google Sheets"
                            chart={pieChartData}
                          />
                        </MDBox>
                        {/* Boiler Type Data Table */}
                        <MDBox mb={isMobile ? 2 : 3} pt={isMobile ? 3 : 6}>
                          <Card>
                            <MDBox
                              mx={isMobile ? 1 : 2}
                              mt={isMobile ? -2 : -3}
                              py={isMobile ? 2 : 3}
                              px={isMobile ? 1 : 2}
                              variant="gradient"
                              bgColor="error"
                              borderRadius="lg"
                              coloredShadow="error"
                            >
                              <MDTypography variant="h6" color="white" style={{ fontSize: isMobile ? '14px' : '16px' }}>
                                {selectedCity || 'Region'} Boiler Type Statistics Table
                              </MDTypography>
                            </MDBox>
                            <MDBox pt={isMobile ? 2 : 3}>
                              <div style={{
                                overflowX: 'auto',
                                maxWidth: '100%',
                                WebkitOverflowScrolling: 'touch',
                              }}>
                                <DataTable
                                  table={pieChartTableData}
                                  entriesPerPage={{ 
                                    defaultValue: isMobile ? 5 : isTablet ? 5 : 5, 
                                    entries: isMobile ? [5] : isTablet ? [5] : [5] 
                                  }}
                                  canSearch={false}
                                  showTotalEntries={true}
                                  isLoading={loading}
                                  isSorted={false}
                                  sx={{
                                    minWidth: isMobile ? '100%' : 'auto',
                                    minHeight: isMobile ? '300px' : isTablet ? '350px' : '400px',
                                    fontSize: isMobile ? '12px' : '14px',
                                    '& .MuiTableCell-root': {
                                      padding: isMobile ? '8px 4px' : isTablet ? '10px 6px' : '12px 8px',
                                      borderSpacing: isMobile ? '2px' : '4px',
                                      fontSize: isMobile ? '12px' : '14px',
                                      color: darkMode ? '#ffffff' : '#000000',
                                      fontWeight: '500',
                                    },
                                    '& .MuiTableHead-root .MuiTableCell-root': {
                                      padding: isMobile ? '10px 4px' : isTablet ? '12px 6px' : '14px 8px',
                                      fontSize: isMobile ? '12px' : '14px',
                                      color: darkMode ? '#ffffff' : '#000000',
                                      fontWeight: 600,
                                    },
                                    '& .MuiTableBody-root .MuiTableCell-root': {
                                      fontSize: isMobile ? '12px' : '14px',
                                      color: darkMode ? '#ffffff' : '#000000',
                                      fontWeight: '500',
                                    },
                                    '& .MuiTableContainer-root': {
                                      minHeight: isMobile ? '250px' : isTablet ? '300px' : '350px',
                                    },
                                  }}
                                />
                              </div>
                            </MDBox>
                          </Card>
                        </MDBox>
                      </Grid>
                    </Grid>
                  </MDBox>
                  
                  
                  <MDBox mb={isMobile ? 2 : 3}>
                    <Grid container spacing={isMobile ? 1 : 3}>
                      <Grid item xs={12} md={6} lg={6}>
                        <MDBox mb={isMobile ? 1 : 3}>
                          <PieChart
                            color="success"
                            title={isMobile ? `${selectedCity || 'Region'} : Fuel type` : `${selectedCity || 'Region'} : Boiler as per fuel by region`}
                            description={isMobile ? `Fuel distribution for ${selectedCity || 'selected region'}` : `Fuel distribution for ${selectedCity || 'selected region'}`}
                            date="data updated from Google Sheets"
                            chart={fuelPieChartData}
                          />
                        </MDBox>
                        {/* Fuel Type Data Table */}
                        <MDBox mb={isMobile ? 2 : 3} pt={isMobile ? 3 : 6}>
                          <Card>
                            <MDBox
                              mx={isMobile ? 1 : 2}
                              mt={isMobile ? -2 : -3}
                              py={isMobile ? 2 : 3}
                              px={isMobile ? 1 : 2}
                              variant="gradient"
                              bgColor="success"
                              borderRadius="lg"
                              coloredShadow="success"
                            >
                              <MDTypography variant="h6" color="white" style={{ fontSize: isMobile ? '14px' : '16px' }}>
                                {selectedCity || 'Region'} Fuel Type Statistics Table
                              </MDTypography>
                            </MDBox>
                            <MDBox pt={isMobile ? 2 : 3}>
                              <div style={{
                                overflowX: 'auto',
                                maxWidth: '100%',
                                WebkitOverflowScrolling: 'touch',
                              }}>
                                <DataTable
                                  table={fuelPieChartTableData}
                                  entriesPerPage={{ 
                                    defaultValue: isMobile ? 5 : isTablet ? 5 : 5, 
                                    entries: isMobile ? [5] : isTablet ? [5] : [5] 
                                  }}
                                  canSearch={false}
                                  showTotalEntries={true}
                                  isLoading={loading}
                                  isSorted={false}
                                  sx={{
                                    minWidth: isMobile ? '100%' : 'auto',
                                    minHeight: isMobile ? '300px' : isTablet ? '350px' : '400px',
                                    fontSize: isMobile ? '12px' : '14px',
                                    '& .MuiTableCell-root': {
                                      padding: isMobile ? '8px 4px' : isTablet ? '10px 6px' : '12px 8px',
                                      borderSpacing: isMobile ? '2px' : '4px',
                                      fontSize: isMobile ? '12px' : '14px',
                                      color: darkMode ? '#ffffff' : '#000000',
                                      fontWeight: '500',
                                    },
                                    '& .MuiTableHead-root .MuiTableCell-root': {
                                      padding: isMobile ? '10px 4px' : isTablet ? '12px 6px' : '14px 8px',
                                      fontSize: isMobile ? '12px' : '14px',
                                      color: darkMode ? '#ffffff' : '#000000',
                                      fontWeight: 600,
                                    },
                                    '& .MuiTableBody-root .MuiTableCell-root': {
                                      fontSize: isMobile ? '12px' : '14px',
                                      color: darkMode ? '#ffffff' : '#000000',
                                      fontWeight: '500',
                                    },
                                    '& .MuiTableContainer-root': {
                                      minHeight: isMobile ? '250px' : isTablet ? '300px' : '350px',
                                    },
                                  }}
                                />
                              </div>
                            </MDBox>
                          </Card>
                        </MDBox>
                      </Grid>
                      <Grid item xs={12} md={6} lg={6}>
                        <MDBox mb={isMobile ? 1 : 3}>
                          <PieChart
                            color="success"
                            title={isMobile ? `${selectedCity || 'Region'} : Industry types` : `${selectedCity || 'Region'} : Boiler used in various industry`}
                            description={isMobile ? `Industry distribution for ${selectedCity || 'selected region'}` : `used in various industry for ${selectedCity || 'selected region'}`}
                            date="data updated from Google Sheets"
                            chart={industryPieChartData}
                          />
                        </MDBox>
                        {/* Industry Type Data Table */}
                        <MDBox mb={isMobile ? 2 : 3} pt={isMobile ? 3 : 6}>
                          <Card>
                            <MDBox
                              mx={isMobile ? 1 : 2}
                              mt={isMobile ? -2 : -3}
                              py={isMobile ? 2 : 3}
                              px={isMobile ? 1 : 2}
                              variant="gradient"
                              bgColor="success"
                              borderRadius="lg"
                              coloredShadow="success"
                            >
                              <MDTypography variant="h6" color="white" style={{ fontSize: isMobile ? '14px' : '16px' }}>
                                {selectedCity || 'Region'} Industry Type Statistics Table
                              </MDTypography>
                            </MDBox>
                            <MDBox pt={isMobile ? 2 : 3}>
                              <div style={{
                                overflowX: 'auto',
                                maxWidth: '100%',
                                WebkitOverflowScrolling: 'touch',
                              }}>
                                <DataTable
                                  table={industryPieChartTableData}
                                  entriesPerPage={{ 
                                    defaultValue: isMobile ? 5 : isTablet ? 5 : 5, 
                                    entries: isMobile ? [5] : isTablet ? [5] : [5] 
                                  }}
                                  canSearch={false}
                                  showTotalEntries={true}
                                  isLoading={loading}
                                  isSorted={false}
                                  sx={{
                                    minWidth: isMobile ? '100%' : 'auto',
                                    minHeight: isMobile ? '300px' : isTablet ? '350px' : '400px',
                                    fontSize: isMobile ? '12px' : '14px',
                                    '& .MuiTableCell-root': {
                                      padding: isMobile ? '8px 4px' : isTablet ? '10px 6px' : '12px 8px',
                                      borderSpacing: isMobile ? '2px' : '4px',
                                      fontSize: isMobile ? '12px' : '14px',
                                      color: darkMode ? '#ffffff' : '#000000',
                                      fontWeight: '500',
                                    },
                                    '& .MuiTableHead-root .MuiTableCell-root': {
                                      padding: isMobile ? '10px 4px' : isTablet ? '12px 6px' : '14px 8px',
                                      fontSize: isMobile ? '12px' : '14px',
                                      color: darkMode ? '#ffffff' : '#000000',
                                      fontWeight: 600,
                                    },
                                    '& .MuiTableBody-root .MuiTableCell-root': {
                                      fontSize: isMobile ? '12px' : '14px',
                                      color: darkMode ? '#ffffff' : '#000000',
                                      fontWeight: '500',
                                    },
                                  }}
                                />
                              </div>
                            </MDBox>
                          </Card>
                        </MDBox>
                      </Grid>
                    </Grid>
                  </MDBox>
                  <MDBox mb={isMobile ? 2 : 3}>
                    <Grid container spacing={isMobile ? 1 : 3}>
                      <Grid item xs={12} md={6} lg={6}>
                        <MDBox mb={isMobile ? 1 : 3}>
                          <PieChart
                            color="success"
                            title={isMobile ? `${selectedCity || 'Region'} : Heating surface` : `${selectedCity || 'Region'} : Boiler as per Heating surface in m2 `}
                            description={isMobile ? `Heating surface for ${selectedCity || 'selected region'}` : `Boiler as per Heating surface in m2 for ${selectedCity || 'selected region'}`}
                            date="data updated from Google Sheets"
                            chart={surfacePieChartData}
                          />
                        </MDBox>
                        {/* Heating Surface Data Table */}
                        <MDBox mb={isMobile ? 2 : 3} pt={isMobile ? 3 : 6}>
                          <Card>
                            <MDBox
                              mx={isMobile ? 1 : 2}
                              mt={isMobile ? -2 : -3}
                              py={isMobile ? 2 : 3}
                              px={isMobile ? 1 : 2}
                              variant="gradient"
                              bgColor="primary"
                              borderRadius="lg"
                              coloredShadow="primary"
                            >
                              <MDTypography variant="h6" color="white" style={{ fontSize: isMobile ? '14px' : '16px' }}>
                                {selectedCity || 'Region'} Heating Surface Statistics Table
                              </MDTypography>
                            </MDBox>
                            <MDBox pt={isMobile ? 2 : 3}>
                              <div style={{
                                overflowX: 'auto',
                                maxWidth: '100%',
                                WebkitOverflowScrolling: 'touch',
                              }}>
                                <DataTable
                                  table={surfacePieChartTableData}
                                  entriesPerPage={{ 
                                    defaultValue: isMobile ? 5 : isTablet ? 5 : 5, 
                                    entries: isMobile ? [5] : isTablet ? [5] : [5] 
                                  }}
                                  canSearch={false}
                                  showTotalEntries={true}
                                  isLoading={loading}
                                  isSorted={false}
                                  sx={{
                                    minWidth: isMobile ? '100%' : 'auto',
                                    minHeight: isMobile ? '300px' : isTablet ? '350px' : '400px',
                                    fontSize: isMobile ? '12px' : '14px',
                                    '& .MuiTableCell-root': {
                                      padding: isMobile ? '8px 4px' : isTablet ? '10px 6px' : '12px 8px',
                                      borderSpacing: isMobile ? '2px' : '4px',
                                      fontSize: isMobile ? '12px' : '14px',
                                      color: darkMode ? '#ffffff' : '#000000',
                                      fontWeight: '500',
                                    },
                                    '& .MuiTableHead-root .MuiTableCell-root': {
                                      padding: isMobile ? '10px 4px' : isTablet ? '12px 6px' : '14px 8px',
                                      fontSize: isMobile ? '12px' : '14px',
                                      color: darkMode ? '#ffffff' : '#000000',
                                      fontWeight: 600,
                                    },
                                    '& .MuiTableBody-root .MuiTableCell-root': {
                                      fontSize: isMobile ? '12px' : '14px',
                                      color: darkMode ? '#ffffff' : '#000000',
                                      fontWeight: '500',
                                    },
                                    '& .MuiTableContainer-root': {
                                      minHeight: isMobile ? '250px' : isTablet ? '300px' : '350px',
                                    },
                                  }}
                                />
                              </div>
                            </MDBox>
                          </Card>
                        </MDBox>
                      </Grid>
                      <Grid item xs={12} md={6} lg={6}>
                        <MDBox mb={isMobile ? 1 : 3}>
                          <PieChart
                            color="success"
                            title={isMobile ? `${selectedCity || 'Region'} : Capacity TPH` : `${selectedCity || 'Region'} : Boiler as per Capacity in TPH`}
                            description={isMobile ? `Capacity for ${selectedCity || 'selected region'}` : `Boiler as per Capacity in TPH for ${selectedCity || 'selected region'}`}
                            date="data updated from Google Sheets"
                            chart={CapacityPieChartData}
                          />
                        </MDBox>
                        {/* Capacity Data Table */}
                        <MDBox mb={isMobile ? 2 : 3} pt={isMobile ? 3 : 6}>
                          <Card>
                            <MDBox
                              mx={isMobile ? 1 : 2}
                              mt={isMobile ? -2 : -3}
                              py={isMobile ? 2 : 3}
                              px={isMobile ? 1 : 2}
                              variant="gradient"
                              bgColor="primary"
                              borderRadius="lg"
                              coloredShadow="primary"
                            >
                              <MDTypography variant="h6" color="white" style={{ fontSize: isMobile ? '14px' : '16px' }}>
                                {selectedCity || 'Region'} Capacity Statistics Table
                              </MDTypography>
                            </MDBox>
                            <MDBox pt={isMobile ? 2 : 3}>
                              <div style={{
                                overflowX: 'auto',
                                maxWidth: '100%',
                                WebkitOverflowScrolling: 'touch',
                              }}>
                                <DataTable
                                  table={capacityPieChartTableData}
                                  entriesPerPage={{ 
                                    defaultValue: isMobile ? 5 : isTablet ? 5 : 5, 
                                    entries: isMobile ? [5] : isTablet ? [5] : [5] 
                                  }}
                                  canSearch={false}
                                  showTotalEntries={true}
                                  isLoading={loading}
                                  isSorted={false}
                                  sx={{
                                    minWidth: isMobile ? '100%' : 'auto',
                                    minHeight: isMobile ? '300px' : isTablet ? '350px' : '400px',
                                    fontSize: isMobile ? '12px' : '14px',
                                    '& .MuiTableCell-root': {
                                      padding: isMobile ? '8px 4px' : isTablet ? '10px 6px' : '12px 8px',
                                      borderSpacing: isMobile ? '2px' : '4px',
                                      fontSize: isMobile ? '12px' : '14px',
                                      color: darkMode ? '#ffffff' : '#000000',
                                      fontWeight: '500',
                                    },
                                    '& .MuiTableHead-root .MuiTableCell-root': {
                                      padding: isMobile ? '10px 4px' : isTablet ? '12px 6px' : '14px 8px',
                                      fontSize: isMobile ? '12px' : '14px',
                                      color: darkMode ? '#ffffff' : '#000000',
                                      fontWeight: 600,
                                    },
                                    '& .MuiTableBody-root .MuiTableCell-root': {
                                      fontSize: isMobile ? '12px' : '14px',
                                      color: darkMode ? '#ffffff' : '#000000',
                                      fontWeight: '500',
                                    },
                                    '& .MuiTableContainer-root': {
                                      minHeight: isMobile ? '250px' : isTablet ? '300px' : '350px',
                                    },
                                  }}
                                />
                              </div>
                            </MDBox>
                          </Card>
                        </MDBox>
                      </Grid>
                    </Grid>
                  </MDBox>
                  <MDBox mb={isMobile ? 2 : 3}>
                    <Grid container spacing={isMobile ? 1 : 3}>
                      
                    <Grid item xs={12} md={6} lg={6}>
                        <MDBox mb={isMobile ? 1 : 3}>
                          <ReportsBarChart
                            color="warning"
                            title={isMobile ? `${selectedCity || 'Region'} : Certificate types` : `${selectedCity || 'Region'} : Boiler as per type of certificate according to the region`}
                            description={isMobile ? `Certificate distribution for ${selectedCity || 'selected region'}` : `Certificate distribution for ${selectedCity || 'selected region'}`}
                            date="data updated from Google Sheets"
                            chart={certificatesBarChartData}
                          />
                        </MDBox>
                        {/* Certificate Type Data Table */}
                        <MDBox mb={isMobile ? 2 : 3} pt={isMobile ? 3 : 6}>
                          <Card>
                            <MDBox
                              mx={isMobile ? 1 : 2}
                              mt={isMobile ? -2 : -3}
                              py={isMobile ? 2 : 3}
                              px={isMobile ? 1 : 2}
                              variant="gradient"
                              bgColor="warning"
                              borderRadius="lg"
                              coloredShadow="warning"
                            >
                              <MDTypography variant="h6" color="white" style={{ fontSize: isMobile ? '14px' : '16px' }}>
                                {selectedCity || 'Region'} Certificate Type Statistics Table
                              </MDTypography>
                            </MDBox>
                            <MDBox pt={isMobile ? 2 : 3}>
                              <div style={{
                                overflowX: 'auto',
                                maxWidth: '100%',
                                WebkitOverflowScrolling: 'touch',
                              }}>
                                <DataTable
                                  key={`certificate-table-1-${selectedCity}-${certificateTablePage}`}
                                  table={certificatesBarChartTableData}
                                  entriesPerPage={{ 
                                    defaultValue: 5, 
                                    entries: [5, 10, 15, 20] 
                                  }}
                                  canSearch={false}
                                  showTotalEntries={true}
                                  isLoading={loading}
                                  isSorted={false}
                                  onPageChange={(newPage) => {
                                    setCertificateTablePage(newPage);
                                  }}
                                  sx={{
                                    minWidth: isMobile ? '100%' : 'auto',
                                    minHeight: isMobile ? '300px' : isTablet ? '350px' : '400px',
                                    fontSize: isMobile ? '12px' : '14px',
                                    '& .MuiTableCell-root': {
                                      padding: isMobile ? '8px 4px' : isTablet ? '10px 6px' : '12px 8px',
                                      borderSpacing: isMobile ? '2px' : '4px',
                                      fontSize: isMobile ? '12px' : '14px',
                                      color: darkMode ? '#ffffff' : '#000000',
                                      fontWeight: '500',
                                    },
                                    '& .MuiTableHead-root .MuiTableCell-root': {
                                      padding: isMobile ? '10px 4px' : isTablet ? '12px 6px' : '14px 8px',
                                      fontSize: isMobile ? '12px' : '14px',
                                      color: darkMode ? '#ffffff' : '#000000',
                                      fontWeight: 600,
                                    },
                                    '& .MuiTableBody-root .MuiTableCell-root': {
                                      fontSize: isMobile ? '12px' : '14px',
                                      color: darkMode ? '#ffffff' : '#000000',
                                      fontWeight: '500',
                                    },
                                    '& .MuiTableContainer-root': {
                                      minHeight: isMobile ? '250px' : isTablet ? '300px' : '350px',
                                    },
                                  }}
                                />
                              </div>
                            </MDBox>
                          </Card>
                        </MDBox>
                      </Grid>

                      <Grid item xs={12} md={6} lg={6}>
                        <MDBox mb={isMobile ? 1 : 3}>
                          <ReportsBarChart
                            color="warning"
                            title={isMobile ? `${selectedCity || 'Region'} : Certificate types` : `${selectedCity || 'Region'} : Boiler as per type of certificate according to the region`}
                            description={isMobile ? `Certificate distribution for ${selectedCity || 'selected region'}` : `Certificate distribution for ${selectedCity || 'selected region'}`}
                            date="data updated from Google Sheets"
                            chart={certificateBarChartData}
                          />
                        </MDBox>
                        {/* Certificate Type Data Table */}
                        <MDBox mb={isMobile ? 2 : 3} pt={isMobile ? 3 : 6}>
                          <Card>
                            <MDBox
                              mx={isMobile ? 1 : 2}
                              mt={isMobile ? -2 : -3}
                              py={isMobile ? 2 : 3}
                              px={isMobile ? 1 : 2}
                              variant="gradient"
                              bgColor="warning"
                              borderRadius="lg"
                              coloredShadow="warning"
                            >
                              <MDTypography variant="h6" color="white" style={{ fontSize: isMobile ? '14px' : '16px' }}>
                                {selectedCity || 'Region'} Certificate Type Statistics Table
                              </MDTypography>
                            </MDBox>
                            <MDBox pt={isMobile ? 2 : 3}>
                              <div style={{
                                overflowX: 'auto',
                                maxWidth: '100%',
                                WebkitOverflowScrolling: 'touch',
                              }}>
                                <DataTable
                                  key={`certificate-table-2-${selectedCity}-${certificateTablePage2}`}
                                  table={certificateBarChartTableData}
                                  entriesPerPage={{ 
                                    defaultValue: isMobile ? 5 : isTablet ? 5 : 5, 
                                    entries: isMobile ? [5] : isTablet ? [5] : [5] 
                                  }}
                                  canSearch={false}
                                  showTotalEntries={true}
                                  isLoading={loading}
                                  isSorted={false}
                                  sx={{
                                    minWidth: isMobile ? '100%' : 'auto',
                                    minHeight: isMobile ? '300px' : isTablet ? '350px' : '400px',
                                    fontSize: isMobile ? '12px' : '14px',
                                    '& .MuiTableCell-root': {
                                      padding: isMobile ? '8px 4px' : isTablet ? '10px 6px' : '12px 8px',
                                      borderSpacing: isMobile ? '2px' : '4px',
                                      fontSize: isMobile ? '12px' : '14px',
                                      color: darkMode ? '#ffffff' : '#000000',
                                      fontWeight: '500',
                                    },
                                    '& .MuiTableHead-root .MuiTableCell-root': {
                                      padding: isMobile ? '10px 4px' : isTablet ? '12px 6px' : '14px 8px',
                                      fontSize: isMobile ? '12px' : '14px',
                                      color: darkMode ? '#ffffff' : '#000000',
                                      fontWeight: 600,
                                    },
                                    '& .MuiTableBody-root .MuiTableCell-root': {
                                      fontSize: isMobile ? '12px' : '14px',
                                      color: darkMode ? '#ffffff' : '#000000',
                                      fontWeight: '500',
                                    },
                                    '& .MuiTableContainer-root': {
                                      minHeight: isMobile ? '250px' : isTablet ? '300px' : '350px',
                                    },
                                  }}
                                />
                              </div>
                            </MDBox>
                          </Card>
                        </MDBox>
                      </Grid>

                      <Grid item xs={12} md={12} lg={12}>
                              hiii
                      </Grid>

                    </Grid>
                  </MDBox>
                </MDBox>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Sheet2;
