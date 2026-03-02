interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  className?: string;
}

export default function Button({
  label,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
}: ButtonProps): React.ReactElement {
  const baseClasses = 'font-semibold py-2 px-6 rounded-lg transition-colors inline-block mx-2';

  const variantClasses: Record<string, string> = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-400',
    secondary: 'bg-gray-300 hover:bg-gray-400 text-gray-900 disabled:bg-gray-200',
    danger: 'bg-red-600 hover:bg-red-700 text-white disabled:bg-red-400',
  };

  const combinedClassName = `${baseClasses} ${variantClasses[variant]} ${className}`;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={combinedClassName}
    >
      {label}
    </button>
  );
}
