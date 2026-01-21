import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import ConfirmDialog from './ConfirmDialog';
import '../styles/DefaultLayout.css';
import { useUnsavedChanges } from '../contexts/UnsavedChangesContext.jsx';
import { clearCreatedDraft } from '../utils/createdDraftStorage.js';

function DefaultLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDirty, clearDirty } = useUnsavedChanges();
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);

  const handleSenseiClick = (e) => {
    if (location.pathname === '/') return;
    e.preventDefault();
    if (!isDirty) {
      clearDirty();
      navigate('/');
      return;
    }
    setIsLeaveConfirmOpen(true);
  };

  return (
    <div className="layout-container">
      <ConfirmDialog
        open={isLeaveConfirmOpen}
        title="Leave page?"
        message="You have unsaved changes. Are you sure you want to leave this page?"
        confirmText="Leave"
        cancelText="Stay"
        onCancel={() => {
          setIsLeaveConfirmOpen(false);
        }}
        onConfirm={() => {
          setIsLeaveConfirmOpen(false);
          clearDirty();
          // Pulisce il draft della CreatePage se si sta tornando indietro
          if (location.pathname.startsWith('/create')) {
            clearCreatedDraft();
          }
          navigate('/');
        }}
      />
      {/* Header/Navbar */}
      <header className="layout-header">
        <div className="layout-header-content">
          <Link to="/" className="layout-logo-link" onClick={handleSenseiClick}>
            <h1 className="layout-logo-title">Sensei</h1>
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
            <span className="layout-footer-sep">•</span>
            <span className="layout-footer-muted">© {new Date().getFullYear()} Sensei</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default DefaultLayout;