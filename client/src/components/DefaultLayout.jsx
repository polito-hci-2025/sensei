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
          <div className="layout-user-section">
            <span className="layout-welcome-text">Welcome back,</span>
            <span className="layout-user-name">prof Rossi</span>
          </div>
        </div>
      </header>

      {/* Content Area - Outlet renders child routes */}
      <div className="layout-content">
        <Outlet />
      </div>

      {/* Footer */}
      <footer className="layout-footer">
        <div className="layout-footer-content">
          <p className="layout-footer-text">
            Made by <span className="layout-footer-author">CTRL-U</span>
          </p>
          <p className="layout-footer-copyright">
            © {new Date().getFullYear()} Sensei. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default DefaultLayout;