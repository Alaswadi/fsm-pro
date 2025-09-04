import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'ri-dashboard-line',
      path: '/dashboard',
    },
    {
      id: 'work-orders',
      label: 'Work Orders',
      icon: 'ri-file-list-line',
      path: '/work-orders',
    },
    {
      id: 'technicians',
      label: 'Technicians',
      icon: 'ri-user-settings-line',
      path: '/technicians',
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: 'ri-group-line',
      path: '/customers',
    },
    {
      id: 'equipment',
      label: 'Equipment',
      icon: 'ri-tools-line',
      path: '/equipment',
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: 'ri-box-line',
      path: '/inventory',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: 'ri-bar-chart-line',
      path: '/analytics',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'ri-settings-line',
      path: '/settings',
    },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div
      className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          {!isCollapsed && (
            <span className="text-2xl font-pacifico text-primary">FSM Pro</span>
          )}
          {isCollapsed && (
            <span className="text-2xl font-pacifico text-primary">F</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <div
            key={item.id}
            onClick={() => handleNavigation(item.path)}
            className={`nav-item rounded-lg px-4 py-3 flex items-center space-x-3 cursor-pointer transition-colors ${
              isActive(item.path)
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <i className={item.icon}></i>
            </div>
            {!isCollapsed && (
              <span className="font-medium">{item.label}</span>
            )}
          </div>
        ))}
      </nav>

      {/* Toggle Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <div className="w-5 h-5 flex items-center justify-center">
            <i className={isCollapsed ? 'ri-menu-unfold-line' : 'ri-menu-fold-line'}></i>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
