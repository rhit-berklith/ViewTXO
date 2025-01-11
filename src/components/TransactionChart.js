import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { fetchTxOutspends } from '../api/api'; // New import

const TransactionChart = ({ 
  transactionData, 
  lineThicknessRatio = 1,
  lineSpacing = 10,
  lineLength = 1500, // Updated default line length
  minLineThickness = 0.1, // Ensured minimum thickness ratio
  onHover
}) => {
  const groupRef = useRef();
  const [outspends, setOutspends] = useState(null);

  useEffect(() => {
    if (transactionData && transactionData.txid) {
      fetchTxOutspends(transactionData.txid)
        .then((data) => {
          // 'data' is an array with length = number of outputs
          // Each element indicates if/where the output is spent
          setOutspends(data);
        })
        .catch(console.error);
    }
  }, [transactionData]);

  useEffect(() => {
    console.log('TransactionChart mounting, groupRef:', groupRef.current);
    if (!transactionData || !transactionData.vin || !transactionData.vout) {
      console.log('No transaction data');
      return;
    }
    if (!outspends) return; // Wait until outspends are fetched

    const g = d3.select(groupRef.current);
    console.log('D3 selection:', g.node());

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

    // Draw inputs from -halfLength to 0
    inputThicknesses.forEach((thickness, i) => {
      const startY = inputEndpointY + thickness / 2;
      const middleY = verticalOffset + inputMiddlePositions[i];

      g.append('path')
        .attr('d', `
          M ${-halfLength},${startY}
          C ${-halfLength * 0.5},${startY}
          ${-halfLength * 0.25},${middleY}
          0,${middleY}
        `)
        .attr('stroke', '#0f0')
        .attr('stroke-width', thickness)
        .attr('fill', 'none')
        .style('cursor', 'pointer')
        .on('mouseenter', () => {
          onHover(transactionData.vin[i], 'input');
        })
        .on('mouseleave', () => {
          onHover(null, null);
        });

      inputEndpointY += thickness + lineSpacing;
    });

    // Draw outputs from 0 to +halfLength, staying on the right side
    outputThicknesses.forEach((thickness, i) => {
      const endY = outputEndpointY + thickness / 2;
      const middleY = verticalOffset + outputMiddlePositions[i];

      g.append('path')
        .attr('d', `
          M 0,${middleY}
          C ${halfLength * 0.25},${middleY}
            ${halfLength * 0.5},${endY}
            ${halfLength},${endY}
        `)
        .attr('stroke', '#0ff')
        .attr('stroke-width', thickness)
        .attr('fill', 'none')
        .style('cursor', 'pointer')
        .on('mouseenter', () => {
          onHover(transactionData.vout[i], 'output');
        })
        .on('mouseleave', () => {
          onHover(null, null);
        });

      // If outspends[i].spent is true, draw rectangle offset to the right
      if (outspends[i]?.spent) {
        g.append('rect')
          .attr('x', halfLength + (lineSpacing / 2)) // Use lineSpacing/2 for offset
          .attr('y', endY - thickness / 2) // Use the endpoint's Y instead of middleY
          .attr('width', thickness * 2)       // 2× height => 2:1 ratio
          .attr('height', thickness)
          .attr('fill', '#aaa')
          .style('cursor', 'pointer');
      }

      outputEndpointY += thickness + lineSpacing;
    });

    // Draw fee if exists, also from x=0 to x=+halfLength
    if (transactionData.fee) {
      const endY = outputEndpointY + feeThickness / 2;
      const middleY = verticalOffset + accumulatedOutputHeight + feeThickness / 2;

      g.append('path')
        .attr('d', `
          M 0,${middleY}
          C ${halfLength * 0.25},${middleY}
            ${halfLength * 0.5},${endY}
            ${halfLength},${endY}
        `)
        .attr('stroke', '#f55')
        .attr('stroke-width', feeThickness)
        .attr('fill', 'none')
        .style('cursor', 'pointer')
        .style('pointer-events', 'all') // Ensure events are captured
        .on('mouseenter', () => {
          onHover({ 
            value: transactionData.fee,
            scriptpubkey_address: null, // No address for fee
            scriptpubkey_type: null
          }, 'fee');
        })
        .on('mouseleave', () => {
          onHover(null, null);
        });
    }

  }, [transactionData, outspends, lineThicknessRatio, lineSpacing, lineLength, minLineThickness, onHover]); // Add dependencies

  console.log('Rendering TransactionChart');

  return <g ref={groupRef} />; // Removed the translate(...).
};

export default TransactionChart;
