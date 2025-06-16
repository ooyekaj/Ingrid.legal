/* eslint-disable react/no-unescaped-entities */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

// Password Protection Component
const PasswordProtection = ({
	onPasswordCorrect,
}: {
	onPasswordCorrect: () => void;
}) => {
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");

		// Static password - you can change this to whatever you want
		const correctPassword = "12345678";

		setTimeout(() => {
			if (password === correctPassword) {
				localStorage.setItem("ingrid_authenticated", "true");
				onPasswordCorrect();
			} else {
				setError("Incorrect password. Please try again.");
				setPassword("");
			}
			setIsLoading(false);
		}, 500);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center px-6">
			<div className="max-w-md w-full">
				<div className="bg-white rounded-2xl shadow-xl p-8">
					<div className="text-center mb-8">
						<Image
							src="/Logo.svg"
							alt="Ingrid Logo"
							width={60}
							height={65}
							className="mx-auto mb-4"
						/>
						<h1 className="text-3xl font-bold text-gray-900 mb-2">Ingrid</h1>
						<p className="text-gray-600">
							Enter password to access the platform
						</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-6">
						<div>
							<label
								htmlFor="password"
								className="block text-sm font-medium text-gray-700 mb-2"
							>
								Password
							</label>
							<input
								type="password"
								id="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
								placeholder="Enter password"
								required
								disabled={isLoading}
							/>
						</div>

						{error && (
							<div className="text-red-600 text-sm text-center bg-red-50 py-2 px-4 rounded-lg">
								{error}
							</div>
						)}

						<button
							type="submit"
							disabled={isLoading || !password.trim()}
							className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-pink-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
						>
							{isLoading ? "Verifying..." : "Access Platform"}
						</button>
					</form>
				</div>
			</div>
		</div>
	);
};

// Particle animation component
const ParticleBackground = () => {
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
			setInterval(() => {
				if (particles.length < 100) {
					for (let i = 0; i < 10; i++) {
						particles.push(new Particle());
					}
				}
			}, 500);
			animate();
		}
	}, []);

	return null;
};

