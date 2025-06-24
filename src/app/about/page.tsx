/* eslint-disable react/no-unescaped-entities */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ParticleBackground } from "@/components/ParticleBackground";
import IngridLogo from "../Ingridlogo";

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
								<IngridLogo compact={true} width={40} height={45} />
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

export default function About() {
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
					
					{/* Enhanced Immersive Header */}
					<header className="fixed top-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-3xl border-b border-white/30 shadow-2xl shadow-pink-500/10 transition-all duration-500">
						{/* Animated background gradient */}
						<div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-purple-500/3 to-pink-500/5 opacity-50" />
						<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
						
						{/* Decorative top border */}
						<div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-pink-500/50 to-transparent" />
						
						<div className="container mx-auto px-6 py-5 flex justify-between items-center relative z-10">
							<Link href="/" className="flex items-center space-x-4 group">
								<div className="relative">
									<div className="absolute -inset-4 bg-gradient-to-r from-pink-500/30 to-purple-600/30 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700 animate-pulse" />
									<div className="absolute -inset-2 bg-gradient-to-r from-pink-500/20 to-purple-600/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-all duration-500" />
									<div className="relative bg-gradient-to-br from-pink-500 via-pink-600 to-purple-600 p-4 rounded-3xl shadow-2xl group-hover:shadow-pink-500/40 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 border border-white/20">
										<IngridLogo compact={true} width={32} height={36} className="group-hover:scale-110 transition-transform duration-300" />
									</div>
								</div>
								<div className="flex flex-col">
									<span className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-700 bg-clip-text text-transparent group-hover:from-pink-600 group-hover:to-purple-600 transition-all duration-500">
										Ingrid
									</span>
									<span className="text-xs text-gray-500 font-medium tracking-wide group-hover:text-pink-500 transition-colors duration-300">Your Filing Assistant</span>
								</div>
							</Link>
							<nav className="hidden md:flex items-center space-x-10">
								{['Home', 'How It Works', 'Testimonials', 'About Us', 'FAQ'].map((item) => (
									<Link
										key={item}
										href={item === 'Home' ? '/' : item === 'About Us' ? '/about' : `/${item.toLowerCase().replace(/ /g, '-')}`}
										className="relative text-gray-600 hover:text-pink-600 transition-all duration-400 font-semibold group py-3 px-5 rounded-xl hover:bg-pink-50/70 hover:shadow-lg hover:shadow-pink-500/10"
									>
										<span className="relative z-10">{item}</span>
										<span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-pink-500 to-purple-600 group-hover:w-4/5 transition-all duration-400 rounded-full" />
										<div className="absolute inset-0 bg-gradient-to-r from-pink-500/15 to-purple-500/15 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-400 blur-sm" />
									</Link>
								))}
							</nav>
							<Link
								href="/#beta"
								className="relative bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 hover:from-pink-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold px-8 py-4 rounded-2xl shadow-2xl hover:shadow-pink-500/40 hover:scale-105 transition-all duration-500 group overflow-hidden border border-white/30"
							>
								<div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/30 to-white/20 -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
								<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
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
										About Ingrid
									</h1>
									<p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed font-medium">
										We're on a mission to eliminate procedural errors in litigation and give legal teams their time back.
									</p>
								</div>
							</div>
						</section>

						{/* Mission Section */}
						<section className="py-32 relative">
							<div className="container mx-auto px-6 relative z-10">
								<div className="max-w-4xl mx-auto">
									<div className="bg-white/80 backdrop-blur-3xl rounded-3xl p-16 border border-white/50 shadow-2xl shadow-pink-500/10 relative overflow-hidden group">
										<div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
										<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent rounded-t-3xl animate-pulse" />
										
										<div className="relative z-10 text-center">
											<div className="bg-gradient-to-br from-pink-500 to-purple-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
												<svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
												</svg>
											</div>
																					<h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-8">
											Our Mission
										</h2>
											<p className="text-xl text-gray-600 leading-relaxed mb-8">
												Every year, procedural errors cost law firms millions in malpractice claims, missed deadlines, and wasted billable hours. We believe there's a better way.
											</p>
											<p className="text-lg text-gray-600 leading-relaxed">
												Ingrid transforms the chaos of court rules into actionable, guaranteed-accurate guidance. We're the first platform to combine a deterministic rules engine with an end-to-end filing workflow, ensuring you never miss a rule. Ever.
											</p>
										</div>
									</div>
								</div>
							</div>
						</section>

						{/* Team Section */}
						<section className="py-12 relative">
							<div className="container mx-auto px-6 relative z-10">
								<div className="text-center mb-20">
									<h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
										Meet the Team
									</h2>
									<p className="text-gray-600 text-xl max-w-3xl mx-auto font-medium leading-relaxed">
										Built by legal professionals and technologists who understand the pain of procedural compliance.
									</p>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
									{[
										{
											name: "Alex Chen",
											role: "Co-Founder & CEO",
											bio: "Former BigLaw associate who experienced procedural compliance pain firsthand. Stanford Law, 10+ years litigation experience.",
											initials: "AC",
											gradient: "from-pink-500 to-rose-500"
										},
										{
											name: "Sarah Rodriguez",
											role: "Co-Founder & CTO",
											bio: "Former Google engineer with expertise in AI and legal tech. MIT Computer Science, built scalable systems for millions of users.",
											initials: "SR",
											gradient: "from-purple-500 to-pink-500"
										},
										{
											name: "Michael Thompson",
											role: "Head of Legal Operations",
											bio: "Former court clerk and legal operations director. Deep expertise in court rules and procedural requirements across jurisdictions.",
											initials: "MT",
											gradient: "from-pink-600 to-purple-600"
										}
									].map((member) => (
										<div key={member.name} className="group relative bg-white/70 backdrop-blur-2xl rounded-3xl p-8 border border-white/50 shadow-2xl shadow-pink-500/5 hover:shadow-pink-500/15 transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer overflow-hidden">
											{/* Animated background */}
											<div className="absolute inset-0 bg-gradient-to-br from-pink-500/3 via-purple-500/3 to-pink-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
											<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
											
											<div className="relative z-10 text-center">
												<div className="relative mb-6">
													<div className="absolute -inset-4 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
													<div className={`relative w-20 h-20 bg-gradient-to-br ${member.gradient} rounded-full flex items-center justify-center mx-auto shadow-2xl group-hover:scale-110 transition-transform duration-300`}>
														<span className="text-white font-bold text-2xl">{member.initials}</span>
													</div>
												</div>
												<h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-pink-700 transition-colors duration-300">
													{member.name}
												</h3>
												<p className="text-pink-600 font-semibold mb-4">{member.role}</p>
												<p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
													{member.bio}
												</p>
											</div>
										</div>
									))}
								</div>
							</div>
						</section>

						{/* Values Section */}
						<section className="py-12 relative">
							<div className="container mx-auto px-6 relative z-10">
								<div className="text-center mb-20">
									<h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
										Our Values
									</h2>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
									{[
										{
											icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
											title: "Accuracy First",
											description: "99.9% accuracy rate backed by rigorous testing and validation. Every recommendation is traceable to specific rule citations.",
											gradient: "from-pink-500 to-rose-500"
										},
										{
											icon: "M13 10V3L4 14h7v7l9-11h-7z",
											title: "Speed Matters",
											description: "Generate comprehensive procedural roadmaps in under 10 seconds. Your time is valuable, and we respect that.",
											gradient: "from-purple-500 to-pink-500"
										},
										{
											icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
											title: "Security & Privacy",
											description: "Bank-level security with attorney-client privilege protection. Your data never leaves our secure infrastructure.",
											gradient: "from-pink-600 to-purple-600"
										}
									].map((value) => (
										<div key={value.title} className="group relative bg-white/70 backdrop-blur-2xl rounded-3xl p-8 border border-white/50 shadow-2xl shadow-pink-500/5 hover:shadow-pink-500/15 transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer overflow-hidden">
											{/* Animated background */}
											<div className="absolute inset-0 bg-gradient-to-br from-pink-500/3 via-purple-500/3 to-pink-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
											<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
											
											<div className="relative z-10">
												<div className="relative mb-8">
													<div className="absolute -inset-4 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
													<div className={`relative bg-gradient-to-br ${value.gradient} w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500`}>
														<svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={value.icon} />
														</svg>
													</div>
												</div>
												<h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-pink-700 transition-colors duration-300">
													{value.title}
												</h3>
												<p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
													{value.description}
												</p>
											</div>
										</div>
									))}
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
												Join Our Mission
											</h2>
											<p className="text-gray-600 max-w-2xl mx-auto mb-10 text-xl leading-relaxed font-medium">
												Help us build the future of legal procedural compliance. Join our private beta today.
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
											<IngridLogo compact={true} width={28} height={32} />
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
