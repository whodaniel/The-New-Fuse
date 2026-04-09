import React from 'react';

export const Card = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);

export default Card;