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
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import ReportsBarChart from "examples/Charts/BarCharts/VerticalBarChart";
import ReportsLineChart from "examples/Charts/LineCharts/ReportsLineChart";
import DefaultLineChart from "examples/Charts/LineCharts/DefaultLineChart";
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
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement);

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
  
  // Chart type selection states
  const [boilerTypeChartType, setBoilerTypeChartType] = useState('Pie Chart');
  const [fuelTypeChartType, setFuelTypeChartType] = useState('Pie Chart');
  const [industriesChartType, setIndustriesChartType] = useState('Pie Chart');
  const [heatingSurfaceChartType, setHeatingSurfaceChartType] = useState('Pie Chart');
  const [capacityChartType, setCapacityChartType] = useState('Bar Chart');
  const [certificateChartType, setCertificateChartType] = useState('Bar Chart');
  const [districtChartType, setDistrictChartType] = useState('Bar Chart');
  const [economisersChartType, setEconomisersChartType] = useState('Pie Chart');
  const [boilerRegisteredChartType, setBoilerRegisteredChartType] = useState('Bar Chart');
  const [economisersManufacturedChartType, setEconomisersManufacturedChartType] = useState('Bar Chart');
  
  const { isAdmin, userInfo } = useContext(AuthContext);
  
  const [perType, setPerType] = useState([]);
  const [totalstate, setTotalstate] = useState([]);
  const [perFuelUsed, setPerFuelUsed] = useState([]);
  const [variousIndustries, setVariousIndustries] = useState([]);
  const [HeatingSurface, setHeatingSurface] = useState([]);
  const [perCapacity, setPerCapacity] = useState([]);
  const [certificate, setCertificate] = useState([]);
  const [BoilerRegistered, setBoilerRegistered] = useState([]);
  const [Accidents, setAccidents] = useState([]);
  const [Economisers, setEconomisers] = useState([]);
  const [perVarious, setPerVarious] = useState([]);
  const [EconomiserStatus, setEconomiserStatus] = useState([]);
  const [RunningEconomisers, setRunningEconomisers] = useState([]);
  const [Accident, setAccident] = useState([]);
  // Reset initialization state when component mounts
  useEffect(() => {
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
      setPerType(res.data[3]);
      setTotalstate(res.data[2]);
      setPerFuelUsed(res.data[4]);
      setVariousIndustries(res.data[5]);
      setHeatingSurface(res.data[6]);
      setPerCapacity(res.data[7]);
      setCertificate(res.data[8]);
      setBoilerRegistered(res.data[9]);
      setAccidents(res.data[10]);
      setEconomisers(res.data[11]);
      setPerVarious(res.data[12]);
      setEconomiserStatus(res.data[13]);
      setRunningEconomisers(res.data[14]);
      setAccident(res.data[15]);
    } catch (err) {
      dispatch(setSheet1([]));
      setPerType([]);
      setTotalstate([]);
      setPerFuelUsed([]);
      setVariousIndustries([]);
      setHeatingSurface([]);
      setPerCapacity([]);
      setCertificate([]);
      setBoilerRegistered([]);
      setAccidents([]);
      setEconomisers([]);
      setPerVarious([]);
      setEconomiserStatus([]);
      setRunningEconomisers([]);
      setAccident([]);
    }
    setLoading(false);
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      const res = await axios.post("/api/refresh-sheet-data");
      if (res.data.success) {
        dispatch(setSheet1(res.data.data[1]));
        setPerType(res.data.data[3]);
        setTotalstate(res.data.data[2]);
        setPerFuelUsed(res.data.data[4]);
        setVariousIndustries(res.data.data[5]);
        setHeatingSurface(res.data.data[6]);
        setPerCapacity(res.data.data[7]);
        setCertificate(res.data.data[8]);
        setBoilerRegistered(res.data.data[9]);
        setAccidents(res.data.data[10]);
        setEconomisers(res.data.data[11]);
        setPerVarious(res.data.data[12]);
        setEconomiserStatus(res.data.data[13]);
        setRunningEconomisers(res.data.data[14]);
        setAccident(res.data.data[15]);
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

    if (isAdmin) {
      // Admin sees all regions
      // Skip the first row (header) and extract region names from the second column
      const labels = sheetData2.slice(1).map(row => row[1] || '').filter(label => label !== '');

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
    } else {
      // Regular users only see their selected region
      if (!selectedCity) {
        console.log("No selected city for user");
        return {
          labels: [],
          datasets: []
        };
      }

      // Find the selected region's data
      const selectedRegionData = sheetData2.slice(1).find(row => row[1] === selectedCity);
      
      if (!selectedRegionData) {
        console.log("No data found for selected city:", selectedCity);
        return {
          labels: [],
          datasets: []
        };
      }

      console.log("Selected region data:", selectedRegionData);
      console.log("Dataset labels:", datasetLabels);

      // Create a single dataset for the selected region with better formatting for user view
      const labels = datasetLabels; // Use the actual data labels instead of just city name
      
      // Create a single dataset with all the data points
      const dataPoints = [];
      for (let i = 2; i <= 5; i++) {
        if (sheetData2[0] && sheetData2[0][i]) {
          const value = parseInt(selectedRegionData[i]) || 0;
          dataPoints.push(value);
        }
      }

      console.log("Data points for user view:", dataPoints);

      // Create a single dataset with all the data
      const dataset = {
        label: selectedCity,
        data: dataPoints,
        color: "info"
      };
      datasets.push(dataset);

      return {
        labels,
        datasets
      };
    }
  }, [sheetData2, isAdmin, selectedCity]);

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
    if (!perType || perType.length === 0 || !selectedCity) {
      return { labels: [], datasets: {} };
    }
    
    // Find the selected region's data
    const selectedRegionData = perType.slice(1).find(row => row[0] === selectedCity);
    
    if (!selectedRegionData) {
      return { labels: [], datasets: {} };
    }
    
    // Extract column headers (labels) from header row (skip first column which is region name)
    const chartLabels = [];
    for (let i = 1; i < perType[0].length; i++) {
      if (perType[0][i] && perType[0][i].trim() !== '') {
        chartLabels.push(perType[0][i]);
      }
    }
    
    // Extract data for selected region (skip first column which is region name)
    const chartData = [];
    for (let i = 1; i < selectedRegionData.length; i++) {
      const value = parseInt(selectedRegionData[i]) || 0;
      chartData.push(value);
    }

    // Filter out zero values and their corresponding labels
    const filteredLabels = [];
    const filteredData = [];
    chartLabels.forEach((label, index) => {
      if (chartData[index] > 0) {
        filteredLabels.push(label);
        filteredData.push(chartData[index]);
      }
    });

    // Define colors for pie chart segments
    const backgroundColors = [
      "info", "success", "error", "warning", "primary", "secondary",
      "light", "dark", "info", "success", "error", "warning",
      "primary", "secondary", "light", "dark", "info", "success",
      "error", "warning", "primary", "secondary", "light", "dark"
    ];

    return {
      labels: filteredLabels,
      datasets: {
        label: selectedCity,
        data: filteredData,
        backgroundColors: backgroundColors.slice(0, filteredLabels.length)
      }
    };
  }, [perType, selectedCity]);

  // Reusable function to process data for pie chart display based on selected city
  const processPieChartData = (dataArray, selectedCity) => {
    if (!dataArray || !Array.isArray(dataArray) || dataArray.length < 2 || !selectedCity) {
      return { labels: [], datasets: {} };
    }

    // First element contains headers
    const headers = dataArray[0] || [];
    
    // Find the row for the selected city
    const selectedCityRow = dataArray.slice(1).find(row => row && row[0] === selectedCity);
    
    if (!selectedCityRow) {
      return { labels: [], datasets: {} };
    }

    // Extract labels (skip first column which is region names)
    const labels = headers.slice(1).filter(label => label && label.trim() !== '');
    
    // Extract data for selected city (skip first column which is region name)
    const data = selectedCityRow.slice(1).map(value => parseInt(value) || 0);
    
    // Filter out labels and data where value is 0 or label contains "Total"
    const filteredLabels = [];
    const filteredData = [];
    
    labels.forEach((label, index) => {
      // Skip if value is 0 or label contains "Total" (case insensitive)
      if (data[index] > 0 && !label.toLowerCase().includes('total')) {
        filteredLabels.push(label);
        filteredData.push(data[index]);
      }
    });

    // If no data with values > 0, return empty structure
    if (filteredLabels.length === 0) {
      return { labels: [], datasets: {} };
    }

    // Define colors for pie chart segments
    const backgroundColors = [
      "info", "success", "error", "warning", "primary", "secondary",
      "light", "dark", "info", "success", "error", "warning",
      "primary", "secondary", "light", "dark", "info", "success",
      "error", "warning", "primary", "secondary", "light", "dark"
    ];

    return {
      labels: filteredLabels,
      datasets: {
        label: selectedCity,
        data: filteredData,
        backgroundColors: backgroundColors.slice(0, filteredLabels.length)
      }
    };
  };

  // Process perType data for pie chart display
  const perTypePieChartData = useMemo(() => {
    return processPieChartData(perType, selectedCity);
  }, [perType, selectedCity]);

  // Process perFuelUsed data for pie chart display
  const perFuelUsedPieChartData = useMemo(() => {
    return processPieChartData(perFuelUsed, selectedCity);
  }, [perFuelUsed, selectedCity]);

  // Reusable function to process data for bar chart display based on selected city
  const processBarChartData = (dataArray, selectedCity) => {
    if (!dataArray || !Array.isArray(dataArray) || dataArray.length < 2 || !selectedCity) {
      return { labels: [], datasets: [] };
    }

    // First element contains headers
    const headers = dataArray[0] || [];
    
    // Find the row for the selected city
    const selectedCityRow = dataArray.slice(1).find(row => row && row[0] === selectedCity);
    
    if (!selectedCityRow) {
      return { labels: [], datasets: [] };
    }

    // Extract labels (skip first column which is region names)
    const labels = headers.slice(1).filter(label => label && label.trim() !== '');
    
    // Extract data for selected city (skip first column which is region name)
    const data = selectedCityRow.slice(1).map(value => parseInt(value) || 0);
    
    // Filter out labels and data where value is 0 or label contains "Total"
    const filteredLabels = [];
    const filteredData = [];
    
    labels.forEach((label, index) => {
      // Skip if value is 0 or label contains "Total" (case insensitive)
      if (data[index] > 0 && !label.toLowerCase().includes('total')) {
        filteredLabels.push(label);
        filteredData.push(data[index]);
      }
    });

    // If no data with values > 0, return empty structure
    if (filteredLabels.length === 0) {
      return { labels: [], datasets: [] };
    }

    // Define colors for bar chart
    const colors = ["info", "success", "error", "warning", "primary", "secondary"];

    return {
      labels: filteredLabels,
      datasets: [
        {
          label: selectedCity,
          data: filteredData,
          color: colors[0] || "info"
        }
      ]
    };
  };

  // Process perCapacity data for bar chart display
  const perCapacityBarChartData = useMemo(() => {
    return processBarChartData(perCapacity, selectedCity);
  }, [perCapacity, selectedCity]);

  // Process certificates data for bar chart display
  const certificateDataBarChart = useMemo(() => {
    return processBarChartData(certificate, selectedCity);
  }, [certificate, selectedCity]);

  // Process BoilerRegistered data for bar chart display (Year-wise data for all regions)
  const boilerRegisteredBarChartData = useMemo(() => {
    if (!BoilerRegistered || !Array.isArray(BoilerRegistered) || BoilerRegistered.length < 2) {
      return { labels: [], datasets: [] };
    }

    // BoilerRegistered has a different structure:
    // Array[0]: ['Year', '2020-2021', '2021-2022', '2022-2023', '2023-2024', ...]
    // Array[1]: ['Total Numbers', '226', '310', '345', '360', '35', ...]
    
    const yearRow = BoilerRegistered[0] || [];
    const numbersRow = BoilerRegistered[1] || [];
    
    // Extract years (skip first column which is 'Year')
    const labels = yearRow.slice(1).filter(label => label && label.trim() !== '');
    
    // Extract numbers (skip first column which is 'Total Numbers')
    const data = numbersRow.slice(1).map(value => parseInt(value) || 0);
    
    // Filter out labels and data where value is 0
    const filteredLabels = [];
    const filteredData = [];
    
    labels.forEach((label, index) => {
      if (data[index] > 0) {
        filteredLabels.push(label);
        filteredData.push(data[index]);
      }
    });

    // If no data with values > 0, return empty structure
    if (filteredLabels.length === 0) {
      return { labels: [], datasets: [] };
    }

    return {
      labels: filteredLabels,
      datasets: [
        {
          label: "Total Boilers Registered",
          data: filteredData,
          color: "success"
        }
      ]
    };
  }, [BoilerRegistered]);

  // Process Economisers data for bar chart display (Year-wise data for all regions)
  const economisersBarChartData = useMemo(() => {
    if (!Economisers || !Array.isArray(Economisers) || Economisers.length < 2) {
      return { labels: [], datasets: [] };
    }

    // Economisers likely has a similar structure to BoilerRegistered:
    // Array[0]: ['Year', '2020-2021', '2021-2022', '2022-2023', '2023-2024', ...]
    // Array[1]: ['Total Numbers', 'X', 'Y', 'Z', 'W', ...]
    
    const yearRow = Economisers[0] || [];
    const numbersRow = Economisers[1] || [];
    
    // Extract years (skip first column which is 'Year')
    const labels = yearRow.slice(1).filter(label => label && label.trim() !== '');
    
    // Extract numbers (skip first column which is 'Total Numbers')
    const data = numbersRow.slice(1).map(value => parseInt(value) || 0);
    
    // Filter out labels and data where value is 0
    const filteredLabels = [];
    const filteredData = [];
    
    labels.forEach((label, index) => {
      if (data[index] > 0) {
        filteredLabels.push(label);
        filteredData.push(data[index]);
      }
    });

    // If no data with values > 0, return empty structure
    if (filteredLabels.length === 0) {
      return { labels: [], datasets: [] };
    }

    return {
      labels: filteredLabels,
      datasets: [
        {
          label: "Total Economisers Manufactured",
          data: filteredData,
          color: "warning"
        }
      ]
    };
  }, [Economisers]);

  // Process Accidents data for line chart display (Multiple datasets over years)
  const accidentsLineChartData = useMemo(() => {
    if (!Accidents || !Array.isArray(Accidents) || Accidents.length < 2) {
      return { labels: [], datasets: [] };
    }

    // Accidents has a structure with multiple datasets:
    // Element 0: ['Year', '2020-2021', '2021-2022', '2022-2023', '2023-2024', '2']
    // Element 1: ['Total No of Accidents', '4', '2', '6', '2', '1']
    // Element 2: ['Death', '0', '0', '5', '0', '0']
    // Element 3: ['Injury', '0', '0', '3', '0', '0']
    
    const yearRow = Accidents[0] || [];
    const labels = yearRow.slice(1).filter(label => label && label.trim() !== '');
    
    // Define colors for different datasets
    const colors = ["error", "warning", "info"];
    const datasets = [];
    
    // Process each data row (skip the first row which contains years)
    for (let i = 1; i < Accidents.length; i++) {
      const dataRow = Accidents[i] || [];
      if (dataRow.length < 2) continue;
      
      const datasetName = dataRow[0] || `Dataset ${i}`;
      const data = dataRow.slice(1).map(value => parseInt(value) || 0);
      
      // Only add dataset if it has valid data
      if (data.some(val => val > 0)) {
        datasets.push({
          label: datasetName,
          data: data,
          color: colors[i - 1] || "info"
        });
      }
    }

    return {
      labels: labels,
      datasets: datasets
    };
  }, [Accidents]);

  // Process Accident data for city-specific line chart display
  const cityAccidentLineChartData = useMemo(() => {
    if (!Accident || !Array.isArray(Accident) || Accident.length === 0) {
      return { labels: [], datasets: [] };
    }

    // Debug: Log available cities in Accident data

    // Find the selected city's accident data with improved matching
    const selectedCityData = Accident.find(item => {
      if (!item || !item.title) return false;
      
      // Try exact match first
      if (item.title === selectedCity) return true;
      
      // Try case-insensitive match
      if (item.title.toLowerCase() === selectedCity.toLowerCase()) return true;
      
      // Try uppercase match
      if (item.title.toUpperCase() === selectedCity.toUpperCase()) return true;
      
      // Try to match common variations
      const normalizedTitle = item.title.replace(/[^A-Za-z]/g, '').toLowerCase();
      const normalizedSelectedCity = selectedCity.replace(/[^A-Za-z]/g, '').toLowerCase();
      if (normalizedTitle === normalizedSelectedCity) return true;
      
      return false;
    });

    if (!selectedCityData || !selectedCityData.data || !Array.isArray(selectedCityData.data)) {
      console.log("No city data found or invalid data structure");
      return { labels: [], datasets: [] };
    }

    const accidentData = selectedCityData.data;
    
    // The first element contains the years/headers
    const yearRow = accidentData[0] || [];
    const labels = yearRow.slice(1).filter(label => label && label.trim() !== '');
    
    // Define colors for different accident types
    const colors = ["error", "warning", "info", "success", "primary"];
    const datasets = [];
    
    // Process each data row (skip the first row which contains years)
    for (let i = 1; i < accidentData.length; i++) {
      const dataRow = accidentData[i] || [];
      if (dataRow.length < 2) continue;
      
      const datasetName = dataRow[0] || `Accident Type ${i}`;
      const data = dataRow.slice(1).map(value => parseInt(value) || 0);
      
      // Always add dataset regardless of whether it has values > 0
      // This ensures all three lines (Total Accidents, Deaths, Injuries) are shown
      datasets.push({
        label: datasetName,
        data: data,
        color: colors[i - 1] || "info"
      });
    }


    return {
      labels: labels,
      datasets: datasets
    };
  }, [Accident, selectedCity]);

  // Process EconomiserStatus data for bar chart display (Region-wise data)
  const economiserStatusBarChartData = useMemo(() => {
    if (!EconomiserStatus || !Array.isArray(EconomiserStatus) || EconomiserStatus.length < 2) {
      return { labels: [], datasets: [] };
    }

    // EconomiserStatus has a structure with region-wise data:
    // Element 0: ['Region', 'Running Economiser', 'Not offered since last 365 Da', ...]
    // Element 1: ['Pune', '31', '11', '87', '129']
    // Element 2: ['Mumbai', '30', '7', '15', '52']
    // etc...
    
    const headerRow = EconomiserStatus[0] || [];
    const labels = headerRow.slice(1).filter(label => label && label.trim() !== '');
    
    // Find the selected region's data
    const selectedRegionData = EconomiserStatus.slice(1).find(row => row && row[0] === selectedCity);
    
    if (!selectedRegionData) {
      return { labels: [], datasets: [] };
    }
    
    // Extract data for selected region (skip first column which is region name)
    const data = selectedRegionData.slice(1).map(value => parseInt(value) || 0);
    
    // Filter out labels and data where value is 0
    const filteredLabels = [];
    const filteredData = [];
    
    labels.forEach((label, index) => {
      if (data[index] > 0) {
        filteredLabels.push(label);
        filteredData.push(data[index]);
      }
    });

    // If no data with values > 0, return empty structure
    if (filteredLabels.length === 0) {
      return { labels: [], datasets: [] };
    }

    return {
      labels: filteredLabels,
      datasets: [
        {
          label: selectedCity,
          data: filteredData,
          color: "primary"
        }
      ]
    };
  }, [EconomiserStatus, selectedCity]);

  // Process RunningEconomisers data for pie chart display (Industry-wise data by region)
  const runningEconomisersPieChartData = useMemo(() => {
    if (!RunningEconomisers || !Array.isArray(RunningEconomisers) || RunningEconomisers.length < 2) {
      return { labels: [], datasets: {} };
    }

    // RunningEconomisers has a structure with industry-wise data by region:
    // Element 0: ['Region', 'Power Generation', 'Sugar', 'Distillary', 'Chemical', 'Text', 'Paper', 'Rubber', 'Food', 'Oil', 'Other', 'Total']
    // Element 1: ['Pune', '0', '15', '0', '2', '1', '0', '4', '0', '0', '0', '0', ...]
    // Element 2: ['Mumbai', '0', '0', '0', '11', '4', '3', '2', '2', '6', '0', '0', ...]
    // etc...
    
    const headerRow = RunningEconomisers[0] || [];
    const labels = headerRow.slice(1).filter(label => label && label.trim() !== '' && label !== 'Total');
    
    // Find the selected region's data
    const selectedRegionData = RunningEconomisers.slice(1).find(row => row && row[0] === selectedCity);
    
    if (!selectedRegionData) {
      return { labels: [], datasets: {} };
    }
    
    // Extract data for selected region (skip first column which is region name)
    const data = selectedRegionData.slice(1).map(value => parseInt(value) || 0);
    
    // Filter out labels and data where value is 0 or label is 'Total'
    const filteredLabels = [];
    const filteredData = [];
    
    labels.forEach((label, index) => {
      if (data[index] > 0 && label !== 'Total') {
        filteredLabels.push(label);
        filteredData.push(data[index]);
      }
    });

    // If no data with values > 0, return empty structure
    if (filteredLabels.length === 0) {
      return { labels: [], datasets: {} };
    }

    // Define colors for pie chart segments
    const backgroundColors = [
      "info", "success", "error", "warning", "primary", "secondary",
      "light", "dark", "info", "success", "error", "warning",
      "primary", "secondary", "light", "dark", "info", "success",
      "error", "warning", "primary", "secondary", "light", "dark"
    ];

    return {
      labels: filteredLabels,
      datasets: {
        label: selectedCity,
        data: filteredData,
        backgroundColors: backgroundColors.slice(0, filteredLabels.length)
      }
    };
  }, [RunningEconomisers, selectedCity]);

  // Process perVarious data for table display (District-wise data by region)
  const perVariousTableData = useMemo(() => {
    if (!perVarious || !Array.isArray(perVarious) || perVarious.length === 0 || !selectedCity) {
      return { columns: [], rows: [] };
    }

    // Find the region object that matches the selected city (case-insensitive)
    const selectedRegionObject = perVarious.find(regionObj => {
      if (!regionObj || !regionObj.title || !regionObj.data) return false;
      // Convert both to lowercase for case-insensitive comparison
      return regionObj.title.toLowerCase() === selectedCity.toLowerCase();
    });

    if (!selectedRegionObject || !selectedRegionObject.data || !Array.isArray(selectedRegionObject.data)) {
      return { columns: [], rows: [] };
    }

    const tableData = selectedRegionObject.data;
    
    // First element contains the table headers (districts)
    const headers = tableData[0] || [];
    if (headers.length === 0) {
      return { columns: [], rows: [] };
    }

    // Create columns from headers
    const columns = headers.map((header, index) => ({
      Header: header,
      accessor: `col${index}`,
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

    // Create rows from data (skip first element which is headers)
    const rows = tableData.slice(1).map((dataRow, rowIndex) => {
      const row = {};
      headers.forEach((header, colIndex) => {
        row[`col${colIndex}`] = dataRow[colIndex] || '';
      });
      return row;
    });

    return { columns, rows };
  }, [perVarious, selectedCity, isMobile, isTablet, darkMode]);

  const variousIndustriesPieChartData = useMemo(() => {
    return processPieChartData(variousIndustries, selectedCity);
  }, [variousIndustries, selectedCity]);

  const HeatingSurfacePieChartData = useMemo(() => {
    return processPieChartData(HeatingSurface, selectedCity);
  }, [HeatingSurface, selectedCity]);

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

  // Helper function to convert pie chart data to bar chart format
  const convertPieToBarChartData = (pieChartData) => {
    if (!pieChartData || !pieChartData.labels || !pieChartData.datasets || !pieChartData.datasets.data) {
      return { labels: [], datasets: [] };
    }
    
    return {
      labels: pieChartData.labels,
      datasets: [
        {
          label: pieChartData.datasets.label || 'Data',
          data: pieChartData.datasets.data,
          color: "info"
        }
      ]
    };
  };

  // Helper function to convert bar chart data to pie chart format
  const convertBarToPieChartData = (barChartData) => {
    if (!barChartData || !barChartData.labels || !barChartData.datasets || !Array.isArray(barChartData.datasets)) {
      console.log("convertBarToPieChartData: Invalid barChartData structure", barChartData);
      return { labels: [], datasets: {} };
    }
    
    const firstDataset = barChartData.datasets[0];
    if (!firstDataset || !firstDataset.data) {
      console.log("convertBarToPieChartData: Invalid dataset structure", firstDataset);
      return { labels: [], datasets: {} };
    }
    
    console.log("convertBarToPieChartData: Input data", {
      labels: barChartData.labels,
      data: firstDataset.data,
      datasetLabel: firstDataset.label
    });
    
    // Don't filter out any values - show all data points for the pie chart
    const labels = barChartData.labels || [];
    const data = firstDataset.data || [];
    
    // Define a better color palette for pie charts
    const colorPalette = [
      "info", "success", "error", "warning", "primary", "secondary",
      "light", "dark"
    ];
    
    // Create background colors array matching the data length
    const backgroundColors = data.map((_, index) => colorPalette[index % colorPalette.length]);
    
    console.log("convertBarToPieChartData: Output data", {
      labels,
      data,
      backgroundColors
    });

    return {
      labels: labels,
      datasets: {
        label: firstDataset.label || 'Data',
        data: data,
        backgroundColors: backgroundColors
      }
    };
  };

  // Create table data from regionalData for the chart
  const regionalTableData = createTableDataFromChart(regionalData, "Regional Data");
  // Create table data for pie charts
  const pieChartTableData = createTableDataFromChart(perTypePieChartData, "Boiler Type Data");
  const perFuelUsedTableData = createTableDataFromChart(perFuelUsedPieChartData, "Fuel Type Data");
  const variousIndustriesTableData = createTableDataFromChart(variousIndustriesPieChartData, "Various Industries Data");
  const HeatingSurfaceTableData = createTableDataFromChart(HeatingSurfacePieChartData, "Heating Surface Data");
  
  // Create table data for certificate bar chart
  const certificateBarChartTableData = createTableDataFromChart(certificateBarChartData, "Certificate Type Data");

  
  
  // Ensure certificate table data is properly structured
  if (certificateBarChartTableData && certificateBarChartTableData.rows) {
    certificateBarChartTableData.rows = certificateBarChartTableData.rows.filter(row => 
      row && row.category && row.category.trim() !== '' && row.value !== undefined
    );
  }
 
  
  // Extract values from totalstate array for ComplexStatisticsCard
  // Show region-specific data when a region is selected, otherwise show totals
  const totalValues = useMemo(() => {
    
    if (totalstate && totalstate.length > 0) {
      // If a region is selected, show data for that specific region
      if (selectedCity) {
        // Find the row for the selected city
        const selectedRegionData = totalstate.find(row => 
          row && row[0] && row[0].toString().toLowerCase() === selectedCity.toLowerCase()
        );
        
        if (selectedRegionData && Array.isArray(selectedRegionData) && selectedRegionData.length >= 4) {
          // Extract the three values for the selected region
          const running = parseInt(selectedRegionData[1]) || 0;        // Running Boilers (index 1)
          const notOffered = parseInt(selectedRegionData[2]) || 0;     // Boiler not offered since last 1 year (index 2)
          const idle = parseInt(selectedRegionData[3]) || 0;           // Total Idle Boilers (index 3)
          
          console.log(`Region-specific data for ${selectedCity}:`, { running, notOffered, idle });
          
          return { running, notOffered, idle };
        } else {
          console.log(`No data found for selected region: ${selectedCity}, falling back to totals`);
        }
      }
      
      // If no region selected or region not found, show totals
      // Look for a row that might contain totals (usually has "Total" or similar in first column)
      let totalRow = null;
      
      // First, try to find a row with "Total" in the first column
      for (let i = 0; i < totalstate.length; i++) {
        if (totalstate[i] && totalstate[i][0] && 
            (totalstate[i][0].toString().toLowerCase().includes('total') || 
             totalstate[i][0].toString().toLowerCase().includes('sum'))) {
          totalRow = totalstate[i];
          break;
        }
      }
      
      // If no total row found, use the last row
      if (!totalRow && totalstate.length > 0) {
        totalRow = totalstate[totalstate.length - 1];
        console.log("Using last row as total row:", totalRow);
      }
      
      if (totalRow && Array.isArray(totalRow) && totalRow.length >= 4) {
        // Extract the three values from the total row
        const running = parseInt(totalRow[1]) || 0;        // Running Boilers (index 1)
        const notOffered = parseInt(totalRow[2]) || 0;     // Boiler not offered since last 1 year (index 2)
        const idle = parseInt(totalRow[3]) || 0;           // Total Idle Boilers (index 3)
        
        console.log("Using total values:", { running, notOffered, idle });
        
        return { running, notOffered, idle };
      }
      
      // If still no valid data, calculate totals from all rows
      if (totalstate.length > 0) {
        let totalRunning = 0;
        let totalNotOffered = 0;
        let totalIdle = 0;
        
        for (let i = 0; i < totalstate.length; i++) {
          const row = totalstate[i];
          if (row && Array.isArray(row) && row.length >= 4) {
            totalRunning += parseInt(row[1]) || 0;
            totalNotOffered += parseInt(row[2]) || 0;
            totalIdle += parseInt(row[3]) || 0;
          }
        }
        
        console.log("Calculated totals from all rows:", { totalRunning, totalNotOffered, totalIdle });
        
        return {
          running: totalRunning,
          notOffered: totalNotOffered,
          idle: totalIdle
        };
      }
    }
    
    console.log("Using default values for ComplexStatisticsCard"); // Debug log
    return {
      running: 0,
      notOffered: 0,
      idle: 0
    };
  }, [totalstate, selectedCity]);
  
  // console.log(BoilerRegistered, "BoilerRegistered"); // Removed to prevent console spam
  
  return (
    <DashboardLayout>
      <DashboardNavbar />
      {/* ... existing code ... */}
      <Grid container spacing={3} pt={3}>
        <>
          {/* Data Source Indicator */}
          <Grid item xs={12}>
            <MDBox mb={2} textAlign="center">
              <MDTypography variant="body2" color="text" fontWeight="light">
                {selectedCity ? 
                  (totalstate && totalstate.find(row => 
                    row && row[0] && row[0].toString().toLowerCase() === selectedCity.toLowerCase()
                  )) ? 
                    `Showing data for ${selectedCity} region` : 
                    `No data available for ${selectedCity} region - showing totals instead`
                  : 
                  "Showing total data across all regions"
                }
              </MDTypography>
            </MDBox>
          </Grid>
          
          <Grid item xs={12} md={6} lg={4}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                icon="leaderboard"
                title={selectedCity ? `${selectedCity} Running Boilers` : "Total Running Boilers"}
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
                title={selectedCity ? `${selectedCity} - Not Offered Since Last 1 Year` : "Not Offered Since Last 1 Year"}
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
                  title={selectedCity ? `${selectedCity} Idle Boilers` : "Total Idle Boilers"}
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
      </Grid>

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
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <MDTypography variant="h6" color="white" style={{ fontSize: isMobile ? '14px' : '16px' }}>
                  City Table
                </MDTypography>

                {isAdmin && (
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
                )}

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
                    mt={isAdmin ? -2 : -1}
                    py={isAdmin ? 2 : 1}
                    px={isMobile ? 1 : 2}
                    variant="gradient"
                    borderRadius="lg"
                  >
                    <MDBox mb={isAdmin ? 2 : 1}>
                      {isAdmin ? (
                        <ReportsBarChart
                          color="info"
                          title="Boiler Statistics by Region"
                          description="Boiler Statistics by Region"
                          date="data updated from Google Sheets"
                          chart={data}
                        />
                      ) : (
                        <MDBox>
                          <Grid container spacing={isMobile ? 1 : 3}>
                            <Grid item xs={12} md={6} lg={6}>
                              <MDBox
                                sx={{
                                  maxWidth: '100%',
                                  overflow: 'hidden',
                                  borderRadius: '12px',
                                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                }}
                              >
                                <ReportsBarChart
                                  color="info"
                                  title={`${selectedCity || 'Region'} Boiler Statistics`}
                                  description={`Boiler statistics for ${selectedCity || 'selected region'}`}
                                  date="data updated from Google Sheets"
                                  chart={data}
                                  height={isMobile ? "200px" : "250px"}
                                />
                              </MDBox>
                            </Grid>
                            <Grid item xs={12} md={6} lg={6}>
                              <MDBox
                                sx={{
                                  maxWidth: '100%',
                                  overflow: 'hidden',
                                  borderRadius: '12px',
                                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                }}
                              >
                              <MDBox>
                                
                                <PieChart
                                  color="success"
                                  title={`${selectedCity || 'Region'} Boiler Statistics Distribution`}
                                  description={`Pie chart view of boiler statistics for ${selectedCity || 'selected region'}`}
                                  date="data updated from Google Sheets"
                                  chart={(() => {
                                    const pieData = convertBarToPieChartData(data);
                                    console.log("Pie chart data:", pieData);
                                    console.log("Original bar chart data:", data);
                                    
                                    // Ensure we have valid data for the pie chart
                                    if (!pieData.labels || pieData.labels.length === 0) {
                                      console.warn("No labels in pie chart data, using fallback");
                                      return {
                                        labels: ["No Data Available"],
                                        datasets: {
                                          label: "No Data",
                                          data: [1],
                                          backgroundColors: ["light"]
                                        }
                                      };
                                    }
                                    
                                    return pieData;
                                  })()}
                                  height={isMobile ? "200px" : "250px"}
                                />
                              </MDBox>
                              </MDBox>
                            </Grid>
                          </Grid>
                        </MDBox>
                      )}
                    </MDBox>
                      
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
                          {/* Chart Type Selector for Boiler Types */}
                          <MDBox mb={2} display="flex" justifyContent="flex-end">
                            <MDSelect
                              value={boilerTypeChartType}
                              onChange={(e) => setBoilerTypeChartType(e.target.value)}
                              label="Chart Type"
                              options={['Pie Chart', 'Bar Chart']}
                            />
                          </MDBox>
                          
                          {boilerTypeChartType === 'Pie Chart' ? (
                            <PieChart
                              color="info"
                              title={isMobile ? `${selectedCity || 'Region'} : Boiler Types` : `${selectedCity || 'Region'} : Running Boiler as per Type`}
                              description={isMobile ? `Type distribution for ${selectedCity || 'selected region'}` : `Boiler types distribution for ${selectedCity || 'selected region'}`}
                              date="data updated from Google Sheets"
                              chart={pieChartData}
                            />
                          ) : (
                            <ReportsBarChart
                              color="info"
                              title={isMobile ? `${selectedCity || 'Region'} : Boiler Types` : `${selectedCity || 'Region'} : Running Boiler as per Type`}
                              description={isMobile ? `Type distribution for ${selectedCity || 'selected region'}` : `Boiler types distribution for ${selectedCity || 'selected region'}`}
                              date="data updated from Google Sheets"
                              chart={convertPieToBarChartData(pieChartData)}
                            />
                          )}
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
                                {selectedCity || 'Region'} Running Boiler as per Type
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
                      <Grid item xs={12} md={6} lg={6}>
                        <MDBox mb={isMobile ? 1 : 3}>
                          {/* Chart Type Selector for Fuel Types */}
                          <MDBox mb={2} display="flex" justifyContent="flex-end">
                            <MDSelect
                              value={fuelTypeChartType}
                              onChange={(e) => setFuelTypeChartType(e.target.value)}
                              label="Chart Type"
                              options={['Pie Chart', 'Bar Chart']}
                            />
                          </MDBox>
                          
                          {fuelTypeChartType === 'Pie Chart' ? (
                            <PieChart
                              color="success"
                              title={isMobile ? `${selectedCity || 'Region'} : Fuel Types` : `${selectedCity || 'Region'} : Running Boiler as per fuel used`}
                              description={isMobile ? `Fuel distribution for ${selectedCity || 'selected region'}` : `Boiler fuel types distribution for ${selectedCity || 'selected region'}`}
                              date="data updated from Google Sheets"
                              chart={perFuelUsedPieChartData}
                            />
                          ) : (
                            <ReportsBarChart
                              color="success"
                              title={isMobile ? `${selectedCity || 'Region'} : Fuel Types` : `${selectedCity || 'Region'} : Running Boiler as per fuel used`}
                              description={isMobile ? `Fuel distribution for ${selectedCity || 'selected region'}` : `Boiler fuel types distribution for ${selectedCity || 'selected region'}`}
                              date="data updated from Google Sheets"
                              chart={convertPieToBarChartData(perFuelUsedPieChartData)}
                            />
                          )}
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
                                {selectedCity || 'Region'} Running Boiler as per fuel used
                              </MDTypography>
                            </MDBox>
                            <MDBox pt={isMobile ? 2 : 3}>
                              <div style={{
                                overflowX: 'auto',
                                maxWidth: '100%',
                                WebkitOverflowScrolling: 'touch',
                              }}>
                                <DataTable
                                  table={perFuelUsedTableData}
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
                          {/* Chart Type Selector for Industries */}
                          <MDBox mb={2} display="flex" justifyContent="flex-end">
                            <MDSelect
                              value={industriesChartType}
                              onChange={(e) => setIndustriesChartType(e.target.value)}
                              label="Chart Type"
                              options={['Pie Chart', 'Bar Chart']}
                            />
                          </MDBox>
                          
                          {industriesChartType === 'Pie Chart' ? (
                            <PieChart
                              color="warning"
                              title={isMobile ? `${selectedCity || 'Region'} : Industries` : `${selectedCity || 'Region'} : Boiler used in various industries`}
                              description={isMobile ? `Industry distribution for ${selectedCity || 'selected region'}` : `Boiler usage across various industries for ${selectedCity || 'selected region'}`}
                              date="data updated from Google Sheets"
                              chart={variousIndustriesPieChartData}
                            />
                          ) : (
                            <ReportsBarChart
                              color="warning"
                              title={isMobile ? `${selectedCity || 'Region'} : Industries` : `${selectedCity || 'Region'} : Boiler used in various industries`}
                              description={isMobile ? `Industry distribution for ${selectedCity || 'selected region'}` : `Boiler usage across various industries for ${selectedCity || 'selected region'}`}
                              date="data updated from Google Sheets"
                              chart={convertPieToBarChartData(variousIndustriesPieChartData)}
                            />
                          )}
                        </MDBox>
                      </Grid>
                      <Grid item xs={12} md={6} lg={6}>
                        <MDBox mb={isMobile ? 1 : 3}>
                          {/* Chart Type Selector for Heating Surface */}
                          <MDBox mb={2} display="flex" justifyContent="flex-end">
                            <MDSelect
                              value={heatingSurfaceChartType}
                              onChange={(e) => setHeatingSurfaceChartType(e.target.value)}
                              label="Chart Type"
                              options={['Pie Chart', 'Bar Chart']}
                            />
                          </MDBox>
                          
                          {heatingSurfaceChartType === 'Pie Chart' ? (
                            <PieChart
                              color="primary"
                              title={isMobile ? `${selectedCity || 'Region'} : Heating Surface` : `${selectedCity || 'Region'} : Boiler as per Heating surface in m2`}
                              description={isMobile ? `Heating surface for ${selectedCity || 'selected region'}` : `Boiler heating surface distribution for ${selectedCity || 'selected region'}`}
                              date="data updated from Google Sheets"
                              chart={HeatingSurfacePieChartData}
                            />
                          ) : (
                            <ReportsBarChart
                              color="primary"
                              title={isMobile ? `${selectedCity || 'Region'} : Heating Surface` : `${selectedCity || 'Region'} : Boiler as per Heating surface in m2`}
                              description={isMobile ? `Heating surface for ${selectedCity || 'selected region'}` : `Boiler heating surface distribution for ${selectedCity || 'selected region'}`}
                              date="data updated from Google Sheets"
                              chart={convertPieToBarChartData(HeatingSurfacePieChartData)}
                            />
                          )}
                        </MDBox>
                      </Grid>
                    </Grid>
                  </MDBox>
                    <MDBox mb={isMobile ? 2 : 3}>
                      <Grid container spacing={isMobile ? 1 : 3}>
                        <Grid item xs={12} md={6} lg={6}>
                          <MDBox mb={isMobile ? 1 : 3}>
                            {/* Chart Type Selector for Capacity */}
                            <MDBox mb={2} display="flex" justifyContent="flex-end">
                              <MDSelect
                                value={capacityChartType}
                                onChange={(e) => setCapacityChartType(e.target.value)}
                                label="Chart Type"
                                options={['Pie Chart', 'Bar Chart']}
                              />
                            </MDBox>
                            
                            {capacityChartType === 'Bar Chart' ? (
                              <ReportsBarChart
                                color="warning"
                                title={`${selectedCity || 'Region'} : Running Boiler as per Capacity in TPH`}
                                description={`Running Boiler as per Capacity in TPH for ${selectedCity || 'selected region'}`}
                                date="data updated from Google Sheets"
                                chart={perCapacityBarChartData}
                              />
                            ) : (
                              <PieChart
                                color="warning"
                                title={`${selectedCity || 'Region'} : Running Boiler as per Capacity in TPH`}
                                description={`Running Boiler as per Capacity in TPH for ${selectedCity || 'selected region'}`}
                                date="data updated from Google Sheets"
                                chart={convertBarToPieChartData(perCapacityBarChartData)}
                              />
                            )}
                          </MDBox>
                        </Grid>
                        <Grid item xs={12} md={6} lg={6}>
                          <MDBox mb={isMobile ? 1 : 3}>
                            {/* Chart Type Selector for Certificate */}
                            <MDBox mb={2} display="flex" justifyContent="flex-end">
                              <MDSelect
                                value={certificateChartType}
                                onChange={(e) => setCertificateChartType(e.target.value)}
                                label="Chart Type"
                                options={['Pie Chart', 'Bar Chart']}
                              />
                            </MDBox>
                            
                            {certificateChartType === 'Bar Chart' ? (
                              <ReportsBarChart
                                color="error"
                                title={`${selectedCity || 'Region'} : Boiler as per type of certificate`}
                                description={`Boiler as per type of certificate for ${selectedCity || 'selected region'}`}
                                date="data updated from Google Sheets"
                                chart={certificateDataBarChart}
                              />
                            ) : (
                              <PieChart
                                color="error"
                                title={`${selectedCity || 'Region'} : Boiler as per type of certificate`}
                                description={`Boiler as per type of certificate for ${selectedCity || 'selected region'}`}
                                date="data updated from Google Sheets"
                                chart={convertBarToPieChartData(certificateDataBarChart)}
                              />
                            )}
                          </MDBox>
                        </Grid>
                      </Grid>
                    </MDBox>

                    <MDBox mb={isMobile ? 2 : 3}>
                      <Grid container spacing={isMobile ? 1 : 3}>
                        <Grid item xs={12} md={6} lg={6}>
                          <MDBox mb={isMobile ? 1 : 3}>
                            {/* Chart Type Selector for District */}
                            <MDBox mb={2} display="flex" justifyContent="flex-end">
                              <MDSelect
                                value={districtChartType}
                                onChange={(e) => setDistrictChartType(e.target.value)}
                                label="Chart Type"
                                options={['Pie Chart', 'Bar Chart']}
                              />
                            </MDBox>
                            
                            {districtChartType === 'Bar Chart' ? (
                              <ReportsBarChart
                                color="warning"
                                title={`${selectedCity || 'Region'} : Boiler as per various district`}
                                description={`Boiler as per various district for ${selectedCity || 'selected region'}`}
                                date="data updated from Google Sheets"
                                chart={economiserStatusBarChartData}
                              />
                            ) : (
                              <PieChart
                                color="warning"
                                title={`${selectedCity || 'Region'} : Boiler as per various district`}
                                description={`Boiler as per various district for ${selectedCity || 'selected region'}`}
                                date="data updated from Google Sheets"
                                chart={convertBarToPieChartData(economiserStatusBarChartData)}
                              />
                            )}
                          </MDBox>
                        </Grid>
                        <Grid item xs={12} md={6} lg={6}>
                          <MDBox mb={isMobile ? 1 : 3}>
                            {/* Chart Type Selector for Economisers */}
                            <MDBox mb={2} display="flex" justifyContent="flex-end">
                              <MDSelect
                                value={economisersChartType}
                                onChange={(e) => setEconomisersChartType(e.target.value)}
                                label="Chart Type"
                                options={['Pie Chart', 'Bar Chart']}
                              />
                            </MDBox>
                            
                            {economisersChartType === 'Pie Chart' ? (
                              <PieChart
                                color="success"
                                title={`${selectedCity || 'Region'} : Running Economisers Used in Various Industries`}
                                description={`Industry-wise distribution of running economisers for ${selectedCity || 'selected region'}`}
                                date="data updated from Google Sheets"
                                chart={runningEconomisersPieChartData}
                              />
                            ) : (
                              <ReportsBarChart
                                color="success"
                                title={`${selectedCity || 'Region'} : Running Economisers Used in Various Industries`}
                                description={`Industry-wise distribution of running economisers for ${selectedCity || 'selected region'}`}
                                date="data updated from Google Sheets"
                                chart={convertPieToBarChartData(runningEconomisersPieChartData)}
                              />
                            )}
                          </MDBox>
                        </Grid>
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
                              bgColor="success"
                              borderRadius="lg"
                              coloredShadow="success"
                            >
                              <MDTypography variant="h6" color="white" style={{ fontSize: isMobile ? '14px' : '16px' }}>
                                {selectedCity || 'Region'} : Boiler as per Various District
                              </MDTypography>
                            </MDBox>
                            <MDBox pt={isMobile ? 2 : 3}>
                              <div style={{
                                overflowX: 'auto',
                                maxWidth: '100%',
                                WebkitOverflowScrolling: 'touch',
                              }}>
                                <DataTable
                                  table={perVariousTableData}
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
                            </MDBox>
                          </Card>
                        </Grid>
                      </Grid>
                    </MDBox>

                    {/* Admin-Only Charts Section */}
                    {isAdmin && (
                      <>
                        <Grid container spacing={isMobile ? 1 : 3}>
                            <Grid item xs={12} md={6} lg={6}>
                              <MDBox mb={isMobile ? 1 : 3}>
                                {/* Chart Type Selector for Boiler Registered */}
                                <MDBox mb={2} display="flex" justifyContent="flex-end">
                                  <MDSelect
                                    value={boilerRegisteredChartType}
                                    onChange={(e) => setBoilerRegisteredChartType(e.target.value)}
                                    label="Chart Type"
                                    options={['Bar Chart', 'Pie Chart']}
                                  />
                                </MDBox>
                                
                                {boilerRegisteredChartType === 'Bar Chart' ? (
                                  <ReportsBarChart
                                    color="warning"
                                    title={`Number of Boiler Registered`}
                                    description={`Number of Boiler Registered`}
                                    date="data updated from Google Sheets"
                                    chart={boilerRegisteredBarChartData}
                                  />
                                ) : (
                                  <PieChart
                                    color="warning"
                                    title={`Number of Boiler Registered`}
                                    description={`Number of Boiler Registered`}
                                    date="data updated from Google Sheets"
                                    chart={convertBarToPieChartData(boilerRegisteredBarChartData)}
                                  />
                                )}
                              </MDBox>
                            </Grid>
                            <Grid item xs={12} md={6} lg={6}>
                              <MDBox mb={isMobile ? 1 : 3}>
                                {/* Chart Type Selector for Economisers Manufactured */}
                                <MDBox mb={2} display="flex" justifyContent="flex-end">
                                  <MDSelect
                                    value={economisersManufacturedChartType}
                                    onChange={(e) => setEconomisersManufacturedChartType(e.target.value)}
                                    label="Chart Type"
                                    options={['Bar Chart', 'Pie Chart']}
                                  />
                                </MDBox>
                                
                                {economisersManufacturedChartType === 'Bar Chart' ? (
                                  <ReportsBarChart
                                    color="error"
                                    title={`Number of Boilers/Economisers Manufactured`}
                                    description={`Number of Boilers/Economisers Manufactured`}
                                    date="data updated from Google Sheets"
                                    chart={economisersBarChartData}
                                  />
                                ) : (
                                  <PieChart
                                    color="error"
                                    title={`Number of Boilers/Economisers Manufactured`}
                                    description={`Number of Boilers/Economisers Manufactured`}
                                    date="data updated from Google Sheets"
                                    chart={convertBarToPieChartData(economisersBarChartData)}
                                  />
                                )}
                              </MDBox>
                            </Grid>
                          </Grid>
                          
                          {/* Accidents Line Chart */}
                          <MDBox mb={isMobile ? 2 : 3} mt={isMobile ? 2 : 3}>
                            <DefaultLineChart
                              icon={{ color: "error", component: "warning" }}
                              title="Accident Statistics Over Years"
                              description="Accident trends including total accidents, deaths, and injuries"
                              height="19.125rem"
                              chart={accidentsLineChartData}
                            />
                          </MDBox>
                      </>
                    )}

                    {/* User-Only Charts Section - City-Specific Accident Statistics */}
                    {!isAdmin && selectedCity && cityAccidentLineChartData.labels.length > 0 && (
                      <MDBox mb={isMobile ? 2 : 3} mt={isMobile ? 2 : 3}>
                        <DefaultLineChart
                          icon={{ color: "info", component: "location_city" }}
                          title={`${selectedCity} - City Accident Statistics`}
                          description={`Accident trends for ${selectedCity} including total accidents, deaths, and injuries by year`}
                          height="19.125rem"
                          chart={cityAccidentLineChartData}
                        />
                      </MDBox>
                    )}

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
