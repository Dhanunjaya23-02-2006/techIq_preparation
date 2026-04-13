import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const Medal3D = ({ type = 'gold', size = 100, label = '1' }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const colors = {
    gold: {
      primary: '#FFD700',
      secondary: '#DAA520',
      shadow: 'rgba(218, 165, 32, 0.6)',
      text: '#000',
      glow: 'rgba(255, 215, 0, 0.3)'
    },
    silver: {
      primary: '#C0C0C0',
      secondary: '#A9A9A9',
      shadow: 'rgba(169, 169, 169, 0.6)',
      text: '#000',
      glow: 'rgba(192, 192, 192, 0.3)'
    },
    bronze: {
      primary: '#CD7F32',
      secondary: '#A0522D',
      shadow: 'rgba(160, 82, 45, 0.6)',
      text: '#fff',
      glow: 'rgba(205, 127, 50, 0.3)'
    }
  };

  const color = colors[type] || colors.gold;

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        width: size,
        height: size,
        perspective: '1000px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        cursor: 'pointer'
      }}
      whileHover={{ scale: 1.1 }}
    >
      {/* Glow Effect */}
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute',
          width: '140%',
          height: '140%',
          background: `radial-gradient(circle, ${color.glow} 0%, transparent 70%)`,
          borderRadius: '50%',
          zIndex: 0
        }}
      />

      {/* 3D Medal Body */}
      <motion.div
        style={{
          width: '100%',
          height: '100%',
          background: `linear-gradient(135deg, ${color.primary}, ${color.secondary})`,
          borderRadius: '50%',
          border: `4px solid ${color.primary}`,
          boxShadow: `0 10px 25px -5px ${color.shadow}, inset 0 0 15px rgba(255,255,255,0.6)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
          transformStyle: 'preserve-3d',
          rotateX,
          rotateY
        }}
      >
        <div style={{
          fontSize: size * 0.4,
          fontWeight: 900,
          color: color.text,
          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          transform: 'translateZ(20px)',
          fontFamily: "'Outfit', sans-serif"
        }}>
          {label}
        </div>
        
        {/* Shine Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)',
          pointerEvents: 'none',
          transform: 'translateZ(5px)'
        }} />

        {/* Ribbons */}
        <motion.div 
          animate={{ rotate: [15, 12, 15] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: 'absolute',
            top: '-25%',
            width: '45%',
            height: '45%',
            background: type === 'gold' ? '#f87171' : '#60a5fa',
            clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
            zIndex: -1,
            transform: 'translateZ(-10px)'
          }} 
        />
        <motion.div 
          animate={{ rotate: [-15, -12, -15] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          style={{
            position: 'absolute',
            top: '-25%',
            width: '45%',
            height: '45%',
            background: type === 'gold' ? '#ef4444' : '#3b82f6',
            clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
            zIndex: -1,
            transform: 'translateZ(-10px)'
          }} 
        />
      </motion.div>
    </motion.div>
  );
};

export default Medal3D;
