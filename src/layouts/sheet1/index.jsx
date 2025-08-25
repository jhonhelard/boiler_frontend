import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState, useContext } from "react";
import { setSheet } from "../../redux/sheet";
import { notification } from "antd";
import { useMaterialUIController } from "context";
import SheetService from "../../services/sheet-service";

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
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";



function Tables() {
  const dispatch = useDispatch();
  const { isMobile, isTablet } = useResponsive();
  const [controller] = useMaterialUIController();
  const { darkMode } = controller;

  const sheetData = useSelector((state) => state.sheet.data);
  
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [search, setSearch] = useState("");

  // Dynamic modal styles based on screen size
  const getModalStyles = () => {
    const baseStyles = {
      modalOverlay: {
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
      },
      modalContainer: {
        background: "#fff",
        borderRadius: 12,
        padding: 0,
        width: isMobile ? "98vw" : isTablet ? "95vw" : "90vw",
        maxWidth: isMobile ? "none" : "1200px",
        minWidth: "280px",
        maxHeight: isMobile ? "98vh" : isTablet ? "95vh" : "90vh",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        margin: isMobile ? "5px" : isTablet ? "10px" : "20px",
      },
      modalContent: {
        padding: isMobile ? "12px" : isTablet ? "16px" : "24px",
        overflowY: "auto",
        maxHeight: isMobile ? "calc(98vh - 80px)" : isTablet ? "calc(95vh - 100px)" : "calc(90vh - 120px)",
      },
      gridContainer: {
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(auto-fit, minmax(250px, 1fr))" : "repeat(auto-fit, minmax(280px, 1fr))",
        gap: isMobile ? "12px" : "16px",
      },
    };
    return baseStyles;
  };

  const fetchSheet = async () => {
    setLoading(true);
    try {
      const data = await SheetService.getSheetData();      
      dispatch(setSheet(data[0]));
    } catch (err) {
      console.error("Error fetching sheet data:", err);
      dispatch(setSheet([]));
      notification.error({
        message: "Error",
        description: "Failed to fetch sheet data. Please try again later.",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSheet();
  }, [dispatch]);

  // Get all column keys and titles from the first row
  const allKeys = sheetData && sheetData.length > 0 ? Object.keys(sheetData[0]) : [];
  const allTitles = sheetData && sheetData.length > 0 ? sheetData[0] : {};
  
  // Calculate how many fields to show in each section
  const totalFields = allKeys.length;
  const fieldsPerSection = Math.ceil(totalFields / 3);

  // Responsive column configuration based on screen size
  const getVisibleKeys = () => {
    if (isMobile) {
      // Mobile: Show only 2 most important columns + Details
      return allKeys.slice(0, 2);
    } else if (isTablet) {
      // Tablet: Show 3 columns + Details
      return allKeys.slice(0, 3);
    } else {
      // Desktop: Show all columns + Details
      return allKeys.slice(0, 4);
    }
  };

  const visibleKeys = getVisibleKeys();
  
  // Table columns: responsive data columns + 1 details button
  const columns = [
    ...visibleKeys.map((key) => ({
      Header: allTitles[key],
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
    })),
    {
      Header: "Details",
      accessor: "details",
      minWidth: isMobile ? 60 : 70,
      maxWidth: isMobile ? 80 : 90,
      Cell: ({ row }) => (
        <MDButton
          variant="gradient"
          color="info"
          size={isMobile ? "small" : "medium"}
          onClick={() => {
            setSelectedRow(row.original._completeRowData);
            setModalOpen(true);
          }}
          style={{
            fontSize: isMobile ? '9px' : '11px',
            padding: isMobile ? '3px 6px' : '4px 8px',
            minWidth: isMobile ? '40px' : '50px',
          }}
        >
          {isMobile ? "DE" : "Details"}
        </MDButton>
      ),
    },
  ];

  // Table rows: add a details button for each row
  let rows =
    sheetData && sheetData.length > 1
      ? sheetData.slice(1).map((row, idx) => {
          const rowData = {};
          visibleKeys.forEach((key) => {
            rowData[key] = row[key];
          });
          // Store the complete row data for modal display
          rowData._completeRowData = row;
          // Details button is now handled in the column definition
          rowData.details = null; // This will be rendered by the Cell component
          return rowData;
        })
      : [];

  // Filter rows by search only in the first column
  if (search && visibleKeys.length > 0) {
    const firstColumnKey = visibleKeys[0];
    rows = rows.filter((row) =>
      (row[firstColumnKey] || "").toString().toLowerCase().includes(search.toLowerCase())
    );
  }
  
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Card>
              <MDBox
                mx={2}
                mt={-3}
                py={3}
                px={2}
                variant="gradient"
                bgColor="info"
                borderRadius="lg"
                coloredShadow="info"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                }}
              >
                <MDTypography variant="h6" color="white">
                  Sheet1 Table
                </MDTypography>
                
                <MDBox sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 2,
                  flexDirection: isMobile ? "column" : "row"
                }}>
                  <MDInput
                    placeholder={isMobile ? "Search..." : `Search by ${allTitles[visibleKeys[0]] || "first column"}`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    fullWidth
                    style={{
                      fontSize: isMobile ? '12px' : '14px',
                      minWidth: isMobile ? 120 : 200,
                    }}
                  />
                </MDBox>
              </MDBox>
              <MDBox pt={3}>
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
                        fontWeight: 600,
                        color: darkMode ? '#ffffff' : '#000000',
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
          </Grid>
        </Grid>
      </MDBox>
      {/* Modal for details */}
      {modalOpen && selectedRow && (
        <div
          style={getModalStyles().modalOverlay}
          onClick={() => setModalOpen(false)}
        >
          <div
            style={getModalStyles().modalContainer}
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
                Firm Details
              </MDTypography>
              <MDButton
                variant="text"
                style={{ color: "white", minWidth: "auto", padding: "4px" }}
                onClick={() => setModalOpen(false)}
              >
                ✕
              </MDButton>
            </div>

            {/* Modal Content */}
            <div style={getModalStyles().modalContent}>
              <div style={getModalStyles().gridContainer}>
                {/* Basic Information Section */}
                <div>
                  <MDTypography
                    variant="h6"
                    style={{
                      color: "#1976d2",
                      fontWeight: 600,
                      marginBottom: "16px",
                      borderBottom: "2px solid #e3f2fd",
                      paddingBottom: "8px",
                    }}
                  >
                    Basic Information
                  </MDTypography>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {allKeys.slice(0, fieldsPerSection).map((key) => (
                      <div
                        key={key}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          padding: "12px",
                          backgroundColor: "#f8f9fa",
                          borderRadius: "8px",
                          border: "1px solid #e9ecef",
                        }}
                      >
                        <MDTypography
                          variant="caption"
                          style={{
                            color: "#6c757d",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            marginBottom: "4px",
                          }}
                        >
                          {allTitles[key]}
                        </MDTypography>
                        <MDTypography
                          variant="body2"
                          style={{
                            color: "#212529",
                            fontWeight: 500,
                            wordBreak: "break-word",
                          }}
                        >
                          {selectedRow[key] ? selectedRow[key] : "N/A"}
                        </MDTypography>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Technical Details Section */}
                <div>
                  <MDTypography
                    variant="h6"
                    style={{
                      color: "#1976d2",
                      fontWeight: 600,
                      marginBottom: "16px",
                      borderBottom: "2px solid #e3f2fd",
                      paddingBottom: "8px",
                    }}
                  >
                    Technical Details
                  </MDTypography>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {allKeys.slice(fieldsPerSection, fieldsPerSection * 2).map((key) => (
                      <div
                        key={key}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          padding: "12px",
                          backgroundColor: "#f8f9fa",
                          borderRadius: "8px",
                          border: "1px solid #e9ecef",
                        }}
                      >
                        <MDTypography
                          variant="caption"
                          style={{
                            color: "#6c757d",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            marginBottom: "4px",
                          }}
                        >
                          {allTitles[key]}
                        </MDTypography>
                        <MDTypography
                          variant="body2"
                          style={{
                            color: "#212529",
                            fontWeight: 500,
                            wordBreak: "break-word",
                          }}
                        >
                          {selectedRow[key] ? selectedRow[key] : "N/A"}
                        </MDTypography>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Certificate & Contact Section */}
                <div>
                  <MDTypography
                    variant="h6"
                    style={{
                      color: "#1976d2",
                      fontWeight: 600,
                      marginBottom: "16px",
                      borderBottom: "2px solid #e3f2fd",
                      paddingBottom: "8px",
                    }}
                  >
                    Certificate & Contact
                  </MDTypography>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {allKeys.slice(fieldsPerSection * 2).map((key) => (
                      <div
                        key={key}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          padding: "12px",
                          backgroundColor: "#f8f9fa",
                          borderRadius: "8px",
                          border: "1px solid #e9ecef",
                        }}
                      >
                        <MDTypography
                          variant="caption"
                          style={{
                            color: "#6c757d",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            marginBottom: "4px",
                          }}
                        >
                          {allTitles[key]}
                        </MDTypography>
                        <MDTypography
                          variant="body2"
                          style={{
                            color: "#212529",
                            fontWeight: 500,
                            wordBreak: "break-word",
                          }}
                        >
                          {selectedRow[key] ? selectedRow[key] : "N/A"}
                        </MDTypography>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
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
                onClick={() => setModalOpen(false)}
                style={{
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Close
              </MDButton>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </DashboardLayout>
  );
}

export default Tables;
