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
		<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/30 flex items-center justify-center px-6 relative overflow-hidden">
			{/* Animated background elements */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute top-10 right-10 w-96 h-96 bg-gradient-to-br from-pink-500/8 to-purple-500/8 rounded-full blur-3xl animate-pulse" />
				<div className="absolute bottom-10 left-10 w-80 h-80 bg-gradient-to-br from-purple-500/6 to-pink-500/6 rounded-full blur-3xl animate-pulse delay-1000" />
				<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-pink-400/4 to-purple-400/4 rounded-full blur-2xl animate-pulse delay-500" />
			</div>
			
			<div className="max-w-md w-full relative z-10">
				<div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-pink-500/10 p-8 border border-white/50 relative overflow-hidden group">
					{/* Animated border gradient */}
					<div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
					
					{/* Decorative gradient */}
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
									: 'bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 hover:from-pink-600 hover:via-pink-700 hover:to-purple-700 active:scale-[0.98] shadow-2xl shadow-pink-500/40 hover:shadow-pink-500/60'
							} disabled:cursor-not-allowed text-white font-bold py-5 px-8 rounded-2xl transition-all duration-500 ease-out focus:outline-none focus:ring-4 focus:ring-pink-500/30`}
						>
							{/* Multiple animated background effects */}
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

export default function Home() {
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
					<main className="bg-gradient-to-br from-slate-50 via-white to-rose-50/40 min-h-screen">
						{/* Animated background elements */}
						<div className="absolute inset-0 overflow-hidden pointer-events-none">
							<div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-rose-400/8 to-pink-400/6 rounded-full blur-3xl animate-pulse" />
							<div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-br from-violet-400/6 to-rose-400/8 rounded-full blur-3xl animate-pulse delay-1000" />
							<div className="absolute top-1/2 left-1/4 w-64 h-64 bg-gradient-to-br from-pink-300/4 to-violet-300/4 rounded-full blur-2xl animate-pulse delay-500" />
							<div className="absolute top-1/3 right-1/3 w-48 h-48 bg-gradient-to-br from-rose-300/3 to-pink-300/3 rounded-full blur-2xl animate-pulse delay-700" />
						</div>
						
						{/* Hero Section */}
						<section className="relative pt-24 pb-12 md:pt-32 md:pb-16 text-center overflow-hidden">
							<div className="container mx-auto px-6 relative z-10">
								<div className="max-w-5xl mx-auto">
									<h1 className="text-5xl md:text-7xl font-extrabold text-gray-800 leading-tight mb-8 animate-fade-in">
										Never Miss a Rule.
										<span className="block bg-gradient-to-r from-pink-600 via-pink-700 to-purple-700 bg-clip-text text-transparent">
											Ever.
										</span>
									</h1>
									<p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed font-medium">
										Ingrid is the <span className="font-bold text-pink-600">first integrated platform</span> to combine a
										deterministic rules engine with an end-to-end filing workflow.
										We transform the chaos of court rules into actionable,
										guaranteed-accurate checklists and document shells in seconds.
									</p>
									<div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
										<Link
											href="/#beta"
											className="group relative bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 hover:from-pink-600 hover:via-pink-700 hover:to-purple-700 text-white font-bold px-10 py-5 rounded-2xl text-xl shadow-2xl shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 transition-all duration-300 overflow-hidden"
										>
											<div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20 -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
											<span className="relative z-10 flex items-center">
												<svg className="w-6 h-6 mr-3 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
												</svg>
												Join the Private Beta
											</span>
										</Link>
										<Link
											href="/demo"
											className="group relative bg-white/90 backdrop-blur-xl border-2 border-purple-300/60 text-purple-700 hover:text-purple-800 font-bold px-10 py-5 rounded-2xl text-xl hover:bg-white hover:border-purple-400 hover:scale-105 transition-all duration-300 overflow-hidden shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
										>
											<div className="absolute inset-0 bg-gradient-to-r from-purple-500/8 to-pink-500/8 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
											<span className="relative z-10 flex items-center">
												<svg className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
												</svg>
												Watch Demo
											</span>
										</Link>
									</div>
								</div>
							</div>
						</section>

						{/* Features Section */}
						<section
							id="features"
							className="py-12 relative bg-gradient-to-br from-pink-50/30 to-purple-50/20"
						>
							<div className="container mx-auto px-6 relative z-10">
								<div className="bg-white/50 backdrop-blur-xl rounded-3xl p-12 border border-white/70 shadow-2xl shadow-pink-500/10">
									<div className="text-center mb-16">
										<h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-10 leading-tight">
											The End-to-End Filing Workflow Platform
										</h2>
										<p className="text-gray-600 text-xl max-w-3xl mx-auto font-medium leading-relaxed">
											From procedural roadmaps to deadline calendaring, Ingrid
											automates the administrative burdens of litigation.
										</p>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
									{[
										{
											icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
											title: "Procedural Roadmap",
											description: "Instantly generate a timeline of potential procedural milestones for your case type.",
											gradient: "from-pink-500 to-rose-500"
										},
										{
											icon: "M12 6v6m0 0v6m0-6h6m-6 0H6",
											title: "Smart Shell Generation",
											description: "Get pre-formatted, compliant document shells populated instantly.",
											gradient: "from-purple-500 to-pink-500"
										},
										{
											icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
											title: "Compliance Check",
											description: "Verify compliance with page limits, font size, and other formatting rules.",
											gradient: "from-pink-600 to-purple-600"
										},
										{
											icon: "M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14m-5 4v2m0 0v2m0-2h2m-2 0h-2",
											title: "Deadline Calendaring",
											description: "Automatically calculate and track critical deadlines with built-in calendar integration.",
											gradient: "from-rose-500 to-pink-500"
										},
										{
											icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
											title: "Secure & Compliant",
											description: "Bank-level security with attorney-client privilege protection and SOC 2 compliance.",
											gradient: "from-purple-600 to-pink-600"
										},
										{
											icon: "M13 10V3L4 14h7v7l9-11h-7z",
											title: "Lightning Fast",
											description: "Generate comprehensive procedural checklists and document shells in under 10 seconds.",
											gradient: "from-pink-500 to-purple-500"
										}
									].map((feature, index) => (
										<div 
											key={feature.title}
											className="group relative bg-white/70 backdrop-blur-2xl rounded-3xl p-8 border border-white/50 shadow-2xl shadow-pink-500/5 hover:shadow-pink-500/15 transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer overflow-hidden"
											style={{ animationDelay: `${index * 100}ms` }}
										>
											{/* Animated background gradient */}
											<div className="absolute inset-0 bg-gradient-to-br from-pink-500/3 via-purple-500/3 to-pink-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
											<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
											
											<div className="relative z-10">
												<div className="relative mb-8">
													<div className="absolute -inset-4 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
													<div className={`relative bg-gradient-to-br ${feature.gradient} w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500`}>
														<svg
															className="w-8 h-8 text-white"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																strokeWidth="2"
																d={feature.icon}
															/>
														</svg>
													</div>
												</div>
												<h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-pink-700 transition-colors duration-300">
													{feature.title}
												</h3>
												<p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
													{feature.description}
												</p>
											</div>
										</div>
									))}
								</div>
								</div>
							</div>
						</section>

						{/* How It Works Section */}
						<section
							id="how-it-works"
							className="py-12 relative bg-gradient-to-br from-purple-50/20 to-pink-50/30"
						>
							<div className="container mx-auto px-6 relative z-10">
								<div className="bg-white/60 backdrop-blur-xl rounded-3xl p-12 border border-purple-200/50 shadow-2xl shadow-purple-500/10">
									<div className="text-center mb-16">
										<h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-10 leading-tight">
											How Ingrid Works
										</h2>
										<p className="text-gray-600 text-xl max-w-3xl mx-auto font-medium leading-relaxed">
											From case intake to final filing, Ingrid streamlines your
											entire procedural workflow in three simple steps.
										</p>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-3 gap-12">
									{[
										{
											number: "1",
											title: "Input Case Details",
											description: "Simply enter your case type, jurisdiction, and key dates. Ingrid's AI instantly identifies all applicable rules and procedures.",
											icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
											gradient: "from-pink-500 to-rose-500"
										},
										{
											number: "2",
											title: "Get Your Roadmap",
											description: "Receive a comprehensive procedural timeline with automated deadline calculations and compliance checklists.",
											icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
											gradient: "from-purple-500 to-pink-500"
										},
										{
											number: "3",
											title: "Execute & File",
											description: "Use pre-formatted document shells and automated compliance checks to file with confidence.",
											icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
											gradient: "from-pink-600 to-purple-600"
										}
									].map((step, index) => (
										<div key={step.number} className="text-center group relative">
											{/* Connecting line for desktop */}
											{index < 2 && (
												<div className="hidden md:block absolute top-12 left-full w-12 h-0.5 bg-gradient-to-r from-pink-500/30 to-purple-500/30 z-0" />
											)}
											
											<div className="relative mb-8">
												<div className="absolute -inset-6 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse" />
												<div className={`relative bg-gradient-to-br ${step.gradient} text-white w-24 h-24 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-pink-500/25 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-500 cursor-pointer`}>
													<span className="text-4xl font-bold">{step.number}</span>
												</div>
											</div>
											
											<div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-8 border border-white/50 shadow-2xl shadow-pink-500/5 hover:shadow-pink-500/15 transition-all duration-500 hover:scale-105 hover:-translate-y-2 group-hover:bg-white/80 relative overflow-hidden">
												{/* Animated background */}
												<div className="absolute inset-0 bg-gradient-to-br from-pink-500/3 via-purple-500/3 to-pink-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
												<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
												
												<div className="relative z-10">
													<div className="mb-6">
														<div className={`bg-gradient-to-br ${step.gradient} w-12 h-12 rounded-xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300`}>
															<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={step.icon} />
															</svg>
														</div>
													</div>
													<h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-pink-700 transition-colors duration-300">
														{step.title}
													</h3>
													<p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
														{step.description}
													</p>
												</div>
											</div>
										</div>
									))}
								</div>

								<div className="text-center mt-16">
									<Link
										href="/how-it-works"
										className="group relative inline-flex items-center bg-white/70 backdrop-blur-xl border border-gray-200/50 text-gray-800 font-bold px-8 py-4 rounded-2xl text-lg hover:bg-white/90 hover:scale-105 transition-all duration-300 overflow-hidden"
									>
										<div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
										<span className="relative z-10 flex items-center">
											Learn More About Our Process
											<svg className="w-5 h-5 ml-2 group-hover:translate-x-1 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
											</svg>
										</span>
									</Link>
								</div>
								</div>
							</div>
						</section>

						{/* Testimonials Section */}
						<section
							id="testimonials"
							className="py-12 relative bg-gradient-to-br from-pink-50/40 to-rose-50/30"
						>
							<div className="container mx-auto px-6 relative z-10">
								<div className="bg-white/50 backdrop-blur-xl rounded-3xl p-12 border border-pink-200/50 shadow-2xl shadow-pink-500/15">
									<div className="text-center mb-16">
										<h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-10 leading-tight">
											Trusted by Leading Law Firms
										</h2>
										<p className="text-gray-600 text-xl max-w-3xl mx-auto font-medium leading-relaxed">
											See what our beta partners are saying about Ingrid's impact
											on their practice.
										</p>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
									{[
										{
											name: "Sarah Martinez",
											role: "Partner, Bay Area Litigation Firm",
											initials: "SM",
											quote: "Ingrid has transformed our motion practice. What used to take hours of rule-checking now happens in seconds. The accuracy is incredible.",
											gradient: "from-pink-500 to-rose-500"
										},
										{
											name: "David Johnson",
											role: "Managing Partner, Johnson & Associates",
											initials: "DJ",
											quote: "The deadline calendaring feature alone has saved us from multiple potential malpractice issues. Ingrid is a game-changer for litigation teams.",
											gradient: "from-purple-500 to-pink-500"
										},
										{
											name: "Amanda Chen",
											role: "Senior Associate, Tech Litigation Group",
											initials: "AC",
											quote: "We've reduced our procedural research time by 80%. Our associates can now focus on substantive legal work instead of hunting through court rules.",
											gradient: "from-pink-600 to-purple-600"
										}
									].map((testimonial) => (
										<div key={testimonial.name} className="group relative bg-white/70 backdrop-blur-2xl rounded-3xl p-8 border border-white/50 shadow-2xl shadow-pink-500/5 hover:shadow-pink-500/15 transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer overflow-hidden">
											{/* Animated background */}
											<div className="absolute inset-0 bg-gradient-to-br from-pink-500/3 via-purple-500/3 to-pink-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
											<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
											
											<div className="relative z-10">
												<div className="flex items-center mb-6">
													<div className="flex text-pink-400 space-x-1">
														{[...Array(5)].map((_, i) => (
															<svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
																<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
															</svg>
														))}
													</div>
												</div>
												<p className="text-gray-700 mb-8 leading-relaxed font-medium text-lg group-hover:text-gray-800 transition-colors duration-300">
													"{testimonial.quote}"
												</p>
												<div className="flex items-center">
													<div className="relative">
														<div className="absolute -inset-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
														<div className={`relative w-14 h-14 bg-gradient-to-br ${testimonial.gradient} rounded-full flex items-center justify-center mr-4 shadow-2xl group-hover:scale-110 transition-transform duration-300`}>
															<span className="text-white font-bold text-lg">{testimonial.initials}</span>
														</div>
													</div>
													<div>
														<h4 className="font-bold text-gray-900 group-hover:text-pink-700 transition-colors duration-300">{testimonial.name}</h4>
														<p className="text-gray-500 text-sm">{testimonial.role}</p>
													</div>
												</div>
											</div>
										</div>
									))}
								</div>

								<div className="text-center mt-16">
									<Link
										href="/testimonials"
										className="group relative inline-flex items-center bg-white/70 backdrop-blur-xl border border-gray-200/50 text-gray-800 font-bold px-8 py-4 rounded-2xl text-lg hover:bg-white/90 hover:scale-105 transition-all duration-300 overflow-hidden"
									>
										<div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
										<span className="relative z-10 flex items-center">
											Read More Success Stories
											<svg className="w-5 h-5 ml-2 group-hover:translate-x-1 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
											</svg>
										</span>
									</Link>
								</div>
								</div>
							</div>
						</section>

						{/* FAQ Section */}
						<section
							id="faq"
							className="py-12 relative bg-gradient-to-br from-purple-50/30 to-indigo-50/20"
						>
							<div className="container mx-auto px-6 relative z-10">
								<div className="bg-white/60 backdrop-blur-xl rounded-3xl p-16 border border-purple-200/60 shadow-2xl shadow-purple-500/12">
									<div className="text-center mb-20">
										<h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-10 leading-tight">
											Frequently Asked Questions
										</h2>
										<p className="text-gray-600 text-xl max-w-3xl mx-auto font-medium leading-relaxed">
											Get answers to common questions about Ingrid's legal
											technology platform.
										</p>
									</div>

									<div className="max-w-4xl mx-auto">
									<div className="space-y-6">
										{[
											{
												question: "How accurate is Ingrid's rules engine?",
												answer: "Ingrid's deterministic rules engine is 99.9% accurate. Our system is built on a comprehensive database of court rules that's continuously updated by our legal team and validated through machine learning algorithms."
											},
											{
												question: "Which jurisdictions does Ingrid support?",
												answer: "We currently support all California state courts and federal courts in the Northern District of California. We're rapidly expanding to other California districts and planning nationwide coverage by Q4 2025."
											},
											{
												question: "Is my client data secure?",
												answer: "Absolutely. Ingrid is built with bank-level security, including end-to-end encryption, SOC 2 compliance, and strict adherence to attorney-client privilege protection. Your data never leaves our secure cloud infrastructure."
											},
											{
												question: "How does pricing work?",
												answer: "Ingrid offers flexible pricing based on firm size and usage. Our beta partners receive special pricing during the trial period. Full pricing will be announced at our general availability launch."
											}
										].map((faq, index) => (
											<div key={index} className="group relative bg-white/70 backdrop-blur-2xl rounded-3xl p-8 border border-white/50 shadow-2xl shadow-pink-500/5 hover:shadow-pink-500/15 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer overflow-hidden">
												{/* Animated background */}
												<div className="absolute inset-0 bg-gradient-to-br from-pink-500/3 via-purple-500/3 to-pink-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
												<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
												
												<div className="relative z-10">
													<h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-pink-700 transition-colors duration-300">
														{faq.question}
													</h3>
													<p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
														{faq.answer}
													</p>
												</div>
											</div>
										))}
									</div>

									<div className="text-center mt-16">
										<Link
											href="/faq"
											className="group relative inline-flex items-center bg-white/70 backdrop-blur-xl border border-gray-200/50 text-gray-800 font-bold px-8 py-4 rounded-2xl text-lg hover:bg-white/90 hover:scale-105 transition-all duration-300 overflow-hidden"
										>
											<div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
											<span className="relative z-10 flex items-center">
												View All FAQs
												<svg className="w-5 h-5 ml-2 group-hover:translate-x-1 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
												</svg>
											</span>
										</Link>
									</div>
								</div>
								</div>
							</div>
						</section>

						{/* Beta Section */}
						<section
							id="beta"
							className="py-12 text-center relative"
						>
							{/* Enhanced background decorations */}
							<div className="absolute inset-0 overflow-hidden pointer-events-none">
								<div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-pink-500/8 to-purple-500/8 rounded-full blur-3xl animate-pulse" />
								<div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-br from-purple-500/2 to-pink-500/2 rounded-full blur-3xl animate-pulse delay-1000" />
							</div>
							
							<div className="container mx-auto px-6 relative z-10">
								<div className="max-w-5xl mx-auto">
									<div className="bg-white/80 backdrop-blur-3xl rounded-3xl p-16 border border-white/50 shadow-2xl shadow-pink-500/10 relative overflow-hidden group">
										{/* Animated border gradient */}
										<div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
										
										{/* Decorative top gradient */}
										<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent rounded-t-3xl animate-pulse" />
										
										<div className="relative z-10">
											<h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-10 leading-tight">
												Interested?
											</h2>
											<h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-pink-600 via-pink-700 to-purple-700 bg-clip-text text-transparent mb-8 leading-tight">
												Become an Ingrid Design Partner
											</h1>
											<p className="text-gray-600 max-w-3xl mx-auto mb-12 text-xl leading-relaxed font-medium">
												We are launching a private beta for select litigation firms in
												the Bay Area. Join us to shape the future of procedural
												compliance and give your team an unfair advantage.
											</p>
											<a
												href="mailto:support@ingrid.legal"
												className="group relative inline-flex items-center bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 hover:from-pink-600 hover:via-pink-700 hover:to-purple-700 text-white font-bold px-12 py-6 rounded-2xl text-xl shadow-2xl shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 transition-all duration-300 overflow-hidden"
											>
												{/* Multiple animated background effects */}
												<div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20 -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
												<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
												
												<span className="relative z-10 flex items-center">
													<div className="relative mr-4 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-300">
														<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
														</svg>
													</div>
													<span className="bg-gradient-to-r from-white to-pink-100 bg-clip-text text-transparent font-extrabold tracking-wide">
														Request Beta Access
													</span>
												</span>
											</a>
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
