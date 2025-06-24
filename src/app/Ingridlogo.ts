import React, { useEffect, useRef } from 'react';

const IngridLogo = () => {
  const bgGraphRef = useRef<SVGGElement>(null);
  const fgGraphRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const generateGraph = (bgElement: SVGGElement | null, fgElement: SVGGElement | null, isDark = false) => {
      if (!bgElement || !fgElement) return;

      // Clear existing content
      bgElement.innerHTML = '';
      fgElement.innerHTML = '';
      
      // Generate nodes - same set for both foreground and background
      const nodes = Array.from({length: 300}, () => ({
        x: Math.random() * 300, 
        y: Math.random() * 300
      }));
      
      // Colors for chaotic background (darker purple)
      const chaoticStrokeColor = isDark ? '#5B21B6' : '#6D28D9';
      const chaoticFillColor = isDark ? '#6D28D9' : '#8B5CF6';
      
      // Generate background graph
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const distance = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
          if (distance < 28) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', nodes[i].x.toString());
            line.setAttribute('y1', nodes[i].y.toString());
            line.setAttribute('x2', nodes[j].x.toString());
            line.setAttribute('y2', nodes[j].y.toString());
            line.setAttribute('stroke', chaoticStrokeColor);
            line.setAttribute('stroke-width', '0.5');
            bgElement.appendChild(line);
          }
        }
        
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', nodes[i].x.toString());
        circle.setAttribute('cy', nodes[i].y.toString());
        circle.setAttribute('r', (Math.random() * 1.0 + 0.5).toString());
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
          if (distance < 28) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', nodes[i].x.toString());
            line.setAttribute('y1', nodes[i].y.toString());
            line.setAttribute('x2', nodes[j].x.toString());
            line.setAttribute('y2', nodes[j].y.toString());
            line.setAttribute('stroke', focusedStrokeColor);
            line.setAttribute('stroke-width', '0.75');
            fgElement.appendChild(line);
          }
        }
        
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', nodes[i].x.toString());
        circle.setAttribute('cy', nodes[i].y.toString());
        circle.setAttribute('r', (Math.random() * 1.5 + 0.8).toString());
        circle.setAttribute('fill', focusedFillColor);
        fgElement.appendChild(circle);
      }
    };

    generateGraph(bgGraphRef.current, fgGraphRef.current, false);
  }, []);

  return (
    <div className="bg-gray-50 flex items-center justify-center min-h-screen p-4">
      <div className="w-80 h-80 flex items-center justify-center relative bg-white rounded-3xl p-10 shadow-xl border border-gray-200">
        <svg width="300" height="300" viewBox="0 0 300 300" className="font-inter">
          <defs>
            <filter id="blur-filter-final">
              <feGaussianBlur stdDeviation="0.8"/>
            </filter>
            <mask id="focus-mask-final">
              <rect width="300" height="300" fill="white"/>
              <circle cx="150" cy="150" r="95" fill="black"/>
            </mask>
            <clipPath id="focus-clip-final">
              <circle cx="150" cy="150" r="90"/>
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
            cx="150" 
            cy="150" 
            r="85" 
            stroke="#8B5CF6" 
            strokeWidth="4" 
            fill="none" 
            opacity="0.6"
          />
          
          {/* Central Text */}
          <text 
            x="150" 
            y="150" 
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