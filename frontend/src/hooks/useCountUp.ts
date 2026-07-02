'use client'

import { useEffect, useState, useRef } from 'react';
import { useInView, useSpring } from 'framer-motion';

export const useCountUp = (targetValue: number, duration: number = 2, decimals: number = 0) => {
  const ref = useRef<any>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [displayValue, setDisplayValue] = useState("0");

  const springValue = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  });

  useEffect(() => {
    if (isInView) {
      springValue.set(targetValue);
    }
  }, [isInView, springValue, targetValue]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      setDisplayValue(latest.toFixed(decimals));
    });
  }, [springValue, decimals]);

  return { ref, value: displayValue };
};
