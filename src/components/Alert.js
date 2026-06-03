import React from 'react';

const STYLES = {
  error:   'bg-red-50 border-red-200 text-red-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  info:    'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
};

const ICONS = {
  error:   '✕',
  success: '✓',
  info:    'ℹ',
  warning: '⚠',
};

export default function Alert({ type = 'info', message, onClose }) {
  if (!message) return null;
  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${STYLES[type]} mb-4`} role="alert">
      <span className="font-bold mt-0.5">{ICONS[type]}</span>
      <p className="flex-1 text-sm">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="text-current opacity-60 hover:opacity-100 ml-auto"
          aria-label="Dismiss"
        >
          ✕
        </button>
      )}
    </div>
  );
}
