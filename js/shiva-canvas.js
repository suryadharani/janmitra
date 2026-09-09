/**
 * JanMitra — Lord Shiva Divine Atmospheric Canvas
 * Created with pure HTML5 Canvas 2D.
 * Features cosmic stardust, breathing sacred aura, crescent moon geometry, 
 * Trishula focal light, and graceful parallax.
 */

export class ShivaCanvas {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.stars = [];
        this.time = 0;
        this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
        this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.animationFrameId = null;

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Mouse Parallax Listener
        window.addEventListener('mousemove', (e) => {
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            this.mouse.targetX = (e.clientX - centerX) / centerX;
            this.mouse.targetY = (e.clientY - centerY) / centerY;
        });

        // Device Orientation for Mobile Parallax
        window.addEventListener('deviceorientation', (e) => {
            if (e.gamma !== null && e.beta !== null) {
                this.mouse.targetX = e.gamma / 30; // -1 to 1 range approx
                this.mouse.targetY = (e.beta - 45) / 30;
            }
        });

        // Visibility Change Optimization (Pause when inactive)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stop();
            } else {
                this.start();
            }
        });

        this.createStars(80);
        this.createParticles(90);

        this.start();
    }

    resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.ctx.scale(dpr, dpr);
    }

    createStars(count) {
        this.stars = [];
        for (let i = 0; i < count; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                radius: Math.random() * 1.2 + 0.3,
                alpha: Math.random() * 0.7 + 0.2,
                speed: Math.random() * 0.02 + 0.005,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    createParticles(count) {
        this.particles = [];
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                radius: Math.random() * 2.2 + 0.6,
                vx: (Math.random() - 0.5) * 0.3,
                vy: -(Math.random() * 0.4 + 0.15), // Drifting upward slowly
                alpha: Math.random() * 0.5 + 0.2,
                maxAlpha: Math.random() * 0.6 + 0.3,
                hue: Math.random() > 0.3 ? 165 : 210, // Teal/Emerald or Sapphire Blue
                pulseSpeed: Math.random() * 0.03 + 0.01
            });
        }
    }

    start() {
        if (this.animationFrameId) return;
        const loop = () => {
            this.update();
            this.draw();
            if (!this.isReducedMotion) {
                this.animationFrameId = requestAnimationFrame(loop);
            }
        };
        loop();
    }

    stop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    update() {
        this.time += 0.015;

        // Smooth mouse lerp
        this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
        this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

        // Update Stardust Particles
        for (let p of this.particles) {
            p.y += p.vy;
            p.x += p.vx + Math.sin(this.time + p.y * 0.01) * 0.2;
            p.alpha = (Math.sin(this.time * p.pulseSpeed * 10) + 1) / 2 * p.maxAlpha;

            if (p.y < -10) {
                p.y = this.height + 10;
                p.x = Math.random() * this.width;
            }
        }
    }

    draw() {
        const { ctx, width, height, time, mouse } = this;

        // 1. Deep Cosmic Background Gradient
        const bgGradient = ctx.createRadialGradient(
            width / 2 + mouse.x * 40,
            height / 2 + mouse.y * 40,
            50,
            width / 2,
            height / 2,
            Math.max(width, height)
        );
        bgGradient.addColorStop(0, '#0c1226'); // Deep Sapphire Blue
        bgGradient.addColorStop(0.5, '#070914'); // Cosmic Night
        bgGradient.addColorStop(1, '#030409'); // Midnight Black

        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);

        // 2. Stars Layer
        ctx.save();
        for (let s of this.stars) {
            const tw = (Math.sin(time * s.speed * 20 + s.phase) + 1) / 2;
            ctx.fillStyle = `rgba(226, 232, 240, ${s.alpha * (0.5 + 0.5 * tw)})`;
            ctx.beginPath();
            ctx.arc(s.x + mouse.x * 15, s.y + mouse.y * 15, s.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // 3. Central Divine Breathing Aura (Lord Shiva Focal Point)
        const centerX = width / 2 + mouse.x * 25;
        const centerY = height / 2.3 + mouse.y * 25;
        const breathe = Math.sin(time * 0.8) * 12;

        // A. Primary Sapphire & Golden Glow Aura
        ctx.save();
        const auraGrad = ctx.createRadialGradient(
            centerX, centerY, 10,
            centerX, centerY, 240 + breathe
        );
        auraGrad.addColorStop(0, 'rgba(56, 189, 248, 0.28)'); // Divine Cyan/Sky
        auraGrad.addColorStop(0.35, 'rgba(16, 185, 129, 0.16)'); // Emerald Resilience
        auraGrad.addColorStop(0.7, 'rgba(99, 102, 241, 0.08)'); // Indigo Radiance
        auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 260 + breathe, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // B. Concentric Sacred Geometry Circles
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(time * 0.05);

        // Inner Sacred Ring
        ctx.strokeStyle = 'rgba(167, 243, 208, 0.18)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([8, 12]);
        ctx.beginPath();
        ctx.arc(0, 0, 130 + breathe * 0.5, 0, Math.PI * 2);
        ctx.stroke();

        // Outer Sacred Ring
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.14)'; // Subtle Gold
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 16]);
        ctx.beginPath();
        ctx.arc(0, 0, 175 + breathe * 0.3, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();

        // C. Sacred Crescent Moon (Chandra) Symbol & Trinetra Aura
        ctx.save();
        ctx.translate(centerX, centerY);

        // Subtle Crescent Moon Curve
        ctx.fillStyle = 'rgba(248, 250, 252, 0.4)';
        ctx.beginPath();
        ctx.arc(-5, -60, 22, -0.6 * Math.PI, 0.4 * Math.PI, false);
        ctx.arc(0, -60, 22, 0.3 * Math.PI, -0.5 * Math.PI, true);
        ctx.closePath();
        ctx.fill();

        // Third Eye (Trinetra) Glowing Pulse Motif
        const eyeGlow = (Math.sin(time * 1.5) + 1) / 2;
        const trinetraGrad = ctx.createRadialGradient(0, -25, 1, 0, -25, 14);
        trinetraGrad.addColorStop(0, `rgba(251, 191, 36, ${0.7 + 0.3 * eyeGlow})`); // Golden Flame
        trinetraGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.3)');
        trinetraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = trinetraGrad;
        ctx.beginPath();
        ctx.arc(0, -25, 14, 0, Math.PI * 2);
        ctx.fill();

        // Third Eye Vertical Oval Line
        ctx.strokeStyle = `rgba(254, 243, 199, ${0.6 + 0.4 * eyeGlow})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, -25, 3.5, 7, 0, 0, Math.PI * 2);
        ctx.stroke();

        // D. Sacred Trishula (Trident) Silhouetted Line Work
        ctx.strokeStyle = 'rgba(226, 232, 240, 0.45)';
        ctx.lineWidth = 1.8;
        ctx.lineCap = 'round';

        // Center Shaft
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(0, 50);
        ctx.stroke();

        // Center Spear Tip
        ctx.beginPath();
        ctx.moveTo(0, -22);
        ctx.lineTo(0, -10);
        ctx.stroke();

        // Left Prong Curve
        ctx.beginPath();
        ctx.moveTo(-16, -16);
        ctx.quadraticCurveTo(-14, 15, 0, 15);
        ctx.stroke();

        // Right Prong Curve
        ctx.beginPath();
        ctx.moveTo(16, -16);
        ctx.quadraticCurveTo(14, 15, 0, 15);
        ctx.stroke();

        // Horizontal Guard Line
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-18, 15);
        ctx.lineTo(18, 15);
        ctx.stroke();

        ctx.restore();

        // 4. Floating Particles (Stardust) Layer
        ctx.save();
        for (let p of this.particles) {
            ctx.fillStyle = `hsla(${p.hue}, 80%, 75%, ${p.alpha})`;
            ctx.beginPath();
            ctx.arc(p.x + mouse.x * 20, p.y + mouse.y * 20, p.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}
