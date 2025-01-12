import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { fetchTxOutspends } from '../api/api';

const TransactionChart = React.memo(({
  transactionData,
  globalMaxValue, // Add new prop
  lineThicknessRatio = 1,
  lineSpacing = 10,
  lineLength = 1500,
  minLineThickness = 0.1,
  onHover,
  onPositionsComputed,
  onSpentOutputClick // Add new prop
}) => {
  const groupRef = useRef(null);
  const [outspends, setOutspends] = useState(null);
  const lastPositionsRef = useRef({ x: null, y: null });

  // Fetch outspends
  useEffect(() => {
    if (transactionData?.txid) {
      fetchTxOutspends(transactionData.txid)
        .then(setOutspends)
        .catch(console.error);
    }
  }, [transactionData]);

  // Draw S-bend paths
  useEffect(() => {
    if (!transactionData?.vin || !transactionData?.vout) return;
    if (!outspends) return;

    const g = d3.select(groupRef.current);
    g.selectAll('*').remove();

    // Use globalMaxValue instead of local calculation
    const valueScale = d3.scaleLinear()
      .domain([0, globalMaxValue])
      .range([0, 80]);

    // thickness arrays
    const inputThicknesses = transactionData.vin.map(input =>
      Math.max(minLineThickness, valueScale(input.prevout?.value || 0) * lineThicknessRatio)
    );
    const outputThicknesses = transactionData.vout.map(output =>
      Math.max(minLineThickness, valueScale(output.value) * lineThicknessRatio)
    );
    const feeThickness = transactionData.fee
      ? Math.max(minLineThickness, valueScale(transactionData.fee) * lineThicknessRatio)
      : 0;

    // offsets
    const totalInputThickness = inputThicknesses.reduce((a, b) => a + b, 0);
    const totalOutputThickness = [...outputThicknesses, feeThickness].reduce((a, b) => a + b, 0);
    let inputEndpointY = -(totalInputThickness + (inputThicknesses.length - 1) * lineSpacing) / 2;
    let outputEndpointY = -(totalOutputThickness + (outputThicknesses.length - 1) * lineSpacing) / 2;
    const halfLength = lineLength / 2;

    // For S-shapes
    const accumulatedInputHeights = [];
    let cumuIn = 0;
    inputThicknesses.forEach((t) => {
      accumulatedInputHeights.push(cumuIn + t / 2);
      cumuIn += t;
    });
    const accumulatedOutputHeights = [];
    let cumuOut = 0;
    outputThicknesses.forEach((t) => {
      accumulatedOutputHeights.push(cumuOut + t / 2);
      cumuOut += t;
    });
    const totalHeight = Math.max(cumuIn, cumuOut + feeThickness);
    const verticalOffset = -totalHeight / 2;

    let firstInputX = null;
    let firstInputY = null;

    // Draw inputs
    inputThicknesses.forEach((thickness, i) => {
      const startY = inputEndpointY + thickness / 2;
      const middleY = verticalOffset + accumulatedInputHeights[i];

      const pathD = `
        M ${-halfLength},${startY}
        C ${-halfLength * 0.5},${startY}
          ${-halfLength * 0.25},${middleY}
          0,${middleY}
      `;
      g.append('path')
        .attr('d', pathD)
        .attr('stroke', '#0f0')
        .attr('stroke-width', thickness)
        .attr('fill', 'none')
        .style('cursor', 'pointer')
        .on('mouseenter', () => onHover?.(transactionData.vin[i], 'input', transactionData))
        .on('mouseleave', () => onHover?.(null, null, null));

      if (i === 0) {
        firstInputX = -halfLength;
        firstInputY = startY;
      }
      inputEndpointY += thickness + lineSpacing;
    });

    // Draw outputs
    outputThicknesses.forEach((thickness, i) => {
      const endY = outputEndpointY + thickness / 2;
      const middleY = verticalOffset + accumulatedOutputHeights[i];

      const pathD = `
        M 0,${middleY}
        C ${halfLength * 0.25},${middleY}
          ${halfLength * 0.5},${endY}
          ${halfLength},${endY}
      `;
      g.append('path')
        .attr('d', pathD)
        .attr('stroke', '#0ff')
        .attr('stroke-width', thickness)
        .attr('fill', 'none')
        .style('cursor', 'pointer')
        .on('mouseenter', () => onHover?.(transactionData.vout[i], 'output', transactionData))
        .on('mouseleave', () => onHover?.(null, null, null));

      // If spent, add small rect
      if (outspends[i]?.spent) {
        g.append('rect')
          .attr('x', halfLength + lineSpacing / 2)
          .attr('y', endY - thickness / 2)
          .attr('width', lineSpacing * 2)
          .attr('height', thickness)
          .attr('fill', '#aaa')
          .style('cursor', 'pointer')
          .on('click', () => {
            const spentTxid = outspends[i].txid; // or spend.txid
            if (spentTxid && onSpentOutputClick) {
              onSpentOutputClick(spentTxid, i);
            }
          });
      }

      outputEndpointY += thickness + lineSpacing;
    });

    // Fee (draw with S-shape)
    if (transactionData.fee) {
      const feeYStart = verticalOffset + cumuOut + feeThickness / 2;
      const feeYEnd = outputEndpointY + feeThickness / 2;
      const pathD = `
        M 0,${feeYStart}
        C ${halfLength * 0.25},${feeYStart}
          ${halfLength * 0.5},${feeYEnd}
          ${halfLength},${feeYEnd}
      `;
      g.append('path')
        .attr('d', pathD)
        .attr('stroke', '#f55')
        .attr('stroke-width', feeThickness)
        .attr('fill', 'none')
        .style('cursor', 'pointer')
        .on('mouseenter', () => onHover?.({
          value: transactionData.fee,
          scriptpubkey_address: null,
          scriptpubkey_type: null
        }, 'fee', transactionData))
        .on('mouseleave', () => onHover?.(null, null, null));
    }

    // Call onPositionsComputed only if new coords differ
    if (onPositionsComputed && firstInputX != null && firstInputY != null) {
      if (
        lastPositionsRef.current.x !== firstInputX ||
        lastPositionsRef.current.y !== firstInputY
      ) {
        lastPositionsRef.current = { x: firstInputX, y: firstInputY };
        onPositionsComputed({ firstInputX, firstInputY });
      }
    }
  }, [
    transactionData, 
    outspends, 
    globalMaxValue, // Add dependency
    lineThicknessRatio, 
    lineSpacing, 
    lineLength, 
    minLineThickness,
    onSpentOutputClick // Add dependency
  ]); // removed onHover & onPositionsComputed to reduce re-renders

  return <g ref={groupRef} />;
});

export default TransactionChart;


