"use client";

import { useEffect, useRef } from 'react';

interface Particle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	size: number;
	opacity: number;
	color: string;
}

export const ParticleBackground = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const particlesRef = useRef<Particle[]>([]);
	  const animationFrameRef = useRef<number>(0);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const resizeCanvas = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		};

		const createParticles = () => {
			const particles: Particle[] = [];
			const particleCount = Math.min(50, Math.floor(window.innerWidth / 30));

			for (let i = 0; i < particleCount; i++) {
				particles.push({
					x: Math.random() * canvas.width,
					y: Math.random() * canvas.height,
					vx: (Math.random() - 0.5) * 0.5,
					vy: (Math.random() - 0.5) * 0.5,
					size: Math.random() * 3 + 1,
					opacity: Math.random() * 0.3 + 0.1,
					color: Math.random() > 0.5 ? '#ec4899' : '#a855f7', // pink-500 or purple-500
				});
			}
			particlesRef.current = particles;
		};

		const animate = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			particlesRef.current.forEach((particle) => {
				// Update position
				particle.x += particle.vx;
				particle.y += particle.vy;

				// Bounce off edges
				if (particle.x <= 0 || particle.x >= canvas.width) {
					particle.vx *= -1;
				}
				if (particle.y <= 0 || particle.y >= canvas.height) {
					particle.vy *= -1;
				}

				// Keep particles in bounds
				particle.x = Math.max(0, Math.min(canvas.width, particle.x));
				particle.y = Math.max(0, Math.min(canvas.height, particle.y));

				// Draw particle
				ctx.beginPath();
				ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
				ctx.fillStyle = `${particle.color}${Math.floor(particle.opacity * 255).toString(16).padStart(2, '0')}`;
				ctx.fill();

				// Add glow effect
				ctx.shadowColor = particle.color;
				ctx.shadowBlur = 10;
				ctx.fill();
				ctx.shadowBlur = 0;
			});

			// Draw connections between nearby particles
			particlesRef.current.forEach((particle, i) => {
				particlesRef.current.slice(i + 1).forEach((otherParticle) => {
					const dx = particle.x - otherParticle.x;
					const dy = particle.y - otherParticle.y;
					const distance = Math.sqrt(dx * dx + dy * dy);

					if (distance < 100) {
						const opacity = (100 - distance) / 100 * 0.1;
						ctx.beginPath();
						ctx.moveTo(particle.x, particle.y);
						ctx.lineTo(otherParticle.x, otherParticle.y);
						ctx.strokeStyle = `rgba(236, 72, 153, ${opacity})`; // pink-500 with opacity
						ctx.lineWidth = 0.5;
						ctx.stroke();
					}
				});
			});

			animationFrameRef.current = requestAnimationFrame(animate);
		};

		resizeCanvas();
		createParticles();
		animate();

		const handleResize = () => {
			resizeCanvas();
			createParticles();
		};

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			className="fixed inset-0 pointer-events-none z-0"
			style={{ background: 'transparent' }}
		/>
	);
};
