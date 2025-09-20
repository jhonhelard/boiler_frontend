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
import Divider from "@mui/material/Divider";
import Icon from "@mui/material/Icon";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// ReportsBarChart configurations
import configs from "examples/Charts/BarCharts/ReportsBarChart/configs";

function ReportsBarChart({ color, title, description, date, chart, height, customOptions, useHtmlLegend }) {
  const { data, options } = configs(chart.labels || [], chart.datasets || {});
  const legendContainerRef = useRef(null);
  const shouldUseHtmlLegend = false; // legend removed as requested
  const finalOptions = customOptions ? { ...options, ...customOptions } : options;
  const optionsWithHiddenCanvasLegend = {
    ...finalOptions,
    plugins: {
      ...(finalOptions.plugins || {}),
      // Force-hide the canvas legend entirely; HTML legend will replace it
      legend: { display: false },
    },
  };

  const htmlLegendPlugin = {
    id: "htmlLegend",
    afterUpdate(chart) {
      const container = legendContainerRef.current;
      if (!container) return;
      while (container.firstChild) {
        container.firstChild.remove();
      }
      let items = [];
      try {
        const gen = chart.options && chart.options.plugins && chart.options.plugins.legend && chart.options.plugins.legend.labels && chart.options.plugins.legend.labels.generateLabels;
        if (typeof gen === 'function') {
          items = gen(chart);
        } else if (chart.data && Array.isArray(chart.data.datasets)) {
          items = chart.data.datasets.map((ds, idx) => ({
            text: ds.label || `Series ${idx+1}`,
            fillStyle: ds.backgroundColor || ds.borderColor,
            datasetIndex: idx,
          }));
        }
      } catch (e) {
        items = (chart.data && Array.isArray(chart.data.datasets)) ? chart.data.datasets.map((ds, idx) => ({
          text: ds.label || `Series ${idx+1}`,
          fillStyle: ds.backgroundColor || ds.borderColor,
          datasetIndex: idx,
        })) : [];
      }
      const list = document.createElement("ul");
      list.style.margin = 0;
      list.style.padding = 0;
      list.style.listStyle = "none";
      items.forEach((item) => {
        const li = document.createElement("li");
        li.style.display = "flex";
        li.style.alignItems = "flex-start";
        li.style.marginBottom = "6px";
        li.style.cursor = "pointer";
        const box = document.createElement("span");
        box.style.display = "inline-block";
        box.style.width = "10px";
        box.style.height = "10px";
        box.style.borderRadius = "2px";
        box.style.marginRight = "8px";
        box.style.background = item.fillStyle || item.strokeStyle || "#999";
        const text = document.createElement("span");
        text.style.fontSize = "12px";
        text.style.lineHeight = "1.2";
        text.style.whiteSpace = "normal";
        text.style.wordBreak = "break-word";
        text.style.overflowWrap = "anywhere";
        text.style.flex = "1 1 auto";
        text.style.maxWidth = "100%";
        text.textContent = item.text;
        li.onclick = () => {
          chart.setDatasetVisibility(item.datasetIndex, !chart.isDatasetVisible(item.datasetIndex));
          chart.update();
        };
        li.appendChild(box);
        li.appendChild(text);
        list.appendChild(li);
      });
      container.appendChild(list);
    },
  };

  return (
    <Card sx={{ height: "100%" }}>
      <MDBox padding="1rem">
        {useMemo(
          () => (
            <MDBox
              variant="gradient"
              bgColor={color}
              borderRadius="lg"
              coloredShadow={color}
              py={2}
              pr={0.5}
              mt={-5}
              height={{ xs: "auto", md: height || "12.5rem" }}
            >
              {shouldUseHtmlLegend ? (
                <MDBox sx={{ width: "100%", height: "100%" }}>
                  <MDBox sx={{ overflowX: "auto", width: "100%", height: "100%" }}>
                    <MDBox
                      sx={{
                        minWidth: `${Math.max(600, (data.labels && data.labels.length ? data.labels.length : 0) * 80)}px`,
                        height: { xs: 260, md: "100%" },
                      }}
                    >
                      <Chart type="bar" data={data} options={optionsWithHiddenCanvasLegend} />
                    </MDBox>
                  </MDBox>
                </MDBox>
              ) : (
                <MDBox sx={{ overflowX: "auto", width: "100%", height: "100%" }}>
                  <MDBox
                    sx={{
                      minWidth: `${Math.max(600, (data.labels && data.labels.length ? data.labels.length : 0) * 80)}px`,
                      height: { xs: 260, md: "100%" },
                    }}
                  >
                    <Chart type="bar" data={data} options={optionsWithHiddenCanvasLegend} />
                  </MDBox>
                </MDBox>
              )}
            </MDBox>
          ),
          [chart, color, shouldUseHtmlLegend]
        )}  
        <MDBox pt={3} pb={1} px={1}>
          <MDTypography variant="h6" textTransform="capitalize">
            {title}
          </MDTypography>
          <MDTypography component="div" variant="button" color="text" fontWeight="light">
            {description}
          </MDTypography>
          <Divider />
          <MDBox display="flex" alignItems="center">
            <MDTypography variant="button" color="text" lineHeight={1} sx={{ mt: 0.15, mr: 0.5 }}>
              <Icon>schedule</Icon>
            </MDTypography>
            <MDTypography variant="button" color="text" fontWeight="light">
              {date}
            </MDTypography>
          </MDBox>
        </MDBox>
      </MDBox>
    </Card>
  );
}

// Setting default values for the props of ReportsBarChart
ReportsBarChart.defaultProps = {
  color: "dark",
  description: "",
  height: "12.5rem",
  customOptions: undefined,
  useHtmlLegend: false,
};

// Typechecking props for the ReportsBarChart
ReportsBarChart.propTypes = {
  color: PropTypes.oneOf(["primary", "secondary", "info", "success", "warning", "error", "dark"]),
  title: PropTypes.string.isRequired,
  description: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  date: PropTypes.string.isRequired,
  chart: PropTypes.objectOf(PropTypes.oneOfType([PropTypes.array, PropTypes.object])).isRequired,
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  customOptions: PropTypes.object,
  useHtmlLegend: PropTypes.bool,
};

export default ReportsBarChart;
