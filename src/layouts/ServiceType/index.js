import { useState, useEffect, useMemo, useContext } from "react";
import { useTheme } from "@mui/material/styles";
import { useMediaQuery } from "@mui/material";
import { Autocomplete, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from "@mui/material";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import MDButton from "components/MDButton";

// Material Dashboard 2 React icons
import CloseIcon from "@mui/icons-material/Close";
import WarningIcon from "@mui/icons-material/Warning";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";

// Context
import { AuthContext } from "context";

// Services
import SheetService from "../../services/sheet-service";
import HttpService from "../../services/http.service";

// Ant Design
import { notification } from "antd";

function ServiceType() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isTablet = useMediaQuery(theme.breakpoints.down("lg"));
  const darkMode = theme.palette.mode === "dark";

  const { isAdmin, userInfo } = useContext(AuthContext);

  // Date range state
  const [startDate, setStartDate] = useState('2024-04-30');
  const [endDate, setEndDate] = useState('2025-03-31');

  // State for API data
  const [ApiBoilerSummaryData, setApiBoilerSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);

  // API Boiler Summary filter state
  const [selectedServiceType, setSelectedServiceType] = useState('Select All');
  const [serviceTypeSearchValue, setServiceTypeSearchValue] = useState('Select All');
  const [debouncedSearchValue, setDebouncedSearchValue] = useState('Select All');

  // Popup notification state
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [userHasSelected, setUserHasSelected] = useState(false);


  // Debounce search input to prevent too many re-renders
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchValue(serviceTypeSearchValue);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [serviceTypeSearchValue]);

  // Fetch boiler summary data from API
  const fetchBoilerSummaryData = async (startDateParam, endDateParam, showNotification = false) => {
    try {
      setLoading(true);
      
      const response = await HttpService.get(`/api/boiler-summary?StartDate=${startDateParam}&EndDate=${endDateParam}`);
      
      if (response && response.success && response.data) {
        setApiBoilerSummaryData(response.data);
        
        // Show success notification if requested
        if (showNotification) {
          notification.success({
            message: 'Data Refreshed Successfully!',
            description: 'data has been updated and synchronized.',
            placement: 'topRight',
            duration: 3,
          });
        }
      } else {
        setApiBoilerSummaryData([]);
        
        // Show error notification if requested
        if (showNotification) {
          notification.error({
            message: 'Failed to refresh data',
            description: 'Please try again or check your connection.',
            placement: 'topRight',
            duration: 4,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching boiler summary data:", error);
      setApiBoilerSummaryData([]);
      
      // Show error notification if requested
      if (showNotification) {
        notification.error({
          message: 'Error occurred',
          description: 'An error occurred while refreshing data. Please try again.',
          placement: 'topRight',
          duration: 4,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch with default dates
  useEffect(() => {
    fetchBoilerSummaryData(startDate, endDate);
  }, []);

  // Handle confirm button click
  const handleConfirmClick = () => {
    fetchBoilerSummaryData(startDate, endDate, true); // Pass true to show notification
  };

  // Check delivery ratio and show notification if needed
  const checkDeliveryRatio = (serviceTypeData) => {
    if (!serviceTypeData || serviceTypeData.length === 0) {
      return;
    }

    serviceTypeData.forEach((item) => {
      const totalApplications = item.totalApplications || 0;
      const notDeliveredOnTime = item.notDeliveredOnTime || 0;
      
      // Calculate the ratio (NOT DELIVERED ON TIME / TOTAL APPLICATIONS)
      const deliveryRatio = totalApplications > 0 ? (notDeliveredOnTime / totalApplications) * 100 : 0;
      
      // Show notification if ratio exceeds 10%
      if (deliveryRatio > 10) {
        const message = `${item.serviceType} Boiler was not delivered on time.`;
        setNotificationMessage(message);
        setShowNotification(true);
      }
    });
  };

  // Effect to check delivery ratio when service type selection changes
  useEffect(() => {
    if (ApiBoilerSummaryData && ApiBoilerSummaryData.length > 0) {
      // Process the API data into the same format as the table
      const processedData = ApiBoilerSummaryData.map((item) => ({
        serviceType: item.serviceType || 'N/A',
        totalApplications: item["Total Applications Received 2024-2025"] || item["total Application Received 2024-2025"] || 0,
        totalDisposed: item.total_Disposed || 0,
        pending: item.pending || 0,
        approved: item.approved || 0,
        rejected: item.rejected || 0,
        deliveredOnTime: item["is Delivered on time"] || item["is Delivered ontime"] || 0,
        notDeliveredOnTime: item["is NOT Delivered on time"] || item["is NOT Delivered ontime"] || 0,
      }));

      // Only check delivery ratio for user-initiated selections, not during initial load or option building
      if (userHasSelected && selectedServiceType !== 'Select All') {
        const filteredData = processedData.filter(item => item.serviceType === selectedServiceType);
        checkDeliveryRatio(filteredData);
      } else if (userHasSelected && debouncedSearchValue && debouncedSearchValue !== 'Select All') {
        const filteredData = processedData.filter(item => 
          item.serviceType.toLowerCase().includes(debouncedSearchValue.toLowerCase())
        );
        checkDeliveryRatio(filteredData);
      } else {
        // When showing all data (Select All) or during initial load, hide any existing notifications
        setShowNotification(false);
        setNotificationMessage('');
      }
    }
  }, [selectedServiceType, debouncedSearchValue, ApiBoilerSummaryData, userHasSelected]);

  // Create table data from API boiler summary data
  const createApiBoilerSummaryTableData = useMemo(() => {
    return () => {
      if (!ApiBoilerSummaryData || !Array.isArray(ApiBoilerSummaryData) || ApiBoilerSummaryData.length === 0) {
        return { columns: [], rows: [] };
      }

      // Define columns based on the API response structure
      const columns = [
        {
          Header: "SERVICE TYPE",
          accessor: "serviceType",
          minWidth: isMobile ? 150 : isTablet ? 200 : 250,
          maxWidth: isMobile ? 250 : isTablet ? 300 : 350,
        },
        {
          Header: "TOTAL APPLICATIONS",
          accessor: "totalApplications",
          minWidth: isMobile ? 120 : isTablet ? 150 : 180,
          maxWidth: isMobile ? 150 : isTablet ? 180 : 200,
        },
        {
          Header: "TOTAL DISPOSED",
          accessor: "totalDisposed",
          minWidth: isMobile ? 120 : isTablet ? 150 : 180,
          maxWidth: isMobile ? 150 : isTablet ? 180 : 200,
        },
        {
          Header: "PENDING",
          accessor: "pending",
          minWidth: isMobile ? 80 : isTablet ? 100 : 120,
          maxWidth: isMobile ? 120 : isTablet ? 150 : 180,
        },
        {
          Header: "APPROVED",
          accessor: "approved",
          minWidth: isMobile ? 80 : isTablet ? 100 : 120,
          maxWidth: isMobile ? 120 : isTablet ? 150 : 180,
        },
        {
          Header: "REJECTED",
          accessor: "rejected",
          minWidth: isMobile ? 80 : isTablet ? 100 : 120,
          maxWidth: isMobile ? 120 : isTablet ? 150 : 180,
        },
        {
          Header: "DELIVERED ON TIME",
          accessor: "deliveredOnTime",
          minWidth: isMobile ? 120 : isTablet ? 150 : 180,
          maxWidth: isMobile ? 150 : isTablet ? 180 : 200,
        },
        {
          Header: "NOT DELIVERED ON TIME",
          accessor: "notDeliveredOnTime",
          minWidth: isMobile ? 140 : isTablet ? 170 : 200,
          maxWidth: isMobile ? 170 : isTablet ? 200 : 220,
        },
      ];

      // Process the API data into table rows
      let rows = ApiBoilerSummaryData.map((item) => ({
        serviceType: item.serviceType || 'N/A',
        totalApplications: item["Total Applications Received 2024-2025"] || item["total Application Received 2024-2025"] || 0,
        totalDisposed: item.total_Disposed || 0,
        pending: item.pending || 0,
        approved: item.approved || 0,
        rejected: item.rejected || 0,
        deliveredOnTime: item["is Delivered on time"] || item["is Delivered ontime"] || 0,
        notDeliveredOnTime: item["is NOT Delivered on time"] || item["is NOT Delivered ontime"] || 0,
      }));

      // Filter rows based on selected service type or search input
      if (selectedServiceType !== 'Select All') {
        rows = rows.filter(row => row.serviceType === selectedServiceType);
      } else if (debouncedSearchValue && debouncedSearchValue !== 'Select All') {
        // Real-time filtering based on search input
        rows = rows.filter(row => 
          row.serviceType.toLowerCase().includes(debouncedSearchValue.toLowerCase())
        );
      }

      return { columns, rows };
    };
  }, [ApiBoilerSummaryData, selectedServiceType, debouncedSearchValue, isMobile, darkMode]);

  // Generate dropdown options for service type filter
  const serviceTypeOptions = useMemo(() => {
    if (!ApiBoilerSummaryData || !Array.isArray(ApiBoilerSummaryData) || ApiBoilerSummaryData.length === 0) {
      return [{ label: 'Select All', value: 'Select All' }];
    }
    
    const options = [{ label: 'Select All', value: 'Select All' }];
    ApiBoilerSummaryData.forEach((item) => {
      if (item.serviceType && !options.some(opt => opt.value === item.serviceType)) {
        options.push({ label: item.serviceType, value: item.serviceType });
      }
    });
    
    return options;
  }, [ApiBoilerSummaryData]);

  // Filtered options based on search input
  const filteredServiceTypeOptions = useMemo(() => {
    if (!serviceTypeSearchValue || serviceTypeSearchValue === 'Select All') {
      return serviceTypeOptions;
    }
    
    return serviceTypeOptions.filter(option => 
      option.label.toLowerCase().includes(serviceTypeSearchValue.toLowerCase())
    );
  }, [serviceTypeOptions, serviceTypeSearchValue]);

  const apiBoilerSummaryTableData = createApiBoilerSummaryTableData();

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Grid container spacing={isMobile ? 2 : 6}>
          <Grid item xs={12}>
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
                <MDBox>
                  <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <MDTypography variant="h6" color="white" style={{ fontSize: isMobile ? '14px' : '16px' }}>
                      Boiler Summary Data
                    </MDTypography>
                    <MDBox display="flex" alignItems="center" gap={2}>
                      <MDTypography variant="body2" color="white" style={{ fontSize: isMobile ? '12px' : '14px' }}>
                        Filter by Service Type:
                      </MDTypography>
                      <Autocomplete
                        value={serviceTypeOptions.find(option => option.value === selectedServiceType) || serviceTypeOptions[0]}
                        onChange={(event, newValue) => {
                          if (newValue) {
                            setSelectedServiceType(newValue.value);
                            setServiceTypeSearchValue(newValue.value);
                            setUserHasSelected(true);
                          } else {
                            // Handle clear action
                            setSelectedServiceType('Select All');
                            setServiceTypeSearchValue('Select All');
                            setUserHasSelected(false);
                          }
                        }}
                        onInputChange={(event, newInputValue) => {
                          setServiceTypeSearchValue(newInputValue);
                          // Reset selectedServiceType when user starts typing
                          if (newInputValue && newInputValue !== selectedServiceType) {
                            setSelectedServiceType('Select All');
                            setUserHasSelected(false);
                          }
                        }}
                        options={filteredServiceTypeOptions}
                        getOptionLabel={(option) => option.label}
                        isOptionEqualToValue={(option, value) => option.value === value.value}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            variant="outlined"
                            placeholder="Search service type..."
                            sx={{
                              minWidth: isMobile ? '150px' : '200px',
                              '& .MuiOutlinedInput-root': {
                                color: 'white',
                                fontSize: isMobile ? '12px' : '14px',
                                '& fieldset': {
                                  borderColor: 'rgba(255, 255, 255, 0.5)',
                                },
                                '&:hover fieldset': {
                                  borderColor: 'white',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: 'white',
                                },
                              },
                              '& .MuiInputBase-input': {
                                color: 'white',
                                fontSize: isMobile ? '12px' : '14px',
                              },
                              '& .MuiInputBase-input::placeholder': {
                                color: 'rgba(255, 255, 255, 0.7)',
                                opacity: 1,
                              },
                              '& .MuiSvgIcon-root': {
                                color: 'white',
                              },
                            }}
                          />
                        )}
                        renderOption={(props, option) => (
                          <li {...props} style={{ 
                            fontSize: isMobile ? '12px' : '14px',
                            padding: isMobile ? '8px 12px' : '12px 16px'
                          }}>
                            {option.label}
                          </li>
                        )}
                        ListboxProps={{
                          style: {
                            maxHeight: '200px',
                            fontSize: isMobile ? '12px' : '14px',
                          }
                        }}
                        noOptionsText="No service types found"
                        clearOnEscape
                        selectOnFocus
                        handleHomeEndKeys
                      />
                    </MDBox>
                  </MDBox>
                  
                  {/* Date Range Input Section */}
                  <MDBox display="flex" alignItems="center" gap={2} flexWrap="wrap">
                    <MDTypography variant="body2" color="white" style={{ fontSize: isMobile ? '12px' : '14px' }}>
                      Date Range:
                    </MDTypography>
                    <TextField
                      type="date"
                      label="Start Date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      InputLabelProps={{
                        shrink: true,
                        style: { color: 'rgba(255, 255, 255, 0.7)' }
                      }}
                      sx={{
                        minWidth: isMobile ? '140px' : '160px',
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          fontSize: isMobile ? '12px' : '14px',
                          '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.5)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'white',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: 'white',
                          },
                        },
                        '& .MuiInputBase-input': {
                          color: 'white',
                          fontSize: isMobile ? '12px' : '14px',
                        },
                        '& .MuiSvgIcon-root': {
                          color: 'white',
                        },
                      }}
                    />
                    <TextField
                      type="date"
                      label="End Date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      InputLabelProps={{
                        shrink: true,
                        style: { color: 'rgba(255, 255, 255, 0.7)' }
                      }}
                      sx={{
                        minWidth: isMobile ? '140px' : '160px',
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          fontSize: isMobile ? '12px' : '14px',
                          '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.5)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'white',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: 'white',
                          },
                        },
                        '& .MuiInputBase-input': {
                          color: 'white',
                          fontSize: isMobile ? '12px' : '14px',
                        },
                        '& .MuiSvgIcon-root': {
                          color: 'white',
                        },
                      }}
                    />
                    <MDButton
                      variant="contained"
                      color="success"
                      size="small"
                      onClick={handleConfirmClick}
                      sx={{
                        fontSize: isMobile ? '12px' : '14px',
                        minWidth: isMobile ? '80px' : '100px',
                        height: isMobile ? '36px' : '40px',
                      }}
                    >
                      Confirm
                    </MDButton>
                  </MDBox>
                </MDBox>
              </MDBox>
              <MDBox pt={isMobile ? 2 : 3}>
                <div style={{
                  overflowX: 'auto',
                  overflowY: 'auto',
                  maxWidth: '100%',
                  maxHeight: isMobile ? '400px' : isTablet ? '500px' : '600px',
                  borderRadius: '8px',
                }}>
                  <DataTable
                    key={`api-boiler-summary-table`}
                    table={apiBoilerSummaryTableData}
                    entriesPerPage={false}
                    canSearch={false}
                    showTotalEntries={false}
                    isLoading={loading}
                    isSorted={false}
                    defaultPageSize={1000}
                    sx={{
                      minWidth: isMobile ? '100%' : 'auto',
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
                        height: '100%',
                        borderRadius: '8px',
                        overflow: 'hidden',
                      },
                    }}
                  />
                </div>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>

      {/* Delivery Ratio Notification Popup */}
      <Dialog
        open={showNotification}
        onClose={() => setShowNotification(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          pb: 1,
          borderBottom: '1px solid #e0e0e0'
        }}>
          <WarningIcon sx={{ color: 'warning.main', fontSize: '28px' }} />
          <MDTypography variant="h6" color="text" fontWeight="bold">
            Delivery Alert
          </MDTypography>
          <IconButton
            onClick={() => setShowNotification(false)}
            sx={{ 
              ml: 'auto',
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'action.hover',
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <MDBox display="flex" alignItems="center" gap={2}>
            <WarningIcon sx={{ color: 'warning.main', fontSize: '24px' }} />
            <MDTypography variant="body1" color="text" sx={{ fontSize: '16px', lineHeight: 1.5 }}>
              {notificationMessage}
            </MDTypography>
          </MDBox>
          
          <MDBox mt={2}>
            <MDTypography variant="body2" color="text.secondary" sx={{ fontSize: '14px' }}>
              The delivery ratio for this service type exceeds 10%, indicating potential delays in service delivery.
            </MDTypography>
          </MDBox>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
          <MDButton
            variant="contained"
            color="primary"
            onClick={() => setShowNotification(false)}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              py: 1
            }}
          >
            Understood
          </MDButton>
        </DialogActions>
      </Dialog>

    </DashboardLayout>
  );
}

export default ServiceType;
