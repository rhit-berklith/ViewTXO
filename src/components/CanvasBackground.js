import React, { useRef, useState, useEffect } from 'react';
import * as d3 from 'd3';
import GridBackground from './GridBackground';
import TransactionChart from './TransactionChart';

const CanvasBackground = ({ recenterRef, transactionData, lineThicknessRatio, lineSpacing, lineLength, minLineThickness }) => { // Added props
  const svgRef = useRef();
  const zoomRef = useRef();
  const [transform, setTransform] = useState(d3.zoomIdentity);

  useEffect(() => {
    const svgEl = d3.select(svgRef.current);
    const container = svgEl.select('.zoom-container');

    const zoom = d3.zoom()
      .scaleExtent([0.1, 10]) // Extended zoom range
      .on('zoom', (event) => {
        const { transform } = event;
        container.attr('transform', transform);
        setTransform(transform);
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
    <>
      <GridBackground transform={transform} />
      <svg
        ref={svgRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'all',
          zIndex: 1
        }}
      >
        <g className="zoom-container">
          <TransactionChart 
            transactionData={transactionData}
            lineThicknessRatio={lineThicknessRatio} // Forward prop
            lineSpacing={lineSpacing} // Forward prop
            lineLength={lineLength}
            minLineThickness={minLineThickness}
          />
        </g>
      </svg>
    </>
  );
};

export default CanvasBackground;