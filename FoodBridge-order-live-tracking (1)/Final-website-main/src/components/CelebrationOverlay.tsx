import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, Heart, CheckCircle2, Award, ArrowRight, X, Volume2 } from 'lucide-react';

export interface DonationDetail {
  food_title?: string;
  title?: string;
  food_type?: string;
  quantity?: string;
  pickup_time?: string;
  city?: string;
  pickup_address?: string;
  address?: string;
}

interface CelebrationOverlayProps {
  show: boolean;
  donationDetails?: DonationDetail | null;
  onClose: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vRot: number;
  shape: 'circle' | 'rect' | 'star';
  opacity: number;
}

const PALETTE = [
  '#10B981', // Emerald
  '#059669', // Dark Emerald
  '#F59E0B', // Amber Gold
  '#3B82F6', // Blue
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#14B8A6', // Teal
  '#F97316', // Orange
];

export const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({
  show,
  donationDetails,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (show) {
      setActive(true);

      // Play joyful audio chime fanfare
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          
          // Note 1: C5
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
          gain1.gain.setValueAtTime(0.2, ctx.currentTime);
          gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          osc1.start(ctx.currentTime);
          osc1.stop(ctx.currentTime + 0.3);

          // Note 2: E5
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12);
          gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.12);
          gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
          osc2.start(ctx.currentTime + 0.12);
          osc2.stop(ctx.currentTime + 0.45);

          // Note 3: G5 + C6 Chord Fanfare
          const osc3 = ctx.createOscillator();
          const gain3 = ctx.createGain();
          osc3.connect(gain3);
          gain3.connect(ctx.destination);
          osc3.frequency.setValueAtTime(783.99, ctx.currentTime + 0.25);
          gain3.gain.setValueAtTime(0.3, ctx.currentTime + 0.25);
          gain3.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
          osc3.start(ctx.currentTime + 0.25);
          osc3.stop(ctx.currentTime + 0.8);

          const osc4 = ctx.createOscillator();
          const gain4 = ctx.createGain();
          osc4.connect(gain4);
          gain4.connect(ctx.destination);
          osc4.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.25);
          gain4.gain.setValueAtTime(0.2, ctx.currentTime + 0.25);
          gain4.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
          osc4.start(ctx.currentTime + 0.25);
          osc4.stop(ctx.currentTime + 0.9);
        }
      } catch (err) {
        // Audio might be muted or awaiting interaction
      }
    } else {
      setActive(false);
    }
  }, [show]);

  // Particle Physics Animation Canvas
  useEffect(() => {
    if (!active || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (canvas) {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    // Create 120 confetti particles bursting from center-top
    const particles: Particle[] = [];
    const count = 130;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
      const speed = 4 + Math.random() * 12;
      particles.push({
        id: i,
        x: width / 2 + (Math.random() - 0.5) * 100,
        y: height * 0.35 + (Math.random() - 0.5) * 50,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 6,
        size: 6 + Math.random() * 10,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
        shape: Math.random() > 0.6 ? 'star' : Math.random() > 0.3 ? 'rect' : 'circle',
        opacity: 1,
      });
    }

    let animationId: number;
    const gravity = 0.25;
    const drag = 0.98;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      let alive = false;
      for (const p of particles) {
        if (p.opacity <= 0) continue;
        alive = true;

        p.vx *= drag;
        p.vy *= drag;
        p.vy += gravity;

        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRot;

        if (p.y > height - 20) {
          p.opacity -= 0.02;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Star shape
          ctx.beginPath();
          for (let j = 0; j < 5; j++) {
            ctx.lineTo(
              Math.cos(((18 + j * 72) * Math.PI) / 180) * p.size,
              -Math.sin(((18 + j * 72) * Math.PI) / 180) * p.size
            );
            ctx.lineTo(
              Math.cos(((54 + j * 72) * Math.PI) / 180) * (p.size / 2),
              -Math.sin(((54 + j * 72) * Math.PI) / 180) * (p.size / 2)
            );
          }
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      }

      if (alive) {
        animationId = requestAnimationFrame(render);
      }
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [active]);

  if (!show) return null;

  const foodTitle = donationDetails?.food_title || donationDetails?.title || 'Surplus Fresh Meals';
  const foodType = donationDetails?.food_type || 'Cooked / Fresh Food';
  const quantity = donationDetails?.quantity || 'Multiple Servings';
  const pickupAddress = donationDetails?.pickup_address || donationDetails?.address || donationDetails?.city || 'Local Pickup Area';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-md animate-in fade-in duration-300">
      {/* Canvas for particle confetti physics */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-10 h-full w-full"
      />

      {/* Celebratory Dialog Card */}
      <div className="relative z-20 w-full max-w-lg overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 p-6 sm:p-8 text-white shadow-2xl shadow-emerald-900/40 ring-1 ring-emerald-500/20 animate-in zoom-in-95 duration-300">
        
        {/* Glow ambient background rings */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-amber-500/20 blur-3xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 rounded-full bg-stone-800/80 p-2 text-stone-400 hover:bg-stone-700 hover:text-white transition"
          title="Close celebration"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Icon Badge */}
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-lg shadow-emerald-500/40 text-white">
            <Sparkles className="h-8 w-8 animate-bounce" />
          </div>
        </div>

        {/* Title */}
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Donation Created Successfully</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Thank You for Making an Impact! 🎉
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-stone-300">
            Your generous food listing is now live on FoodBridge for nearby volunteers and community hubs.
          </p>
        </div>

        {/* Summary Card */}
        <div className="mt-6 rounded-2xl border border-stone-800 bg-stone-800/50 p-4 space-y-2 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs border-b border-stone-700/60 pb-2">
            <span className="text-stone-400 font-medium">Food Item</span>
            <span className="font-bold text-emerald-300 truncate max-w-[200px]">
              {foodTitle}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div>
              <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">Type / Category</span>
              <span className="font-semibold text-stone-200">{foodType}</span>
            </div>
            <div>
              <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">Quantity</span>
              <span className="font-semibold text-stone-200">{quantity}</span>
            </div>
          </div>

          <div className="text-xs pt-1">
            <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">Pickup Location</span>
            <span className="font-semibold text-stone-200 truncate block">{pickupAddress}</span>
          </div>
        </div>

        {/* Impact Highlights */}
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-200">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
            <Award className="h-5 w-5" />
          </div>
          <div className="text-xs">
            <p className="font-bold text-amber-300">Zero Food Waste Champion</p>
            <p className="text-[11px] text-amber-200/80">
              You earned +50 Karma Points & reduced CO₂ emissions from landfill food waste!
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => {
              onClose();
              window.location.hash = '#/dashboard';
            }}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 font-bold text-stone-950 shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-400 transition active:scale-95 text-xs sm:text-sm"
          >
            <span>View Donation Tracking</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          
          <button
            onClick={onClose}
            className="w-full sm:w-auto rounded-2xl border border-stone-700 bg-stone-800/80 px-5 py-3 font-semibold text-stone-300 hover:bg-stone-700 hover:text-white transition text-xs sm:text-sm"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
