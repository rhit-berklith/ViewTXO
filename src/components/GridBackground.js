import React from 'react';

/**
 * This component returns an SVG <g> with a <defs> <pattern> and a <rect> 
 * that extends across some large area. The pattern is repeated automatically by SVG.
 *
 * Usage:
 *   <g className="zoom-container">  // subject to D3 zoom
 *     <GridBackground />
 *     ...other stuff...
 *   </g>
 */
function GridBackground() {
  return (
    <g>
      {/* Define a pattern that draws squares or lines in user space */}
      <defs>
        <pattern
          id="gridPattern"
          x="0"
          y="0"
          width="50"       /* One cell is 50x50 in user-space coords */
          height="50"
          patternUnits="userSpaceOnUse"
        >
          {/* Fill the cell with a darker color */}
          <rect x="0" y="0" width="50" height="50" fill="#444" />

          {/* Optionally draw lines to create a grid effect */}
          <path
            d="M 50 0 L 0 0 0 50"
            fill="none"
            stroke="#333"
            strokeWidth="1"
          />
        </pattern>
      </defs>

      {/* 
        A big <rect> that uses the pattern as a fill.
        If your world is effectively infinite, just pick large coords 
        so the user doesn't see beyond it. 
      */}
      <rect
        x="-100000" 
        y="-100000"
        width="200000"
        height="200000"
        fill="url(#gridPattern)"
      />
    </g>
  );
}

export default GridBackground;



