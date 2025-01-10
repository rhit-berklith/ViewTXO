import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const TransactionChart = ({ 
  transactionData, 
  lineThicknessRatio, 
  lineSpacing,
  lineLength,
  minLineThickness,
}) => {
  const groupRef = useRef();

  useEffect(() => {
    if (!transactionData || !transactionData.vin || !transactionData.vout) return;

    const g = d3.select(groupRef.current);
    g.selectAll('*').remove();

    // Calculate the total input and output values for proportional scaling
    const totalValue = d3.max([
      ...transactionData.vin.map(d => d.prevout?.value || 0),
      ...transactionData.vout.map(d => d.value),
      transactionData.fee ? transactionData.fee : 0
    ]) || 1;

    // Adjust scale to be purely proportional with larger range
    const valueScale = d3.scaleLinear()
      .domain([0, totalValue])
      .range([0, 80]); // Doubled maximum thickness

    // First, calculate all line thicknesses
    const inputThicknesses = transactionData.vin.map(input => 
      Math.max(minLineThickness, valueScale(input.prevout?.value || 0) * lineThicknessRatio)
    );
    const outputThicknesses = transactionData.vout.map(output => 
      Math.max(minLineThickness, valueScale(output.value) * lineThicknessRatio)
    );
    const feeThickness = transactionData.fee ? 
      Math.max(minLineThickness, valueScale(transactionData.fee) * lineThicknessRatio) : 0;

    // Calculate total height in the middle where lines meet
    const totalLineThickness = [...inputThicknesses, ...outputThicknesses, feeThickness].reduce((a, b) => a + b, 0);

    // Calculate total thickness for inputs and outputs separately
    const totalInputThickness = inputThicknesses.reduce((a, b) => a + b, 0);
    const totalOutputThickness = [...outputThicknesses, feeThickness].reduce((a, b) => a + b, 0);

    // Initialize accumulators for endpoint positions
    let inputEndpointY = -(totalInputThickness + (inputThicknesses.length - 1) * lineSpacing) / 2;
    let outputEndpointY = -(totalOutputThickness + (outputThicknesses.length - 1) * lineSpacing) / 2;

    // Calculate control points based on line length
    const halfLength = lineLength / 2;
    const cp1 = -halfLength * 0.5;
    const cp2 = -halfLength * 0.25;

    // Calculate accumulated center positions for inputs and outputs
    const inputMiddlePositions = [];
    let accumulatedInputHeight = 0;
    inputThicknesses.forEach(thickness => {
      inputMiddlePositions.push(accumulatedInputHeight + thickness / 2);
      accumulatedInputHeight += thickness;
    });

    const outputMiddlePositions = [];
    let accumulatedOutputHeight = 0;
    outputThicknesses.forEach(thickness => {
      outputMiddlePositions.push(accumulatedOutputHeight + thickness / 2);
      accumulatedOutputHeight += thickness;
    });

    // Center everything vertically
    const totalHeight = Math.max(accumulatedInputHeight, accumulatedOutputHeight + (transactionData.fee ? feeThickness : 0));
    const verticalOffset = -totalHeight / 2;

    // Draw inputs
    inputThicknesses.forEach((thickness, i) => {
      const startY = inputEndpointY + thickness / 2;
      const middleY = verticalOffset + inputMiddlePositions[i];

      g.append('path')
        .attr('d', `
          M ${-halfLength},${startY}
          C ${cp1},${startY}
          ${cp2},${middleY}
          0,${middleY}
        `)
        .attr('stroke', '#0f0')
        .attr('stroke-width', thickness)
        .attr('fill', 'none');

      inputEndpointY += thickness + lineSpacing;
    });

    // Draw outputs
    outputThicknesses.forEach((thickness, i) => {
      const endY = outputEndpointY + thickness / 2;
      const middleY = verticalOffset + outputMiddlePositions[i];

      g.append('path')
        .attr('d', `
          M 0,${middleY}
          C ${-cp2},${middleY}
          ${-cp1},${endY}
          ${halfLength},${endY}
        `)
        .attr('stroke', '#0ff')
        .attr('stroke-width', thickness)
        .attr('fill', 'none');

      outputEndpointY += thickness + lineSpacing;
    });

    // Draw fee if exists with longer path
    if (transactionData.fee) {
      const endY = outputEndpointY + feeThickness / 2;
      const middleY = verticalOffset + accumulatedOutputHeight + feeThickness / 2;

      g.append('path')
        .attr('d', `
          M 0,${middleY}
          C ${-cp2},${middleY}
          ${-cp1},${endY}
          ${halfLength},${endY}
        `)
        .attr('stroke', '#f55')
        .attr('stroke-width', feeThickness)
        .attr('fill', 'none');
    }

  }, [transactionData, lineThicknessRatio, lineSpacing, lineLength, minLineThickness]); // Add dependencies

  return (
    <svg width="100%" height="100%" viewBox={`${-lineLength/2} -200 ${lineLength} 400`}>
      <g ref={groupRef} />
    </svg>
  );
};

TransactionChart.defaultProps = {
  lineLength: 400,
  minLineThickness: 0.1,
  lineThicknessRatio: 1,
  lineSpacing: 10
};

export default TransactionChart;
