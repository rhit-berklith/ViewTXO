import React, { useRef, useEffect } from 'react';

const GridBackground = ({ transform }) => {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Match canvas resolution to display
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Draw grid
    const drawGrid = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const gridSize = 12.5; // Halved grid size
      const { x, y, k } = transform;

      ctx.fillStyle = '#444';
      ctx.fillRect(0, 0, rect.width, rect.height);

      ctx.fillStyle = '#333';
      const scaledGridSize = gridSize * k;

      // Calculate global tile indices to maintain consistent coloring
      const globalIStart = Math.floor(-x / scaledGridSize) - 1;
      const globalJStart = Math.floor(-y / scaledGridSize) - 1;

      for (let i = -1; i < Math.ceil(rect.width / scaledGridSize) + 2; i++) {
        for (let j = -1; j < Math.ceil(rect.height / scaledGridSize) + 2; j++) { // Corrected to use j
          const globalI = globalIStart + i;
          const globalJ = globalJStart + j;

          // Determine color based on global tile indices to prevent color swapping
          if ((globalI + globalJ) % 2 === 0) {
            ctx.fillStyle = '#333';
          } else {
            ctx.fillStyle = '#444';
          }

          ctx.fillRect(
            i * scaledGridSize + ((x % scaledGridSize) + scaledGridSize) % scaledGridSize,
            j * scaledGridSize + ((y % scaledGridSize) + scaledGridSize) % scaledGridSize,
            scaledGridSize,
            scaledGridSize
          );
        }
      }
    };

    drawGrid();
  }, [transform]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0
      }}
    />
  );
};

export default GridBackground;
