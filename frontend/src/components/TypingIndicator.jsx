const TypingIndicator = ({ color = '#7c3aed' }) => {
  return (
    <div className="flex items-center space-x-1.5 py-2">
      <div
        className="w-2 h-2 rounded-full animate-bounce"
        style={{
          backgroundColor: color,
          animationDelay: '0ms',
          animationDuration: '1s',
        }}
      />
      <div
        className="w-2 h-2 rounded-full animate-bounce"
        style={{
          backgroundColor: color,
          animationDelay: '150ms',
          animationDuration: '1s',
        }}
      />
      <div
        className="w-2 h-2 rounded-full animate-bounce"
        style={{
          backgroundColor: color,
          animationDelay: '300ms',
          animationDuration: '1s',
        }}
      />
    </div>
  );
};

export default TypingIndicator;
