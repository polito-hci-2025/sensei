import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

function DefaultLayout() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navbar */}
      <header className="bg-white border-b border-gray-300 px-8 py-6">
        <div className="flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center space-x-2 hover:opacity-80 transition-all no-underline"
          >
            <h1 className="text-4xl font-serif italic text-gray-900">
              Sensei
            </h1>
          </Link>
          <span className="text-gray-700 text-lg font-medium">prof Rossi</span>
        </div>
      </header>

      {/* Content Area - Outlet renders child routes */}
      <div className="h-[calc(100vh-88px)] overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}

export default DefaultLayout;