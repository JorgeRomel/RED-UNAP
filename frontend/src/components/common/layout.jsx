import React from 'react';
import DockNavigation from './DockNavigation';

const Layout = ({ children, className = "" }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">🎓</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">RED UNAP</h1>
                <p className="text-sm text-gray-600">Red de Estudiantes</p>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>En línea</span>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main className={`flex-1 pb-24 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
      
      <DockNavigation />
    </div>
  );
};

export default Layout;