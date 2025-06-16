import Link from "next/link";
import Image from "next/image";

export default function HowItWorks() {
	return (
		<div className="min-h-screen bg-white">
			{/* Header */}
			<header className="fixed top-0 left-0 right-0 z-50 bg-white bg-opacity-90 backdrop-blur-md border-b border-gray-200">
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
						<Link href="/how-it-works" className="text-pink-600 font-semibold">
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
						className="bg-pink-600 hover:bg-pink-500 text-white font-semibold px-5 py-2 rounded-lg"
					>
						Request Beta Access
					</Link>
				</div>
			</header>

			{/* Main Content */}
			<main className="pt-24">
				{/* Hero Section */}
				<section className="py-16 bg-gradient-to-r from-pink-50 to-white">
					<div className="container mx-auto px-6 text-center">
						<h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
							How Ingrid Works
						</h1>
						<p className="text-xl text-gray-600 max-w-3xl mx-auto">
							From complex court rules to actionable checklists in seconds. See
							how Ingrid transforms the way litigation teams handle procedural
							compliance.
						</p>
					</div>
				</section>

				{/* Process Overview */}
				<section className="py-20">
					<div className="container mx-auto px-6">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-12">
							<div className="text-center">
								<div className="bg-pink-600 text-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 text-3xl font-bold">
									1
								</div>
								<h3 className="text-2xl font-bold text-gray-900 mb-6">
									Input Case Details
								</h3>
								<p className="text-gray-600 text-lg leading-relaxed">
									Simply enter your case type, jurisdiction, court, and key
									dates. Our AI instantly identifies all applicable rules,
									procedures, and deadlines from our comprehensive legal
									database.
								</p>
							</div>

							<div className="text-center">
								<div className="bg-pink-600 text-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 text-3xl font-bold">
									2
								</div>
								<h3 className="text-2xl font-bold text-gray-900 mb-6">
									Get Your Roadmap
								</h3>
								<p className="text-gray-600 text-lg leading-relaxed">
									Receive a comprehensive procedural timeline with automated
									deadline calculations, compliance checklists, and document
									requirements. Every step is backed by specific rule citations.
								</p>
							</div>

							<div className="text-center">
								<div className="bg-pink-600 text-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 text-3xl font-bold">
									3
								</div>
								<h3 className="text-2xl font-bold text-gray-900 mb-6">
									Execute & File
								</h3>
								<p className="text-gray-600 text-lg leading-relaxed">
									Use pre-formatted, compliant document shells and automated
									compliance checks to file with confidence. Track deadlines and
									get alerts as they approach.
								</p>
							</div>
						</div>
					</div>
				</section>

				{/* Detailed Process */}
				<section className="py-20 bg-gray-50">
					<div className="container mx-auto px-6">
						<div className="text-center mb-16">
							<h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
								The Technology Behind Ingrid
							</h2>
							<p className="text-gray-600 text-lg max-w-3xl mx-auto">
								Our deterministic rules engine processes thousands of court
								rules and procedural requirements to give you guaranteed
								accuracy.
							</p>
						</div>

						<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
							<div>
								<h3 className="text-2xl font-bold text-gray-900 mb-6">
									Intelligent Rule Processing
								</h3>
								<div className="space-y-6">
									<div className="flex items-start">
										<div className="bg-pink-100 p-3 rounded-full mr-4 mt-1">
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
										<div>
											<h4 className="text-lg font-semibold text-gray-900 mb-2">
												Comprehensive Database
											</h4>
											<p className="text-gray-600">
												Our system contains every current court rule, local
												rule, and procedural requirement from supported
												jurisdictions.
											</p>
										</div>
									</div>

									<div className="flex items-start">
										<div className="bg-pink-100 p-3 rounded-full mr-4 mt-1">
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
										<div>
											<h4 className="text-lg font-semibold text-gray-900 mb-2">
												Real-Time Processing
											</h4>
											<p className="text-gray-600">
												Generate complete procedural roadmaps in under 10
												seconds, with instant updates when rules change.
											</p>
										</div>
									</div>

									<div className="flex items-start">
										<div className="bg-pink-100 p-3 rounded-full mr-4 mt-1">
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
										<div>
											<h4 className="text-lg font-semibold text-gray-900 mb-2">
												Guaranteed Accuracy
											</h4>
											<p className="text-gray-600">
												99.9% accuracy rate with every recommendation backed by
												specific rule citations and regular validation.
											</p>
										</div>
									</div>
								</div>
							</div>

							<div className="bg-white p-8 rounded-2xl shadow-lg">
								<h4 className="text-lg font-semibold text-gray-900 mb-4">
									Sample Output
								</h4>
								<div className="bg-gray-50 p-4 rounded-lg">
									<div className="text-sm text-gray-600 mb-2">
										Motion to Dismiss - Federal Court
									</div>
									<div className="space-y-2 text-sm">
										<div className="flex justify-between">
											<span>Filing Deadline:</span>
											<span className="font-semibold">
												21 days after service
											</span>
										</div>
										<div className="flex justify-between">
											<span>Page Limit:</span>
											<span className="font-semibold">
												12 pages (Fed. R. Civ. P. 7(b))
											</span>
										</div>
										<div className="flex justify-between">
											<span>Font Requirements:</span>
											<span className="font-semibold">
												14-point, Century family
											</span>
										</div>
										<div className="flex justify-between">
											<span>Service Method:</span>
											<span className="font-semibold">
												Electronic filing required
											</span>
										</div>
									</div>
									<div className="mt-4 pt-4 border-t border-gray-200">
										<div className="text-xs text-gray-500">
											✓ All requirements verified against current rules
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Integration Features */}
				<section className="py-20">
					<div className="container mx-auto px-6">
						<div className="text-center mb-16">
							<h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
								Seamless Workflow Integration
							</h2>
							<p className="text-gray-600 text-lg max-w-3xl mx-auto">
								Ingrid integrates with your existing tools to create a
								comprehensive litigation management experience.
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
							<div className="text-center">
								<div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
									<svg
										className="w-8 h-8 text-pink-600"
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
								<h3 className="text-lg font-semibold text-gray-900 mb-2">
									Calendar Sync
								</h3>
								<p className="text-gray-600 text-sm">
									Automatic deadline sync with Google Calendar, Outlook, and
									other calendar systems.
								</p>
							</div>

							<div className="text-center">
								<div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
									<svg
										className="w-8 h-8 text-pink-600"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
										/>
									</svg>
								</div>
								<h3 className="text-lg font-semibold text-gray-900 mb-2">
									Document Generation
								</h3>
								<p className="text-gray-600 text-sm">
									Pre-formatted Word templates with automatic population of case
									details and requirements.
								</p>
							</div>

							<div className="text-center">
								<div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
									<svg
										className="w-8 h-8 text-pink-600"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M15 17h5l-5 5v-5zM9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
								</div>
								<h3 className="text-lg font-semibold text-gray-900 mb-2">
									Compliance Checking
								</h3>
								<p className="text-gray-600 text-sm">
									Real-time validation of document formatting, page limits, and
									filing requirements.
								</p>
							</div>

							<div className="text-center">
								<div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
									<svg
										className="w-8 h-8 text-pink-600"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
										/>
									</svg>
								</div>
								<h3 className="text-lg font-semibold text-gray-900 mb-2">
									Mobile Access
								</h3>
								<p className="text-gray-600 text-sm">
									Check deadlines and access checklists from anywhere with our
									mobile-optimized platform.
								</p>
							</div>
						</div>
					</div>
				</section>

				{/* CTA Section */}
				<section className="py-20 bg-pink-600 text-white">
					<div className="container mx-auto px-6 text-center">
						<h2 className="text-3xl md:text-4xl font-bold mb-6">
							Ready to Transform Your Practice?
						</h2>
						<p className="text-xl mb-8 opacity-90">
							Join our private beta and experience the future of procedural
							compliance.
						</p>
						<Link
							href="/#beta"
							className="bg-white text-pink-600 hover:bg-gray-100 font-bold px-8 py-4 rounded-lg text-lg inline-block"
						>
							Request Beta Access
						</Link>
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
