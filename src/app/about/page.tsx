/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ParticleBackground } from "@/components/ParticleBackground";

export default function About() {
	useEffect(() => {
		// Scroll reveal animation
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add("fade-in-section");
					}
				});
			},
			{ threshold: 0.1 }
		);

		document.querySelectorAll(".fade-in-section").forEach((section) => {
			observer.observe(section);
		});

		// Add CSS for logo animation
		const style = document.createElement("style");
		style.textContent = `
			@keyframes slide {
				from { transform: translateX(0); }
				to { transform: translateX(-100%); }
			}
			.animate-slide {
				animation: slide 20s linear infinite;
			}
		`;
		document.head.appendChild(style);

		return () => {
			document.head.removeChild(style);
		};
	}, []);

	return (
		<div className="overflow-x-hidden">
			<ParticleBackground />
			{/* Header */}
			<header className="fixed top-0 left-0 right-0 z-50 bg-white backdrop-blur-md border-b border-gray-200">
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
						<Link href="/about" className="text-pink-600 font-medium">
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
			<main className="bg-white">
				{/* Hero Section */}
				<section className="py-20 md:py-32 text-center bg-white">
					<div className="container mx-auto px-6">
						<h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-4">
							Our Mission
						</h1>
						<p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
							We believe that legal professionals should be empowered to focus
							on what matters most: strategy, advocacy, and winning their case.
							Our mission is to eliminate the procedural friction and
							administrative risk that stands in the way, giving litigation
							teams the confidence to file perfectly, every time.
						</p>
					</div>
				</section>

				{/* Founders Section */}
				<section className="py-20 md:py-28">
					<div className="container mx-auto px-6">
						<h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-16">
							Meet the Founders
						</h2>
						<div className="grid md:grid-cols-2 lg:grid-cols-2 gap-12 lg:gap-16">
							<div className="founder-bubble text-center transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-xl">
								<div
									className="w-40 h-40 rounded-full bg-gray-200 mx-auto mb-4 border-4 border-white shadow-lg bg-cover bg-center"
									style={{ backgroundImage: "url('/Jake.jpg')" }}
								></div>
								<h3 className="text-2xl font-bold text-gray-900">Jake Yoo</h3>
								<p className="text-pink-600 font-semibold mb-2">
									Co-Founder & XYZ
								</p>
								<p className="text-gray-600 max-w-xs mx-auto">
									Jake&apos;s work on major tax platforms like TurboTax taught
									him the importance of getting filings right. He founded Ingrid
									to bring that same mission of accuracy and ease to the complex
									world of legal procedure.
								</p>
							</div>
							<div className="founder-bubble text-center transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-xl">
								<div
									className="w-40 h-40 rounded-full bg-gray-200 mx-auto mb-4 border-4 border-white shadow-lg bg-cover bg-center"
									style={{ backgroundImage: "url('/Raj.jpg')" }}
								></div>
								<h3 className="text-2xl font-bold text-gray-900">
									Raj Komawar
								</h3>
								<p className="text-pink-600 font-semibold mb-2">
									Co-Founder & Booty Muncher
								</p>
								<p className="text-gray-600 max-w-xs mx-auto">
									Fighting for his life in communist India, Raj learned the
									importance of getting things right. He attained his H1-B
									through SCAMazon and began his ginder career. He founded
									Ingrid to bring that same mission of accuracy and ease to the
									complex world of legal procedure.
								</p>
							</div>
						</div>
					</div>
				</section>

				{/* Company Logos Section */}
				<section className="bg-white py-12">
					<div className="container mx-auto px-6">
						<p className="text-center text-gray-500 font-semibold mb-8">
							Our team&apos;s experience comes from the world&apos;s most
							innovative companies
						</p>
						<div
							className="relative h-16 w-full overflow-hidden"
							style={{
								maskImage:
									"linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
							}}
						>
							<div className="flex">
								<div className="logo-track inline-flex animate-slide whitespace-nowrap">
									<div className="logo-item flex-shrink-0 w-45 flex justify-center items-center mx-10">
										<img
											src="/intuit.jpg"
											alt="Intuit"
											className="h-12 object-contain grayscale opacity-70"
										/>
									</div>
									<div className="logo-item flex-shrink-0 w-45 flex justify-center items-center mx-10">
										<img
											src="/amazon.jpg"
											alt="Amazon"
											className="h-8 object-contain grayscale opacity-70"
										/>
									</div>
									<div className="logo-item flex-shrink-0 w-45 flex justify-center items-center mx-10">
										<img
											src="/google.jpg"
											alt="Google"
											className="h-8 object-contain grayscale opacity-70"
										/>
									</div>
									<div className="logo-item flex-shrink-0 w-45 flex justify-center items-center mx-10">
										<img
											src="/scale.jpg"
											alt="Scale AI"
											className="h-12 object-contain grayscale opacity-70"
										/>
									</div>
								</div>
								<div
									className="logo-track inline-flex animate-slide whitespace-nowrap"
									aria-hidden="true"
								>
									<div className="logo-item flex-shrink-0 w-45 flex justify-center items-center mx-10">
										<img
											src="/intuit.jpg"
											alt="Intuit"
											className="h-12 object-contain grayscale opacity-70"
										/>
									</div>
									<div className="logo-item flex-shrink-0 w-45 flex justify-center items-center mx-10">
										<img
											src="/amazon.jpg"
											alt="Amazon"
											className="h-8 object-contain grayscale opacity-70"
										/>
									</div>
									<div className="logo-item flex-shrink-0 w-45 flex justify-center items-center mx-10">
										<img
											src="/google.jpg"
											alt="Google"
											className="h-8 object-contain grayscale opacity-70"
										/>
									</div>
									<div className="logo-item flex-shrink-0 w-45 flex justify-center items-center mx-10">
										<img
											src="/scale.jpg"
											alt="Scale AI"
											className="h-12 object-contain grayscale opacity-70"
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Contact Section */}
				<section className="py-20 bg-gray-50">
					<div className="container mx-auto px-6 text-center">
						<h2 className="text-3xl font-bold text-gray-900 mb-4">
							Get in Touch
						</h2>
						<p className="text-gray-600 max-w-2xl mx-auto mb-8">
							Interested in learning more about Ingrid? We&apos;d love to hear
							from you.
						</p>
						<a
							href="mailto:support@ingrid.legal"
							className="cta-button bg-pink-600 hover:bg-pink-500 text-white font-bold px-8 py-4 rounded-lg text-lg inline-block"
						>
							Contact Us
						</a>
					</div>
				</section>
			</main>

			{/* Footer */}
			<footer className="bg-gray-100 border-t border-gray-200">
				<div className="container mx-auto px-6 py-8 text-center text-gray-500">
					<p>&copy; 2025 Ingrid Technologies Inc. All rights reserved.</p>
					<p className="text-sm mt-2">
						Ingrid provides procedural information and workflow automation
						tools. It does not provide legal advice.
					</p>
				</div>
			</footer>
		</div>
	);
}
