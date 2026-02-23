/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';

// --- Constants ---
const CANVAS_WIDTH = 840;
const CANVAS_HEIGHT = 680;
const IMAGE_ENLARGE = 11;
const HEART_COLOR = "#FF0000";
const GENERATE_FRAMES = 20;

// --- Mathematical Functions ---

const heartFunction = (t: number, centerX: number, centerY: number) => {
  let x = 17 * (Math.pow(Math.sin(t), 3));
  let y = -(16 * Math.cos(t) - 5 * Math.cos(2 * t) - 3 * Math.cos(3 * t));

  x *= IMAGE_ENLARGE;
  y *= IMAGE_ENLARGE;
  x += centerX;
  y += centerY;

  return { x: Math.floor(x), y: Math.floor(y) };
};

const scatterInside = (x: number, y: number, centerX: number, centerY: number, beta = 0.15) => {
  const ratioX = -beta * Math.log(Math.random());
  const ratioY = -beta * Math.log(Math.random());

  const dx = ratioX * (x - centerX);
  const dy = ratioY * (y - centerY);

  return { x: x - dx, y: y - dy };
};

const shrink = (x: number, y: number, centerX: number, centerY: number, ratio: number) => {
  const force = -1 / Math.pow(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2), 0.6);
  const dx = ratio * force * (x - centerX);
  const dy = ratio * force * (y - centerY);
  return { x: x - dx, y: y - dy };
};

const curve = (p: number) => {
  return 2 * (2 * Math.sin(4 * p)) / (2 * Math.PI);
};

const calcPosition = (x: number, y: number, centerX: number, centerY: number, ratio: number) => {
  const force = 1 / Math.pow(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2), 0.420);
  const dx = ratio * force * (x - centerX) + (Math.floor(Math.random() * 3) - 1);
  const dy = ratio * force * (y - centerY) + (Math.floor(Math.random() * 3) - 1);
  return { x: x - dx, y: y - dy };
};

// --- Heart Class Implementation ---

class HeartSystem {
  points: { x: number; y: number }[] = [];
  edgeDiffusionPoints: { x: number; y: number }[] = [];
  centerDiffusionPoints: { x: number; y: number }[] = [];
  allFrames: { x: number; y: number; size: number }[][] = [];
  centerX: number;
  centerY: number;

  constructor(centerX: number, centerY: number) {
    this.centerX = centerX;
    this.centerY = centerY;
    this.build(1000);
    for (let frame = 0; frame < GENERATE_FRAMES; frame++) {
      this.calc(frame);
    }
  }

  build(number: number) {
    // Heart Outline
    for (let i = 0; i < number; i++) {
      const t = Math.random() * 2 * Math.PI;
      const pos = heartFunction(t, this.centerX, this.centerY);
      this.points.push(pos);
    }

    // Edge Diffusion
    this.points.forEach((p) => {
      for (let i = 0; i < 3; i++) {
        const pos = scatterInside(p.x, p.y, this.centerX, this.centerY, 0.05);
        this.edgeDiffusionPoints.push(pos);
      }
    });

    // Center Diffusion
    for (let i = 0; i < 5000; i++) {
      const p = this.points[Math.floor(Math.random() * this.points.length)];
      const pos = scatterInside(p.x, p.y, this.centerX, this.centerY, 0.27);
      this.centerDiffusionPoints.push(pos);
    }
  }

