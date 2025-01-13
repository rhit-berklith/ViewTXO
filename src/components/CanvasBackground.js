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
const CanvasBackground = ({ 
  selectedOutputs,
  onSpentOutputClick,
  recenterRef, 
  allTransactions, // array of transaction data
  globalMaxValue, 
  lineSpacing = 10, // Add this with default value
  initialScale,
  ...props 
}) => {
  const svgRef = useRef(null);
  const [transform, setTransform] = useState(d3.zoomIdentity);

  // Each chart has position in an array
  const [chartPositions, setChartPositions] = useState([]);
  const [chartLayouts, setChartLayouts] = useState([]); // Store input positions

  useEffect(() => {
    // Remove the old re-initializing code. Instead, only add positions if necessary.
    if (!allTransactions) return;
    if (allTransactions.length > chartPositions.length) {
      // Add a new chart position offset from the last transaction or from stored index
      const newPositions = [...chartPositions];
      newPositions.push({ x: newPositions[newPositions.length - 1]?.x + 500 || 0, y: 0 });
      setChartPositions(newPositions);
    }
  }, [allTransactions]);

  // 1) Initialize D3 Zoom on the entire <svg>, controlling <g.world>
  useEffect(() => {
    const svgEl = d3.select(svgRef.current);
    const worldGroup = svgEl.select('.world');
    
    const zoomBehavior = d3.zoom()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        worldGroup.attr('transform', event.transform);
        setTransform(event.transform);
      });

    svgEl.call(zoomBehavior);

    // Initial center
    const { width, height } = svgRef.current.getBoundingClientRect();
    const initialTransform = d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(1);
    
    svgEl.call(zoomBehavior.transform, initialTransform);
    setTransform(initialTransform);

    return () => {
      svgEl.on('.zoom', null);
    };
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
    let rAF = null;
    allTransactions?.forEach((_, idx) => {
      const handle = svgEl.select(`.drag-handle-${idx}`);
      const dragStart = { sx: 0, sy: 0, cx: 0, cy: 0 };
      const dragBehavior = d3.drag()
        .on('start', (event) => {
          event.sourceEvent.stopPropagation();
          const [px, py] = d3.pointer(event, svgEl.node());
          dragStart.sx = px;
          dragStart.sy = py;
          dragStart.cx = chartPositions[idx].x;
          dragStart.cy = chartPositions[idx].y;
        })
        .on('drag', (event) => {
          if (rAF) cancelAnimationFrame(rAF);
          rAF = requestAnimationFrame(() => {
            const [px, py] = d3.pointer(event, svgEl.node());
            const dxScreen = px - dragStart.sx;
            const dyScreen = py - dragStart.sy;
            const dxWorld = dxScreen / transform.k;
            const dyWorld = dyScreen / transform.k;

            setChartPositions((prev) => {
              const newPositions = [...prev];
              newPositions[idx] = {
                x: dragStart.cx + dxWorld,
                y: dragStart.cy + dyWorld
              };
              return newPositions;
            });
          });
        })
        .on('end', () => {
          if (rAF) {
            cancelAnimationFrame(rAF);
            rAF = null;
          }
        });
      handle.call(dragBehavior);
    });

    return () => {
      if (rAF) cancelAnimationFrame(rAF);
      allTransactions?.forEach((_, idx) => {
        const handle = svgEl.select(`.drag-handle-${idx}`);
        handle.on('.drag', null);
      });
    };
  }, [allTransactions, chartPositions, transform]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg
        ref={svgRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          touchAction: 'none' // Prevent touch scrolling interference
        }}
      >
        <g
          className="world"
          transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}
        >
          {/* A) The pattern-based background grid */}
          <GridBackground />

          {/* B) The chart container, offset by chartPos in world coords */}
          {allTransactions?.map((tx, idx) => (
            <g key={idx} transform={`translate(${chartPositions[idx]?.x || 0}, ${chartPositions[idx]?.y || 0})`}>
              <TransactionChart
                transactionData={tx}
                onSpentOutputClick={(spentTxid) => onSpentOutputClick(spentTxid, idx)}
                globalMaxValue={globalMaxValue}
                lineSpacing={lineSpacing}
                selectedOutputs={selectedOutputs}
                initialScale={initialScale}
                {...props}
                onLayoutChange={(layout) => {
                  setChartLayouts(prev => {
                    const next = [...prev];
                    next[idx] = layout;
                    return next;
                  });
                }}
              />
              {chartLayouts[idx] && (
                <g
                  className={`drag-handle-${idx}`}
                  transform={`translate(
                    ${chartLayouts[idx].x - lineSpacing/2}, 
                    ${chartLayouts[idx].y - lineSpacing/2}
                  )`}
                  style={{ cursor: 'move' }}
                >
                  <path
                    d="M 0,0 L 0,40 L 5,40 L 5,5 L 40,5 L 40,0 Z"
                    fill="#888"
                    stroke="#666"
                    strokeWidth="1"
                  />
                </g>
              )}
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
};

export default CanvasBackground;




