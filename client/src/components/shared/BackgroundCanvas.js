import React, { useEffect, useRef } from 'react';

/**
 * NAVISLOG — LIVING CINEMATIC ENVIRONMENT ENGINE (HIGH CONTRAST & LUMINESCENCE)
 * 
 * Each sidebar station renders a unique living environment:
 * - dashboard (Fleet Command: 3D Perspective Vector Floor, Transit Cityscape, 360° Phosphor Radar)
 * - vehicles (Vehicle Hangar: Gantry Crane Trusses, Directional Light Cones, Holographic Heavy Hauler Wireframe, Rotating Calipers, Laser Scanner)
 * - drivers (Driver Network: Biometric Honeycomb Mesh, Synaptic Personnel Network, Retinal/Fingerprint Scanning Reticle)
 * - trips (Mission Control: Topographic Contours, Multi-Lane Glowing Vector Highway, Expanding Waypoint Beacons, Mission Vectors)
 * - tracking (Live Tactical Map: 3D Wireframe Globe, Orbital Satellites, Downlink Telemetry Cones, GPS Transponders)
 * - fuel (Fleet Energy System: Glowing Central Plasma Reactor Core, Multi-Axis Confinement Rings, Swirling Particle Vortex)
 * - maintenance (Vehicle Diagnostic Bay: CAD Engineering Blueprint, Exploded Mechanical Engine Chassis, Dual-Laser Scanner, Calipers)
 * - telemetry (Live Telemetry Matrix: Phosphor Oscilloscope Grid, 3 Real-time Distorting Waveforms, Sensor Telemetry Drops)
 * - ai (Navis AI Core: Luminous Quantum Core, Rotating Gyroscope Rings, Neural Synaptic Lightning Arcs firing toward mouse)
 * - reports (Intelligence Chamber: 3D Holographic Bar Histograms, Isometric Data Floor, Laser Analytics Sweep)
 * - driver-dashboard (Pilot Cockpit: Canopy HUD, Artificial Horizon Pitch Ladder, High-Speed Vector Funnel)
 * - driver-route (Route Navigation HUD: Perspective Highway, Moving Dashed Lane Lines, Checkpoint Laser Pillars)
 * - driver-gps (GPS Beacon: Polar Radar Grid, Orbital Satellite Triangulation, Expanding Shockwaves)
 * - auth (Airlock Portal: Giant Cyber Iris Bulkhead, Crossed Laser Security Beams)
 */
