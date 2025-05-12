"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { cn } from "../../../src/lib/utils";

interface BackgroundCellsProps {
  children?: React.ReactNode;
  className?: string;
}

export const BackgroundCells = ({ children, className }: BackgroundCellsProps) => {
  return (
    <div className={cn("relative bg-black h-screen flex justify-center overflow-hidden", className)}>
      <BackgroundCellCore />
      {children && (
        <div className="relative z-50 mt-40">
          {children}
        </div>
      )}
    </div>
  );
};

const BackgroundCellCore = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (event: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      setMousePosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    }
  };

  const size = 300; // Size of the radial gradient mask

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className="h-full absolute inset-0"
    >
      <div className="absolute h-full inset-y-0 overflow-hidden">
        {/* Bottom fade mask */}
        <div className="absolute h-full w-full pointer-events-none -bottom-2 z-40 [mask-image:linear-gradient(to_bottom,transparent,black)]" />
        {/* Radial gradient mask following mouse */}
        <div
          className="absolute inset-0 z-20 bg-transparent"
          style={{
            maskImage: `radial-gradient(${size / 4}px circle at center, white, transparent)`,
            maskPosition: `${mousePosition.x - size / 2}px ${mousePosition.y - size / 2}px`,
            maskSize: `${size}px`,
            maskRepeat: "no-repeat",
          }}
        >
          <Pattern cellClassName="border-[#8b0000] relative z-[100]" />
        </div>
        {/* Base grid pattern */}
        <Pattern className="opacity-[1]" cellClassName="border-[#8b0000]" />
      </div>
    </div>
  );
};

interface PatternProps {
  className?: string;
  cellClassName?: string;
}

const Pattern = ({ className, cellClassName }: PatternProps) => {
  // Configurable grid size (adjust based on needs)
  const gridWidth = 47;
  const gridHeight = 30;
  const x = new Array(gridWidth).fill(0);
  const y = new Array(gridHeight).fill(0);
  const matrix = x.map((_, i) => y.map((_, j) => [i, j]));
  const [clickedCell, setClickedCell] = useState<[number, number] | null>(null);

  return (
    <div className={cn("flex flex-row relative z-30", className)}>
      {matrix.map((row, rowIdx) => (
        <div
          key={`row-${rowIdx}`}
          className="flex flex-col relative z-20 border-b"
        >
          {row.map((_, colIdx) => {
            const controls = useAnimation();

            useEffect(() => {
              if (clickedCell) {
                const distance = Math.sqrt(
                  Math.pow(clickedCell[0] - rowIdx, 2) +
                    Math.pow(clickedCell[1] - colIdx, 2)
                );
                controls.start({
                  opacity: [0, 1 - distance * 0.1, 0],
                  transition: { duration: distance * 0.15 },
                });
              }
            }, [clickedCell, controls]);

            return (
              <div
                key={`col-${colIdx}`}
                className={cn(
                  "bg-transparent border-l border-b border-neutral-600",
                  cellClassName
                )}
                onClick={() => setClickedCell([rowIdx, colIdx])}
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: [0, 1, 0.5] }}
                  transition={{ duration: 0.5, ease: "backOut" }}
                  animate={controls}
                  className="bg-[rgba(139,0,0,0.1)] h-12 w-12"
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};