import HttpService from "./htttp.service";

class SheetService {
  getSheetData = async () => {
    const endpoint = '/api/sheet-data';
    return await HttpService.get(endpoint);
  };

  getSheet1Data = async () => {
    const endpoint = '/api/sheet-data1';
    return await HttpService.get(endpoint);
  };

  // Refresh sheet data from Google Sheets
  refreshSheetData = async () => {
    const endpoint = '/api/refresh-sheet-data';
    return await HttpService.post(endpoint);
  };

  // Get user information by ID
  getUserById = async (userId) => {
    const endpoint = `/api/v1/auth/user/${userId}`;
    return await HttpService.get(endpoint);
  };

  // Add more sheet-related API calls as needed
  // For example, if you need to update sheet data or fetch specific ranges
  updateSheetData = async (data) => {
    const endpoint = '/api/sheet-data';
    return await HttpService.put(endpoint, data);
  };

  getSheetDataByRange = async (range) => {
    const endpoint = `/api/sheet-data?range=${range}`;
    return await HttpService.get(endpoint);
  };
}

export default new SheetService(); 