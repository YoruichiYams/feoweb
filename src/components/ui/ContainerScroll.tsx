import React, { useRef, useState, useEffect } from 'react';
import { useScroll, useTransform, motion, MotionValue } from 'framer-motion';
import './ContainerScroll.css';

interface ContainerScrollProps {
  titleComponent: string | React.ReactNode;
  children: React.ReactNode;
}

export const ContainerScroll: React.FC<ContainerScrollProps> = ({
  titleComponent,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const scaleDimensions = isMobile ? [0.92, 1] : [1.02, 1];
  const rotate = useTransform(scrollYProgress, [0, 0.6], [16, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.6], scaleDimensions);
  const translate = useTransform(scrollYProgress, [0, 0.6], [0, -40]);

  return (
    <div ref={containerRef} className="container-scroll-root">
      <div className="container-scroll-perspective-box">
        <ScrollHeader translate={translate} titleComponent={titleComponent} />
        <ScrollCard rotate={rotate} scale={scale}>
          {children}
        </ScrollCard>
      </div>
    </div>
  );
};

interface ScrollHeaderProps {
  translate: MotionValue<number>;
  titleComponent: string | React.ReactNode;
}

const ScrollHeader: React.FC<ScrollHeaderProps> = ({ translate, titleComponent }) => {
  return (
    <motion.div
      style={{
        y: translate,
      }}
      className="container-scroll-header"
    >
      {titleComponent}
    </motion.div>
  );
};

interface ScrollCardProps {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  children: React.ReactNode;
}

const ScrollCard: React.FC<ScrollCardProps> = ({ rotate, scale, children }) => {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
      }}
      className="container-scroll-card"
    >
      <div className="container-scroll-card-inner">{children}</div>
    </motion.div>
  );
};
