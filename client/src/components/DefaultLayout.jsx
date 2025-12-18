import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import ConfirmDialog from './ConfirmDialog';
import '../styles/DefaultLayout.css';

function DefaultLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isHomeConfirmOpen, setIsHomeConfirmOpen] = useState(false);

  const handleSenseiClick = (e) => {
    if (location.pathname === '/') return;
    e.preventDefault();
    setIsHomeConfirmOpen(true);
  };

  return (
    <div className="layout-container">
      <ConfirmDialog
        open={isHomeConfirmOpen}
        title="Leave page?"
        message="Are you sure you want to go to the home page?"
        confirmText="Go home"
        cancelText="Stay"
        onCancel={() => setIsHomeConfirmOpen(false)}
        onConfirm={() => {
          setIsHomeConfirmOpen(false);
          navigate('/');
        }}
      />
      {/* Header/Navbar */}
      <header className="layout-header">
        <div className="layout-header-content">
          <Link to="/" className="layout-logo-link" onClick={handleSenseiClick}>
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
    </div>
  );
}

export default DefaultLayout;