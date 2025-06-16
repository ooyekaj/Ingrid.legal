"use client";

import { useEffect } from "react";

// Particle animation component
export const ParticleBackground = () => {
	useEffect(() => {
		const canvas = document.createElement("canvas");
		const container = document.getElementById("canvas-container");
		if (container) {
			container.appendChild(canvas);
			const ctx = canvas.getContext("2d");
			const particles: Particle[] = [];

			function resizeCanvas() {
				if (!container) return;
				canvas.width = container.offsetWidth;
				canvas.height = container.offsetHeight;
			}

			class Particle {
				x: number;
				y: number;
				size: number;
				speedX: number;
				speedY: number;

				constructor() {
					this.x = Math.random() * canvas.width;
					this.y = Math.random() * canvas.height;
					this.size = Math.random() * 2 + 1;
					this.speedX = Math.random() * 1 - 0.5;
					this.speedY = Math.random() * 1 - 0.5;
				}

				update() {
					this.x += this.speedX;
					this.y += this.speedY;
					if (this.size > 0.2) this.size -= 0.01;
				}

				draw() {
					if (!ctx) return;
					ctx.fillStyle = "rgba(236, 72, 153, 0.4)";
					ctx.strokeStyle = "rgba(236, 72, 153, 0.4)";
					ctx.lineWidth = 2;
					ctx.beginPath();
					ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
					ctx.closePath();
					ctx.fill();
				}
			}

			function handleParticles() {
				for (let i = 0; i < particles.length; i++) {
					particles[i].update();
					particles[i].draw();
					if (particles[i].size <= 0.3) {
						particles.splice(i, 1);
						i--;
					}
				}
			}

			function animate() {
				if (!ctx) return;
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				handleParticles();
				requestAnimationFrame(animate);
			}

			window.addEventListener("resize", resizeCanvas);

			resizeCanvas();
			const intervalId = setInterval(() => {
				if (particles.length < 100) {
					for (let i = 0; i < 10; i++) {
						particles.push(new Particle());
					}
				}
			}, 500);
			animate();

			return () => {
				clearInterval(intervalId);
				window.removeEventListener("resize", resizeCanvas);
				if (container && canvas) {
					container.removeChild(canvas);
				}
			};
		}
	}, []);

	return (
		<div
			id="canvas-container"
			className="fixed inset-0 pointer-events-none z-0 bg-white/10"
		></div>
	);
};