export default function BackgroundCanvas({ variant = 'dashboard' }) {
  const canvasRef = useRef(null);
  const activeVariantRef = useRef(variant);
  const prevVariantRef = useRef(variant);
  const transitionRef = useRef({
    active: false,
    startTime: 0,
    duration: 450,
  });

  // Track variant changes with a holographic transition
  useEffect(() => {
    if (variant !== activeVariantRef.current) {
      prevVariantRef.current = activeVariantRef.current;
      activeVariantRef.current = variant;
      transitionRef.current = {
        active: true,
        startTime: performance.now(),
        duration: 450,
      };
    }
  }, [variant]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Defensively wrap ctx.ellipse to guarantee no negative or non-finite radius can ever crash the canvas
    const origEllipse = ctx.ellipse;
    if (origEllipse) {
      ctx.ellipse = function (x, y, radiusX, radiusY, rotation = 0, startAngle = 0, endAngle = Math.PI * 2, counterclockwise = false) {
        const rx = Math.max(0.001, Math.abs(Number(radiusX) || 0));
        const ry = Math.max(0.001, Math.abs(Number(radiusY) || 0));
        const rot = Number.isFinite(rotation) ? rotation : 0;
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(rx) || !Number.isFinite(ry)) return;
        try {
          return origEllipse.call(this, x, y, rx, ry, rot, startAngle, endAngle, !!counterclockwise);
        } catch (e) {
          // Gracefully protect canvas animation loop
        }
      };
    }

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    // Mouse Tracking Bus with Smooth Lerp
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      nx: 0,
      ny: 0,
      targetNx: 0,
      targetNy: 0,
    };

    const onMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.targetNx = (e.clientX / width) * 2 - 1;
      mouse.targetNy = (e.clientY / height) * 2 - 1;
      window.__navisMouse = {
        x: mouse.targetX,
        y: mouse.targetY,
        nx: mouse.targetNx,
        ny: mouse.targetNy,
      };
    };
    window.addEventListener('mousemove', onMouseMove);

    // Ambient Floating Particles
    const particles = [];
    const pCount = window.innerWidth < 768 ? 35 : 75;
    for (let i = 0; i < pCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        radius: Math.random() * 2.2 + 0.8,
        baseAlpha: Math.random() * 0.4 + 0.2,
        alpha: 0.3,
      });
    }

    // Persistent environmental state
    const env = {
      // Dashboard
      dashNodes: Array.from({ length: 11 }, (_, i) => ({
        x: (width * 0.12) + ((i % 4) * (width * 0.26)) + (Math.random() * 40 - 20),
        y: (height * 0.18) + (Math.floor(i / 4) * (height * 0.26)) + (Math.random() * 30 - 15),
        label: ['ORBITAL-HQ', 'UNIT-07', 'GATE-3', 'DEPOT-ALPHA', 'RADAR-01', 'SUB-9', 'RELAY-6', 'TERMINAL-4', 'VEC-LOG', 'ARRAY-B', 'SAT-LNK'][i],
        pulse: Math.random() * Math.PI,
        size: 5 + Math.random() * 3,
      })),
      // Vehicles
      hangarRingAngle: 0,
      hangarLaserY: 0,
      hangarLaserDir: 1,
      // Drivers
      driverNodes: Array.from({ length: 20 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        id: `PILOT-${Math.floor(100 + Math.random() * 900)}`,
      })),
      // Trips
      waypoints: [
        { x: width * 0.20, y: height * 0.32, code: 'WP-01 INCEPTION' },
        { x: width * 0.42, y: height * 0.22, code: 'WP-02 VECTOR N-4' },
        { x: width * 0.65, y: height * 0.52, code: 'WP-03 CORRIDOR DELTA' },
        { x: width * 0.84, y: height * 0.38, code: 'WP-04 DESTINATION HUB' },
      ],
      // Tracking
      satellites: [
        { angle: 0.4, rX: width * 0.44, rY: height * 0.26, speed: 0.005, name: 'SAT-IRNSS-1A' },
        { angle: 2.2, rX: width * 0.50, rY: height * 0.30, speed: -0.0035, name: 'SAT-NAVSTAR-04' },
        { angle: 4.5, rX: width * 0.38, rY: height * 0.22, speed: 0.006, name: 'SAT-GALILEO-07' },
      ],
      // Fuel
      energyAngle: 0,
      fuelParticles: Array.from({ length: 60 }, () => ({
        angle: Math.random() * Math.PI * 2,
        dist: 45 + Math.random() * 240,
        speed: 0.012 + Math.random() * 0.02,
        size: 1.8 + Math.random() * 2.8,
        alpha: Math.random() * 0.8 + 0.2,
      })),
      // Maintenance
      diagLaserX: 0,
      diagLaserDir: 1,
      // AI
      aiAngle: 0,
      neuralNodes: Array.from({ length: 28 }, () => ({
        x: (width * 0.15) + Math.random() * (width * 0.7),
        y: (height * 0.15) + Math.random() * (height * 0.7),
        layer: Math.floor(Math.random() * 4),
      })),
    };

    let time = 0;

    // =========================================================================
    // RENDER LOOP (60 FPS)
    // =========================================================================
    const render = (now) => {
      time += 0.016;

      // Smooth Lerp Mouse
      const lerp = 0.07;
      mouse.x += (mouse.targetX - mouse.x) * lerp;
      mouse.y += (mouse.targetY - mouse.y) * lerp;
      mouse.nx += (mouse.targetNx - mouse.nx) * lerp;
      mouse.ny += (mouse.targetNy - mouse.ny) * lerp;

      // 3 Parallax Layers
      const bgOffX = mouse.nx * 15;
      const bgOffY = mouse.ny * 10;
      const midOffX = mouse.nx * 35;
      const midOffY = mouse.ny * 24;
      const foreOffX = mouse.nx * 62;
      const foreOffY = mouse.ny * 40;

      ctx.clearRect(0, 0, width, height);

      // Deep Atmosphere Foundation
      const currentActive = activeVariantRef.current;
      const baseGrad = ctx.createRadialGradient(
        width / 2 + bgOffX * 0.5,
        height / 2 + bgOffY * 0.5,
        120,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.85
      );

      if (currentActive === 'fuel') {
        baseGrad.addColorStop(0, '#0c1a24');
        baseGrad.addColorStop(1, '#02070d');
      } else if (currentActive === 'maintenance') {
        baseGrad.addColorStop(0, '#1c1016');
        baseGrad.addColorStop(1, '#070205');
      } else if (currentActive === 'ai') {
        baseGrad.addColorStop(0, '#140c26');
        baseGrad.addColorStop(1, '#04020a');
      } else if (currentActive === 'telemetry') {
        baseGrad.addColorStop(0, '#061c18');
        baseGrad.addColorStop(1, '#010a08');
      } else {
        baseGrad.addColorStop(0, '#061122');
        baseGrad.addColorStop(1, '#020610');
      }
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      // Cursor Dynamic Spotlight Following Cursor
      const spotGrad = ctx.createRadialGradient(mouse.x, mouse.y, 20, mouse.x, mouse.y, 360);
      if (currentActive === 'maintenance') {
        spotGrad.addColorStop(0, 'rgba(255, 0, 85, 0.16)');
        spotGrad.addColorStop(1, 'rgba(255, 0, 85, 0)');
      } else if (currentActive === 'ai') {
        spotGrad.addColorStop(0, 'rgba(168, 85, 247, 0.18)');
        spotGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
      } else if (currentActive === 'telemetry') {
        spotGrad.addColorStop(0, 'rgba(0, 255, 170, 0.16)');
        spotGrad.addColorStop(1, 'rgba(0, 255, 170, 0)');
      } else {
        spotGrad.addColorStop(0, 'rgba(0, 240, 255, 0.14)');
        spotGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
      }
      ctx.fillStyle = spotGrad;
      ctx.fillRect(0, 0, width, height);

      // Render Environment
      renderLivingScene(currentActive, {
        ctx, width, height, time, mouse, bgOffX, bgOffY, midOffX, midOffY, foreOffX, foreOffY, env
      });

      // Ambient Floating Particles with Proximity Reaction
      ctx.save();
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 150) {
          const force = (1 - dist / 150) * 2;
          p.x += (dx / (dist || 1)) * force;
          p.y += (dy / (dist || 1)) * force;
          p.alpha = Math.min(0.95, p.baseAlpha + 0.4);
        } else {
          p.alpha = p.baseAlpha + Math.sin(time * 2.5 + p.radius) * 0.12;
        }

        ctx.fillStyle = currentActive === 'maintenance'
          ? `rgba(255, 0, 85, ${p.alpha})`
          : currentActive === 'ai'
          ? `rgba(168, 85, 247, ${p.alpha})`
          : currentActive === 'telemetry'
          ? `rgba(0, 255, 170, ${p.alpha})`
          : `rgba(0, 240, 255, ${p.alpha})`;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      // Holographic Transition Overlay
      if (transitionRef.current.active) {
        const elapsed = now - transitionRef.current.startTime;
        const prog = Math.min(1, elapsed / transitionRef.current.duration);

        ctx.save();
        if (prog < 0.5) {
          const p1 = prog / 0.5;
          ctx.fillStyle = `rgba(2, 6, 16, ${p1 * 0.75})`;
          ctx.fillRect(0, 0, width, height);

          // Glitch scanline bar
          const scanY = p1 * height;
          ctx.fillStyle = 'rgba(0, 240, 255, 0.8)';
          ctx.fillRect(0, scanY - 3, width, 6);
        } else {
          const p2 = (prog - 0.5) / 0.5;
          ctx.fillStyle = `rgba(0, 240, 255, ${(1 - p2) * 0.22})`;
          ctx.fillRect(0, 0, width, height);
        }
        ctx.restore();

        if (prog >= 1) transitionRef.current.active = false;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}

