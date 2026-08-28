import {
    LayoutDashboard,
    Building2,
    Users,
    Monitor,
    ShieldAlert,
    Wrench,
    LogOut,
    Package,
    RefreshCw,
    Network,
    GitBranch,
    ClipboardList,
  } from 'lucide-react';
  import { NavLink, Outlet, useNavigate } from 'react-router-dom';
  import api from '../api/api';
  
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['Super Admin', 'Organization Admin', 'Security Analyst', 'IT Technician'] },
    { name: 'Organizations', path: '/organizations', icon: Building2, roles: ['Super Admin', 'Organization Admin'] },
    { name: 'Departments', path: '/departments', icon: Network, roles: ['Super Admin', 'Organization Admin'] },
    { name: 'Users', path: '/users', icon: Users, roles: ['Super Admin', 'Organization Admin'] },
    { name: 'Devices', path: '/devices', icon: Monitor, roles: ['Super Admin', 'Organization Admin', 'Security Analyst', 'IT Technician'] },
    { name: 'Software Inventory', path: '/software-inventory', icon: Package, roles: ['Super Admin', 'Organization Admin', 'Security Analyst', 'IT Technician'] },
    { name: 'Update Findings', path: '/software-update-findings', icon: RefreshCw, roles: ['Super Admin', 'Organization Admin', 'Security Analyst', 'IT Technician'] },
    { name: 'Vulnerabilities', path: '/vulnerability-findings', icon: ShieldAlert, roles: ['Super Admin', 'Organization Admin', 'Security Analyst', 'IT Technician'] },
    { name: 'Remediation', path: '/remediation-actions', icon: Wrench, roles: ['Super Admin', 'Organization Admin', 'Security Analyst', 'IT Technician'] },
    { name: 'Repository Scanning', path: '/repository-scanning', icon: GitBranch, roles: ['Super Admin', 'Organization Admin', 'Security Analyst', 'IT Technician'] },
    { name: 'Audit Logs', path: '/audit-logs', icon: ClipboardList, roles: ['Super Admin', 'Organization Admin'] },
  ];
  
  function MainLayout() {
    const navigate = useNavigate();
  
    const user = JSON.parse(localStorage.getItem('user') || '{}');
  
    const handleLogout = async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try { await api.post('/auth/logout', { refreshToken }); } catch { /* Local logout still completes. */ }
      }
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      navigate('/');
    };
  
    return (
      <div className="min-h-screen bg-slate-950 text-white flex">
        <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col">
          <div className="p-6 border-b border-slate-800">
            <h1 className="text-2xl font-bold text-cyan-400">VulnGuard AI</h1>
            <p className="text-sm text-slate-400 mt-1">
              Vulnerability Management
            </p>
          </div>
  
          <nav className="flex-1 p-4 space-y-2">
            {navItems.filter((item) => item.roles.includes(user?.role?.roleName)).map((item) => {
              const Icon = item.icon;
  
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition ${
                      isActive
                        ? 'bg-cyan-500 text-slate-950 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <Icon size={18} />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
  
          <div className="p-4 border-t border-slate-800">
            <div className="mb-4">
              <p className="text-sm font-semibold">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-400">{user?.role?.roleName}</p>
            </div>
  
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-400 text-white py-3 rounded-lg font-semibold transition"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </aside>
  
        <div className="flex-1 flex flex-col">
          <header className="h-20 border-b border-slate-800 bg-slate-950 flex items-center justify-between px-8">
            <div>
              <h2 className="text-xl font-bold">
                {user?.role?.roleName || 'Security'} Dashboard
              </h2>
              <p className="text-sm text-slate-400">
                Monitor assets, vulnerabilities, and remediation progress
              </p>
            </div>
  
            <div className="text-right">
              <p className="text-sm font-medium">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
          </header>
  
          <main className="flex-1 p-8 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    );
  }
  
  export default MainLayout;
