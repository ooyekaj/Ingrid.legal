/* eslint-disable react/no-unescaped-entities */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ParticleBackground } from "@/components/ParticleBackground";

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
		<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/30 flex items-center justify-center px-6 relative overflow-hidden">
			{/* Animated background elements */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute top-10 right-10 w-96 h-96 bg-gradient-to-br from-pink-500/8 to-purple-500/8 rounded-full blur-3xl animate-pulse" />
				<div className="absolute bottom-10 left-10 w-80 h-80 bg-gradient-to-br from-purple-500/6 to-pink-500/6 rounded-full blur-3xl animate-pulse delay-1000" />
				<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-pink-400/4 to-purple-400/4 rounded-full blur-2xl animate-pulse delay-500" />
			</div>
			
			<div className="max-w-md w-full relative z-10">
				<div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-pink-500/10 p-8 border border-white/50 relative overflow-hidden group">
					<div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
					<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent rounded-t-3xl animate-pulse" />
					
					<div className="text-center mb-8 relative z-10">
						<div className="relative mb-6">
							<div className="absolute -inset-6 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full blur-2xl animate-pulse" />
							<div className="relative bg-gradient-to-br from-pink-500 to-pink-600 p-4 rounded-2xl shadow-2xl mx-auto w-fit group-hover:scale-110 transition-transform duration-500">
								<Image
									src="/Logo.svg"
									alt="Ingrid Logo"
									width={40}
									height={45}
									className="filter brightness-0 invert"
								/>
							</div>
						</div>
						<h1 className="text-4xl font-bold text-gray-800 mb-3">
							Ingrid
						</h1>
						<p className="text-gray-600 font-medium">
							Enter password to access the platform
						</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-6 relative z-10">
						<div className="group relative">
							<label
								htmlFor="password"
								className="block text-sm font-bold text-gray-800 mb-3 tracking-wide"
							>
								Password
							</label>
							<div className="relative">
								<input
									type="password"
									id="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className="w-full px-5 py-4 border-0 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-pink-500/20 placeholder-gray-400 transition-all duration-300 group-hover:shadow-2xl bg-white/80 backdrop-blur-sm text-gray-800 font-medium disabled:opacity-50 border border-gray-200/50"
									placeholder="Enter password"
									required
									disabled={isLoading}
								/>
								<div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
							</div>
						</div>

						{error && (
							<div className="bg-gradient-to-r from-red-50 to-pink-50 backdrop-blur-sm border border-red-200/50 text-red-700 px-6 py-4 rounded-2xl text-sm shadow-lg relative overflow-hidden">
								<div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-pink-500/5" />
								<div className="relative flex items-center">
									<div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
										<svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
											<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
										</svg>
									</div>
									{error}
								</div>
							</div>
						)}

						<button
							type="submit"
							disabled={isLoading || !password.trim()}
							className={`w-full relative overflow-hidden group ${
								isLoading || !password.trim()
									? 'bg-gradient-to-r from-pink-300/20 to-purple-300/20' 
									: 'bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 hover:from-pink-600 hover:via-pink-700 hover:to-purple-700 active:scale-[0.98] shadow-2xl shadow-pink-500/25 hover:shadow-pink-500/40'
							} disabled:cursor-not-allowed text-white font-bold py-5 px-8 rounded-2xl transition-all duration-500 ease-out focus:outline-none focus:ring-4 focus:ring-pink-500/30`}
						>
							<div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20 -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
							<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
							
							<span className="relative z-10 flex items-center justify-center text-lg font-bold tracking-wide">
								{isLoading ? (
									<>
										<div className="relative mr-3">
											<svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
												<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
												<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
											</svg>
										</div>
										<span className="bg-gradient-to-r from-white to-pink-100 bg-clip-text text-transparent">
											Verifying...
										</span>
									</>
								) : (
									<>
										<div className="relative mr-3 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-300">
											<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
											</svg>
										</div>
										<span className="bg-gradient-to-r from-white to-pink-100 bg-clip-text text-transparent font-extrabold">
											Access Platform
										</span>
									</>
								)}
							</span>
						</button>
					</form>
				</div>
			</div>
		</div>
	);
};

