const Spinner = ({ size = 'md', color = 'violet' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
  };
  
  const colorClasses = {
    violet: 'border-violet border-t-transparent',
    blue: 'border-blue border-t-transparent',
    white: 'border-white border-t-transparent',
  };
  
  return (
    <div
      className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-spin`}
      role="status"
      aria-label="Loading"
    />
  );
};

export default Spinner;
