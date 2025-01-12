import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { fetchTxOutspends } from '../api/api';

const TransactionChart = ({
  transactionData,
  lineThicknessRatio = 1,
  lineSpacing = 10,
  lineLength = 1500,
  minLineThickness = 0.1,
  onHover,
  onPositionsComputed
}) => {
  const groupRef = useRef(null);
  const [outspends, setOutspends] = useState(null);

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

    const totalValue = d3.max([
      ...transactionData.vin.map(d => d.prevout?.value || 0),
      ...transactionData.vout.map(d => d.value),
      transactionData.fee || 0
    ]) || 1;

    const valueScale = d3.scaleLinear().domain([0, totalValue]).range([0, 80]);

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
        .on('mouseenter', () => onHover?.(transactionData.vin[i], 'input'))
        .on('mouseleave', () => onHover?.(null, null));

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
        .on('mouseenter', () => onHover?.(transactionData.vout[i], 'output'))
        .on('mouseleave', () => onHover?.(null, null));

      // If spent, add small rect
      if (outspends[i]?.spent) {
        g.append('rect')
          .attr('x', halfLength + lineSpacing / 2)
          .attr('y', endY - thickness / 2)
          .attr('width', lineSpacing * 2)
          .attr('height', thickness)
          .attr('fill', '#aaa')
          .style('cursor', 'pointer');
      }

      outputEndpointY += thickness + lineSpacing;
    });

    // Fee
    if (transactionData.fee) {
      const feeY = outputEndpointY + feeThickness / 2;
      const pathD = `
        M 0,${feeY}
        C ${halfLength * 0.25},${feeY}
          ${halfLength * 0.5},${feeY}
          ${halfLength},${feeY}
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
        }, 'fee'))
        .on('mouseleave', () => onHover?.(null, null));
    }

    // Notify parent of the first input line’s start
    if (onPositionsComputed && firstInputX != null && firstInputY != null) {
      onPositionsComputed({ firstInputX, firstInputY });
    }
  }, [
    transactionData, 
    outspends, 
    onHover,
    lineThicknessRatio, 
    lineSpacing, 
    lineLength, 
    minLineThickness,
    onPositionsComputed
  ]);

  return <g ref={groupRef} />;
};

export default TransactionChart;


