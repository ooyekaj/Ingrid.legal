import React, { useEffect, useRef } from 'react';

interface IngridLogoProps {
  compact?: boolean;
  width?: number;
  height?: number;
  className?: string;
}

const IngridLogo: React.FC<IngridLogoProps> = ({ 
  compact = false, 
  width = compact ? 40 : 300, 
  height = compact ? 45 : 300,
  className = ""
}) => {
  const bgGraphRef = useRef<SVGGElement>(null);
  const fgGraphRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const generateGraph = (bgElement: SVGGElement | null, fgElement: SVGGElement | null, isDark = false) => {
      if (!bgElement || !fgElement) return;

      // Clear existing content
      bgElement.innerHTML = '';
      fgElement.innerHTML = '';
      
      // Generate fewer nodes for compact version
      const nodeCount = compact ? 50 : 300;
      const nodes = Array.from({length: nodeCount}, () => ({
        x: Math.random() * width, 
        y: Math.random() * height
      }));
      
      // Colors for chaotic background (darker purple)
      const chaoticStrokeColor = isDark ? '#5B21B6' : '#6D28D9';
      const chaoticFillColor = isDark ? '#6D28D9' : '#8B5CF6';
      
      // Generate background graph
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const distance = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
          const threshold = compact ? 20 : 28;
          if (distance < threshold) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', nodes[i].x.toString());
            line.setAttribute('y1', nodes[i].y.toString());
            line.setAttribute('x2', nodes[j].x.toString());
            line.setAttribute('y2', nodes[j].y.toString());
            line.setAttribute('stroke', chaoticStrokeColor);
            line.setAttribute('stroke-width', compact ? '0.3' : '0.5');
            bgElement.appendChild(line);
          }
        }
        
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', nodes[i].x.toString());
        circle.setAttribute('cy', nodes[i].y.toString());
        circle.setAttribute('r', (Math.random() * (compact ? 0.8 : 1.0) + (compact ? 0.3 : 0.5)).toString());
        circle.setAttribute('fill', chaoticFillColor);
        bgElement.appendChild(circle);
      }

      // Colors for focused foreground (lighter purple)
      const focusedStrokeColor = isDark ? '#A78BFA' : '#C4B5FD'; 
      const focusedFillColor = isDark ? '#C4B5FD' : '#DDD6FE';
      
      // Generate foreground graph
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const distance = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
          const threshold = compact ? 20 : 28;
          if (distance < threshold) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', nodes[i].x.toString());
            line.setAttribute('y1', nodes[i].y.toString());
            line.setAttribute('x2', nodes[j].x.toString());
            line.setAttribute('y2', nodes[j].y.toString());
            line.setAttribute('stroke', focusedStrokeColor);
            line.setAttribute('stroke-width', compact ? '0.5' : '0.75');
            fgElement.appendChild(line);
          }
        }
        
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', nodes[i].x.toString());
        circle.setAttribute('cy', nodes[i].y.toString());
        circle.setAttribute('r', (Math.random() * (compact ? 1.0 : 1.5) + (compact ? 0.5 : 0.8)).toString());
        circle.setAttribute('fill', focusedFillColor);
        fgElement.appendChild(circle);
      }
    };

    generateGraph(bgGraphRef.current, fgGraphRef.current, false);
  }, [compact, width, height]);

  const centerX = width / 2;
  const centerY = height / 2;
  const focusRadius = Math.min(width, height) * (compact ? 0.35 : 0.3);
  const lensRadius = Math.min(width, height) * (compact ? 0.32 : 0.28);

  if (compact) {
    return (
      <svg 
        width={width} 
        height={height} 
        viewBox={`0 0 ${width} ${height}`} 
        className={`${className} filter brightness-0 invert`}
      >
        <defs>
          <filter id={`blur-filter-${width}-${height}`}>
            <feGaussianBlur stdDeviation="0.5"/>
          </filter>
          <mask id={`focus-mask-${width}-${height}`}>
            <rect width={width} height={height} fill="white"/>
            <circle cx={centerX} cy={centerY} r={focusRadius + 2} fill="black"/>
          </mask>
          <clipPath id={`focus-clip-${width}-${height}`}>
            <circle cx={centerX} cy={centerY} r={focusRadius}/>
          </clipPath>
        </defs>
        
        {/* Background Graph (Chaotic, Darker Purple) */}
        <g 
          ref={bgGraphRef}
          filter={`url(#blur-filter-${width}-${height})`}
          mask={`url(#focus-mask-${width}-${height})`}
          opacity="0.4"
        />

        {/* Foreground Graph (Clear, Lighter Purple) */}
        <g 
          ref={fgGraphRef}
          clipPath={`url(#focus-clip-${width}-${height})`}
        />
        
        {/* Lens Effect */}
        <circle 
          cx={centerX}
          cy={centerY}
          r={lensRadius}
          stroke="#8B5CF6" 
          strokeWidth="1.5" 
          fill="none" 
          opacity="0.6"
        />
      </svg>
    );
  }

  return (
    <div className="bg-gray-50 flex items-center justify-center min-h-screen p-4">
      <div className="w-80 h-80 flex items-center justify-center relative bg-white rounded-3xl p-10 shadow-xl border border-gray-200">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={`font-inter ${className}`}>
          <defs>
            <filter id="blur-filter-final">
              <feGaussianBlur stdDeviation="0.8"/>
            </filter>
            <mask id="focus-mask-final">
              <rect width={width} height={height} fill="white"/>
              <circle cx={centerX} cy={centerY} r={focusRadius + 5} fill="black"/>
            </mask>
            <clipPath id="focus-clip-final">
              <circle cx={centerX} cy={centerY} r={focusRadius}/>
            </clipPath>
          </defs>
          
          {/* Background Graph (Chaotic, Darker Purple) */}
          <g 
            ref={bgGraphRef}
            id="bg-graph-light-final" 
            filter="url(#blur-filter-final)" 
            mask="url(#focus-mask-final)" 
            opacity="0.6"
          />

          {/* Foreground Graph (Clear, Lighter Purple) */}
          <g 
            ref={fgGraphRef}
            id="fg-graph-light-final" 
            clipPath="url(#focus-clip-final)"
          />
          
          {/* Lens Effect */}
          <circle 
            cx={centerX}
            cy={centerY}
            r={lensRadius}
            stroke="#8B5CF6" 
            strokeWidth="4" 
            fill="none" 
            opacity="0.6"
          />
          
          {/* Central Text */}
          <text 
            x={centerX}
            y={centerY}
            textAnchor="middle" 
            dy=".35em" 
            className="text-5xl font-bold fill-pink-500"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '46px',
              fontWeight: '700'
            }}
          >
            Ingrid
          </text>
        </svg>
      </div>
    </div>
  );
};

export default IngridLogo;