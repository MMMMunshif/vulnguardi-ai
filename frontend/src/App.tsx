import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MainLayout from './layouts/MainLayout';
import ComingSoon from './pages/ComingSoon';

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

          <Route
            path="/organizations"
            element={
              <ComingSoon
                title="Organizations"
                description="Manage organization profiles and status."
              />
            }
          />

          <Route
            path="/departments"
            element={
              <ComingSoon
                title="Departments"
                description="Manage departments inside organizations."
              />
            }
          />

          <Route
            path="/users"
            element={
              <ComingSoon
                title="Users"
                description="Manage users, roles, and access permissions."
              />
            }
          />

          <Route
            path="/devices"
            element={
              <ComingSoon
                title="Devices"
                description="Manage device and asset inventory."
              />
            }
          />

          <Route
            path="/software-inventory"
            element={
              <ComingSoon
                title="Software Inventory"
                description="Track installed software records for each device."
              />
            }
          />

          <Route
            path="/software-update-findings"
            element={
              <ComingSoon
                title="Software Update Findings"
                description="Track outdated software and latest version information."
              />
            }
          />

          <Route
            path="/vulnerability-findings"
            element={
              <ComingSoon
                title="Vulnerability Findings"
                description="Manage CVEs and vulnerability findings."
              />
            }
          />

          <Route
            path="/remediation-actions"
            element={
              <ComingSoon
                title="Remediation Actions"
                description="Track remediation tasks and verification status."
              />
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;