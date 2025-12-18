import React, { useEffect } from 'react';

function ConfirmDialog({
  open,
  title = 'Confirm',
  message = 'Are you sure?',
  confirmText = 'Leave',
  cancelText = 'Stay',
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onCancel?.();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="sensei-confirm-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel?.();
      }}
    >
      <div
        className="sensei-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sensei-confirm-title"
        aria-describedby="sensei-confirm-message"
      >
        <h3 id="sensei-confirm-title" className="sensei-confirm-title">
          {title}
        </h3>
        <p id="sensei-confirm-message" className="sensei-confirm-message">
          {message}
        </p>
        <div className="sensei-confirm-actions">
          <button
            type="button"
            className="sensei-confirm-btn secondary"
            onClick={onCancel}
            autoFocus
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="sensei-confirm-btn primary"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
