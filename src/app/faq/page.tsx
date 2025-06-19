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

export default function FAQ() {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
	const [openFAQ, setOpenFAQ] = useState<number | null>(null);

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

	const faqs = [
		{
			question: "What types of court rules does Ingrid cover?",
			answer: "Ingrid covers federal court rules (FRCP, FRAP, FRE), state court rules for all 50 states, and local rules for major courts. Our database is continuously updated to reflect rule changes and amendments."
		},
		{
			question: "How accurate is Ingrid's guidance?",
			answer: "Ingrid maintains a 99.9% accuracy rate. Every recommendation is backed by specific rule citations and undergoes rigorous testing. Our deterministic rules engine ensures consistent, reliable results every time."
		},
		{
			question: "Can Ingrid handle complex procedural scenarios?",
			answer: "Yes. Ingrid's AI can process multi-layered procedural requirements, conflicting deadlines, and jurisdiction-specific variations. It considers all applicable rules and provides comprehensive guidance for even the most complex filing scenarios."
		},
		{
			question: "How does Ingrid integrate with existing workflows?",
			answer: "Ingrid offers calendar sync, document templates, and API integrations with popular legal software. You can export deadlines to your calendar system and use our pre-formatted document shells in your existing workflow."
		},
		{
			question: "What security measures does Ingrid have in place?",
			answer: "Ingrid uses bank-level encryption, SOC 2 compliance, and attorney-client privilege protection. Your data is stored in secure, isolated environments and never shared with third parties."
		},
		{
			question: "How quickly can I get results from Ingrid?",
			answer: "Most procedural roadmaps are generated in under 10 seconds. Complex scenarios may take up to 30 seconds. Our real-time processing ensures you get immediate guidance when you need it most."
		},
		{
			question: "Does Ingrid provide legal advice?",
			answer: "No. Ingrid provides procedural information and workflow automation tools based on court rules and requirements. It does not provide legal advice or replace the judgment of qualified attorneys."
		},
		{
			question: "How often are court rules updated in Ingrid?",
			answer: "Our legal team monitors rule changes daily and updates our database within 24-48 hours of any amendments. You'll always have access to the most current procedural requirements."
		},
		{
			question: "Can I try Ingrid before committing?",
			answer: "Yes! We offer a private beta program for select litigation firms. Contact us to learn about trial access and see how Ingrid can transform your practice."
		},
		{
			question: "What kind of support does Ingrid provide?",
			answer: "We provide comprehensive onboarding, training materials, and ongoing support. Our team includes legal professionals who understand litigation workflows and can help optimize your use of the platform."
		}
	];

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
								{['Home', 'How It Works', 'Testimonials', 'About Us', 'FAQ'].map((item, index) => (
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
										Frequently Asked Questions
									</h1>
									<p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed font-medium">
										Everything you need to know about Ingrid's procedural compliance platform.
									</p>
								</div>
							</div>
						</section>

						{/* FAQ Section */}
						<section className="py-12 relative">
							<div className="container mx-auto px-6 relative z-10">
								<div className="bg-white/40 backdrop-blur-xl rounded-3xl p-12 border border-white/60 shadow-2xl shadow-pink-500/5">
									<div className="max-w-4xl mx-auto">
										<div className="space-y-6">
										{faqs.map((faq, index) => (
											<div key={index} className="group relative bg-white/70 backdrop-blur-2xl rounded-3xl border border-white/50 shadow-2xl shadow-pink-500/5 hover:shadow-pink-500/15 transition-all duration-500 overflow-hidden">
												{/* Animated background */}
												<div className="absolute inset-0 bg-gradient-to-br from-pink-500/3 via-purple-500/3 to-pink-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
												<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
												
												<button
													onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
													className="w-full p-8 text-left relative z-10 focus:outline-none"
												>
													<div className="flex justify-between items-start">
														<h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-pink-700 transition-colors duration-300 pr-8">
															{faq.question}
														</h3>
														<div className={`flex-shrink-0 w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 ${openFAQ === index ? 'rotate-45' : ''}`}>
															<svg className="w-4 h-4 text-white transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
															</svg>
														</div>
													</div>
													{openFAQ === index && (
														<div className="mt-4 pr-12">
															<p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
																{faq.answer}
															</p>
														</div>
													)}
												</button>
											</div>
										))}
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
												Still Have Questions?
											</h2>
											<p className="text-gray-600 max-w-2xl mx-auto mb-10 text-xl leading-relaxed font-medium">
												Our team is here to help. Get in touch to learn more about how Ingrid can transform your practice.
											</p>
											<div className="flex flex-col sm:flex-row gap-4 justify-center">
												<Link
													href="/#beta"
													className="group relative inline-flex items-center justify-center bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 hover:from-pink-600 hover:via-pink-700 hover:to-purple-700 text-white font-bold px-8 py-4 rounded-2xl text-lg shadow-2xl shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105 transition-all duration-300 overflow-hidden"
												>
													<div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20 -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
													<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
													
													<span className="relative z-10 flex items-center">
														<svg className="w-5 h-5 mr-2 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
														</svg>
														Request Beta Access
													</span>
												</Link>
												<a
													href="mailto:support@ingrid.legal"
													className="group relative inline-flex items-center justify-center bg-white/80 backdrop-blur-sm hover:bg-white text-gray-800 hover:text-pink-700 font-bold px-8 py-4 rounded-2xl text-lg border border-gray-200/50 hover:border-pink-300 shadow-lg hover:shadow-xl transition-all duration-300"
												>
													<svg className="w-5 h-5 mr-2 group-hover:scale-125 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
													</svg>
													Contact Us
												</a>
											</div>
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
