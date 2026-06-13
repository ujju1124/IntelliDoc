import { useState } from 'react';

const MindMap = ({ data }) => {
  const [expandedBranches, setExpandedBranches] = useState(
    data?.branches?.reduce((acc, _, index) => ({ ...acc, [index]: true }), {}) || {}
  );

  if (!data || !data.central || !data.branches) {
    return (
      <div className="flex items-center justify-center h-[500px] text-text-secondary">
        <p>No mind map data available</p>
      </div>
    );
  }

  const toggleBranch = (index) => {
    setExpandedBranches((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Layout configuration
  const centerX = 400;
  const centerY = 250;
  const branchDistance = 160;
  const leafDistance = 90;

  // Calculate branch positions (radial layout)
  const branches = data.branches.map((branch, index) => {
    const angle = (index / data.branches.length) * 2 * Math.PI;
    const x = centerX + Math.cos(angle) * branchDistance;
    const y = centerY + Math.sin(angle) * branchDistance;

    // Calculate leaf positions around this branch
    const children = branch.children || [];
    const leaves = children.map((child, childIndex) => {
      const childCount = children.length;
      const spreadAngle = Math.PI / 3; // 60 degrees spread
      const startAngle = angle - spreadAngle / 2;
      const childAngle = startAngle + (childIndex / Math.max(childCount - 1, 1)) * spreadAngle;
      
      const leafX = x + Math.cos(childAngle) * leafDistance;
      const leafY = y + Math.sin(childAngle) * leafDistance;
      
      return {
        text: child,
        x: leafX,
        y: leafY,
      };
    });

    return {
      ...branch,
      x,
      y,
      angle,
      leaves,
    };
  });

  // Helper to create curved path between two points
  const createCurvedPath = (x1, y1, x2, y2) => {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const controlDist = dist * 0.3;
    
    const angle = Math.atan2(dy, dx);
    const controlX = midX + Math.sin(angle) * controlDist;
    const controlY = midY - Math.cos(angle) * controlDist;
    
    return `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`;
  };

  const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="w-full">
      <svg
        viewBox="0 0 800 500"
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Connections - Draw first so they appear behind nodes */}
        {branches.map((branch, index) => (
          <g key={`connections-${index}`}>
            {/* Central to branch connection */}
            <path
              d={createCurvedPath(centerX, centerY, branch.x, branch.y)}
              stroke="#7c3aed"
              strokeWidth="1.5"
              fill="none"
              opacity="0.5"
            />
            
            {/* Branch to leaves connections */}
            {expandedBranches[index] && branch.leaves.map((leaf, leafIndex) => (
              <line
                key={`leaf-line-${index}-${leafIndex}`}
                x1={branch.x}
                y1={branch.y}
                x2={leaf.x}
                y2={leaf.y}
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth="1"
              />
            ))}
          </g>
        ))}

        {/* Central node */}
        <g>
          <circle
            cx={centerX}
            cy={centerY}
            r="45"
            fill="#7c3aed"
            filter="url(#glow)"
          />
          <text
            x={centerX}
            y={centerY}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize="13"
            fontWeight="700"
            className="pointer-events-none"
          >
            {truncateText(data.central, 15)}
          </text>
        </g>

        {/* Branch nodes */}
        {branches.map((branch, index) => (
          <g
            key={`branch-${index}`}
            onClick={() => toggleBranch(index)}
            className="cursor-pointer transition-transform hover:scale-105"
            style={{ transformOrigin: `${branch.x}px ${branch.y}px` }}
          >
            <circle
              cx={branch.x}
              cy={branch.y}
              r="32"
              fill="#1e1b4b"
              stroke="#7c3aed"
              strokeWidth="1.5"
            />
            <text
              x={branch.x}
              y={branch.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize="11"
              fontWeight="500"
              className="pointer-events-none"
            >
              {truncateText(branch.label, 12)}
            </text>
          </g>
        ))}

        {/* Leaf nodes */}
        {branches.map((branch, branchIndex) =>
          expandedBranches[branchIndex] && branch.leaves.map((leaf, leafIndex) => (
            <g key={`leaf-${branchIndex}-${leafIndex}`}>
              <rect
                x={leaf.x - 40}
                y={leaf.y - 14}
                width="80"
                height="28"
                rx="6"
                fill="#0f0f1a"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="1"
              />
              <text
                x={leaf.x}
                y={leaf.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#94a3b8"
                fontSize="10"
                className="pointer-events-none"
              >
                {truncateText(leaf.text, 15)}
              </text>
            </g>
          ))
        )}
      </svg>
      
      <p className="text-xs text-text-secondary text-center mt-2">
        Click branch nodes to toggle children
      </p>
    </div>
  );
};

export default MindMap;
