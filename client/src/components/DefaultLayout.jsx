import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import '../styles/DefaultLayout.css';

function DefaultLayout() {
  return (
    <div className="layout-container">
      {/* Header/Navbar */}
      <header className="layout-header">
        <div className="layout-header-content">
          <Link to="/" className="layout-logo-link">
            <h1 className="layout-logo-title">
              Sensei
            </h1>
          </Link>
          <span className="layout-user-info">prof Rossi</span>
        </div>
      </header>

      {/* Content Area - Outlet renders child routes */}
      <div className="layout-content">
        <Outlet />
      </div>
    </div>
  );
}

export default DefaultLayout;