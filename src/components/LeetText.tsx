'use client';

import { useState } from 'react';

interface LeetTextProps {
  text: string;
  leet: string;
  className?: string;
}

export default function LeetText({ text, leet, className }: LeetTextProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <span
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered ? leet : text}
    </span>
  );
}
