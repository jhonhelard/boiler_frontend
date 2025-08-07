import React, { useState, useEffect, useMemo, useCallback } from "react";
import { notification, Checkbox } from "antd";
import { useSelector, useDispatch } from "react-redux";
import { setRegions } from "../../redux/regions";

import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import MDTypography from "components/MDTypography";
import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";
import MDBox from "components/MDBox";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";
import AuthService from "../../services/auth-service";
import CityService from "../../services/city-service";
import MDButton from "components/MDButton";
import MDAlert from "components/MDAlert";
import { useMaterialUIController } from "context";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center', 
          color: '#666',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          margin: '10px'
        }}>
          <h4>Something went wrong with the table.</h4>
          <p>Please refresh the page to try again.</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Custom hook for responsive design
const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 600);
      setIsTablet(window.innerWidth <= 900 && window.innerWidth > 600);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return { isMobile, isTablet };
};

function Tables() {
  const { isMobile, isTablet } = useResponsive();
  const [controller] = useMaterialUIController();
  const { darkMode } = controller;
  
  const dispatch = useDispatch();
  
  // Get regions data from Redux
  const regions = useSelector((state) => state.regions.data);
  const regionsLoading = useSelector((state) => state.regions.loading);
  
  // State for dynamic table data
  const [tableData, setTableData] = useState({ columns: [], rows: [] });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, color: "success", message: "" });
  const [adminCount, setAdminCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  
  // State for region assignment modal
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRegions, setSelectedRegions] = useState([]);

  const showAlert = (message, color = "success") => {
    setAlert({ open: true, color, message });
    setTimeout(() => setAlert({ open: false, color: "success", message: "" }), 3000);
  };

  // Helper function to map region IDs to city names
  const getRegionNames = (regionIds) => {
    // Handle null, undefined, or empty values
    if (!regionIds) {
      return 'N/A';
    }
    
    let processedRegionIds = regionIds;
    
    // If regionIds is a string, convert it to an array for consistency
    // This handles cases where old user data might have region stored as a string
    if (typeof regionIds === 'string') {      
      processedRegionIds = [regionIds];
    }
    
    // Ensure processedRegionIds is an array
    if (!Array.isArray(processedRegionIds)) {
      return 'N/A';
    }
    
    // Check if regions data is available
    if (!regions || !Array.isArray(regions) || regions.length === 0) {
      return 'N/A';
    }
    
    try {
      const regionNames = processedRegionIds.map(regionId => {
        if (!regionId) return 'N/A';
        
        const region = regions.find(r => r._id === regionId);
        return region ? region.name : regionId;
      });
      
      return regionNames.join(', ');
    } catch (error) {
      console.error('Error processing region names:', error);
      return 'N/A';
    }
  };

  // Modal functions for region assignment
  const showRegionModal = (user) => {
    if (!user) {
      console.error('Cannot show region modal: user is null or undefined');
      return;
    }
    
    setSelectedUser(user);
    setSelectedRegions(user.region || []);
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    if (!selectedUser || !selectedUser._id) {
      notification.error({
        message: "Cannot update regions: Invalid user data",
        placement: "topRight",
      });
      return;
    }
    
    try {
      // Update user's regions in backend
      await AuthService.updateUserRegions(selectedUser._id, selectedRegions);
      
      // Refresh user data
      fetchUsers();
      
      notification.success({
        message: "Region assignments updated successfully",
        placement: "topRight",
      });
      
      setIsModalVisible(false);
      setSelectedUser(null);
      setSelectedRegions([]);
    } catch (error) {
      console.error('Error updating user regions:', error);
      notification.error({
        message: "Failed to update region assignments",
        description: error.message || 'An error occurred while updating regions',
        placement: "topRight",
      });
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setSelectedUser(null);
    setSelectedRegions([]);
  };

  const handleRegionChange = (regionId, checked) => {
    if (!regionId) {
      console.error('Cannot change region: regionId is null or undefined');
      return;
    }
    
    if (checked) {
      setSelectedRegions([...selectedRegions, regionId]);
    } else {
      setSelectedRegions(selectedRegions.filter(id => id !== regionId));
    }
  };

  // Memoize the column configuration to prevent recreation on every render
  const getVisibleColumns = useMemo(() => {
    if (isMobile) {
      // Mobile: Show only 2 essential columns
      return [
        { Header: 'Email', accessor: 'email' },
        { Header: 'Actions', accessor: 'actions' },
      ];
    } else if (isTablet) {
      // Tablet: Show 6 columns including Region Assignment Settings
      return [
        { Header: 'Email', accessor: 'email' },
        { Header: 'Permission', accessor: 'permission' },
        { Header: 'Region Assignment', accessor: 'region_assignment' },
        { Header: 'Region Settings', accessor: 'region_settings' },
        { Header: 'Actions', accessor: 'actions' },
      ];
    } else {
      // Desktop: Show 6 columns including Region Assignment Settings
      return [
        { Header: 'Email', accessor: 'email' },
        { Header: 'Permission', accessor: 'permission' },
        { Header: 'Region Assignment', accessor: 'region_assignment' },
        { Header: 'Region Settings', accessor: 'region_settings' },
        { Header: 'Toggle Permission', accessor: 'toggle' },
        { Header: 'Delete', accessor: 'delete' },
      ];
    }
  }, [isMobile, isTablet]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await AuthService.getallusers();
      
      if (!response) {
        console.error('No response from AuthService.getallusers()');
        setTableData({ columns: [], rows: [] });
        setAdminCount(0);
        setUserCount(0);
        return;
      }
      
      const users = response.data || response;
      
      if (Array.isArray(users) && users.length > 0) {
        try {
          const columns = getVisibleColumns.map((col, index) => {
            try {
              return {
                ...col,
                minWidth: isMobile ? 40 : isTablet ? 120 : 150,
                maxWidth: isMobile ? 80 : isTablet ? 200 : 250,
                Cell: col.accessor === 'actions' ? undefined : ({ value }) => (
                  <div style={{
                    fontSize: isMobile ? '12px' : '14px',
                    lineHeight: '1.2',
                    wordBreak: 'break-word',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    padding: isMobile ? '2px 4px' : '6px 8px',
                    color: darkMode ? '#ffffff' : '#000000',
                    fontWeight: '500',
                  }}>
                    {value || 'N/A'}
                  </div>
                ),
              };
            } catch (error) {
              console.error(`Error processing column ${index}:`, error);
              return null;
            }
          }).filter(col => col !== null);
          // Map users to rows with permission label and buttons
          const rows = users.map((user, index) => {
            try {
              // Ensure user object exists and has required properties
              if (!user || typeof user !== 'object') {
                console.warn('Invalid user object at index', index, ':', user);
                return null;
              }
              
              if (!user.email || typeof user.email !== 'string') {
                console.warn('User missing email at index', index, ':', user);
                return null;
              }
              
              const baseRow = {
                email: user.email,
              };

              // Add permission for tablet and desktop
              if (!isMobile) {
                baseRow.permission = user.admin === true ? 'admin' : 'user';
                
                // Safely handle user.region which might be null/undefined
                const userRegions = Array.isArray(user.region) ? user.region : [];
                baseRow.region_assignment = getRegionNames(userRegions);
                baseRow.region_settings = (
                  <MDButton
                    variant="gradient"
                    color="info"
                    size="small"
                    onClick={() => showRegionModal(user)}
                    style={{
                      fontSize: isMobile ? '10px' : '11px',
                      padding: isMobile ? '1px 3px' : '4px 8px',
                      minWidth: isMobile ? '30px' : '50px',
                    }}
                  >
                    Settings
                  </MDButton>
                );
              }

              // Add actions column for mobile/tablet
              if (isMobile || isTablet) {
                baseRow.actions = (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <MDButton
                      variant="gradient"
                      color={user.admin === true ? 'warning' : 'info'}
                      size="small"
                      onClick={async () => {
                        try {
                          await AuthService.toggleUserPermission(user._id);
                          fetchUsers();
                          notification.success({
                            message:  `permission changed to ${user.admin === true ? 'user' : 'admin'}.`,
                            description: "permission changed successfully",
                            placement: "topRight",
                          });
                        } catch (error) {
                          console.error('Error toggling user permission:', error);
                          notification.error({
                            message: "Failed to change permission",
                            description: error.message || 'An error occurred',
                            placement: "topRight",
                          });
                        }
                      }}
                      style={{
                        fontSize: isMobile ? '10px' : '11px',
                        padding: isMobile ? '1px 3px' : '4px 8px',
                        minWidth: isMobile ? '30px' : '50px',
                      }}
                    >
                      {user.admin === true ? 'Set as User' : 'Set as Admin'}
                    </MDButton>
                    <MDButton
                      variant="gradient"
                      color="error"
                      size="small"
                      onClick={async () => {
                        try {
                          await AuthService.deleteUser(user._id);
                          fetchUsers();
                          notification.success({
                            message: `User ${user.email} deleted.`,
                            description: "permission deleted successfully",
                            placement: "topRight",
                          });
                        } catch (error) {
                          console.error('Error deleting user:', error);
                          notification.error({
                            message: "Failed to delete user",
                            description: error.message || 'An error occurred',
                            placement: "topRight",
                          });
                        }
                      }}
                      style={{
                        fontSize: isMobile ? '10px' : '11px',
                        padding: isMobile ? '1px 3px' : '4px 8px',
                        minWidth: isMobile ? '30px' : '50px',
                      }}
                    >
                      Delete
                    </MDButton>
                  </div>
                );
              } else {
                // Desktop: separate columns for toggle and delete
                baseRow.toggle = (
                  <MDButton
                    variant="gradient"
                    color={user.admin === true ? 'warning' : 'info'}
                    size="small"
                    onClick={async () => {
                      try {
                        await AuthService.toggleUserPermission(user._id);
                        fetchUsers();
                        notification.success({
                          message:  `permission changed to ${user.admin === true ? 'user' : 'admin'}.`,
                          description: "permission changed successfully",
                          placement: "topRight",
                        });
                      } catch (error) {
                        console.error('Error toggling user permission:', error);
                        notification.error({
                          message: "Failed to change permission",
                          description: error.message || 'An error occurred',
                          placement: "topRight",
                        });
                      }
                    }}
                  >
                    {user.admin === true ? 'Set as User' : 'Set as Admin'}
                  </MDButton>
                );
                baseRow.delete = (
                  <MDButton
                    variant="gradient"
                    color="error"
                    size="small"
                    onClick={async () => {
                      try {
                        await AuthService.deleteUser(user._id);
                        fetchUsers();
                        notification.success({
                          message: `User ${user.email} deleted.`,
                          description: "permission deleted successfully",
                          placement: "topRight",
                        });
                      } catch (error) {
                        console.error('Error deleting user:', error);
                        notification.error({
                          message: "Failed to delete user",
                          description: error.message || 'An error occurred',
                          placement: "topRight",
                        });
                      }
                    }}
                  >
                    Delete
                  </MDButton>
                );
              }

              return baseRow;
            } catch (error) {
              console.error(`Error processing user ${index}:`, error);
              return null;
            }
          }).filter(row => row !== null); // Remove any null rows
          
          // Ensure we have valid table data before setting it
          if (Array.isArray(columns) && Array.isArray(rows)) {
            setTableData({ columns, rows });
          } else {
            console.error('Invalid table data structure:', { columns, rows });
            setTableData({ columns: [], rows: [] });
          }
        } catch (error) {
          console.error('Error processing users data:', error);
          setTableData({ columns: [], rows: [] });
        }
        // Calculate admin and user counts
        try {
          const admins = users.filter((u) => u && u.admin === true).length;
          const normalUsers = users.filter((u) => u && u.admin === false).length;
          setAdminCount(admins);
          setUserCount(normalUsers);
        } catch (error) {
          console.error('Error calculating user counts:', error);
          setAdminCount(0);
          setUserCount(0);
        }
      } else {
        setTableData({ columns: [], rows: [] });
        setAdminCount(0);
        setUserCount(0);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setTableData({ columns: [], rows: [] });
      setAdminCount(0);
      setUserCount(0);
    }
    setLoading(false);
  };

  // Fetch regions data if not already loaded
  const fetchRegions = async () => {
    try {
      const response = await CityService.getAllCities();
      const citiesData = response.data || response;
      // Dispatch to Redux store
      dispatch(setRegions(citiesData));
      console.log("Fetched cities:", citiesData);
    } catch (error) {
      console.error('Failed to fetch cities:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    // Fetch regions if not already loaded
    if (!regions || regions.length === 0) {
      fetchRegions();
    }
    // eslint-disable-next-line
  }, [regions]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      {alert.open && (
        <MDAlert color={alert.color} dismissible>
          {alert.message}
        </MDAlert>
      )}
      <Grid container spacing={isMobile ? 2 : 3} pt={isMobile ? 2 : 3}>
        <Grid item xs={12} md={6} lg={3}>
          <MDBox mb={isMobile ? 1 : 1.5}>
            <ComplexStatisticsCard
              icon="leaderboard"
              title="admin counts"
              count={adminCount}
              percentage={{
                color: "success",
                amount: "+3%",
                label: "than last month",
              }}
            />
          </MDBox>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <MDBox mb={isMobile ? 1 : 1.5}>
            <ComplexStatisticsCard
              color="success"
              icon="store"
              title="user counts"
              count={userCount}
              percentage={{
                color: "success",
                amount: "+1%",
                label: "than last month",
              }}
            />
          </MDBox>
        </Grid>
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
              >
                <MDTypography variant="h6" color="white" style={{ fontSize: isMobile ? '14px' : '16px' }}>
                  User Table
                </MDTypography>
              </MDBox>
              <MDBox pt={isMobile ? 2 : 3}>
                <div style={{
                  overflowX: 'auto',
                  maxWidth: '100%',
                  WebkitOverflowScrolling: 'touch',
                }}>
                  <ErrorBoundary>
                    {tableData && Array.isArray(tableData.columns) && Array.isArray(tableData.rows) ? (
                      <DataTable
                        key={`user-table-${isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'}`}
                        table={tableData}
                        entriesPerPage={{ 
                          defaultValue: isMobile ? 5 : isTablet ? 8 : 10, 
                          entries: isMobile ? [5, 10] : isTablet ? [8, 15] : [10, 20] 
                        }}
                        canSearch={true}
                        showTotalEntries={true}
                        isLoading={loading}
                        sx={{
                          minWidth: isMobile ? '100%' : 'auto',
                          fontSize: isMobile ? '12px' : '14px',
                          '& .MuiTableCell-root': {
                            padding: isMobile ? '2px 1px' : isTablet ? '10px 6px' : '12px 8px',
                            borderSpacing: isMobile ? '1px' : '4px',
                            fontSize: isMobile ? '12px' : '14px',
                            color: darkMode ? '#ffffff' : '#000000',
                            fontWeight: '500',
                          },
                          '& .MuiTableHead-root .MuiTableCell-root': {
                            padding: isMobile ? '4px 1px' : isTablet ? '12px 6px' : '14px 8px',
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
                    ) : (
                      <div style={{ 
                        padding: '20px', 
                        textAlign: 'center', 
                        color: '#666',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px'
                      }}>
                        <p>No data available to display.</p>
                      </div>
                    )}
                  </ErrorBoundary>
                </div>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
      
      {/* Region Assignment Modal */}
      {isModalVisible && selectedUser && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            backdropFilter: "blur(4px)",
            padding: isMobile ? "5px" : "10px",
            boxSizing: "border-box",
          }}
          onClick={() => handleModalCancel()}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 0,
              width: isMobile ? "98vw" : isTablet ? "95vw" : "600px",
              maxWidth: "600px",
              minWidth: "280px",
              maxHeight: isMobile ? "98vh" : isTablet ? "95vh" : "90vh",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              margin: isMobile ? "5px" : isTablet ? "10px" : "20px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
                color: "white",
                padding: "20px 24px",
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <MDTypography variant="h6" style={{ fontWeight: 600, color: "white" }}>
                Region Assignment Settings - {selectedUser.email}
              </MDTypography>
              <MDButton
                variant="text"
                style={{ color: "white", minWidth: "auto", padding: "4px" }}
                onClick={() => handleModalCancel()}
              >
                ✕
              </MDButton>
            </div>

            {/* Modal Content */}
            <div
              style={{
                padding: isMobile ? "12px" : isTablet ? "16px" : "24px",
                overflowY: "auto",
                maxHeight: isMobile ? "calc(98vh - 80px)" : isTablet ? "calc(95vh - 100px)" : "calc(90vh - 120px)",
              }}
            >
              <div style={{ marginBottom: 16 }}>
                <MDTypography variant="body2" color="text" mb={2}>
                  Select regions to assign to this user:
                </MDTypography>
              </div>
              
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(auto-fit, minmax(200px, 1fr))" : "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: isMobile ? "12px" : "16px",
                }}
              >
                {regions && regions.length > 0 ? (
                  regions.map((region) => (
                    <div
                      key={region._id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        padding: "12px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                        border: "1px solid #e9ecef",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onClick={() => handleRegionChange(region._id, !selectedRegions.includes(region._id))}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Checkbox
                          checked={selectedRegions.includes(region._id)}
                          onChange={(e) => handleRegionChange(region._id, e.target.checked)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <MDTypography
                          variant="body2"
                          style={{
                            color: "#212529",
                            fontWeight: 500,
                            wordBreak: "break-word",
                          }}
                        >
                          {region.name}
                        </MDTypography>
                      </div>
                    </div>
                  ))
                ) : (
                  <MDTypography variant="body2" color="text">
                    No regions available. Please load regions data first.
                  </MDTypography>
                )}
              </div>
              
              {selectedRegions.length > 0 && (
                <div
                  style={{
                    marginTop: 16,
                    padding: "12px",
                    backgroundColor: "#e3f2fd",
                    borderRadius: "8px",
                    border: "1px solid #bbdefb",
                  }}
                >
                  <MDTypography variant="body2" color="text" fontWeight="bold">
                    Selected Regions: {selectedRegions.length}
                  </MDTypography>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid #e9ecef",
                backgroundColor: "#f8f9fa",
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
              }}
            >
              <MDButton
                variant="outlined"
                color="info"
                onClick={() => handleModalCancel()}
                style={{
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Cancel
              </MDButton>
              <MDButton
                variant="gradient"
                color="info"
                onClick={() => handleModalOk()}
                style={{
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Save Changes
              </MDButton>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default Tables;