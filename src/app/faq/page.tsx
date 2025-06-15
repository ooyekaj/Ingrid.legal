import Link from "next/link";

export default function FAQ() {
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
						<Link href="/faq" className="text-pink-600 font-semibold">
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
							Frequently Asked Questions
						</h1>
						<p className="text-xl text-gray-600 max-w-3xl mx-auto">
							Get answers to common questions about Ingrid&apos;s legal
							technology platform, implementation, and how it can transform your
							litigation practice.
						</p>
					</div>
				</section>

				{/* FAQ Categories */}
				<section className="py-20">
					<div className="container mx-auto px-6">
						<div className="max-w-4xl mx-auto">
							{/* Platform & Features */}
							<div className="mb-16">
								<h2 className="text-2xl font-bold text-gray-900 mb-8 pb-4 border-b-2 border-pink-200">
									Platform & Features
								</h2>
								<div className="space-y-8">
									<div className="bg-gray-50 rounded-lg p-8">
										<h3 className="text-xl font-bold text-gray-900 mb-4">
											How accurate is Ingrid&apos;s rules engine?
										</h3>
										<p className="text-gray-600 mb-4">
											Ingrid&apos;s deterministic rules engine maintains a 99.9%
											accuracy rate. Our system is built on a comprehensive
											database of court rules that&apos;s continuously updated
											by our legal team and validated through machine learning
											algorithms.
										</p>
										<p className="text-gray-600">
											Every recommendation comes with specific rule citations,
											and we provide regular validation reports to ensure
											ongoing accuracy as rules change.
										</p>
									</div>

									<div className="bg-gray-50 rounded-lg p-8">
										<h3 className="text-xl font-bold text-gray-900 mb-4">
											Which jurisdictions does Ingrid support?
										</h3>
										<p className="text-gray-600 mb-4">
											Currently, Ingrid supports:
										</p>
										<ul className="text-gray-600 space-y-2 ml-6">
											<li>
												• All California state courts (Superior Courts in all 58
												counties)
											</li>
											<li>
												• Federal courts in the Northern District of California
											</li>
											<li>• California Courts of Appeal (all districts)</li>
											<li>• California Supreme Court</li>
										</ul>
										<p className="text-gray-600 mt-4">
											We&apos;re rapidly expanding to other California federal
											districts and planning nationwide coverage by Q4 2025,
											starting with major metropolitan areas.
										</p>
									</div>

									<div className="bg-gray-50 rounded-lg p-8">
										<h3 className="text-xl font-bold text-gray-900 mb-4">
											How fast does Ingrid generate procedural roadmaps?
										</h3>
										<p className="text-gray-600">
											Ingrid generates comprehensive procedural roadmaps in
											under 10 seconds. This includes deadline calculations,
											compliance checklists, document requirements, and
											formatting specifications. The speed comes from our
											pre-processed rule database and optimized algorithms.
										</p>
									</div>

									<div className="bg-gray-50 rounded-lg p-8">
										<h3 className="text-xl font-bold text-gray-900 mb-4">
											What types of cases does Ingrid handle?
										</h3>
										<p className="text-gray-600 mb-4">
											Ingrid currently supports the most common litigation case
											types:
										</p>
										<ul className="text-gray-600 space-y-2 ml-6">
											<li>
												• Civil litigation (contract disputes, business torts,
												employment law)
											</li>
											<li>• Intellectual property disputes</li>
											<li>• Personal injury and medical malpractice</li>
											<li>• Real estate litigation</li>
											<li>• Commercial litigation</li>
											<li>• Appeals (state and federal)</li>
										</ul>
										<p className="text-gray-600 mt-4">
											We&apos;re continuously expanding our coverage to include
											specialized practice areas based on user demand.
										</p>
									</div>
								</div>
							</div>

							{/* Security & Compliance */}
							<div className="mb-16">
								<h2 className="text-2xl font-bold text-gray-900 mb-8 pb-4 border-b-2 border-pink-200">
									Security & Compliance
								</h2>
								<div className="space-y-8">
									<div className="bg-gray-50 rounded-lg p-8">
										<h3 className="text-xl font-bold text-gray-900 mb-4">
											Is my client data secure with Ingrid?
										</h3>
										<p className="text-gray-600 mb-4">
											Absolutely. Ingrid is built with enterprise-grade security
											including:
										</p>
										<ul className="text-gray-600 space-y-2 ml-6">
											<li>
												• End-to-end encryption for all data in transit and at
												rest
											</li>
											<li>• SOC 2 Type II compliance certification</li>
											<li>
												• Strict adherence to attorney-client privilege
												protection
											</li>
											<li>
												• Zero-knowledge architecture - we cannot access your
												case details
											</li>
											<li>• Regular third-party security audits</li>
											<li>• GDPR and CCPA compliance</li>
										</ul>
										<p className="text-gray-600 mt-4">
											Your data never leaves our secure cloud infrastructure,
											and we maintain detailed audit logs for all access and
											activities.
										</p>
									</div>

									<div className="bg-gray-50 rounded-lg p-8">
										<h3 className="text-xl font-bold text-gray-900 mb-4">
											Does Ingrid comply with legal professional standards?
										</h3>
										<p className="text-gray-600">
											Yes. Ingrid is designed to meet all relevant professional
											responsibility requirements. We maintain strict
											confidentiality protocols, provide detailed audit trails
											for ethics compliance, and our platform is reviewed by
											legal ethics experts to ensure compliance with Model Rule
											1.1 (competence) and 1.6 (confidentiality).
										</p>
									</div>

									<div className="bg-gray-50 rounded-lg p-8">
										<h3 className="text-xl font-bold text-gray-900 mb-4">
											What happens to my data if I stop using Ingrid?
										</h3>
										<p className="text-gray-600">
											You maintain full control of your data. Upon termination,
											you can export all your case data, procedural timelines,
											and documents in standard formats. We provide a 90-day
											grace period for data retrieval, after which all data is
											permanently deleted from our systems according to our data
											retention policy.
										</p>
									</div>
								</div>
							</div>

							{/* Implementation & Integration */}
							<div className="mb-16">
								<h2 className="text-2xl font-bold text-gray-900 mb-8 pb-4 border-b-2 border-pink-200">
									Implementation & Integration
								</h2>
								<div className="space-y-8">
									<div className="bg-gray-50 rounded-lg p-8">
										<h3 className="text-xl font-bold text-gray-900 mb-4">
											How long does it take to implement Ingrid?
										</h3>
										<p className="text-gray-600">
											Implementation is typically completed within 1-2 weeks.
											This includes account setup, user training, calendar
											integration, and customization of document templates. Most
											firms are fully operational within the first week, with
											ongoing optimization in the second week.
										</p>
									</div>

									<div className="bg-gray-50 rounded-lg p-8">
										<h3 className="text-xl font-bold text-gray-900 mb-4">
											Does Ingrid integrate with existing practice management
											software?
										</h3>
										<p className="text-gray-600 mb-4">
											Yes. Ingrid integrates with popular legal practice
											management systems including:
										</p>
										<ul className="text-gray-600 space-y-2 ml-6">
											<li>• Clio</li>
											<li>• MyCase</li>
											<li>• PracticePanther</li>
											<li>• CasePeer</li>
											<li>• Google Workspace and Microsoft 365</li>
										</ul>
										<p className="text-gray-600 mt-4">
											We also provide API access for custom integrations with
											enterprise-level case management systems.
										</p>
									</div>

									<div className="bg-gray-50 rounded-lg p-8">
										<h3 className="text-xl font-bold text-gray-900 mb-4">
											What training is provided for my team?
										</h3>
										<p className="text-gray-600">
											We provide comprehensive training including live
											onboarding sessions, recorded tutorials, written
											documentation, and ongoing support. Most users become
											proficient within their first day of use. We also offer
											advanced training sessions for power users and practice
											managers.
										</p>
									</div>
								</div>
							</div>

							{/* Pricing & Plans */}
							<div className="mb-16">
								<h2 className="text-2xl font-bold text-gray-900 mb-8 pb-4 border-b-2 border-pink-200">
									Pricing & Plans
								</h2>
								<div className="space-y-8">
									<div className="bg-gray-50 rounded-lg p-8">
										<h3 className="text-xl font-bold text-gray-900 mb-4">
											How does Ingrid&apos;s pricing work?
										</h3>
										<p className="text-gray-600 mb-4">
											Ingrid offers flexible pricing based on firm size and
											usage:
										</p>
										<ul className="text-gray-600 space-y-2 ml-6">
											<li>
												• <strong>Solo/Small Firms (1-5 attorneys):</strong>{" "}
												Per-user monthly subscription
											</li>
											<li>
												• <strong>Mid-Size Firms (6-50 attorneys):</strong>{" "}
												Tiered pricing with volume discounts
											</li>
											<li>
												• <strong>Large Firms (50+ attorneys):</strong>{" "}
												Enterprise pricing with custom features
											</li>
										</ul>
										<p className="text-gray-600 mt-4">
											Our beta partners receive special introductory pricing
											during the trial period. Full pricing will be announced at
											our general availability launch in Q2 2025.
										</p>
									</div>

									<div className="bg-gray-50 rounded-lg p-8">
										<h3 className="text-xl font-bold text-gray-900 mb-4">
											Is there a free trial available?
										</h3>
										<p className="text-gray-600">
											Yes! We offer a 30-day free trial with full access to all
											features. No credit card required. During the beta period,
											selected firms receive extended trial periods up to 90
											days to fully evaluate the platform&apos;s impact on their
											practice.
										</p>
									</div>

									<div className="bg-gray-50 rounded-lg p-8">
										<h3 className="text-xl font-bold text-gray-900 mb-4">
											What&apos;s included in the subscription?
										</h3>
										<p className="text-gray-600 mb-4">
											All subscriptions include:
										</p>
										<ul className="text-gray-600 space-y-2 ml-6">
											<li>• Unlimited procedural roadmap generation</li>
											<li>• Document shell creation and compliance checking</li>
											<li>• Deadline calendaring and alerts</li>
											<li>• Rule database access and updates</li>
											<li>• Standard integrations (calendar, email)</li>
											<li>• Customer support and training</li>
											<li>• Regular platform updates and new features</li>
										</ul>
									</div>
								</div>
							</div>

							{/* Support */}
							<div>
								<h2 className="text-2xl font-bold text-gray-900 mb-8 pb-4 border-b-2 border-pink-200">
									Support & Resources
								</h2>
								<div className="space-y-8">
									<div className="bg-gray-50 rounded-lg p-8">
										<h3 className="text-xl font-bold text-gray-900 mb-4">
											What kind of customer support do you provide?
										</h3>
										<p className="text-gray-600 mb-4">
											We provide comprehensive support including:
										</p>
										<ul className="text-gray-600 space-y-2 ml-6">
											<li>
												• Live chat support during business hours (6 AM - 6 PM
												PT)
											</li>
											<li>• Email support with 24-hour response time</li>
											<li>• Video call support for complex issues</li>
											<li>• Comprehensive knowledge base and documentation</li>
											<li>• Community forum for user collaboration</li>
										</ul>
										<p className="text-gray-600 mt-4">
											Enterprise customers receive dedicated account management
											and priority support.
										</p>
									</div>

									<div className="bg-gray-50 rounded-lg p-8">
										<h3 className="text-xl font-bold text-gray-900 mb-4">
											How often is the rules database updated?
										</h3>
										<p className="text-gray-600">
											Our rules database is updated continuously. We monitor
											court websites, legal publications, and rule changes
											daily. Critical updates (like emergency rule changes) are
											deployed within 24 hours. Routine updates are released
											weekly. All users are automatically notified of relevant
											rule changes that might affect their cases.
										</p>
									</div>

									<div className="bg-gray-50 rounded-lg p-8">
										<h3 className="text-xl font-bold text-gray-900 mb-4">
											Can I request new features or jurisdictions?
										</h3>
										<p className="text-gray-600">
											Absolutely! We actively seek user feedback and regularly
											implement requested features. Our product roadmap is
											heavily influenced by user needs. You can submit feature
											requests through our platform, and we provide regular
											updates on development progress.
										</p>
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
							Still Have Questions?
						</h2>
						<p className="text-xl mb-8 opacity-90">
							Get in touch with our team for personalized answers about your
							firm&apos;s needs.
						</p>
						<div className="space-x-4">
							<Link
								href="/#beta"
								className="bg-white text-pink-600 hover:bg-gray-100 font-bold px-8 py-4 rounded-lg text-lg inline-block"
							>
								Request Beta Access
							</Link>
							<a
								href="mailto:support@ingrid.legal"
								className="border-2 border-white text-white hover:bg-white hover:text-pink-600 font-bold px-8 py-4 rounded-lg text-lg inline-block"
							>
								Contact Support
							</a>
						</div>
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
