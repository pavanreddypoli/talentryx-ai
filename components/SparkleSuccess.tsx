"use client";

import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import { useEffect, useState } from "react";

export default function SparkleSuccess({ trigger }: { trigger: boolean }) {
  const { width, height } = useWindowSize();
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (trigger) {
      setActive(true);
      setTimeout(() => setActive(false), 2500); // auto-stop
    }
  }, [trigger]);

  if (!active) return null;

  return (
    <Confetti
      width={width}
      height={height}
      numberOfPieces={220}
      recycle={false}
      gravity={0.15}
    />
  );
}
