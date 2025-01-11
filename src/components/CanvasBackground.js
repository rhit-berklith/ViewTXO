import React, { useRef, useState, useEffect } from 'react';
import * as d3 from 'd3';
import SimpleBackground from './SimpleBackground';
import TransactionChart from './TransactionChart';

const CanvasBackground = ({ recenterRef, transactionData, onHover, ...props }) => { // Added props
  const svgRef = useRef();
  const zoomRef = useRef();
  const [transform, setTransform] = useState(d3.zoomIdentity);

  useEffect(() => {
    const svgEl = d3.select(svgRef.current);
    const container = svgEl.select('.zoom-container');

    const zoom = d3.zoom()
      .scaleExtent([0.1, 10]) // Extended zoom range
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
        setTransform(event.transform);
      });

    svgEl.call(zoom);

    // Center initially
    const { width, height } = svgRef.current.getBoundingClientRect();
    const initialTransform = d3.zoomIdentity.translate(width / 2, height / 2);
    svgEl.call(zoom.transform, initialTransform);
    setTransform(initialTransform);

    zoomRef.current = zoom;
  }, []);

  // Recenter button
  useEffect(() => {
    if (recenterRef) {
      recenterRef.current = () => {
        const svgEl = d3.select(svgRef.current);
        const { width, height } = svgRef.current.getBoundingClientRect();
        svgEl.transition().duration(750).call(
          zoomRef.current.transform,
          d3.zoomIdentity.translate(width / 2, height / 2)
        );
      };
    }
  }, [recenterRef]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <SimpleBackground />
      <svg
        ref={svgRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          // Remove the pointerEvents override so D3 can handle zoom/pan properly
        }}
      >
        <g className="zoom-container">
          <TransactionChart 
            transactionData={transactionData}
            onHover={onHover}
            {...props}
          />
        </g>
      </svg>
    </div>
  );
};

export default CanvasBackground;