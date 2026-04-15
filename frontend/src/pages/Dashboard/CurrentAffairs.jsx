import React, { useState, useEffect, useRef, Suspense } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { HiGlobeAlt, HiCalendar, HiBadgeCheck, HiRefresh, HiSearch, HiLightBulb, HiX, HiStar, HiArrowRight, HiDocumentText } from 'react-icons/hi';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Float } from '@react-three/drei';
import { contentService } from '../../services/testService';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';


export default function CurrentAffairs() {
  const [activeTab, setActiveTab] = useState('Daily');
  const [rawNews, setRawNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNews, setSelectedNews] = useState(null);
  const [showHighYieldOnly, setShowHighYieldOnly] = useState(false);
  useAuthStore();

  // 3D Tilt Motion Values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [15, -15]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15, 15]), springConfig);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Procedural Satellite
  const Satellite = ({ radius, speed, color, tilt }) => {
    const satelliteRef = useRef();

    useFrame(({ clock }) => {
      const t = clock.getElapsedTime() * speed;
      satelliteRef.current.position.x = Math.cos(t) * radius;
      satelliteRef.current.position.z = Math.sin(t) * radius;
    });

    return (
      <group rotation={[tilt, 0, 0]}>
        {/* Orbital Path */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius, radius + 0.01, 64]} />
          <meshBasicMaterial color={color} transparent opacity={0.2} side={THREE.DoubleSide} />
        </mesh>


        {/* Pulsing Satellite Node */}
        <mesh ref={satelliteRef}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshBasicMaterial color={color} />
          <pointLight color={color} intensity={2} distance={1} />
        </mesh>
      </group>
    );
  };

  // Procedural Realistic Earth with GLSL Shaders
  const RealisticEarth = () => {
    const earthRef = useRef();
    const cloudsRef = useRef();

    // Custom Shader for Earth (Land/Sea)
    const earthShader = {
      uniforms: {
        time: { value: 0 },
        sunDirection: { value: new THREE.Vector3(5, 5, 5).normalize() }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 sunDirection;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;

        // Simple Noise Function
        float hash(vec3 p) {
          p = fract(p * 0.3183099 + 0.1);
          p *= 17.0;
          return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }

        float noise(vec3 x) {
          vec3 i = floor(x);
          vec3 f = fract(x);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(hash(i + vec3(0, 0, 0)), hash(i + vec3(1, 0, 0)), f.x),
                         mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
                     mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x),
                         mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
        }

        float fbm(vec3 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 5; i++) {
            v += a * noise(p);
            p *= 2.0;
            a *= 0.5;
          }
          return v;
        }

        void main() {
          float n = fbm(vPosition * 1.5 + vec3(0.0, time * 0.02, 0.0));
          
          // Define Earth Colors
          vec3 deepOcean = vec3(0.05, 0.15, 0.4);
          vec3 shallowOcean = vec3(0.1, 0.3, 0.6);
          vec3 landGreen = vec3(0.15, 0.45, 0.15);
          vec3 mountainBrown = vec3(0.4, 0.3, 0.2);
          vec3 polarWhite = vec3(0.95, 0.95, 1.0);

          vec3 color;
          float dotProduct = dot(vNormal, sunDirection);
          float brightness = max(0.1, dotProduct);

          if (n < 0.45) {
            color = mix(deepOcean, shallowOcean, smoothstep(0.3, 0.45, n));
          } else {
            color = mix(landGreen, mountainBrown, smoothstep(0.45, 0.65, n));
            if (abs(vPosition.y) > 1.8) {
               color = mix(color, polarWhite, smoothstep(1.8, 2.0, abs(vPosition.y)));
            }
          }

          // Specular for water
          float spec = 0.0;
          if (n < 0.45) {
            vec3 reflectDir = reflect(-sunDirection, vNormal);
            vec3 viewDir = normalize(-vPosition); // Simplified
            spec = pow(max(dot(reflectDir, viewDir), 0.0), 32.0) * 0.5;
          }

          gl_FragColor = vec4(color * brightness + spec, 1.0);
        }
      `
    };

    // Custom Shader for Clouds
    const cloudShader = {
      uniforms: { time: { value: 0 } },
      vertexShader: earthShader.vertexShader,
      fragmentShader: `
        uniform float time;
        varying vec3 vPosition;

        float hash(vec3 p) {
          p = fract(p * 0.3183099 + 0.1);
          p *= 17.0;
          return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }

        float noise(vec3 x) {
          vec3 i = floor(x);
          vec3 f = fract(x);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(hash(i + vec3(0, 0, 0)), hash(i + vec3(1, 0, 0)), f.x),
                         mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
                     mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x),
                         mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
        }

        void main() {
          float n = noise(vPosition * 1.8 + vec3(time * 0.05, time * 0.03, 0.0));
          float alpha = smoothstep(0.5, 0.8, n) * 0.6;
          gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
        }
       `
    };

    useFrame(({ clock }) => {
      const t = clock.getElapsedTime();
      earthRef.current.rotation.y = t * 0.05;
      earthRef.current.material.uniforms.time.value = t;
      cloudsRef.current.rotation.y = t * 0.07;
      cloudsRef.current.material.uniforms.time.value = t;
    });

    return (
      <group>
        {/* Main Earth Sphere */}
        <mesh ref={earthRef}>
          <sphereGeometry args={[2, 64, 64]} />
          <shaderMaterial attach="material" {...earthShader} />
        </mesh>

        {/* Cloud Layer */}
        <mesh ref={cloudsRef} scale={[1.03, 1.03, 1.03]}>
          <sphereGeometry args={[2, 64, 64]} />
          <shaderMaterial attach="material" {...cloudShader} transparent depthWrite={false} />
        </mesh>

        {/* Atmospheric Atmosphere Glow */}
        <mesh scale={[1.15, 1.15, 1.15]}>
          <sphereGeometry args={[2, 64, 64]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.08} side={THREE.BackSide} />
        </mesh>

        {/* Orbits - Adjusted to match Earth look */}
        <Satellite radius={2.8} speed={0.3} color="#FF9933" tilt={0.5} />
        <Satellite radius={3.5} speed={0.2} color="#138808" tilt={-0.3} />
        <Satellite radius={4.2} speed={0.12} color="#ffffff" tilt={0.8} />

      </group>
    );
  };



  const HyperGlobe = () => {
    return (
      <div style={{ width: '400px', height: '400px', position: 'relative' }}>
        <Canvas
          camera={{ position: [0, 0, 6], fov: 45 }}
          gl={{ alpha: true, antialias: true }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0); // Transparent background
          }}
        >
          <Suspense fallback={null}>
            <Float
              speed={1.5}
              rotationIntensity={0.2}
              floatIntensity={0.1}
            >
              <RealisticEarth />
            </Float>
          </Suspense>
        </Canvas>
      </div>
    );
  };



  useEffect(() => {
    fetchNews();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedNews(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await contentService.getCurrentAffairs();
      setRawNews(res.data.results || res.data || []);
    } catch {
      toast.error("Failed to fetch current affairs");
    }
    setLoading(false);
  };

  const getLocalDateStr = (d = new Date()) => {
    // Returns YYYY-MM-DD in local time
    return d.getFullYear() + '-' + 
           String(d.getMonth() + 1).padStart(2, '0') + '-' + 
           String(d.getDate()).padStart(2, '0');
  };

  const filteredNews = rawNews.filter(item => {
    if (activeTab === 'Railway Special') {
      return item.category === 'railways';
    }

    const newsDate = new Date(item.date);
    const newsDateStr = item.date; 
    const today = new Date();
    const todayStr = getLocalDateStr(today);

    if (activeTab === 'Daily') {
      return newsDateStr === todayStr;
    }

    if (activeTab === 'Weekly') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);
      return newsDate >= sevenDaysAgo;
    }

    if (activeTab === 'Monthly') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      return newsDate >= thirtyDaysAgo;
    }

    return true;
  }).filter(item => {
    if (showHighYieldOnly) return (item.importance_score || 0) >= 7;
    return true;
  }).filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return item.title.toLowerCase().includes(query) || item.content.toLowerCase().includes(query);
  }).sort((a, b) => (b.importance_score || 0) - (a.importance_score || 0));

  return (
    <div className="animate-fadeIn" style={{ padding: '20px' }}>

      {/* Hero Banner with 3D Globe */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
        style={{
          padding: '40px',
          marginBottom: '32px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 420px',
          gap: '40px',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(255,153,51,0.08) 0%, rgba(19,136,8,0.08) 100%)',
          border: '1px solid var(--border)',
          overflow: 'hidden'
        }}
      >

        <div>
          <span style={{
            background: 'rgba(19, 136, 8, 0.1)',
            color: 'var(--green)',
            padding: '6px 14px',
            borderRadius: '100px',
            fontSize: '0.75rem',
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '20px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <HiGlobeAlt size={14} /> Global Updates
          </span>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '16px', lineHeight: 1.1 }}>
            Daily <span className="gradient-text">Current Affairs</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '480px', lineHeight: 1.6 }}>
            Stay ahead of the curve. Master the General Awareness section with crisp, exam-focused updates delivered every day.
          </p>
        </div>

        <div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ position: 'relative', width: '400px', height: '400px', perspective: '1500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {/* Subtle Ambient Background - Blends with Page */}
          <div style={{ position: 'absolute', inset: -100, zIndex: -1, pointerEvents: 'none' }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at center, rgba(255, 153, 51, 0.05) 0%, transparent 70%)',
              opacity: 0.6
            }} />
          </div>

          {/* THE HYPER-REALISTIC THREE.JS GLOBE */}
          <motion.div style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            transformStyle: 'preserve-3d',
            rotateX,
            rotateY
          }}>
            <HyperGlobe />
          </motion.div>

        </div>



      </motion.div>

      {/* Search & High Yield Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '600px' }}>
          <HiSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={20} />
          <input
            type="text"
            placeholder="Search news, topics, or events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 14px 14px 48px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border)',
              color: '#fff',
              fontSize: '1rem',
              outline: 'none',
              transition: 'all 0.2s'
            }}
          />
        </div>

        <button
          onClick={() => setShowHighYieldOnly(!showHighYieldOnly)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 24px',
            borderRadius: '12px',
            background: showHighYieldOnly ? 'rgba(255,153,51,0.2)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${showHighYieldOnly ? 'var(--saffron)' : 'var(--border)'}`,
            color: showHighYieldOnly ? 'var(--saffron)' : 'var(--text-secondary)',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          <HiStar size={20} /> {showHighYieldOnly ? 'Showing High Yield' : 'Show High Yield Only'}
        </button>
      </div>

      {/* Tabs & Admin Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ display: 'flex', gap: '32px' }}>
          {['Daily', 'Weekly', 'Monthly', 'Railway Special'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === tab ? 'var(--green)' : 'var(--text-secondary)',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                position: 'relative',
                padding: '8px 0',
                transition: 'all 0.2s'
              }}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTabIndicator"
                  style={{ position: 'absolute', bottom: '-13px', left: 0, right: 0, height: '3px', background: 'var(--green)', borderRadius: '100px', boxShadow: '0 0 10px var(--green)' }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content Timeline */}
      <motion.div
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
        }}
        initial="hidden"
        animate="visible"
        style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
      >
        {loading ? (
          <div style={{ padding: '80px 0', textAlign: 'center' }}>
            <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--green)', borderRadius: '50%', margin: '0 auto 20px' }}></div>
            <p style={{ color: 'var(--text-secondary)' }}>Analyzing global trends...</p>
          </div>
        ) : filteredNews.length > 0 ? (
          filteredNews.map((item, idx) => (
            <motion.div
              key={item.id || idx}
              variants={{
                hidden: { y: 20, opacity: 0 },
                visible: { y: 0, opacity: 1 }
              }}
              whileHover={{ y: -5, background: 'rgba(255,255,255,0.04)' }}
              className="glass-card"
              onClick={() => setSelectedNews(item)}
              style={{
                padding: '28px',
                display: 'flex',
                gap: '24px',
                borderLeft: `4px solid ${item.category === 'railways' ? 'var(--saffron)' : 'var(--green)'}`,
                position: 'relative',
                background: 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{
                    background: item.category === 'railways' ? 'rgba(255,153,51,0.1)' : 'rgba(19, 136, 8, 0.1)',
                    padding: '4px 14px',
                    borderRadius: '100px',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    color: item.category === 'railways' ? 'var(--saffron)' : 'var(--green)',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase'
                  }}>
                    {item.category.replace('_', ' & ')}
                  </span>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {item.importance_score && (
                      <div style={{
                        background: item.importance_score >= 8 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,153,51,0.1)',
                        padding: '4px 12px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: `1px solid ${item.importance_score >= 8 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,153,51,0.2)'}`
                      }}>
                        <HiStar size={14} color={item.importance_score >= 8 ? '#ef4444' : 'var(--saffron)'} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: item.importance_score >= 8 ? '#ef4444' : 'var(--saffron)' }}>
                          {item.importance_score * 10}% Probable
                        </span>
                      </div>
                    )}
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                      <HiCalendar /> {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '16px', color: '#fff' }}>{item.title}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {item.content.split('\n').filter(p => p.trim()).map((pt, i) => (
                    <div key={i} style={{ display: 'flex', gap: '12px', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                      <HiBadgeCheck style={{ color: item.category === 'railways' ? 'var(--saffron)' : 'var(--green)', flexShrink: 0, marginTop: '2px' }} size={18} />
                      {pt.replace('•', '').trim()}
                    </div>
                  ))}
                </div>

                {item.exam_insight && (
                  <div style={{
                    marginTop: '20px',
                    padding: '12px 16px',
                    background: 'rgba(255,153,51,0.05)',
                    border: '1px solid rgba(255,153,51,0.1)',
                    borderRadius: '12px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start'
                  }}>
                    <HiLightBulb style={{ color: 'var(--saffron)', flexShrink: 0, marginTop: '2px' }} size={18} />
                    <div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--saffron)', textTransform: 'uppercase', display: 'block', marginBottom: '4px', letterSpacing: '0.05em' }}>Railway Exam Insight</span>
                      <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', marginBottom: 0 }}>{item.exam_insight}</p>
                    </div>
                  </div>
                )}

                <button
                  style={{
                    marginTop: '24px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border)',
                    color: '#fff',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  Read Study Analysis <HiArrowRight />
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <HiGlobeAlt size={48} style={{ opacity: 0.1, marginBottom: '20px' }} />
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{activeTab === 'Daily' ? "Today's updates are being synchronized" : "No news items found in this category"}</p>
            <p style={{ fontSize: '0.9rem', marginBottom: '20px' }}>{activeTab === 'Daily' ? "Our AI is busy analyzing the latest global trends for you." : "Try switching tabs or check back later."}</p>
            {activeTab === 'Daily' && (
              <button 
                onClick={() => setActiveTab('Weekly')}
                className="btn-secondary" 
                style={{ padding: '10px 24px', borderRadius: '10px', fontSize: '0.9rem' }}
              >
                View Latest Weekly News
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* Modal / Reader Mode - Portalled to Body for absolute stacking safety */}
      {ReactDOM.createPortal(
        <AnimatePresence>
          {selectedNews && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              <motion.div
                key="modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedNews(null)}
                style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)' }}
              />
              <motion.div
                key="modal-content"
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                onClick={(e) => e.stopPropagation()}
                className="glass-card"
                style={{
                  width: '100%',
                  maxWidth: '900px',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  padding: '0',
                  position: 'relative',
                  background: '#0f172a',
                  border: '1px solid rgba(255,153,51,0.2)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
              >
                {/* Modal Header */}
                <div style={{ position: 'sticky', top: 0, background: '#0f172a', padding: '24px 40px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: 'rgba(255,153,51,0.1)', color: 'var(--saffron)', padding: '4px 12px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                      {selectedNews.category} Expert Analysis
                    </div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>{new Date(selectedNews.date).toLocaleDateString('en-IN', { dateStyle: 'long' })}</span>
                  </div>
                  <button onClick={() => setSelectedNews(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex' }}>
                    <HiX size={20} />
                  </button>
                </div>

                {/* Modal Content */}
                <div style={{ padding: '40px' }}>
                  <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', marginBottom: '16px', lineHeight: '1.2', letterSpacing: '-0.02em' }}>{selectedNews.title}</h2>
                  <div style={{ height: '4px', width: '80px', background: 'var(--green)', borderRadius: '10px', marginBottom: '32px' }}></div>

                  <div style={{
                    display: 'flex',
                    gap: '24px',
                    padding: '24px',
                    background: 'rgba(255,153,51,0.03)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,153,51,0.1)',
                    marginBottom: '40px',
                    alignItems: 'center'
                  }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--saffron)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 10px 20px rgba(255,153,51,0.3)' }}>
                      <HiLightBulb size={32} color="#fff" />
                    </div>
                    <div>
                      <h4 style={{ color: 'var(--saffron)', fontWeight: 800, marginBottom: '6px', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Railway Exam Strategy</h4>
                      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', lineHeight: '1.6', margin: 0 }}>{selectedNews.exam_insight || "Analyze this topic for General Awareness and Current Affairs sections."}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '40px', padding: '16px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <HiDocumentText size={20} color="var(--green)" />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Detailed Analysis Portfolio</span>
                    <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', marginLeft: '10px' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(selectedNews.importance_score || 5) * 10}%` }}
                        style={{ height: '100%', background: 'var(--green)', borderRadius: '10px' }}
                      />
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--green)' }}>Priority: {selectedNews.importance_score || 5}/10</span>
                  </div>

                  <div className="full-content-reader" style={{
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: '1.15rem',
                    lineHeight: '1.9',
                    whiteSpace: 'pre-wrap',
                    fontFamily: '"Inter", sans-serif',
                    marginBottom: '60px'
                  }}>
                    {selectedNews.full_content || selectedNews.content}
                  </div>

                  <div style={{
                    marginTop: '80px',
                    paddingTop: '40px',
                    borderTop: '1px solid var(--border)',
                    textAlign: 'center',
                    background: 'linear-gradient(to top, rgba(19,136,8,0.05) 0%, transparent 100%)',
                    padding: '40px',
                    borderRadius: '0 0 16px 16px'
                  }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', color: 'var(--green)', marginBottom: '16px' }}>
                      <HiBadgeCheck size={24} />
                      <span style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Verified Syllabus Content</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px' }}>
                      This topic has a high probability of appearing in RRB Group D and RRB NTPC Phase 2 exams. Ensure you remember the key stakeholders and dates.
                    </p>
                    <button onClick={() => setSelectedNews(null)} className="btn-primary" style={{ padding: '14px 48px', borderRadius: '12px', fontSize: '1rem', fontWeight: 800 }}>
                      Mark Complete & Continue
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
