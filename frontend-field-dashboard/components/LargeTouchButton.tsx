import React from 'react';

interface LargeTouchButtonProps {
  label: string;
  onClick?: () => void;
  icon?: string | React.ReactNode;
  variant?: 'primary' | 'warning' | 'danger' | 'secondary';
  type?: 'button' | 'submit';
  disabled?: boolean;
}

export default function LargeTouchButton({
  label,
  onClick,
  icon = '✨',
  variant = 'primary',
  type = 'button',
  disabled = false,
}: LargeTouchButtonProps) {
  const getButtonClass = () => {
    switch (variant) {
      case 'warning':
        return 'btn-warning';
      case 'danger':
        return 'btn-danger';
      case 'secondary':
        return 'btn-secondary';
      default:
        return 'btn-primary';
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn ${getButtonClass()}`}
      style={{
        width: '100%',
        padding: '1.15rem 1.5rem',
        fontSize: '1.15rem',
        fontWeight: 700,
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
      }}
    >
      {typeof icon === 'string' ? <span>{icon}</span> : icon}
      <span>{label}</span>
    </button>
  );
}
