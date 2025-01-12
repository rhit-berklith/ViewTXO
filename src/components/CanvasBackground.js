import React, { useRef, useState, useEffect } from 'react';
import * as d3 from 'd3';
import GridBackground from './GridBackground';
import TransactionChart from './TransactionChart';

/**
 * A single <svg> with one <g class="world"> that is panned/zoomed by D3.
 * Inside this 'world' <g>, we place:
 *   - A <GridBackground> (SVG pattern-based)
 *   - The TransactionChart <g>
 * 
 * The chart is "pinned" to the same world coords as the background grid.
 * 
 * If you want to drag the chart 1:1 in screen space, you do so by updating 
 * the chart's *world* coords with dx/k, dy/k in the 'drag' event. 
 */
const CanvasBackground = ({ recenterRef, transactionData, onHover, ...props }) => {
  const svgRef = useRef(null);

  // The current D3 zoom transform: {x, y, k}
  const [transform, setTransform] = useState(d3.zoomIdentity);

  // We'll store a "chart position" in *world coords* 
  // (so if the user drags 10 px at k=2 => +5 in world coords).
  const [chartPos, setChartPos] = useState({ x: 0, y: 0 });

  // The circle is placed at the first input line start
  const [circlePos, setCirclePos] = useState({ x: -740, y: -50 });

  // 1) Initialize D3 Zoom on the entire <svg>, controlling <g.world>
  useEffect(() => {
    const svgEl = d3.select(svgRef.current);
    const zoomBehavior = d3.zoom()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        // store transform => triggers re-render => <g.world> transforms
        setTransform(event.transform);
      });

    svgEl.call(zoomBehavior);

    // Optionally center on mount
    const { width, height } = svgRef.current.getBoundingClientRect();
    const initialTransform = d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(1);
    svgEl.call(zoomBehavior.transform, initialTransform);
    setTransform(initialTransform);
  }, []);

  // 2) Recenter if parent calls recenterRef
  useEffect(() => {
    if (recenterRef) {
      recenterRef.current = () => {
        const svgEl = d3.select(svgRef.current);
        const { width, height } = svgEl.node().getBoundingClientRect();
        const newTransform = d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(1);

        svgEl.transition().duration(750).call(
          d3.zoom().transform,
          newTransform
        );
      };
    }
  }, [recenterRef]);

  // 3) Drag the chart 1:1 in screen => dx/k, dy/k in world coords
  useEffect(() => {
    const svgEl = d3.select(svgRef.current);
    const handle = svgEl.select('.drag-handle');

    const dragStart = { sx: 0, sy: 0, cx: 0, cy: 0 };
    const dragBehavior = d3.drag()
      .on('start', (event) => {
        event.sourceEvent.stopPropagation();
        const [px, py] = d3.pointer(event, svgEl.node());
        dragStart.sx = px;
        dragStart.sy = py;
        dragStart.cx = chartPos.x;
        dragStart.cy = chartPos.y;
      })
      .on('drag', (event) => {
        const [px, py] = d3.pointer(event, svgEl.node());
        const dxScreen = px - dragStart.sx;
        const dyScreen = py - dragStart.sy;

        const dxWorld = dxScreen / transform.k;
        const dyWorld = dyScreen / transform.k;

        setChartPos({
          x: dragStart.cx + dxWorld,
          y: dragStart.cy + dyWorld
        });
      });

    handle.call(dragBehavior);

    return () => {
      handle.on('.drag', null);
    };
  }, [chartPos, transform]);

  // Called from TransactionChart after it draws S-bend lines
  const handlePositionsComputed = ({ firstInputX, firstInputY }) => {
    setCirclePos({ x: firstInputX, y: firstInputY });
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg
        ref={svgRef}
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '100%', height: '100%'
        }}
      >
        {/* 
          .world => we apply the transform => the grid + chart scale/pan together
        */}
        <g
          className="world"
          transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}
        >
          {/* A) The pattern-based background grid */}
          <GridBackground />

          {/* B) The chart container, offset by chartPos in world coords */}
          <g transform={`translate(${chartPos.x}, ${chartPos.y})`}>
            <TransactionChart
              transactionData={transactionData}
              onHover={onHover}
              onPositionsComputed={handlePositionsComputed}
              {...props}
            />
            <circle
              className="drag-handle"
              cx={circlePos.x}
              cy={circlePos.y}
              r={20}
              fill="#888"
              style={{ cursor: 'move' }}
            />
          </g>
        </g>
      </svg>
    </div>
  );
};

export default CanvasBackground;




