import Link from "next/link";

export default function Testimonials() {
	return (
		<div className="min-h-screen bg-white">
			{/* Header */}
			<header className="fixed top-0 left-0 right-0 z-50 bg-white bg-opacity-90 backdrop-blur-md border-b border-gray-200">
				<div className="container mx-auto px-6 py-4 flex justify-between items-center">
					<Link href="/" className="flex items-center">
						<svg
							width="45"
							height="50"
							viewBox="0 0 45 50"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
							className="mr-3"
						>
							<rect
								x="0"
								y="5"
								width="35"
								height="45"
								rx="3"
								fill="#EC4899"
								opacity="0.6"
							/>
							<rect
								x="8"
								y="0"
								width="35"
								height="45"
								rx="3"
								fill="#DB2777"
								opacity="1"
							/>
							<path
								d="M 20 25 L 25 30 L 35 20"
								stroke="#FFFFFF"
								strokeWidth="3"
								fill="none"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
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
						<Link href="/testimonials" className="text-pink-600 font-semibold">
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
							Success Stories
						</h1>
						<p className="text-xl text-gray-600 max-w-3xl mx-auto">
							See how leading law firms are transforming their litigation
							practice with Ingrid&apos;s procedural compliance platform.
						</p>
					</div>
				</section>

				{/* Stats Section */}
				<section className="py-16">
					<div className="container mx-auto px-6">
						<div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
							<div>
								<div className="text-4xl font-bold text-pink-600 mb-2">80%</div>
								<div className="text-gray-600">
									Reduction in procedural research time
								</div>
							</div>
							<div>
								<div className="text-4xl font-bold text-pink-600 mb-2">
									99.9%
								</div>
								<div className="text-gray-600">
									Accuracy rate for rule compliance
								</div>
							</div>
							<div>
								<div className="text-4xl font-bold text-pink-600 mb-2">0</div>
								<div className="text-gray-600">
									Missed deadlines since implementation
								</div>
							</div>
							<div>
								<div className="text-4xl font-bold text-pink-600 mb-2">15+</div>
								<div className="text-gray-600">Law firms in private beta</div>
							</div>
						</div>
					</div>
				</section>

				{/* Featured Testimonials */}
				<section className="py-20 bg-gray-50">
					<div className="container mx-auto px-6">
						<div className="text-center mb-16">
							<h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
								What Our Partners Are Saying
							</h2>
						</div>

						<div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
							{/* Large Featured Testimonial */}
							<div className="bg-white rounded-2xl p-10 shadow-lg">
								<div className="flex items-center mb-6">
									<div className="flex text-pink-500 mr-4">
										{[...Array(5)].map((_, i) => (
											<svg
												key={i}
												className="w-6 h-6"
												fill="currentColor"
												viewBox="0 0 20 20"
											>
												<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
											</svg>
										))}
									</div>
									<span className="text-sm text-gray-500 font-medium">
										Featured Review
									</span>
								</div>
								<blockquote className="text-xl text-gray-700 mb-8 leading-relaxed">
									&ldquo;Ingrid has completely transformed our motion practice.
									What used to take our associates 2-3 hours of rule research
									now happens in under 10 seconds. The accuracy is phenomenal -
									we haven&apos;t had a single compliance issue since
									implementing the platform. It&apos;s given us back hours every
									day to focus on substantive legal work.&rdquo;
								</blockquote>
								<div className="flex items-center">
									<div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mr-6">
										<span className="text-pink-600 font-bold text-xl">SM</span>
									</div>
									<div>
										<h4 className="font-bold text-gray-900 text-lg">
											Sarah Martinez
										</h4>
										<p className="text-gray-600">
											Partner, Bay Area Litigation Firm
										</p>
										<p className="text-gray-500 text-sm">
											Civil Litigation • 150+ Attorney Firm
										</p>
									</div>
								</div>
							</div>

							{/* Stats Card */}
							<div className="bg-pink-600 text-white rounded-2xl p-10">
								<h3 className="text-2xl font-bold mb-8">
									Impact at Sarah&apos;s Firm
								</h3>
								<div className="space-y-6">
									<div className="flex justify-between items-center">
										<span className="text-pink-100">
											Time Saved per Motion:
										</span>
										<span className="text-2xl font-bold">2.5 hours</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-pink-100">Compliance Issues:</span>
										<span className="text-2xl font-bold">Zero</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-pink-100">
											Associates&apos; Satisfaction:
										</span>
										<span className="text-2xl font-bold">↑ 95%</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-pink-100">
											Client Billing Recovery:
										</span>
										<span className="text-2xl font-bold">$15K/month</span>
									</div>
								</div>
								<div className="mt-8 pt-8 border-t border-pink-400">
									<p className="text-pink-100 text-sm">
										&ldquo;Our associates can now focus on legal analysis
										instead of hunting through court rules.&rdquo;
									</p>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* More Testimonials Grid */}
				<section className="py-20">
					<div className="container mx-auto px-6">
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
							<div className="bg-white rounded-2xl p-8 shadow-lg border">
								<div className="flex items-center mb-4">
									<div className="flex text-pink-500">
										{[...Array(5)].map((_, i) => (
											<svg
												key={i}
												className="w-5 h-5"
												fill="currentColor"
												viewBox="0 0 20 20"
											>
												<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
											</svg>
										))}
									</div>
								</div>
								<p className="text-gray-600 mb-6">
									&ldquo;The deadline calendaring feature alone has saved us
									from multiple potential malpractice issues. Ingrid is a
									game-changer for litigation teams.&rdquo;
								</p>
								<div className="flex items-center">
									<div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mr-4">
										<span className="text-pink-600 font-bold text-lg">DJ</span>
									</div>
									<div>
										<h4 className="font-bold text-gray-900">David Johnson</h4>
										<p className="text-gray-600 text-sm">Managing Partner</p>
										<p className="text-gray-500 text-xs">
											Johnson & Associates
										</p>
									</div>
								</div>
							</div>

							<div className="bg-white rounded-2xl p-8 shadow-lg border">
								<div className="flex items-center mb-4">
									<div className="flex text-pink-500">
										{[...Array(5)].map((_, i) => (
											<svg
												key={i}
												className="w-5 h-5"
												fill="currentColor"
												viewBox="0 0 20 20"
											>
												<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
											</svg>
										))}
									</div>
								</div>
								<p className="text-gray-600 mb-6">
									&ldquo;We&apos;ve reduced our procedural research time by 80%.
									Our associates can now focus on substantive legal work instead
									of hunting through court rules.&rdquo;
								</p>
								<div className="flex items-center">
									<div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mr-4">
										<span className="text-pink-600 font-bold text-lg">AC</span>
									</div>
									<div>
										<h4 className="font-bold text-gray-900">Amanda Chen</h4>
										<p className="text-gray-600 text-sm">Senior Associate</p>
										<p className="text-gray-500 text-xs">
											Tech Litigation Group
										</p>
									</div>
								</div>
							</div>

							<div className="bg-white rounded-2xl p-8 shadow-lg border">
								<div className="flex items-center mb-4">
									<div className="flex text-pink-500">
										{[...Array(5)].map((_, i) => (
											<svg
												key={i}
												className="w-5 h-5"
												fill="currentColor"
												viewBox="0 0 20 20"
											>
												<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
											</svg>
										))}
									</div>
								</div>
								<p className="text-gray-600 mb-6">
									&ldquo;The document shells are perfectly formatted every time.
									No more worrying about font sizes, margins, or page limits -
									it&apos;s all handled automatically.&rdquo;
								</p>
								<div className="flex items-center">
									<div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mr-4">
										<span className="text-pink-600 font-bold text-lg">MR</span>
									</div>
									<div>
										<h4 className="font-bold text-gray-900">
											Michael Rodriguez
										</h4>
										<p className="text-gray-600 text-sm">Staff Attorney</p>
										<p className="text-gray-500 text-xs">
											Peninsula Legal Services
										</p>
									</div>
								</div>
							</div>

							<div className="bg-white rounded-2xl p-8 shadow-lg border">
								<div className="flex items-center mb-4">
									<div className="flex text-pink-500">
										{[...Array(5)].map((_, i) => (
											<svg
												key={i}
												className="w-5 h-5"
												fill="currentColor"
												viewBox="0 0 20 20"
											>
												<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
											</svg>
										))}
									</div>
								</div>
								<p className="text-gray-600 mb-6">
									&ldquo;As a solo practitioner, Ingrid gives me the confidence
									that I&apos;m not missing anything. It&apos;s like having a
									procedural expert on my team.&rdquo;
								</p>
								<div className="flex items-center">
									<div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mr-4">
										<span className="text-pink-600 font-bold text-lg">LW</span>
									</div>
									<div>
										<h4 className="font-bold text-gray-900">Lisa Wang</h4>
										<p className="text-gray-600 text-sm">Solo Practitioner</p>
										<p className="text-gray-500 text-xs">Wang Law Office</p>
									</div>
								</div>
							</div>

							<div className="bg-white rounded-2xl p-8 shadow-lg border">
								<div className="flex items-center mb-4">
									<div className="flex text-pink-500">
										{[...Array(5)].map((_, i) => (
											<svg
												key={i}
												className="w-5 h-5"
												fill="currentColor"
												viewBox="0 0 20 20"
											>
												<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
											</svg>
										))}
									</div>
								</div>
								<p className="text-gray-600 mb-6">
									&ldquo;The ROI was immediate. We&apos;re billing more hours
									for substantive work and our clients are happier with faster
									turnaround times.&rdquo;
								</p>
								<div className="flex items-center">
									<div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mr-4">
										<span className="text-pink-600 font-bold text-lg">RT</span>
									</div>
									<div>
										<h4 className="font-bold text-gray-900">Robert Thompson</h4>
										<p className="text-gray-600 text-sm">Partner</p>
										<p className="text-gray-500 text-xs">
											Thompson & Associates
										</p>
									</div>
								</div>
							</div>

							<div className="bg-white rounded-2xl p-8 shadow-lg border">
								<div className="flex items-center mb-4">
									<div className="flex text-pink-500">
										{[...Array(5)].map((_, i) => (
											<svg
												key={i}
												className="w-5 h-5"
												fill="currentColor"
												viewBox="0 0 20 20"
											>
												<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
											</svg>
										))}
									</div>
								</div>
								<p className="text-gray-600 mb-6">
									&ldquo;Training new associates is so much easier now. They can
									be productive immediately instead of spending weeks learning
									all the court rules.&rdquo;
								</p>
								<div className="flex items-center">
									<div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mr-4">
										<span className="text-pink-600 font-bold text-lg">KP</span>
									</div>
									<div>
										<h4 className="font-bold text-gray-900">Karen Patel</h4>
										<p className="text-gray-600 text-sm">Training Partner</p>
										<p className="text-gray-500 text-xs">Major Bay Area Firm</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* CTA Section */}
				<section className="py-20 bg-pink-600 text-white">
					<div className="container mx-auto px-6 text-center">
						<h2 className="text-3xl md:text-4xl font-bold mb-6">
							Join These Successful Firms
						</h2>
						<p className="text-xl mb-8 opacity-90">
							See why leading litigation teams choose Ingrid for procedural
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
