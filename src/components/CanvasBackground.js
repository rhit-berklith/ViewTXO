import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const CanvasBackground = ({ recenterRef }) => {
  const svgRef = useRef();
  const zoomRef = useRef();

  useEffect(() => {
    const svgEl = d3.select(svgRef.current);
    const pattern = svgEl.select('#checkerboard');
    const zoom = d3.zoom()
      .scaleExtent([0.5, 5])
      .on('zoom', (event) => {
        pattern.attr('patternTransform', `translate(${event.transform.x},${event.transform.y}) scale(${event.transform.k})`);
      });
    svgEl.call(zoom);
    zoomRef.current = zoom;
  }, []);

  //recentering
  useEffect(() => {
    if (recenterRef) {
      recenterRef.current = () => {
        const svgEl = d3.select(svgRef.current);
        const { width, height } = svgRef.current.getBoundingClientRect();
        svgEl.transition().call(
          zoomRef.current.translateTo,
          0,
          0,
          [width / 2, height / 2]
        );
      };
    }
  }, [recenterRef]);

  return (
    <svg
      ref={svgRef}
      style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
    >
      <defs>
        <pattern id="checkerboard" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="10" height="10" fill="#333" />
          <rect x="10" y="0" width="10" height="10" fill="#444" />
          <rect x="0" y="10" width="10" height="10" fill="#444" />
          <rect x="10" y="10" width="10" height="10" fill="#333" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#checkerboard)" />
    </svg>
  );
};

export default CanvasBackground;