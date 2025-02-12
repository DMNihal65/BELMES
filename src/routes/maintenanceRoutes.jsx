import { Route } from 'react-router-dom';
import MaintenanceDashboard from '../pages/supervisorscreens/Monitoring/MaintenanceDashboard';

export const maintenanceRoutes = [
  {
    path: "/supervisor/maintenance",
    element: <MaintenanceDashboard />
  }
]; 