export default function HowItWorks() {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

	// Track mouse position for interactive effects
	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			setMousePosition({ x: e.clientX, y: e.clientY });
		};

		window.addEventListener('mousemove', handleMouseMove);
		return () => window.removeEventListener('mousemove', handleMouseMove);
	}, []);

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
					
					{/* Interactive cursor follower */}
					<div 
						className="fixed w-6 h-6 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-full blur-sm pointer-events-none z-50 transition-all duration-100 ease-out"
						style={{
							left: mousePosition.x - 12,
							top: mousePosition.y - 12,
						}}
					/>
					
					{/* Header */}
					<header className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-3xl border-b border-white/20 shadow-2xl shadow-pink-500/5">
						<div className="container mx-auto px-6 py-4 flex justify-between items-center">
							<Link href="/" className="flex items-center space-x-3 group">
								<div className="relative">
									<div className="absolute -inset-3 bg-gradient-to-r from-pink-500/20 to-purple-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500 animate-pulse" />
									<div className="relative bg-gradient-to-br from-pink-500 to-pink-600 p-3 rounded-2xl shadow-2xl group-hover:shadow-pink-500/25 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
										<Image
											src="/Logo.svg"
											alt="Ingrid Logo"
											width={28}
											height={32}
											className="filter brightness-0 invert"
										/>
									</div>
								</div>
								<div className="flex flex-col">
									<span className="text-2xl font-bold text-gray-800 group-hover:text-pink-600 transition-all duration-300">
										Ingrid
									</span>
									<span className="text-xs text-gray-500 font-medium tracking-wide">Your Filing Assistant</span>
								</div>
							</Link>
							<nav className="hidden md:flex items-center space-x-8">
								{['Home', 'How It Works', 'Testimonials', 'About Us', 'FAQ'].map((item) => (
									<Link
										key={item}
										href={item === 'Home' ? '/' : item === 'About Us' ? '/about' : `/${item.toLowerCase().replace(/ /g, '-')}`}
										className="relative text-gray-600 hover:text-pink-600 transition-all duration-300 font-medium group py-2 px-4 rounded-xl hover:bg-pink-50"
									>
										<span className="relative z-10">{item}</span>
										<div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
									</Link>
								))}
							</nav>
							<Link
								href="/#beta"
								className="relative bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-bold px-6 py-3 rounded-2xl shadow-2xl hover:shadow-pink-500/25 hover:scale-105 transition-all duration-300 group overflow-hidden"
							>
								<div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20 -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
								<span className="relative z-10">Request Beta Access</span>
							</Link>
						</div>
					</header>

					{/* Main Content */}
					<main className="bg-gradient-to-br from-gray-50 via-white to-pink-50/30 min-h-screen">
						{/* Animated background elements */}
						<div className="absolute inset-0 overflow-hidden pointer-events-none">
							<div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-pink-500/5 to-purple-500/5 rounded-full blur-3xl animate-pulse" />
							<div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-br from-purple-500/2 to-pink-500/2 rounded-full blur-3xl animate-pulse delay-1000" />
							<div className="absolute top-1/2 left-1/4 w-64 h-64 bg-gradient-to-br from-pink-400/3 to-purple-400/3 rounded-full blur-2xl animate-pulse delay-500" />
						</div>
						
						{/* Hero Section */}
						<section className="relative pt-24 pb-12 md:pt-32 md:pb-16 text-center overflow-hidden">
							<div className="container mx-auto px-6 relative z-10">
								<div className="max-w-5xl mx-auto">
									<h1 className="text-5xl md:text-7xl font-extrabold text-gray-800 leading-tight mb-12 animate-fade-in">
										How Ingrid Works
									</h1>
									<p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed font-medium">
										From case intake to final filing, Ingrid streamlines your entire procedural workflow in three simple steps.
									</p>
								</div>
							</div>
						</section>

						{/* Detailed Steps Section */}
						<section className="py-12 relative">
							<div className="container mx-auto px-6 relative z-10">
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
									<div className="order-2 lg:order-1">
										<div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-8 border border-white/50 shadow-2xl shadow-pink-500/5 hover:shadow-pink-500/15 transition-all duration-500 hover:scale-105 group overflow-hidden">
											<div className="absolute inset-0 bg-gradient-to-br from-pink-500/3 via-purple-500/3 to-pink-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
											<div className="relative z-10">
												<div className="bg-gradient-to-br from-pink-500 to-rose-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-2xl group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
													<span className="text-3xl font-bold text-white">1</span>
												</div>
												<h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-pink-700 transition-colors duration-300">
													Input Case Details
												</h3>
												<p className="text-gray-600 leading-relaxed mb-6 group-hover:text-gray-700 transition-colors duration-300">
													Simply enter your case type, jurisdiction, and key dates. Ingrid's AI instantly identifies all applicable rules and procedures.
												</p>
												<ul className="space-y-3 text-gray-600">
													<li className="flex items-center">
														<svg className="w-5 h-5 text-pink-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
															<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
														</svg>
														Case type and jurisdiction
													</li>
													<li className="flex items-center">
														<svg className="w-5 h-5 text-pink-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
															<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
														</svg>
														Key dates and deadlines
													</li>
													<li className="flex items-center">
														<svg className="w-5 h-5 text-pink-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
															<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
														</svg>
														Document requirements
													</li>
												</ul>
											</div>
										</div>
									</div>
									<div className="order-1 lg:order-2">
										<div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-3xl p-8 border border-pink-200/50 shadow-xl">
											<div className="text-center">
												<div className="text-6xl mb-4">📝</div>
												<h4 className="text-xl font-bold text-gray-800 mb-2">Smart Input Form</h4>
												<p className="text-gray-600">AI-powered form that adapts to your case type</p>
											</div>
										</div>
									</div>
								</div>

								<div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
									<div>
										<div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-3xl p-8 border border-purple-200/50 shadow-xl">
											<div className="text-center">
												<div className="text-6xl mb-4">🗺️</div>
												<h4 className="text-xl font-bold text-gray-800 mb-2">Procedural Roadmap</h4>
												<p className="text-gray-600">Visual timeline of your case journey</p>
											</div>
										</div>
									</div>
									<div>
										<div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-8 border border-white/50 shadow-2xl shadow-pink-500/5 hover:shadow-pink-500/15 transition-all duration-500 hover:scale-105 group overflow-hidden">
											<div className="absolute inset-0 bg-gradient-to-br from-pink-500/3 via-purple-500/3 to-pink-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
											<div className="relative z-10">
												<div className="bg-gradient-to-br from-purple-500 to-pink-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-2xl group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
													<span className="text-3xl font-bold text-white">2</span>
												</div>
												<h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-pink-700 transition-colors duration-300">
													Get Your Roadmap
												</h3>
												<p className="text-gray-600 leading-relaxed mb-6 group-hover:text-gray-700 transition-colors duration-300">
													Receive a comprehensive procedural timeline with automated deadline calculations and compliance checklists.
												</p>
												<ul className="space-y-3 text-gray-600">
													<li className="flex items-center">
														<svg className="w-5 h-5 text-purple-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
															<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
														</svg>
														Automated deadline calculations
													</li>
													<li className="flex items-center">
														<svg className="w-5 h-5 text-purple-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
															<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
														</svg>
														Compliance checklists
													</li>
													<li className="flex items-center">
														<svg className="w-5 h-5 text-purple-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
															<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
														</svg>
														Calendar integration
													</li>
												</ul>
											</div>
										</div>
									</div>
								</div>

								<div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
									<div className="order-2 lg:order-1">
										<div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-8 border border-white/50 shadow-2xl shadow-pink-500/5 hover:shadow-pink-500/15 transition-all duration-500 hover:scale-105 group overflow-hidden">
											<div className="absolute inset-0 bg-gradient-to-br from-pink-500/3 via-purple-500/3 to-pink-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
											<div className="relative z-10">
												<div className="bg-gradient-to-br from-pink-600 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-2xl group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
													<span className="text-3xl font-bold text-white">3</span>
												</div>
												<h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-pink-700 transition-colors duration-300">
													Execute & File
												</h3>
												<p className="text-gray-600 leading-relaxed mb-6 group-hover:text-gray-700 transition-colors duration-300">
													Use pre-formatted document shells and automated compliance checks to file with confidence.
												</p>
												<ul className="space-y-3 text-gray-600">
													<li className="flex items-center">
														<svg className="w-5 h-5 text-pink-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
															<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
														</svg>
														Pre-formatted document shells
													</li>
													<li className="flex items-center">
														<svg className="w-5 h-5 text-pink-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
															<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
														</svg>
														Automated compliance checks
													</li>
													<li className="flex items-center">
														<svg className="w-5 h-5 text-pink-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
															<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
														</svg>
														Electronic filing integration
													</li>
												</ul>
											</div>
										</div>
									</div>
									<div className="order-1 lg:order-2">
										<div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-3xl p-8 border border-pink-200/50 shadow-xl">
											<div className="text-center">
												<div className="text-6xl mb-4">⚡</div>
												<h4 className="text-xl font-bold text-gray-800 mb-2">Lightning Fast Filing</h4>
												<p className="text-gray-600">Complete accuracy in under 10 seconds</p>
											</div>
										</div>
									</div>
								</div>
							</div>
						</section>

						{/* CTA Section */}
						<section className="py-12 text-center relative">
							<div className="container mx-auto px-6 relative z-10">
								<div className="max-w-4xl mx-auto">
									<div className="bg-white/80 backdrop-blur-3xl rounded-3xl p-16 border border-white/50 shadow-2xl shadow-pink-500/10 relative overflow-hidden group">
										<div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
										<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent rounded-t-3xl animate-pulse" />
										
										<div className="relative z-10">
											<h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
												Ready to Get Started?
											</h2>
											<p className="text-gray-600 max-w-2xl mx-auto mb-10 text-xl leading-relaxed font-medium">
												Join our private beta and experience the future of legal procedural compliance.
											</p>
											<Link
												href="/#beta"
												className="group relative inline-flex items-center bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 hover:from-pink-600 hover:via-pink-700 hover:to-purple-700 text-white font-bold px-10 py-5 rounded-2xl text-xl shadow-2xl shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 transition-all duration-300 overflow-hidden"
											>
												<div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20 -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
												<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
												
												<span className="relative z-10 flex items-center">
													<svg className="w-6 h-6 mr-3 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
													</svg>
													Request Beta Access
												</span>
											</Link>
										</div>
									</div>
								</div>
							</div>
						</section>
					</main>

					{/* Footer */}
					<footer className="bg-white/80 backdrop-blur-3xl border-t border-white/30 shadow-2xl shadow-pink-500/5">
						<div className="container mx-auto px-6 py-12 text-center">
							<div className="flex flex-col items-center space-y-6">
								<div className="flex items-center space-x-4">
									<div className="relative group">
										<div className="absolute -inset-3 bg-gradient-to-r from-pink-500/20 to-purple-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500 animate-pulse" />
										<div className="relative bg-gradient-to-br from-pink-500 to-pink-600 p-3 rounded-2xl shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
											<Image
												src="/Logo.svg"
												alt="Ingrid Logo"
												width={28}
												height={32}
												className="filter brightness-0 invert"
											/>
										</div>
									</div>
									<span className="text-2xl font-bold text-gray-800">
										Ingrid
									</span>
								</div>
								<p className="text-gray-600 font-medium text-lg">
									&copy; 2025 Ingrid Technologies Inc. All rights reserved.
								</p>
								<p className="text-gray-500 max-w-md leading-relaxed">
									Ingrid provides procedural information and workflow automation
									tools. It does not provide legal advice.
								</p>
							</div>
						</div>
					</footer>
				</>
			)}
		</div>
	);
}
