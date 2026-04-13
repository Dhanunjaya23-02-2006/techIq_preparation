import { motion } from 'framer-motion';

const ThreeDRocket = ({ size = 40, className = "" }) => {
  return (
    <motion.div
      className={`inline-block relative ${className}`}
      style={{
        width: size,
        height: size,
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <motion.div
        animate={{
          y: [0, -10, 0],
          rotateX: [0, 5, 0],
          rotateY: [0, -10, 0],
          rotateZ: [0, 2, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          filter: 'drop-shadow(0 0 15px rgba(255, 153, 51, 0.4))',
        }}
        whileHover={{ scale: 1.1, rotateZ: 10 }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: '100%' }}
        >
          {/* Rocket Body - 3D effect via gradients and layering */}
          <defs>
            <linearGradient id="rocketBody" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F8FAFC" />
              <stop offset="50%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>
            <linearGradient id="rocketWindow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
            <linearGradient id="flameGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FF9933" />
              <stop offset="60%" stopColor="#FF4500" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>

          {/* Exhaust Flame */}
          <motion.path
            d="M12 20C12 20 10 22 10 23C10 24 11 24 12 24C13 24 14 24 14 23C14 22 12 20 12 20Z"
            fill="url(#flameGradient)"
            animate={{
              scaleY: [1, 1.5, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 0.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Fins / Wings */}
          <path
            d="M7 16L4 19V14L7 12V16Z"
            fill="#64748B"
          />
          <path
            d="M17 16L20 19V14L17 12V16Z"
            fill="#64748B"
          />

          {/* Main Body */}
          <path
            d="M12 2C12 2 7 6 7 12V17H17V12C17 6 12 2 12 2Z"
            fill="url(#rocketBody)"
          />

          {/* Window */}
          <circle cx="12" cy="8" r="2" fill="url(#rocketWindow)" />
          <circle cx="12" cy="8" r="1.5" fill="rgba(255,255,255,0.2)" />
          
          {/* Nose Tip */}
          <path d="M12 2C12 2 10 4 10 6H14C14 4 12 2 12 2Z" fill="#F43F5E" />
        </svg>

        {/* Dynamic Glow Trail */}
        <motion.div
           style={{
             position: 'absolute',
             bottom: '-10%',
             left: '50%',
             transform: 'translateX(-50%) translateZ(-1px)',
             width: '60%',
             height: '40%',
             background: 'radial-gradient(ellipse at center, rgba(255,153,51,0.4) 0%, transparent 80%)',
             filter: 'blur(8px)',
             zIndex: -1
           }}
           animate={{
             opacity: [0.3, 0.7, 0.3],
             scale: [0.8, 1.2, 0.8]
           }}
           transition={{
             duration: 1.5,
             repeat: Infinity,
             ease: "linear"
           }}
        />
      </motion.div>
    </motion.div>
  );
};

export default ThreeDRocket;
