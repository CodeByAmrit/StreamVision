import React from 'react';
import { NavLink } from 'react-router-dom';
import { Video, Home, Server, Camera, Settings, BarChart2 } from 'lucide-react';
import clsx from 'clsx';

const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'DVRs / Locations', path: '/dvr', icon: Server },
    { name: 'All Cameras', path: '/cameras', icon: Camera },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'Analytics', path: '/analytics', icon: BarChart2 },
  ];

  return (
    <aside className="fixed top-0 left-0 z-40 w-64 h-screen bg-white border-r border-gray-200">
      <div className="h-full flex flex-col">
        {/* Logo */}
        <div className="flex items-center justify-center p-6 border-b border-gray-100">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mx-auto mb-2 shadow-md">
              <Video className="text-white w-6 h-6" />
            </div>
            <div className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              StreamVision
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-grow overflow-y-auto px-4 py-6">
          <NavLink
            to="/camera/add"
            className="w-full mb-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-xl px-4 py-3 flex items-center justify-center shadow-md transition-all"
          >
            <span className="mr-2 text-xl leading-none">+</span>
            Add Camera
          </NavLink>

          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center p-3 rounded-xl transition-all',
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    )
                  }
                >
                  <item.icon className={clsx("w-5 h-5 mr-3")} />
                  <span className="font-medium">{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 border-t border-gray-100 text-xs text-center text-gray-400">
          StreamVision v2.0
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
