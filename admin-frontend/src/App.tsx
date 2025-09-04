import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Technicians from './pages/Technicians';
import Equipment from './pages/Equipment';
import Settings from './pages/Settings';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  const { checkAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Check authentication status on app load
    checkAuth();
  }, [checkAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
              } 
            />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute requiredRoles={['super_admin', 'admin', 'manager']}>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              
              {/* Placeholder routes for future pages */}
              <Route 
                path="work-orders" 
                element={
                  <div className="p-6">
                    <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                      <i className="ri-file-list-line text-6xl text-gray-400 mb-4"></i>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Work Orders</h2>
                      <p className="text-gray-600">Work Orders management page coming soon...</p>
                    </div>
                  </div>
                } 
              />
              
              <Route path="technicians" element={<Technicians />} />
              
              <Route 
                path="customers" 
                element={
                  <div className="p-6">
                    <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                      <i className="ri-group-line text-6xl text-gray-400 mb-4"></i>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Customers</h2>
                      <p className="text-gray-600">Customers management page coming soon...</p>
                    </div>
                  </div>
                } 
              />
              
              <Route path="equipment" element={<Equipment />} />

              <Route
                path="inventory"
                element={
                  <div className="p-6">
                    <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                      <i className="ri-box-line text-6xl text-gray-400 mb-4"></i>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Inventory</h2>
                      <p className="text-gray-600">Inventory management page coming soon...</p>
                    </div>
                  </div>
                }
              />
              
              <Route 
                path="analytics" 
                element={
                  <div className="p-6">
                    <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                      <i className="ri-bar-chart-line text-6xl text-gray-400 mb-4"></i>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics</h2>
                      <p className="text-gray-600">Analytics page coming soon...</p>
                    </div>
                  </div>
                } 
              />
              
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>

          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
