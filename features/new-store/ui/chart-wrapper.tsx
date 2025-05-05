import React, { ReactNode, useEffect, useRef, useState } from "react";

interface ResponsiveSVGWrapperProps {
  children: ReactNode;
  width: number;
  height: number;
  className?: string;
}

const ResponsiveSVGWrapper = ({
  children,
  width,
  height,
  className = "",
}: ResponsiveSVGWrapperProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({
    width: "100%",
    height: "100%",
    scale: 1,
  });

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;

        // Check if container has parent limits
        const parentWidth =
          containerRef.current.parentElement?.clientWidth || window.innerWidth;
        const parentHeight =
          containerRef.current.parentElement?.clientHeight ||
          window.innerHeight;

        // Base scale factors
        const scaleX = parentWidth / width;
        const scaleY = parentHeight / height;

        // Use the smaller scale to ensure the SVG fits in the container
        const scale = Math.min(scaleX, scaleY, 1); // Cap at 1 for minimum size

        // Check if we're on large screens (above 1920px width)
        const isLargeScreen = window.innerWidth >= 1920;
        const scaleFactor = isLargeScreen ? 1.2 : 1;

        setDimensions({
          width: `${width * scale}px`,
          height: `${height * scale}px`,
          scale: scale * scaleFactor,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial calculation

    return () => window.removeEventListener("resize", handleResize);
  }, [width, height]);

  return (
    <div
      ref={containerRef}
      className={`flex items-center justify-center ${className}`}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "450px",
      }}
    >
      <div
        style={{
          width: dimensions.width,
          height: dimensions.height,
          transform: `scale(${dimensions.scale})`,
          transformOrigin: "center center",
          transition: "transform 0.2s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default ResponsiveSVGWrapper;
