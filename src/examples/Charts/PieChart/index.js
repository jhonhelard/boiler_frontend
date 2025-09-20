/**
=========================================================
* Material Dashboard 2 React - v2.1.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2022 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useMemo, useRef } from "react";

// porp-types is a library for typechecking of props
import PropTypes from "prop-types";

// react-chartjs-2 components
import "chart.js/auto";
import { Chart } from "react-chartjs-2";

// @mui material components
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// PieChart configurations
import configs from "examples/Charts/PieChart/configs";

function PieChart({ icon, title, description, height, chart, customOptions }) {
  const { data, options } = configs(chart.labels || [], chart.datasets || {});
  
  // Merge custom options if provided
  const finalOptions = customOptions ? { ...options, ...customOptions } : options;
  const legendContainerRef = useRef(null);
  const optionsWithHiddenCanvasLegend = {
    ...finalOptions,
    plugins: {
      ...(finalOptions.plugins || {}),
      legend: { display: false },
    },
  };
  const htmlLegendPlugin = {
    id: "htmlLegend",
    afterUpdate(chart) {
      const container = legendContainerRef.current;
      if (!container) return;
      while (container.firstChild) container.firstChild.remove();
      const labels = chart.data && Array.isArray(chart.data.labels) ? chart.data.labels : [];
      const colors = (chart.data && chart.data.datasets && chart.data.datasets[0] && chart.data.datasets[0].backgroundColor) || [];
      const list = document.createElement("ul");
      list.style.margin = 0;
      list.style.padding = 0;
      list.style.listStyle = "none";
      labels.forEach((textValue, idx) => {
        const li = document.createElement("li");
        li.style.display = "flex";
        li.style.alignItems = "center";
        li.style.marginBottom = "6px";
        const box = document.createElement("span");
        box.style.display = "inline-block";
        box.style.width = "10px";
        box.style.height = "10px";
        box.style.borderRadius = "2px";
        box.style.marginRight = "8px";
        box.style.background = Array.isArray(colors) ? (colors[idx] || colors[0] || "#999") : (colors || "#999");
        const text = document.createElement("span");
        text.style.fontSize = "12px";
        text.style.lineHeight = "1.2";
        text.style.whiteSpace = "normal";
        text.style.wordBreak = "break-word";
        text.style.overflowWrap = "anywhere";
        text.textContent = String(textValue);
        li.appendChild(box);
        li.appendChild(text);
        list.appendChild(li);
      });
      container.appendChild(list);
    },
  };

  const renderChart = (
    <MDBox py={2} pr={2} pl={icon.component ? 1 : 2}>
      {title || description ? (
        <MDBox display="flex" px={description ? 1 : 0} pt={description ? 1 : 0}>
          {icon.component && (
            <MDBox
              width="4rem"
              height="4rem"
              bgColor={icon.color || "info"}
              variant="gradient"
              coloredShadow={icon.color || "info"}
              borderRadius="xl"
              display="flex"
              justifyContent="center"
              alignItems="center"
              color="white"
              mt={-5}
              mr={2}
            >
              <Icon fontSize="medium">{icon.component}</Icon>
            </MDBox>
          )}
          <MDBox mt={icon.component ? -2 : 0}>
            {title && <MDTypography variant="h6">{title}</MDTypography>}
            <MDBox mb={2}>
              <MDTypography component="div" variant="button" color="text">
                {description}
              </MDTypography>
            </MDBox>
          </MDBox>
        </MDBox>
      ) : null}
      {useMemo(
        () => (
          <MDBox height={height}>
            <MDBox sx={{ width: "100%", height: "100%", display: "flex", flexDirection: { xs: "column", lg: "row" } }}>
              <MDBox sx={{ flex: 1, minWidth: 0 }}>
                <Chart type="pie" data={data} options={optionsWithHiddenCanvasLegend} plugins={[htmlLegendPlugin]} />
              </MDBox>
              <MDBox
                ref={legendContainerRef}
                sx={{
                  width: { xs: "100%", lg: "min(320px, 30%)" },
                  maxHeight: { xs: "auto", lg: "100%" },
                  overflowY: { xs: "visible", lg: "auto" },
                  overflowX: "hidden",
                  mt: { xs: 2, lg: 0 },
                  ml: { xs: 0, lg: 2 },
                }}
              />
            </MDBox>
          </MDBox>
        ),
        [chart, height]
      )}
    </MDBox>
  );

  return title || description ? <Card>{renderChart}</Card> : renderChart;
}

// Setting default values for the props of PieChart
PieChart.defaultProps = {
  icon: { color: "info", component: "" },
  title: "",
  description: "",
  height: "19.125rem",
};

// Typechecking props for the PieChart
PieChart.propTypes = {
  icon: PropTypes.shape({
    color: PropTypes.oneOf([
      "primary",
      "secondary",
      "info",
      "success",
      "warning",
      "error",
      "light",
      "dark",
    ]),
    component: PropTypes.node,
  }),
  title: PropTypes.string,
  description: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  chart: PropTypes.objectOf(PropTypes.oneOfType([PropTypes.array, PropTypes.object])).isRequired,
  customOptions: PropTypes.object,
};

export default PieChart;