export default function Home() {
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	// Check if user is already authenticated on component mount
	useEffect(() => {
		const checkAuth = () => {
			const isAuth = localStorage.getItem("ingrid_authenticated");
			if (isAuth === "true") {
				setIsAuthenticated(true);
			}
		};
		checkAuth();
	}, []);

	return (
		<div className="overflow-x-hidden">
			{!isAuthenticated && (
				<PasswordProtection
					onPasswordCorrect={() => setIsAuthenticated(true)}
				/>
			)}
			{isAuthenticated && (
				<>
					<ParticleBackground />
					{/* Header */}
					<header className="fixed top-0 left-0 right-0 z-50 bg-white bg-opacity-80 backdrop-blur-md border-b border-gray-200">
						<div className="container mx-auto px-6 py-4 flex justify-between items-center">
							<Link href="/" className="flex items-center">
								<Image
									src="/Logo.svg"
									alt="Ingrid Logo"
									width={45}
									height={50}
									className="mr-3"
								/>
								<span className="text-3xl font-bold text-gray-900 tracking-wider">
									Ingrid
								</span>
							</Link>
							<nav className="hidden md:flex items-center space-x-8">
								<Link
									href="/"
									className="text-gray-600 hover:text-pink-600 transition"
								>
									Home
								</Link>
								<Link
									href="/how-it-works"
									className="text-gray-600 hover:text-pink-600 transition"
								>
									How It Works
								</Link>
								<Link
									href="/testimonials"
									className="text-gray-600 hover:text-pink-600 transition"
								>
									Testimonials
								</Link>
								<Link
									href="/about"
									className="text-gray-600 hover:text-pink-600 transition"
								>
									About Us
								</Link>
								<Link
									href="/faq"
									className="text-gray-600 hover:text-pink-600 transition"
								>
									FAQ
								</Link>
							</nav>
							<Link
								href="/#beta"
								className="cta-button bg-pink-600 hover:bg-pink-500 text-white font-semibold px-5 py-2 rounded-lg"
							>
								Request Beta Access
							</Link>
						</div>
					</header>

					{/* Main Content */}
					<main>
						{/* Hero Section */}
						<section className="relative py-20 md:py-32 text-center overflow-hidden bg-white">
							<div
								id="canvas-container"
								className="absolute inset-0 pointer-events-none"
							></div>
							<div className="container mx-auto px-6 relative">
								<h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-4">
									Never Miss a Rule. Ever.
								</h1>
								<p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
									Ingrid is the <b>first integrated platform</b> to combine a
									deterministic rules engine with an end-to-end filing workflow.
									We transform the chaos of court rules into actionable,
									guaranteed-accurate checklists and document shells in seconds.
								</p>
								<Link
									href="/#beta"
									className="cta-button bg-pink-600 hover:bg-pink-500 text-white font-bold px-8 py-4 rounded-lg text-lg"
								>
									Join the Private Beta
								</Link>
							</div>
						</section>

						{/* Features Section */}
						<section
							id="features"
							className="py-24 bg-gray-50 bg-opacity-80 backdrop-blur-sm"
						>
							<div className="container mx-auto px-6">
								<div className="text-center mb-16">
									<h2 className="text-3xl md:text-4xl font-bold text-gray-900">
										The End-to-End Filing Workflow Platform
									</h2>
									<p className="text-gray-600 mt-2 max-w-2xl mx-auto">
										From procedural roadmaps to deadline calendaring, Ingrid
										automates the administrative burdens of litigation.
									</p>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
									{/* Feature Cards */}
									<div className="feature-card rounded-2xl p-6">
										<div className="bg-pink-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
											<svg
												className="w-6 h-6 text-pink-600"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth="2"
													d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
												/>
											</svg>
										</div>
										<h3 className="text-xl font-bold text-gray-900 mb-2">
											Procedural Roadmap
										</h3>
										<p className="text-gray-600">
											Instantly generate a timeline of potential procedural
											milestones for your case type.
										</p>
									</div>

									<div className="feature-card rounded-2xl p-6">
										<div className="bg-pink-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
											<svg
												className="w-6 h-6 text-pink-600"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth="2"
													d="M12 6v6m0 0v6m0-6h6m-6 0H6"
												/>
											</svg>
										</div>
										<h3 className="text-xl font-bold text-gray-900 mb-2">
											Smart Shell Generation
										</h3>
										<p className="text-gray-600">
											Get pre-formatted, compliant document shells populated
											instantly.
										</p>
									</div>

									<div className="feature-card rounded-2xl p-6">
										<div className="bg-pink-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
											<svg
												className="w-6 h-6 text-pink-600"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth="2"
													d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
												/>
											</svg>
										</div>
										<h3 className="text-xl font-bold text-gray-900 mb-2">
											Compliance Check
										</h3>
										<p className="text-gray-600">
											Verify compliance with page limits, font size, and other
											formatting rules.
										</p>
									</div>

									<div className="feature-card rounded-2xl p-6">
										<div className="bg-pink-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
											<svg
												className="w-6 h-6 text-pink-600"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth="2"
													d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4a2 2 0 11-4 0 2 2 0 014 0zM4 14v8a2 2 0 002 2h12a2 2 0 002-2v-8"
												/>
											</svg>
										</div>
										<h3 className="text-xl font-bold text-gray-900 mb-2">
											Deadline Calendaring
										</h3>
										<p className="text-gray-600">
											Automatically calculate and track critical deadlines with
											built-in calendar integration.
										</p>
									</div>

									<div className="feature-card rounded-2xl p-6">
										<div className="bg-pink-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
											<svg
												className="w-6 h-6 text-pink-600"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth="2"
													d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
												/>
											</svg>
										</div>
										<h3 className="text-xl font-bold text-gray-900 mb-2">
											Secure & Compliant
										</h3>
										<p className="text-gray-600">
											Bank-level security with attorney-client privilege
											protection and SOC 2 compliance.
										</p>
									</div>

									<div className="feature-card rounded-2xl p-6">
										<div className="bg-pink-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
											<svg
												className="w-6 h-6 text-pink-600"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth="2"
													d="M13 10V3L4 14h7v7l9-11h-7z"
												/>
											</svg>
										</div>
										<h3 className="text-xl font-bold text-gray-900 mb-2">
											Lightning Fast
										</h3>
										<p className="text-gray-600">
											Generate comprehensive procedural checklists and document
											shells in under 10 seconds.
										</p>
									</div>
								</div>
							</div>
						</section>

						{/* How It Works Section */}
						<section
							id="how-it-works"
							className="py-24 bg-white bg-opacity-80 backdrop-blur-sm"
						>
							<div className="container mx-auto px-6">
								<div className="text-center mb-16">
									<h2 className="text-3xl md:text-4xl font-bold text-gray-900">
										How Ingrid Works
									</h2>
									<p className="text-gray-600 mt-2 max-w-2xl mx-auto">
										From case intake to final filing, Ingrid streamlines your
										entire procedural workflow in three simple steps.
									</p>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
									<div className="text-center">
										<div className="bg-pink-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
											1
										</div>
										<h3 className="text-xl font-bold text-gray-900 mb-4">
											Input Case Details
										</h3>
										<p className="text-gray-600">
											Simply enter your case type, jurisdiction, and key dates.
											Ingrid's AI instantly identifies all applicable rules and
											procedures.
										</p>
									</div>

									<div className="text-center">
										<div className="bg-pink-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
											2
										</div>
										<h3 className="text-xl font-bold text-gray-900 mb-4">
											Get Your Roadmap
										</h3>
										<p className="text-gray-600">
											Receive a comprehensive procedural timeline with automated
											deadline calculations and compliance checklists.
										</p>
									</div>

									<div className="text-center">
										<div className="bg-pink-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
											3
										</div>
										<h3 className="text-xl font-bold text-gray-900 mb-4">
											Execute & File
										</h3>
										<p className="text-gray-600">
											Use pre-formatted document shells and automated compliance
											checks to file with confidence.
										</p>
									</div>
								</div>

								<div className="text-center mt-12">
									<Link
										href="/how-it-works"
										className="text-pink-600 hover:text-pink-500 font-semibold text-lg"
									>
										Learn More About Our Process →
									</Link>
								</div>
							</div>
						</section>

						{/* Testimonials Section */}
						<section
							id="testimonials"
							className="py-24 bg-gray-50 bg-opacity-80 backdrop-blur-sm"
						>
							<div className="container mx-auto px-6">
								<div className="text-center mb-16">
									<h2 className="text-3xl md:text-4xl font-bold text-gray-900">
										Trusted by Leading Law Firms
									</h2>
									<p className="text-gray-600 mt-2 max-w-2xl mx-auto">
										See what our beta partners are saying about Ingrid's impact
										on their practice.
									</p>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
									<div className="bg-white rounded-2xl p-8 shadow-lg">
										<div className="flex items-center mb-4">
											<div className="flex text-pink-500">
												<svg
													className="w-5 h-5"
													fill="currentColor"
													viewBox="0 0 20 20"
												>
													<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
												</svg>
												<svg
													className="w-5 h-5"
													fill="currentColor"
													viewBox="0 0 20 20"
												>
													<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
												</svg>
												<svg
													className="w-5 h-5"
													fill="currentColor"
													viewBox="0 0 20 20"
												>
													<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
												</svg>
												<svg
													className="w-5 h-5"
													fill="currentColor"
													viewBox="0 0 20 20"
												>
													<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
												</svg>
												<svg
													className="w-5 h-5"
													fill="currentColor"
													viewBox="0 0 20 20"
												>
													<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
												</svg>
											</div>
										</div>
										<p className="text-gray-600 mb-6">
											"Ingrid has transformed our motion practice. What used to
											take hours of rule-checking now happens in seconds. The
											accuracy is incredible."
										</p>
										<div className="flex items-center">
											<div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mr-4">
												<span className="text-pink-600 font-bold text-lg">
													SM
												</span>
											</div>
											<div>
												<h4 className="font-bold text-gray-900">
													Sarah Martinez
												</h4>
												<p className="text-gray-600 text-sm">
													Partner, Bay Area Litigation Firm
												</p>
											</div>
										</div>
									</div>

									<div className="bg-white rounded-2xl p-8 shadow-lg">
										<div className="flex items-center mb-4">
											<div className="flex text-pink-500">
												<svg
													className="w-5 h-5"
													fill="currentColor"
													viewBox="0 0 20 20"
												>
													<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
												</svg>
												<svg
													className="w-5 h-5"
													fill="currentColor"
													viewBox="0 0 20 20"
												>
													<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
												</svg>
												<svg
													className="w-5 h-5"
													fill="currentColor"
													viewBox="0 0 20 20"
												>
													<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
												</svg>
												<svg
													className="w-5 h-5"
													fill="currentColor"
													viewBox="0 0 20 20"
												>
													<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
												</svg>
												<svg
													className="w-5 h-5"
													fill="currentColor"
													viewBox="0 0 20 20"
												>
													<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
												</svg>
											</div>
										</div>
										<p className="text-gray-600 mb-6">
											"The deadline calendaring feature alone has saved us from
											multiple potential malpractice issues. Ingrid is a
											game-changer for litigation teams."
										</p>
										<div className="flex items-center">
											<div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mr-4">
												<span className="text-pink-600 font-bold text-lg">
													DJ
												</span>
											</div>
											<div>
												<h4 className="font-bold text-gray-900">
													David Johnson
												</h4>
												<p className="text-gray-600 text-sm">
													Managing Partner, Johnson & Associates
												</p>
											</div>
										</div>
									</div>

									<div className="bg-white rounded-2xl p-8 shadow-lg">
										<div className="flex items-center mb-4">
											<div className="flex text-pink-500">
												<svg
													className="w-5 h-5"
													fill="currentColor"
													viewBox="0 0 20 20"
												>
													<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
												</svg>
												<svg
													className="w-5 h-5"
													fill="currentColor"
													viewBox="0 0 20 20"
												>
													<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
												</svg>
												<svg
													className="w-5 h-5"
													fill="currentColor"
													viewBox="0 0 20 20"
												>
													<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
												</svg>
												<svg
													className="w-5 h-5"
													fill="currentColor"
													viewBox="0 0 20 20"
												>
													<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
												</svg>
												<svg
													className="w-5 h-5"
													fill="currentColor"
													viewBox="0 0 20 20"
												>
													<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
												</svg>
											</div>
										</div>
										<p className="text-gray-600 mb-6">
											"We've reduced our procedural research time by 80%. Our
											associates can now focus on substantive legal work instead
											of hunting through court rules."
										</p>
										<div className="flex items-center">
											<div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mr-4">
												<span className="text-pink-600 font-bold text-lg">
													AC
												</span>
											</div>
											<div>
												<h4 className="font-bold text-gray-900">Amanda Chen</h4>
												<p className="text-gray-600 text-sm">
													Senior Associate, Tech Litigation Group
												</p>
											</div>
										</div>
									</div>
								</div>

								<div className="text-center mt-12">
									<Link
										href="/testimonials"
										className="text-pink-600 hover:text-pink-500 font-semibold text-lg"
									>
										Read More Success Stories →
									</Link>
								</div>
							</div>
						</section>

						{/* FAQ Section */}
						<section
							id="faq"
							className="py-24 bg-white bg-opacity-80 backdrop-blur-sm"
						>
							<div className="container mx-auto px-6">
								<div className="text-center mb-16">
									<h2 className="text-3xl md:text-4xl font-bold text-gray-900">
										Frequently Asked Questions
									</h2>
									<p className="text-gray-600 mt-2 max-w-2xl mx-auto">
										Get answers to common questions about Ingrid's legal
										technology platform.
									</p>
								</div>

								<div className="max-w-4xl mx-auto">
									<div className="space-y-6">
										<div className="bg-gray-50 rounded-lg p-6">
											<h3 className="text-lg font-bold text-gray-900 mb-2">
												How accurate is Ingrid's rules engine?
											</h3>
											<p className="text-gray-600">
												Ingrid's deterministic rules engine is 99.9% accurate.
												Our system is built on a comprehensive database of court
												rules that's continuously updated by our legal team and
												validated through machine learning algorithms.
											</p>
										</div>

										<div className="bg-gray-50 rounded-lg p-6">
											<h3 className="text-lg font-bold text-gray-900 mb-2">
												Which jurisdictions does Ingrid support?
											</h3>
											<p className="text-gray-600">
												We currently support all California state courts and
												federal courts in the Northern District of California.
												We're rapidly expanding to other California districts
												and planning nationwide coverage by Q4 2025.
											</p>
										</div>

										<div className="bg-gray-50 rounded-lg p-6">
											<h3 className="text-lg font-bold text-gray-900 mb-2">
												Is my client data secure?
											</h3>
											<p className="text-gray-600">
												Absolutely. Ingrid is built with bank-level security,
												including end-to-end encryption, SOC 2 compliance, and
												strict adherence to attorney-client privilege
												protection. Your data never leaves our secure cloud
												infrastructure.
											</p>
										</div>

										<div className="bg-gray-50 rounded-lg p-6">
											<h3 className="text-lg font-bold text-gray-900 mb-2">
												How does pricing work?
											</h3>
											<p className="text-gray-600">
												Ingrid offers flexible pricing based on firm size and
												usage. Our beta partners receive special pricing during
												the trial period. Full pricing will be announced at our
												general availability launch.
											</p>
										</div>
									</div>

									<div className="text-center mt-12">
										<Link
											href="/faq"
											className="text-pink-600 hover:text-pink-500 font-semibold text-lg"
										>
											View All FAQs →
										</Link>
									</div>
								</div>
							</div>
						</section>

						{/* Beta Section */}
						<section
							id="beta"
							className="py-20 text-center bg-gray-50 bg-opacity-80 backdrop-blur-sm"
						>
							<div className="container mx-auto px-6">
								<h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
									Interested?
								</h2>
								<h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-4">
									Become an Ingrid Design Partner
								</h1>
								<p className="text-gray-600 max-w-2xl mx-auto mb-8">
									We are launching a private beta for select litigation firms in
									the Bay Area. Join us to shape the future of procedural
									compliance and give your team an unfair advantage.
								</p>
								<a
									href="mailto:support@ingrid.legal"
									className="cta-button bg-pink-600 hover:bg-pink-500 text-white font-bold px-8 py-4 rounded-lg text-lg"
								>
									Request Beta Access
								</a>
							</div>
						</section>
					</main>

					{/* Footer */}
					<footer className="bg-gray-100 bg-opacity-80 backdrop-blur-sm border-t border-gray-200">
						<div className="container mx-auto px-6 py-8 text-center text-gray-500">
							<p>&copy; 2025 Ingrid Technologies Inc. All rights reserved.</p>
							<p className="text-sm mt-2">
								Ingrid provides procedural information and workflow automation
								tools. It does not provide legal advice.
							</p>
						</div>
					</footer>
				</>
			)}
		</div>
	);
}
