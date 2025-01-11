import React from 'react';

const SimpleBackground = () => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#222', // or any dark gray you prefer
        zIndex: 0
      }}
    />
  );
};

export default SimpleBackground;