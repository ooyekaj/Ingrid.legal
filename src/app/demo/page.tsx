"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getApiUrl } from "@/lib/config";

// Types
interface Judge {
	name: string;
	division: string;
}

interface Document {
	item: string;
	rule: string;
	link: string;
}

interface Rule {
	name: string;
	text: string;
	link: string;
}

interface ChecklistItem {
	phase: string;
	task: string;
	notes: string;
	rule: string;
	link: string;
}

interface SearchResults {
	documents: Document[];
	conditional: Document[];
	rules: Rule[];
	checklist: ChecklistItem[];
}

export default function Demo() {
	const [judges, setJudges] = useState<Judge[]>([]);
	const [selectedDivision, setSelectedDivision] = useState<string>(
		"Complex Civil Litigation"
	);
	const [selectedJudge, setSelectedJudge] =
		useState<string>("Charles F. Adams");
	const [showResults, setShowResults] = useState<boolean>(false);
	const [activeTab, setActiveTab] = useState<string>("Checklist");
	const [searchResults, setSearchResults] = useState<SearchResults | null>(
		null
	);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	// Fetch judges on component mount
	useEffect(() => {
		const fetchJudges = async () => {
			try {
				const response = await fetch(getApiUrl("/api/judges"), {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				});
				const data = await response.json();
				if (data.judges) {
					setJudges(data.judges);
				}
			} catch (err) {
				console.error("Failed to fetch judges:", err);
				setError("Failed to load judges");
			}
		};

		fetchJudges();
	}, []);

	const filteredJudges = judges.filter((j) => j.division === selectedDivision);

	const handleSearch = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		try {
			const response = await fetch(getApiUrl("/api/prepareDocket"), {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					state: "California",
					county: "Santa Clara",
					division: selectedDivision,
					judge: selectedJudge,
					document_type: "Motion for Summary Judgment",
				}),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "Failed to prepare docket");
			}

			if (result.success && result.data) {
				setSearchResults(result.data);
				setShowResults(true);
				setActiveTab("Checklist");
			} else {
				throw new Error("No data received from server");
			}
		} catch (err) {
			console.error("Failed to prepare docket:", err);
			setError(err instanceof Error ? err.message : "Failed to prepare docket");
		} finally {
			setLoading(false);
		}
	};

	const handleNewSearch = () => {
		setShowResults(false);
		setActiveTab("Checklist");
		setError(null);
	};

	const checklistByPhase = searchResults?.checklist.reduce<
		Record<string, ChecklistItem[]>
	>((acc, item) => {
		if (!acc[item.phase]) acc[item.phase] = [];
		acc[item.phase].push(item);
		return acc;
	}, {});

	return (
		<div className="bg-gray-50/50 font-sans text-gray-800">
			<div className="flex min-h-screen">
				{/* Sidebar */}
				<aside className="fixed top-0 left-0 h-full w-full max-w-md border-r border-gray-200 bg-white p-8 overflow-y-auto">
					<div className="space-y-10 h-full flex flex-col">
						{/* Header */}
						<Link href="/" className="flex items-center space-x-2.5">
							<svg
								width="28"
								height="28"
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<rect width="24" height="24" rx="6" fill="#EC4899" />
								<path
									d="M9 12.5L11.5 15L16 10"
									stroke="white"
									strokeWidth="2.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
							<span className="text-2xl font-bold tracking-tighter text-gray-900">
								Ingrid
							</span>
						</Link>

						{/* Form */}
						<form onSubmit={handleSearch} className="space-y-6 flex-grow">
							<div className="grid grid-cols-1 gap-5">
								<h2 className="text-lg font-semibold text-gray-900 tracking-tight">
									Search Parameters
								</h2>

								{error && (
									<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
										{error}
									</div>
								)}

								<div>
									<label
										htmlFor="state"
										className="block text-sm font-medium text-gray-600 mb-1.5"
									>
										State
									</label>
									<select
										id="state"
										name="state"
										className="w-full pl-3 pr-10 py-2 text-base border-gray-300 bg-gray-50/80 focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 sm:text-sm rounded-lg shadow-sm"
									>
										<option>California</option>
									</select>
								</div>
								<div>
									<label
										htmlFor="county"
										className="block text-sm font-medium text-gray-600 mb-1.5"
									>
										County
									</label>
									<select
										id="county"
										name="county"
										className="w-full pl-3 pr-10 py-2 text-base border-gray-300 bg-gray-50/80 focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 sm:text-sm rounded-lg shadow-sm"
									>
										<option>Santa Clara</option>
									</select>
								</div>
								<div>
									<label
										htmlFor="division"
										className="block text-sm font-medium text-gray-600 mb-1.5"
									>
										Division
									</label>
									<select
										id="division"
										name="division"
										value={selectedDivision}
										onChange={(e) => setSelectedDivision(e.target.value)}
										className="w-full pl-3 pr-10 py-2 text-base border-gray-300 bg-gray-50/80 focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 sm:text-sm rounded-lg shadow-sm"
									>
										<option>Complex Civil Litigation</option>
										<option>Civil Division</option>
									</select>
								</div>
								<div>
									<label
										htmlFor="judge"
										className="block text-sm font-medium text-gray-600 mb-1.5"
									>
										Judge
									</label>
									<select
										id="judge"
										name="judge"
										value={selectedJudge}
										onChange={(e) => setSelectedJudge(e.target.value)}
										className="w-full pl-3 pr-10 py-2 text-base border-gray-300 bg-gray-50/80 focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 sm:text-sm rounded-lg shadow-sm"
									>
										{filteredJudges.map((judge) => (
											<option key={judge.name} value={judge.name}>
												{judge.name}
											</option>
										))}
									</select>
								</div>
								<div>
									<label
										htmlFor="document-type"
										className="block text-sm font-medium text-gray-600 mb-1.5"
									>
										Document Type
									</label>
									<select
										id="document-type"
										name="document-type"
										className="w-full pl-3 pr-10 py-2 text-base border-gray-300 bg-gray-50/80 focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 sm:text-sm rounded-lg shadow-sm"
									>
										<option>Motion for Summary Judgment</option>
										<option disabled>Motion to Dismiss (Demurrer)</option>
									</select>
								</div>
							</div>
							<div className="pt-4">
								<button
									type="submit"
									disabled={loading}
									className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-pink-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
								>
									{loading ? "Preparing..." : "Prepare Filing Docket"}
								</button>
							</div>
						</form>

						{/* Footer */}
						<div className="text-center text-xs text-gray-400 space-y-2 pt-4 border-t border-gray-200">
							<p>&copy; 2025 Ingrid Technologies Inc.</p>
							<p>
								Ingrid provides procedural information and workflow automation
								tools. It does not provide legal advice.
							</p>
						</div>
					</div>
				</aside>

				{/* Main Content */}
				<main className="flex-1 ml-[28rem]">
					<div className="p-12">
						{showResults && searchResults ? (
							<div className="max-w-4xl mx-auto">
								<div className="flex justify-between items-center mb-10">
									<div>
										<h1 className="text-3xl font-bold text-gray-900 tracking-tight">
											Filing Requirements Report
										</h1>
										<p className="text-gray-500 mt-1">
											For a Motion for Summary Judgment before Judge{" "}
											{selectedJudge}
										</p>
									</div>
									<button
										onClick={handleNewSearch}
										className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg flex items-center transition text-sm"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="16"
											height="16"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2.5"
											strokeLinecap="round"
											strokeLinejoin="round"
											className="mr-2"
										>
											<path d="M19 12H5" />
											<path d="m12 19-7-7 7-7" />
										</svg>
										New Search
									</button>
								</div>

								{/* Tabs */}
								<div className="border-b border-gray-200 mb-8">
									<nav className="-mb-px flex space-x-6" aria-label="Tabs">
										{[
											"Checklist",
											"Mandatory Docs",
											"Conditional Docs",
											"Governing Rules",
											".docx Shell",
										].map((tab) => (
											<button
												key={tab}
												onClick={() => setActiveTab(tab)}
												className={`${
													activeTab === tab
														? "border-pink-600 text-pink-600"
														: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
												} whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-sm transition-colors focus:outline-none`}
											>
												{tab}
											</button>
										))}
									</nav>
								</div>

								{/* Tab Content */}
								<div>
									{activeTab === "Checklist" && (
										<section>
											<h2 className="text-xl font-bold text-gray-900 pb-3 mb-6 border-b border-gray-200">
												Filing Checklist
											</h2>
											<div className="space-y-8">
												{Object.entries(checklistByPhase || {}).map(
													([phase, items]) => (
														<div key={phase}>
															<h3 className="text-md font-semibold text-pink-700 mb-4">
																{phase}
															</h3>
															<div className="space-y-5">
																{items.map((item) => (
																	<div
																		key={item.task}
																		className="flex items-start"
																	>
																		<input
																			type="checkbox"
																			id={item.task}
																			className="h-5 w-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500 mt-0.5 flex-shrink-0"
																		/>
																		<label
																			htmlFor={item.task}
																			className="ml-3 text-sm w-full"
																		>
																			<span className="font-medium text-gray-800">
																				{item.task}
																			</span>
																			<span className="block text-gray-500 mt-0.5">
																				{item.notes}
																			</span>
																			<a
																				href={item.link}
																				target="_blank"
																				rel="noopener noreferrer"
																				className="text-xs text-pink-600 hover:underline mt-1 inline-block"
																			>
																				{item.rule}
																			</a>
																		</label>
																	</div>
																))}
															</div>
														</div>
													)
												)}
											</div>
										</section>
									)}

									{activeTab === "Mandatory Docs" && (
										<section>
											<h2 className="text-xl font-bold text-gray-900 pb-3 mb-6 border-b border-gray-200">
												Mandatory Documents
											</h2>
											<ul className="space-y-4">
												{searchResults.documents.map((doc) => (
													<li
														key={doc.item}
														className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm"
													>
														<p className="font-semibold">{doc.item}</p>
														<a
															href={doc.link}
															target="_blank"
															rel="noopener noreferrer"
															className="text-sm text-pink-600 hover:underline mt-1.5 inline-block"
														>
															{doc.rule}
														</a>
													</li>
												))}
											</ul>
										</section>
									)}

									{activeTab === "Conditional Docs" && (
										<section>
											<h2 className="text-xl font-bold text-gray-900 pb-3 mb-6 border-b border-gray-200">
												Conditional Documents
											</h2>
											<ul className="space-y-4">
												{searchResults.conditional.map((doc) => (
													<li
														key={doc.item}
														className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm"
													>
														<p className="font-semibold">{doc.item}</p>
														<a
															href={doc.link}
															target="_blank"
															rel="noopener noreferrer"
															className="text-sm text-pink-600 hover:underline mt-1.5 inline-block"
														>
															{doc.rule}
														</a>
													</li>
												))}
											</ul>
										</section>
									)}

									{activeTab === "Governing Rules" && (
										<section>
											<h2 className="text-xl font-bold text-gray-900 pb-3 mb-6 border-b border-gray-200">
												Governing Rules
											</h2>
											<div className="space-y-4">
												{searchResults.rules.map((rule) => (
													<div
														key={rule.name}
														className="p-5 bg-gray-100 rounded-xl border border-gray-200/80"
													>
														<p className="font-semibold text-gray-800">
															{rule.name}
														</p>
														<p className="text-sm text-gray-600 mt-1">
															{rule.text}
														</p>
														<a
															href={rule.link}
															target="_blank"
															rel="noopener noreferrer"
															className="text-sm text-pink-600 hover:underline mt-3 inline-block font-medium"
														>
															Source Link →
														</a>
													</div>
												))}
											</div>
										</section>
									)}

									{activeTab === ".docx Shell" && (
										<section>
											<h2 className="text-xl font-bold text-gray-900 pb-3 mb-6 border-b border-gray-200">
												.docx Shell Downloads
											</h2>
											<div className="space-y-4">
												<div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex justify-between items-center">
													<div>
														<p className="font-semibold">
															Notice of Motion and Motion Shell
														</p>
														<p className="text-sm text-gray-500 mt-1">
															A pre-formatted .docx shell for the notice of
															motion.
														</p>
													</div>
													<button
														disabled
														className="bg-gray-200 text-gray-500 font-semibold py-2 px-4 rounded-lg text-sm cursor-not-allowed"
													>
														Download
													</button>
												</div>
												<div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex justify-between items-center">
													<div>
														<p className="font-semibold">
															Separate Statement Shell
														</p>
														<p className="text-sm text-gray-500 mt-1">
															A pre-formatted .docx shell with the required
															two-column format.
														</p>
													</div>
													<button
														disabled
														className="bg-gray-200 text-gray-500 font-semibold py-2 px-4 rounded-lg text-sm cursor-not-allowed"
													>
														Download
													</button>
												</div>
											</div>
										</section>
									)}
								</div>
							</div>
						) : (
							<div className="flex flex-col items-center justify-center h-[calc(100vh-6rem)] text-center">
								<svg
									width="48"
									height="48"
									viewBox="0 0 24 24"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
									className="text-gray-300 mb-4"
								>
									<path
										d="M12.75 3.844A1.5 1.5 0 0011.25 2.5H6A1.5 1.5 0 004.5 4v16A1.5 1.5 0 006 21.5h12a1.5 1.5 0 001.5-1.5v-7.694a1.5 1.5 0 00-.75-1.306l-4.5-2.813z"
										stroke="currentColor"
										strokeWidth="1.5"
									/>
									<path
										d="M12.75 3.844l4.5 2.812V11l-4.5-3.188"
										stroke="currentColor"
										strokeWidth="1.5"
									/>
									<path
										d="M9.5 14h5"
										stroke="currentColor"
										strokeWidth="1.5"
										strokeLinecap="round"
									/>
									<path
										d="M9.5 17h5"
										stroke="currentColor"
										strokeWidth="1.5"
										strokeLinecap="round"
									/>
								</svg>

								<h2 className="text-xl font-semibold text-gray-900">
									Your Filing Docket Will Appear Here
								</h2>
								<p className="text-gray-500 mt-2 max-w-sm">
									Complete the search parameters on the left to generate your
									filing requirements report and procedural checklist.
								</p>
							</div>
						)}
					</div>
				</main>
			</div>
		</div>
	);
}
