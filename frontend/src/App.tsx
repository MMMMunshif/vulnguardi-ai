import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MainLayout from './layouts/MainLayout';
import Organizations from './pages/Organizations';
import Departments from './pages/Departments';
import Users from './pages/Users';
import Devices from './pages/Devices';
import SoftwareInventory from './pages/SoftwareInventory';  
import SoftwareUpdateFindings from './pages/SoftwareUpdateFindings';
import VulnerabilityFindings from './pages/VulnerabilityFindings';
import RemediationActions from './pages/RemediationActions';
import RepositoryScanning from './pages/RepositoryScanning';
import AuditLogs from './pages/AuditLogs';


function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    return <Navigate to="/" />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/organizations" element={<Organizations />} />
            

          <Route path="/departments" element={<Departments />} />

          <Route path="/users" element={<Users />} />

          <Route path="/devices" element={<Devices />} />

          <Route path="/software-inventory" element={<SoftwareInventory />} />

          <Route
  path="/software-update-findings"
  element={<SoftwareUpdateFindings />}
/>

<Route
  path="/vulnerability-findings"
  element={<VulnerabilityFindings />}
/>

<Route path="/remediation-actions" element={<RemediationActions />} />
          <Route path="/repository-scanning" element={<RepositoryScanning />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