// =============================================================================
// SAFE CANVAS PRIMITIVES
// =============================================================================
function safeEllipse(ctx, x, y, radiusX, radiusY, rotation = 0, startAngle = 0, endAngle = Math.PI * 2, counterclockwise = false) {
  const rx = Math.max(0.001, Math.abs(Number(radiusX) || 0));
  const ry = Math.max(0.001, Math.abs(Number(radiusY) || 0));
  const rot = Number.isFinite(rotation) ? rotation : 0;
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(rx) || !Number.isFinite(ry)) return;
  try {
    ctx.ellipse(x, y, rx, ry, rot, startAngle, endAngle, counterclockwise);
  } catch (err) {
    // Gracefully handle any unexpected canvas error
  }
}

// =============================================================================
// SCENE RENDERERS (LUMINESCENT & HIGH FIDELITY)
// =============================================================================
function renderLivingScene(variant, p) {
  const { ctx, width, height, time, mouse, bgOffX, bgOffY, midOffX, midOffY, foreOffX, foreOffY, env } = p;

  switch (variant) {
    // -------------------------------------------------------------------------
    // 01: FLEET COMMAND (Autonomous Logistics Network Overlook)
    // -------------------------------------------------------------------------
    case 'dashboard': {
      const horizon = height * 0.52 + bgOffY;

      // 1. Distant Transit Port Towers & Aircraft Beacons
      ctx.save();
      ctx.fillStyle = 'rgba(12, 28, 52, 0.6)';
      const towerCount = 20;
      const tWidth = width / towerCount;
      for (let i = 0; i < towerCount; i++) {
        const tHeight = 50 + ((Math.sin(i * 3.4) * 0.5 + 0.5) * 110);
        const tx = i * tWidth + bgOffX * 0.35;
        ctx.fillRect(tx, horizon - tHeight, tWidth - 5, tHeight);

        // Blinking obstruction beacons
        if (i % 2 === 0) {
          const blink = Math.sin(time * 3 + i) > 0.3 ? 0.95 : 0.15;
          ctx.fillStyle = `rgba(255, 60, 60, ${blink})`;
          ctx.beginPath();
          ctx.arc(tx + (tWidth - 5) / 2, horizon - tHeight - 4, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(12, 28, 52, 0.6)';
        }
      }
      ctx.restore();

      // 2. High-Perspective Fleet Grid Floor
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.16)';
      ctx.lineWidth = 1.2;
      const vLines = 26;
      const centerX = width * 0.5 + midOffX;
      for (let i = 0; i <= vLines; i++) {
        const topX = (width / vLines) * i;
        const bottomX = ((topX - centerX) * 3.2) + centerX;
        ctx.beginPath();
        ctx.moveTo(topX, horizon);
        ctx.lineTo(bottomX, height);
        ctx.stroke();
      }
      for (let y = horizon; y <= height; y += (y - horizon) * 0.28 + 14) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();

      // 3. Central Radar Sweep
      ctx.save();
      const rX = width * 0.80 + foreOffX;
      const rY = height * 0.36 + foreOffY;
      const rR = Math.min(width, height) * 0.24;

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.lineWidth = 1.5;
      [0.33, 0.66, 1].forEach((mul) => {
        ctx.beginPath();
        ctx.arc(rX, rY, rR * mul, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Rotating Sweep Beam
      const swAngle = (time * 0.9) % (Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 240, 255, 0.12)';
      ctx.beginPath();
      ctx.moveTo(rX, rY);
      ctx.arc(rX, rY, rR, swAngle, swAngle + 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 4. Interactive Fleet Nodes
      ctx.save();
      env.dashNodes.forEach((node, idx) => {
        const nx = node.x + midOffX;
        const ny = node.y + midOffY;
        const d = Math.hypot(nx - mouse.x, ny - mouse.y);
        const isNear = d < 180;

        if (idx < env.dashNodes.length - 1) {
          const next = env.dashNodes[idx + 1];
          ctx.strokeStyle = isNear ? 'rgba(0, 240, 255, 0.55)' : 'rgba(0, 240, 255, 0.14)';
          ctx.lineWidth = isNear ? 1.8 : 1;
          ctx.beginPath();
          ctx.moveTo(nx, ny);
          ctx.lineTo(next.x + midOffX, next.y + midOffY);
          ctx.stroke();
        }

        ctx.fillStyle = isNear ? '#00f0ff' : 'rgba(0, 240, 255, 0.55)';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = isNear ? 15 : 6;
        ctx.beginPath();
        ctx.arc(nx, ny, isNear ? node.size * 1.5 : node.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (isNear) {
          ctx.strokeStyle = '#00f0ff';
          ctx.strokeRect(nx - 14, ny - 14, 28, 28);
          ctx.fillStyle = '#00f0ff';
          ctx.font = '10px "Share Tech Mono", monospace';
          ctx.fillText(`// ${node.label} [LINKED]`, nx + 18, ny + 4);
        }
      });
      ctx.restore();
      break;
    }

    // -------------------------------------------------------------------------
    // 02: VEHICLE HANGAR (Holographic Heavy Hauler Bay)
    // -------------------------------------------------------------------------
    case 'vehicles': {
      // 1. Industrial Overhead Gantry Crane Trusses
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
      ctx.lineWidth = 2;
      const trussY = 80 + bgOffY * 0.5;
      for (let x = 0; x < width; x += 140) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 70, trussY);
        ctx.lineTo(x + 140, 0);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(0, trussY);
      ctx.lineTo(width, trussY);
      ctx.stroke();
      ctx.restore();

      // 2. Overhead Hanging Light Cones Aiming Toward Cursor
      ctx.save();
      [0.22, 0.5, 0.78].forEach((pos) => {
        const lx = width * pos;
        const grad = ctx.createRadialGradient(lx, trussY, 15, mouse.x, height * 0.75, 480);
        grad.addColorStop(0, 'rgba(0, 240, 255, 0.16)');
        grad.addColorStop(1, 'rgba(0, 240, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(lx - 30, trussY);
        ctx.lineTo(lx + 30, trussY);
        ctx.lineTo(mouse.x + 140 * (pos - 0.5), height);
        ctx.lineTo(mouse.x - 140 * (pos - 0.5), height);
        ctx.closePath();
        ctx.fill();
      });
      ctx.restore();

      // 3. Central Holographic Truck Wireframe (Tata Prima / Heavy Hauler)
      ctx.save();
      const vX = width * 0.52 + midOffX;
      const vY = height * 0.58 + midOffY;
      const s = Math.min(width / 1250, 1.25);

      // Rotating Diagnostic Caliper Rings
      env.hangarRingAngle += 0.01;
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      safeEllipse(ctx, vX, vY + 25, 340 * s, 95 * s, env.hangarRingAngle * 0.25, 0, Math.PI * 2);
      ctx.stroke();

      // Vehicle Wireframe Body
      ctx.save();
      ctx.translate(vX, vY);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.55)';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 8;
      ctx.lineWidth = 1.8;

      // Heavy Hauler Cab
      ctx.strokeRect(-200 * s, -145 * s, 135 * s, 175 * s);
      // Windshield
      ctx.fillStyle = 'rgba(0, 240, 255, 0.1)';
      ctx.fillRect(-195 * s, -135 * s, 120 * s, 70 * s);
      ctx.strokeRect(-195 * s, -135 * s, 120 * s, 70 * s);
      // Front Grille Slats
      for (let g = 0; g < 5; g++) {
        ctx.beginPath();
        ctx.moveTo(-185 * s, (-35 + g * 13) * s);
        ctx.lineTo(-80 * s, (-35 + g * 13) * s);
        ctx.stroke();
      }
      // Heavy Chassis / Bed Frame
      ctx.strokeRect(-65 * s, -45 * s, 270 * s, 75 * s);
      // Fuel / Hydraulic Tank
      ctx.strokeRect(-35 * s, 38 * s, 90 * s, 28 * s);
      // Wheels
      [-140, 50, 150].forEach((wx) => {
        ctx.fillStyle = 'rgba(0, 240, 255, 0.18)';
        ctx.beginPath();
        ctx.arc(wx * s, 60 * s, 34 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(wx * s, 60 * s, 15 * s, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.restore();

      // Sweeping Laser Bar
      env.hangarLaserY += env.hangarLaserDir * 3.5;
      if (env.hangarLaserY > 210 || env.hangarLaserY < -160) env.hangarLaserDir *= -1;
      const laserY = vY + env.hangarLaserY;
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.95)';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 15;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(vX - 260 * s, laserY);
      ctx.lineTo(vX + 260 * s, laserY);
      ctx.stroke();

      // Specifications
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#00f0ff';
      ctx.font = '11px "Share Tech Mono", monospace';
      ctx.fillText(`// UNIT: TATA PRIMA 5530 [ACTIVE HAULER]`, vX - 200 * s, vY - 165 * s);
      ctx.fillText(`// STATUS: COMBAT-READY // DIAGNOSTIC: 100%`, vX + 40 * s, vY - 165 * s);
      ctx.fillText(`// MASS: 55,000 KG // TURBO-DIESEL 1100 NM`, vX - 200 * s, vY + 125 * s);
      ctx.restore();
      break;
    }

    // -------------------------------------------------------------------------
    // 03: DRIVERS (Driver Network / Biometric Identity Chamber)
    // -------------------------------------------------------------------------
    case 'drivers': {
      // 1. Honeycomb Biometric Lattice
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.09)';
      ctx.lineWidth = 1;
      const hR = 50;
      const hH = hR * Math.sqrt(3);
      for (let y = 0; y < height + hH; y += hH) {
        for (let x = 0; x < width + hR * 3; x += hR * 3) {
          drawHex(ctx, x + bgOffX * 0.4, y + bgOffY * 0.4, hR);
          drawHex(ctx, x + hR * 1.5 + bgOffX * 0.4, y + hH * 0.5 + bgOffY * 0.4, hR);
        }
      }
      ctx.restore();

      // 2. Personnel Network Mesh
      ctx.save();
      env.driverNodes.forEach((node, i) => {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        const nx = node.x + midOffX;
        const ny = node.y + midOffY;
        const d = Math.hypot(nx - mouse.x, ny - mouse.y);
        const near = d < 180;

        for (let j = i + 1; j < env.driverNodes.length; j++) {
          const o = env.driverNodes[j];
          const cDist = Math.hypot(node.x - o.x, node.y - o.y);
          if (cDist < 190) {
            ctx.strokeStyle = near ? 'rgba(0, 240, 255, 0.5)' : 'rgba(0, 240, 255, 0.12)';
            ctx.lineWidth = near ? 1.8 : 1;
            ctx.beginPath();
            ctx.moveTo(nx, ny);
            ctx.lineTo(o.x + midOffX, o.y + midOffY);
            ctx.stroke();
          }
        }

        ctx.fillStyle = near ? '#00f0ff' : 'rgba(0, 240, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(nx, ny, near ? 6 : 3.5, 0, Math.PI * 2);
        ctx.fill();

        if (near) {
          ctx.strokeStyle = '#00f0ff';
          ctx.strokeRect(nx - 14, ny - 14, 28, 28);
          ctx.fillStyle = '#00f0ff';
          ctx.font = '10px "Share Tech Mono", monospace';
          ctx.fillText(`BIOMETRIC: ${node.id} [VERIFIED]`, nx + 18, ny + 4);
        }
      });
      ctx.restore();

      // 3. Biometric Target Reticle Following Mouse
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 52, time * 2, time * 2 + Math.PI * 1.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 68, -time * 1.6, -time * 1.6 + Math.PI);
      ctx.stroke();

      // Fingerprint waveform
      ctx.beginPath();
      for (let x = -35; x <= 35; x += 4) {
        const yVal = Math.sin(x * 0.28 + time * 6) * 12;
        if (x === -35) ctx.moveTo(mouse.x + x, mouse.y + yVal);
        else ctx.lineTo(mouse.x + x, mouse.y + yVal);
      }
      ctx.strokeStyle = '#00f0ff';
      ctx.stroke();
      ctx.restore();
      break;
    }

    // -------------------------------------------------------------------------
    // 04: TRIPS (Mission Control / Autonomous Navigation)
    // -------------------------------------------------------------------------
    case 'trips': {
      // 1. Topographic Elevation Contours
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.10)';
      ctx.lineWidth = 1.2;
      [140, 250, 370, 510, 680].forEach((r, i) => {
        ctx.beginPath();
        safeEllipse(ctx, width * 0.5 + bgOffX * 0.5, height * 0.45 + bgOffY * 0.5, r, r * 0.58, i * 0.25, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.restore();

      // 2. Glowing Multi-Lane Vector Highway
      ctx.save();
      const p0 = { x: width * 0.08, y: height * 0.85 };
      const p1 = { x: width * 0.35 + midOffX, y: height * 0.28 };
      const p2 = { x: width * 0.65 - midOffX, y: height * 0.72 };
      const p3 = { x: width * 0.92, y: height * 0.22 };

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
      ctx.stroke();

      ctx.setLineDash([10, 14]);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // 3. Waypoint Beacons with Expanding Pulse Rings
      ctx.save();
      env.waypoints.forEach((wp) => {
        const wx = wp.x + foreOffX;
        const wy = wp.y + foreOffY;
        const d = Math.hypot(wx - mouse.x, wy - mouse.y);
        const near = d < 160;

        const pulse = (time * 1.5) % 1;
        ctx.strokeStyle = `rgba(0, 240, 255, ${(1 - pulse) * (near ? 0.95 : 0.45)})`;
        ctx.lineWidth = near ? 2 : 1.2;
        ctx.beginPath();
        ctx.arc(wx, wy, 15 + pulse * 50, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = near ? '#00f0ff' : 'rgba(0, 240, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(wx, wy, near ? 8 : 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#00f0ff';
        ctx.font = '11px "Share Tech Mono", monospace';
        ctx.fillText(wp.code, wx + 14, wy - 18);
        if (near) {
          ctx.fillText(`TARGET LOCKED // LAT: 10.954°`, wx + 14, wy - 4);
        }
      });
      ctx.restore();
      break;
    }

    // -------------------------------------------------------------------------
    // 05: LIVE TRACKING (Satellite / Tactical Fleet Tracking)
    // -------------------------------------------------------------------------
    case 'tracking': {
      // 1. 3D Wireframe Globe Projection
      ctx.save();
      const gX = width * 0.5 + bgOffX * 0.4;
      const gY = height * 0.48 + bgOffY * 0.4;
      const gR = Math.min(width, height) * 0.38;

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.14)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(gX, gY, gR, 0, Math.PI * 2);
      ctx.stroke();

      for (let lat = -0.7; lat <= 0.7; lat += 0.35) {
        ctx.beginPath();
        const rx = Math.max(0.1, Math.abs(gR * Math.cos(lat)));
        const ry = Math.max(0.1, Math.abs(gR * 0.22));
        safeEllipse(ctx, gX, gY + lat * gR, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let lon = 0; lon < Math.PI; lon += Math.PI / 4) {
        ctx.beginPath();
        const rx = Math.max(0.1, Math.abs(gR * Math.sin(lon + time * 0.12)));
        const ry = Math.max(0.1, Math.abs(gR));
        safeEllipse(ctx, gX, gY, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // 2. Orbital Satellites with Telemetry Downlinks
      ctx.save();
      env.satellites.forEach((sat) => {
        sat.angle += sat.speed;
        const satRx = Math.max(0.1, Math.abs(sat.rX || 10));
        const satRy = Math.max(0.1, Math.abs(sat.rY || 10));
        const sx = gX + Math.cos(sat.angle) * satRx + midOffX;
        const sy = gY + Math.sin(sat.angle) * satRy + midOffY;

        ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
        ctx.beginPath();
        safeEllipse(ctx, gX + midOffX, gY + midOffY, satRx, satRy, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Downlink telemetry cone
        const cone = ctx.createRadialGradient(sx, sy, 8, sx, sy + 150, 190);
        cone.addColorStop(0, 'rgba(0, 240, 255, 0.24)');
        cone.addColorStop(1, 'rgba(0, 240, 255, 0)');
        ctx.fillStyle = cone;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx - 70, sy + 190);
        ctx.lineTo(sx + 70, sy + 190);
        ctx.closePath();
        ctx.fill();

        // Satellite body
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(sx - 6, sy - 6, 12, 12);
        ctx.fillRect(sx - 20, sy - 3, 12, 6);
        ctx.fillRect(sx + 8, sy - 3, 12, 6);

        ctx.font = '10px "Share Tech Mono", monospace';
        ctx.fillText(sat.name, sx + 18, sy);
      });
      ctx.restore();
      break;
    }

    // -------------------------------------------------------------------------
    // 06: FUEL (Fleet Energy System / Glowing Plasma Reactor)
    // -------------------------------------------------------------------------
    case 'fuel': {
      const cX = width * 0.5 + midOffX;
      const cY = height * 0.48 + midOffY;

      // 1. Industrial Conduit Lines
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.18)';
      ctx.lineWidth = 2;
      [0.15, 0.35, 0.65, 0.85].forEach((pos) => {
        ctx.beginPath();
        ctx.moveTo(width * pos, 0);
        ctx.lineTo(width * pos, height);
        ctx.stroke();
      });
      ctx.restore();

      // 2. Central Plasma Reactor Core with High Corona
      ctx.save();
      env.energyAngle += 0.015;
      const cGrad = ctx.createRadialGradient(cX, cY, 15, cX, cY, 210);
      cGrad.addColorStop(0, 'rgba(0, 240, 255, 0.95)');
      cGrad.addColorStop(0.25, 'rgba(0, 210, 255, 0.5)');
      cGrad.addColorStop(0.7, 'rgba(0, 150, 255, 0.12)');
      cGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = cGrad;
      ctx.beginPath();
      ctx.arc(cX, cY, 210, 0, Math.PI * 2);
      ctx.fill();

      // Multi-layer rotating magnetic containment rings
      [95, 140, 185].forEach((rad, i) => {
        ctx.strokeStyle = `rgba(0, 240, 255, ${0.55 - i * 0.12})`;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        const dir = i % 2 === 0 ? 1 : -1;
        ctx.arc(cX, cY, rad, env.energyAngle * dir, env.energyAngle * dir + Math.PI * 1.6);
        ctx.stroke();
      });
      ctx.restore();

      // 3. Swirling Fuel Particles with Cursor Repulsion
      ctx.save();
      env.fuelParticles.forEach((p) => {
        p.angle += p.speed;
        let px = cX + Math.cos(p.angle) * p.dist;
        let py = cY + Math.sin(p.angle) * p.dist;

        const d = Math.hypot(px - mouse.x, py - mouse.y);
        if (d < 150) {
          const push = (1 - d / 150) * 45;
          px += ((px - mouse.x) / (d || 1)) * push;
          py += ((py - mouse.y) / (d || 1)) * push;
        }

        ctx.fillStyle = `rgba(0, 240, 255, ${p.alpha})`;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
      break;
    }

    // -------------------------------------------------------------------------
    // 07: MAINTENANCE (Vehicle Diagnostic Bay)
    // -------------------------------------------------------------------------
    case 'maintenance': {
      // 1. Isometric CAD Blueprint Grid
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 0, 85, 0.12)';
      ctx.lineWidth = 1;
      const cadStep = 50;
      for (let x = 0; x < width; x += cadStep) {
        ctx.beginPath();
        ctx.moveTo(x + bgOffX * 0.35, 0);
        ctx.lineTo(x + bgOffX * 0.35, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += cadStep) {
        ctx.beginPath();
        ctx.moveTo(0, y + bgOffY * 0.35);
        ctx.lineTo(width, y + bgOffY * 0.35);
        ctx.stroke();
      }
      ctx.restore();

      // 2. Mechanical Exploded Engine Chassis Hologram
      ctx.save();
      const mX = width * 0.5 + midOffX;
      const mY = height * 0.5 + midOffY;
      ctx.strokeStyle = 'rgba(255, 0, 85, 0.45)';
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2;

      ctx.strokeRect(mX - 150, mY - 95, 300, 190);
      for (let c = 0; c < 4; c++) {
        const cx = mX - 110 + c * 75;
        ctx.strokeRect(cx - 22, mY - 65, 44, 75);
        ctx.beginPath();
        ctx.arc(cx, mY + 45, 18, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Sweeping Crimson Diagnostic Laser
      env.diagLaserX += env.diagLaserDir * 4.5;
      if (env.diagLaserX > 340 || env.diagLaserX < -340) env.diagLaserDir *= -1;
      const dlX = mX + env.diagLaserX;
      const dlGrad = ctx.createLinearGradient(dlX - 20, 0, dlX + 20, 0);
      dlGrad.addColorStop(0, 'rgba(255, 0, 85, 0)');
      dlGrad.addColorStop(0.5, 'rgba(255, 0, 85, 0.95)');
      dlGrad.addColorStop(1, 'rgba(255, 0, 85, 0)');
      ctx.fillStyle = dlGrad;
      ctx.fillRect(dlX - 20, mY - 150, 40, 300);

      // Caliper Target Tracking Mouse
      ctx.strokeStyle = '#ff0055';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 48, time * 3, time * 3 + Math.PI * 1.4);
      ctx.stroke();
      ctx.font = '10px "Share Tech Mono", monospace';
      ctx.fillStyle = '#ff0055';
      ctx.fillText(`DTC: SYS-DIAGNOSTIC [OK]`, mouse.x + 58, mouse.y);
      ctx.restore();
      break;
    }

    // -------------------------------------------------------------------------
    // 08: TELEMETRY (Live Sensor / Data Stream)
    // -------------------------------------------------------------------------
    case 'telemetry': {
      // 1. Oscilloscope Grid
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 255, 170, 0.12)';
      ctx.lineWidth = 1;
      for (let y = 0; y < height; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      for (let x = 0; x < width; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      ctx.restore();

      // 2. Real-Time Oscillating Waveforms Distorting Near Mouse
      ctx.save();
      const channels = [
        { yBase: height * 0.28, freq: 0.016, amp: 50, color: '#00ffaa' },
        { yBase: height * 0.50, freq: 0.026, amp: 40, color: '#00f0ff' },
        { yBase: height * 0.72, freq: 0.012, amp: 60, color: '#38bdf8' },
      ];

      channels.forEach((ch, idx) => {
        ctx.strokeStyle = ch.color;
        ctx.shadowColor = ch.color;
        ctx.shadowBlur = 10;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (let x = 0; x <= width; x += 5) {
          const d = Math.hypot(x - mouse.x, ch.yBase - mouse.y);
          const warp = d < 180 ? (1 - d / 180) * 45 : 0;
          const y = ch.yBase + Math.sin(x * ch.freq + time * (3.5 + idx)) * (ch.amp + warp);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
      ctx.restore();
      break;
    }

    // -------------------------------------------------------------------------
    // 09: NAVIS AI (AI Intelligence Core)
    // -------------------------------------------------------------------------
    case 'ai': {
      const aX = width * 0.5 + midOffX;
      const aY = height * 0.46 + midOffY;

      // 1. Central Luminous AI Core Sphere
      ctx.save();
      env.aiAngle += 0.012;
      const aiGrad = ctx.createRadialGradient(aX, aY, 15, aX, aY, 220);
      aiGrad.addColorStop(0, 'rgba(192, 132, 252, 0.95)');
      aiGrad.addColorStop(0.3, 'rgba(168, 85, 247, 0.55)');
      aiGrad.addColorStop(0.7, 'rgba(126, 34, 206, 0.12)');
      aiGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = aiGrad;
      ctx.beginPath();
      ctx.arc(aX, aY, 220, 0, Math.PI * 2);
      ctx.fill();

      // Multi-Axis Gyroscope Rings
      [75, 120, 165].forEach((r, i) => {
        ctx.strokeStyle = `rgba(168, 85, 247, ${0.55 - i * 0.12})`;
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 12;
        ctx.lineWidth = 2;
        ctx.beginPath();
        safeEllipse(ctx, aX, aY, r, r * 0.42, env.aiAngle * (1 + i * 0.5), 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.restore();

      // 2. Synaptic Lightning Arcs Firing toward Cursor
      ctx.save();
      env.neuralNodes.forEach((node) => {
        const nx = node.x + foreOffX;
        const ny = node.y + foreOffY;
        const d = Math.hypot(nx - mouse.x, ny - mouse.y);
        const near = d < 200;

        if (near && Math.random() < 0.22) {
          ctx.strokeStyle = 'rgba(192, 132, 252, 0.75)';
          ctx.shadowColor = '#c084fc';
          ctx.shadowBlur = 8;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(nx, ny);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }

        ctx.fillStyle = near ? '#e9d5ff' : 'rgba(168, 85, 247, 0.55)';
        ctx.beginPath();
        ctx.arc(nx, ny, near ? 6 : 3.5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
      break;
    }

    // -------------------------------------------------------------------------
    // 10: REPORTS (Fleet Data Intelligence Chamber)
    // -------------------------------------------------------------------------
    case 'reports': {
      // 1. Isometric Matrix Planes
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
      ctx.lineWidth = 1;
      const rY = height * 0.6 + midOffY;
      for (let x = 0; x < width; x += 55) {
        ctx.beginPath();
        ctx.moveTo(x, rY);
        ctx.lineTo(x + 220, height);
        ctx.stroke();
      }
      ctx.restore();

      // 2. 3D Holographic Bar Histograms with Perspective Shift
      ctx.save();
      const bX = width * 0.22 + foreOffX;
      const bY = height * 0.55 + foreOffY;
      const count = 12;
      for (let i = 0; i < count; i++) {
        const bx = bX + i * 50;
        const bH = 45 + ((Math.sin(i * 1.3 + time) * 0.5 + 0.5) * 160);
        ctx.fillStyle = 'rgba(0, 240, 255, 0.22)';
        ctx.strokeStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
        ctx.fillRect(bx, bY - bH, 26, bH);
        ctx.strokeRect(bx, bY - bH, 26, bH);
      }
      ctx.restore();
      break;
    }

    // -------------------------------------------------------------------------
    // DRIVER DASHBOARD (Pilot Cockpit Environment)
    // -------------------------------------------------------------------------
    case 'driver-dashboard': {
      ctx.save();
      const chX = width * 0.5 + midOffX;
      const chY = height * 0.5 + midOffY;

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2.2;
      ctx.translate(chX, chY);
      ctx.rotate(mouse.nx * 0.16);

      ctx.beginPath();
      ctx.moveTo(-180, 0);
      ctx.lineTo(-45, 0);
      ctx.moveTo(45, 0);
      ctx.lineTo(180, 0);
      ctx.stroke();

      [-45, 45].forEach((ry) => {
        ctx.beginPath();
        ctx.moveTo(-70, ry);
        ctx.lineTo(70, ry);
        ctx.stroke();
      });
      ctx.restore();
      break;
    }

    // -------------------------------------------------------------------------
    // DRIVER ROUTE (Route Navigation HUD)
    // -------------------------------------------------------------------------
    case 'driver-route': {
      ctx.save();
      const rHor = height * 0.44;
      const rCtr = width * 0.5 + midOffX;
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(rCtr - 35, rHor);
      ctx.lineTo(rCtr - width * 0.48, height);
      ctx.moveTo(rCtr + 35, rHor);
      ctx.lineTo(rCtr + width * 0.48, height);
      ctx.stroke();

      ctx.setLineDash([20, 24]);
      ctx.lineDashOffset = -time * 85;
      ctx.beginPath();
      ctx.moveTo(rCtr, rHor);
      ctx.lineTo(rCtr, height);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      break;
    }

    // -------------------------------------------------------------------------
    // DRIVER GPS PHONE (Beacon Triangulation Environment)
    // -------------------------------------------------------------------------
    case 'driver-gps': {
      ctx.save();
      const bX = width * 0.5 + midOffX;
      const bY = height * 0.5 + midOffY;

      [70, 140, 220, 310].forEach((r) => {
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(bX, bY, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      const wave = (time * 1.3) % 1;
      ctx.strokeStyle = `rgba(0, 240, 255, ${(1 - wave) * 0.85})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(bX, bY, 45 + wave * 300, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      break;
    }

    // -------------------------------------------------------------------------
    // AUTH (Command Access Airlock Portal)
    // -------------------------------------------------------------------------
    case 'auth': {
      ctx.save();
      const aX = width * 0.5 + midOffX * 0.5;
      const aY = height * 0.5 + midOffY * 0.5;
      const irisR = Math.min(width, height) * 0.4;

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(aX, aY, irisR, 0, Math.PI * 2);
      ctx.stroke();

      const teeth = 8;
      for (let i = 0; i < teeth; i++) {
        const angle = (i * Math.PI * 2) / teeth + time * 0.25;
        ctx.beginPath();
        ctx.moveTo(aX + Math.cos(angle) * (irisR - 45), aY + Math.sin(angle) * (irisR - 45));
        ctx.lineTo(aX + Math.cos(angle) * (irisR + 25), aY + Math.sin(angle) * (irisR + 25));
        ctx.stroke();
      }
      ctx.restore();
      break;
    }

    default:
      break;
  }
}

// Utility: Draw regular hexagon
function drawHex(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const hx = x + r * Math.cos(a);
    const hy = y + r * Math.sin(a);
    if (i === 0) ctx.moveTo(hx, hy);
    else ctx.lineTo(hx, hy);
  }
  ctx.closePath();
  ctx.stroke();
}
