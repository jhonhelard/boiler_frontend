import HttpService from "./htttp.service";

class AuthService {
  // authEndpoint = process.env.API_URL;

  login = async (payload) => {
    const loginEndpoint = '/api/v1/auth/login';
    return await HttpService.post(loginEndpoint, payload);
  };

  register = async (credentials) => {
    const registerEndpoint = '/api/v1/auth/register';
    
    return await HttpService.post(registerEndpoint, credentials);
  };

  logout = async () => {
    const logoutEndpoint = '/api/v1/auth/logout';
    return await HttpService.post(logoutEndpoint);
  };

  getallusers = async () => {
    const getallusers = '/api/v1/auth/getallusers';
    return await HttpService.get(getallusers);
  }

  toggleUserPermission = async (userId) => {
    const endpoint = `/api/v1/auth/toggle-permission/${userId}`;
    return await HttpService.patch(endpoint);
  };

  deleteUser = async (userId) => {
    const endpoint = `/api/v1/auth/delete-user/${userId}`;
    return await HttpService.delete(endpoint);
  };

  updateUserRegions = async (userId, regions) => {
    const endpoint = `/api/v1/auth/update-user-regions/${userId}`;
    return await HttpService.patch(endpoint, { regions });
  };
}

export default new AuthService();
