import React, { useState, useEffect, useMemo } from "react";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";
import CityService from "../../services/city-service";
import { notification } from "antd";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";
import { useMaterialUIController } from "context";

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


function CityTables() {
  const [controller] = useMaterialUIController();
  const { darkMode } = controller;
  const { isMobile, isTablet } = useResponsive();
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // 'add' or 'edit'
  const [cityName, setCityName] = useState("");
  const [editId, setEditId] = useState(null);

  const fetchCities = async () => {
    setLoading(true);
    try {
      const response = await CityService.getAllCities();
      setCities(response.data || response);
    } catch (error) {
      setCities([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCities();
  }, []);

  const openAddModal = () => {
    setModalMode("add");
    setCityName("");
    setEditId(null);
    setModalOpen(true);
  };

  const openEditModal = (city) => {
    setModalMode("edit");
    setCityName(city.name);
    setEditId(city._id);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!cityName.trim()) return;
    if (modalMode === "add") {
      await CityService.addCity(cityName.trim());
      notification.success({
        message: `City added`,
        description: `City '${cityName.trim()}' added successfully`,
        placement: "topRight",
      });
    } else if (modalMode === "edit" && editId) {
      await CityService.updateCity(editId, cityName.trim());
      notification.success({
        message: `City updated`,
        description: `City name changed to '${cityName.trim()}'`,
        placement: "topRight",
      });
    }
    setModalOpen(false);
    setCityName("");
    setEditId(null);
    fetchCities();
  };

  const handleDelete = async (id) => {
    const city = cities.find((c) => c._id === id);
    await CityService.deleteCity(id);
    notification.success({
      message: `City deleted`,
      description: `City '${city ? city.name : ''}' deleted successfully`,
      placement: "topRight",
    });
    fetchCities();
  };

  const columns = useMemo(() => [
    { 
      Header: "City Name", 
      accessor: "name",
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
    },
    { Header: "Edit", accessor: "edit" },
    { Header: "Delete", accessor: "delete" },
  ], [isMobile, darkMode]);

  const tableData = useMemo(() => {
    if (!cities || cities.length === 0) {
      return { columns, rows: [] };
    }

    const rows = cities.map((city) => ({
      name: city.name || 'N/A',
      edit: (
        <MDButton
          variant="gradient"
          color="info"
          size="small"
          onClick={() => openEditModal(city)}
        >
          Edit
        </MDButton>
      ),
      delete: (
        <MDButton
          variant="gradient"
          color="error"
          size="small"
          onClick={() => handleDelete(city._id)}
        >
          Delete
        </MDButton>
      ),
    }));

    return { columns, rows };
  }, [cities, columns]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <Grid container spacing={3} pt={3}>
        <Grid item xs={12} md={6} lg={3}>
          <MDBox mb={1.5}>
            <ComplexStatisticsCard
              icon="leaderboard"
              title="City counts"
              count={cities.length}
              percentage={{
                color: "success",
                amount: "+3%",
                label: "than last month",
              }}
            />
          </MDBox>
        </Grid>
      </Grid>
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
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <MDTypography variant="h6" color="white">
                  City Name Table
                </MDTypography>
                <MDButton variant="gradient" color="success" size="small" onClick={openAddModal}>
                  Add
                </MDButton>
              </MDBox>
              <MDBox pt={3}>
                <DataTable
                  table={tableData}
                  entriesPerPage={{ 
                    defaultValue: isMobile ? 5 : isTablet ? 8 : 10, 
                    entries: isMobile ? [5, 10] : isTablet ? [8, 15] : [10, 20] 
                  }}
                  canSearch={true}
                  showTotalEntries={true}
                  isLoading={loading}
                  sx={{
                    fontSize: isMobile ? '12px' : '14px',
                    '& .MuiTableCell-root': {
                      fontSize: isMobile ? '12px' : '14px',
                      color: darkMode ? '#ffffff' : '#000000',
                      fontWeight: '500',
                    },
                    '& .MuiTableHead-root .MuiTableCell-root': {
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
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 8,
              padding: 32,
              minWidth: 320,
              boxShadow: "0 2px 16px rgba(0,0,0,0.2)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <MDTypography variant="h6" mb={2}>
              {modalMode === "add" ? "Add City" : "Edit City"}
            </MDTypography>
            <MDInput
              label="City Name"
              value={cityName}
              onChange={(e) => setCityName(e.target.value)}
              fullWidth
              style={{ marginBottom: 24 }}
            />
            <div style={{ display: "flex", gap: 12 }}>
              <MDButton variant="gradient" color="info" onClick={handleSave}>
                Save
              </MDButton>
              <MDButton variant="outlined" color="dark" onClick={() => setModalOpen(false)}>
                Cancel
              </MDButton>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </DashboardLayout>
  );
}

export default CityTables;
