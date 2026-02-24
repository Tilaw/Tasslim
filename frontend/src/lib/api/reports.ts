import api from './axios';

export const getDashboardStats = async () => {
    const response = await api.get('/reports/dashboard-stats');
    return response.data;
};
