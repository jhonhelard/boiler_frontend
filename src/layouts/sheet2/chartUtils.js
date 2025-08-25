export const processPieChartData = (dataArray, selectedCity) => {
  if (!dataArray || !Array.isArray(dataArray) || dataArray.length < 2 || !selectedCity) {
    return { labels: [], datasets: {} };
  }

  const headers = dataArray[0] || [];
  const selectedCityRow = dataArray.slice(1).find(row => row && row[0] === selectedCity);
  
  if (!selectedCityRow) {
    return { labels: [], datasets: {} };
  }

  const labels = headers.slice(1).filter(label => label && label.trim() !== '');
  const data = selectedCityRow.slice(1).map(value => parseInt(value) || 0);

  const filteredLabels = [];
  const filteredData = [];

  labels.forEach((label, index) => {
    if (data[index] > 0 && !label.toLowerCase().includes('total')) {
      filteredLabels.push(label);
      filteredData.push(data[index]);
    }
  });

  if (filteredLabels.length === 0) {
    return { labels: [], datasets: {} };
  }

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

export const processBarChartData = (dataArray, selectedCity) => {
  if (!dataArray || !Array.isArray(dataArray) || dataArray.length < 2 || !selectedCity) {
    return { labels: [], datasets: [] };
  }

  const headers = dataArray[0] || [];
  const selectedCityRow = dataArray.slice(1).find(row => row && row[0] === selectedCity);
  
  if (!selectedCityRow) {
    return { labels: [], datasets: [] };
  }

  const labels = headers.slice(1).filter(label => label && label.trim() !== '');
  const data = selectedCityRow.slice(1).map(value => parseInt(value) || 0);

  const filteredLabels = [];
  const filteredData = [];

  labels.forEach((label, index) => {
    if (data[index] > 0 && !label.toLowerCase().includes('total')) {
      filteredLabels.push(label);
      filteredData.push(data[index]);
    }
  });

  if (filteredLabels.length === 0) {
    return { labels: [], datasets: [] };
  }

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

export const convertPieToBarChartData = (pieChartData) => {
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

export const convertBarToPieChartData = (barChartData) => {
  if (!barChartData || !barChartData.labels || !barChartData.datasets || !Array.isArray(barChartData.datasets)) {
    return { labels: [], datasets: {} };
  }
  
  const firstDataset = barChartData.datasets[0];
  if (!firstDataset || !firstDataset.data) {
    return { labels: [], datasets: {} };
  }
  
  const labels = barChartData.labels || [];
  const data = firstDataset.data || [];
  
  const colorPalette = [
    "info", "success", "error", "warning", "primary", "secondary",
    "light", "dark"
  ];
  
  const backgroundColors = data.map((_, index) => colorPalette[index % colorPalette.length]);

  return {
    labels: labels,
    datasets: {
      label: firstDataset.label || 'Data',
      data: data,
      backgroundColors: backgroundColors
    }
  };
}; 