  calc(frame: number) {
    const ratio = 15 * curve((frame / 10) * Math.PI);
    const haloRadius = Math.floor(4 + 6 * (1 + curve((frame / 10) * Math.PI)));
    const haloNumber = Math.floor(1500 + 2000 * Math.pow(Math.abs(curve((frame / 10) * Math.PI)), 2));

    const framePoints: { x: number; y: number; size: number }[] = [];

    // Halo
    const haloPointsSet = new Set<string>();
    for (let i = 0; i < haloNumber; i++) {
      const t = Math.random() * 2 * Math.PI;
      let pos = heartFunction(t, this.centerX, this.centerY);
      pos = shrink(pos.x, pos.y, this.centerX, this.centerY, haloRadius);

      const key = `${Math.floor(pos.x)},${Math.floor(pos.y)}`;
      if (!haloPointsSet.has(key)) {
        haloPointsSet.add(key);
        const x = pos.x + (Math.floor(Math.random() * 121) - 60);
        const y = pos.y + (Math.floor(Math.random() * 121) - 60);
        const size = Math.random() > 0.33 ? 1 : 2;
        framePoints.push({ x, y, size });
      }
    }

    // Outline
    this.points.forEach((p) => {
      const pos = calcPosition(p.x, p.y, this.centerX, this.centerY, ratio);
      const size = Math.floor(Math.random() * 3) + 1;
      framePoints.push({ x: pos.x, y: pos.y, size });
    });

    // Edge Diffusion
    this.edgeDiffusionPoints.forEach((p) => {
      const pos = calcPosition(p.x, p.y, this.centerX, this.centerY, ratio);
      const size = Math.floor(Math.random() * 2) + 1;
      framePoints.push({ x: pos.x, y: pos.y, size });
    });

    // Center Diffusion
    this.centerDiffusionPoints.forEach((p) => {
      const pos = calcPosition(p.x, p.y, this.centerX, this.centerY, ratio);
      const size = Math.floor(Math.random() * 2) + 1;
      framePoints.push({ x: pos.x, y: pos.y, size });
    });

    this.allFrames[frame] = framePoints;
  }
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);
  const audioEnabledRef = useRef(false);
  const lastBeatRef = useRef(false);

  // Initialize the heart system once
  const heartSystem = useMemo(() => {
    return new HeartSystem(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }, []);

  const playHeartbeat = () => {
    if (!audioEnabledRef.current) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContextClass();

    const playThump = (frequency: number, volume: number, duration: number, delay: number) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, audioCtx.currentTime + delay);
      osc.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + delay + duration);

      gain.gain.setValueAtTime(volume, audioCtx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + delay + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(audioCtx.currentTime + delay);
      osc.stop(audioCtx.currentTime + delay + duration);
    };

    // "Lub-dub" sound
    playThump(60, 0.5, 0.15, 0);      // Lub
    playThump(50, 0.4, 0.12, 0.2);    // Dub
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const currentFrame = Math.floor(frameRef.current) % GENERATE_FRAMES;
      const points = heartSystem.allFrames[currentFrame];

      // Detect beat for sound
      // curve(p) = 2 * (2 * sin(4 * p)) / (2 * pi)
      // p = (frame / 10) * pi
      const p = (frameRef.current / 10) * Math.PI;
      const beatValue = Math.sin(4 * p);
      const isBeating = beatValue > 0.8;

      if (isBeating && !lastBeatRef.current) {
        playHeartbeat();
      }
      lastBeatRef.current = isBeating;

      // Calculate dynamic color based on frame
      const hue = (frameRef.current * 10) % 360;
      const dynamicColor = `hsl(${hue}, 100%, 60%)`;

      ctx.fillStyle = dynamicColor;
      points.forEach((p) => {
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });

      // Slow down the animation speed to one-third of the previous value.
      // Previous increment was 0.5, so 0.5 / 3 ≈ 0.1667
      frameRef.current += 0.1667; 
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [heartSystem]);

  const enableAudio = () => {
    audioEnabledRef.current = true;
    // Play a silent sound to unlock audio on mobile/safari
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContextClass();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  };

  return (
    <div 
      className="min-h-screen bg-[#050505] flex items-center justify-center overflow-hidden font-sans cursor-pointer"
      onClick={enableAudio}
    >
      <div className="relative group">
        {/* Decorative glow background */}
        <div className="absolute -inset-20 blur-[100px] rounded-full opacity-30 group-hover:opacity-50 transition-opacity duration-1000 animate-bg-cycle" />
        
        <div 
          ref={containerRef}
          className="relative z-10 bg-black rounded-2xl shadow-2xl border border-white/5 overflow-hidden"
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="block"
          />

          {/* Birthday Message Overlay */}
          <div className="absolute inset-0 flex items-start justify-center pt-16 pointer-events-none">
            <motion.div
              initial={{ opacity: 0.3 }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="text-4xl md:text-5xl font-bold tracking-[0.2em] select-none animate-color-cycle"
              style={{ fontFamily: '"Microsoft YaHei", sans-serif' }}
            >
              王悦丞生日快乐
            </motion.div>
          </div>
          
          {/* Subtle UI overlay */}
          <div className="absolute top-6 left-6 flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-[0.2em] font-mono opacity-40 animate-color-cycle">System Status</span>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse animate-bg-cycle" />
              <span className="text-xs font-medium opacity-60 animate-color-cycle">PULSE_ACTIVE</span>
            </div>
          </div>

          <div className="absolute bottom-6 right-6 text-right">
            <h1 className="text-xl font-light tracking-tighter italic font-serif opacity-80 animate-color-cycle">
              Beating Heart
            </h1>
            <p className="text-[9px] uppercase tracking-widest mt-1 opacity-30 animate-color-cycle">
              Parametric Equation v1.0
            </p>
            <p className="text-[8px] uppercase tracking-[0.3em] mt-4 opacity-20 animate-color-cycle">
              Click anywhere to enable pulse audio
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
