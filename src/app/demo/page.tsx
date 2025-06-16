"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getApiUrl } from "@/lib/config";
import jsPDF from "jspdf";

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
	const [documentType, setDocumentType] = useState<string>(
		"Motion for Summary Judgment"
	);
	const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
	const pdfContentRef = useRef<HTMLDivElement>(null);

	// Fetch judges on component mount
	useEffect(() => {
		const fetchJudges = async () => {
			try {
				const params = new URLSearchParams({
					division: selectedDivision,
				});

				const response = await fetch(
					getApiUrl(`/api/judges?${params.toString()}`),
					{
						method: "GET",
						headers: {
							"Content-Type": "application/json",
						},
					}
				);

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
	}, [selectedDivision]);

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
					document_type: documentType,
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

	const handleDownloadPDF = async () => {
		if (!searchResults || !pdfContentRef.current) return;

		setIsGeneratingPDF(true);

		try {
			const pdf = new jsPDF("p", "mm", "a4");
			const pageWidth = pdf.internal.pageSize.getWidth();
			const pageHeight = pdf.internal.pageSize.getHeight();
			const margin = 20;
			const contentWidth = pageWidth - margin * 2;
			let yPosition = margin;

			// Add title
			pdf.setFontSize(24);
			pdf.setFont("helvetica", "bold");
			pdf.text("Filing Requirements Report", margin, yPosition);
			yPosition += 12;

			pdf.setFontSize(14);
			pdf.setFont("helvetica", "normal");
			pdf.setTextColor(100);
			pdf.text(`${documentType} - Judge ${selectedJudge}`, margin, yPosition);
			yPosition += 8;

			pdf.setFontSize(12);
			pdf.text(
				`${selectedDivision}, Santa Clara County, California`,
				margin,
				yPosition
			);
			yPosition += 15;

			// Reset text color
			pdf.setTextColor(0);

			// Add Filing Checklist section
			pdf.setFontSize(18);
			pdf.setFont("helvetica", "bold");
			pdf.text("Filing Checklist", margin, yPosition);
			yPosition += 10;

			Object.entries(checklistByPhase || {}).forEach(([phase, items]) => {
				// Check if we need a new page
				if (yPosition > pageHeight - 60) {
					pdf.addPage();
					yPosition = margin;
				}

				// Phase header
				pdf.setFontSize(14);
				pdf.setFont("helvetica", "bold");
				pdf.setTextColor(219, 39, 119); // Pink color
				pdf.text(phase, margin, yPosition);
				yPosition += 8;

				// Define column positions and widths
				const checkboxCol = margin;
				const taskCol = margin + 15;
				const notesCol = margin + 80;
				const ruleCol = margin + 130;
				const tableWidth = contentWidth;
				const taskWidth = 60;
				const notesWidth = 45;
				const ruleWidth = 40;

				// Table header
				pdf.setFontSize(10);
				pdf.setFont("helvetica", "bold");
				pdf.setTextColor(0);
				pdf.text("Done", checkboxCol, yPosition);
				pdf.text("Task", taskCol, yPosition);
				pdf.text("Notes", notesCol, yPosition);
				pdf.text("Rule Reference", ruleCol, yPosition);
				yPosition += 6;

				// Draw header line
				pdf.setDrawColor(200);
				pdf.line(margin, yPosition - 2, margin + tableWidth, yPosition - 2);

				// Draw column dividers for header
				pdf.line(taskCol - 2, yPosition - 8, taskCol - 2, yPosition - 2);
				pdf.line(notesCol - 2, yPosition - 8, notesCol - 2, yPosition - 2);
				pdf.line(ruleCol - 2, yPosition - 8, ruleCol - 2, yPosition - 2);

				yPosition += 2;

				// Table content
				pdf.setFont("helvetica", "normal");
				items.forEach((item) => {
					if (yPosition > pageHeight - 30) {
						pdf.addPage();
						yPosition = margin;
					}

					const startY = yPosition;

					// Checkbox - use simple [ ]
					pdf.setTextColor(0);
					pdf.text("[ ]", checkboxCol, yPosition);

					// Task (word wrap)
					pdf.setFontSize(9);
					const taskLines = pdf.splitTextToSize(item.task, taskWidth);
					pdf.text(taskLines, taskCol, yPosition);

					// Notes (word wrap)
					pdf.setTextColor(100);
					const notesLines = pdf.splitTextToSize(item.notes, notesWidth);
					pdf.text(notesLines, notesCol, yPosition);

					// Rule reference with link (word wrap)
					pdf.setTextColor(219, 39, 119);
					pdf.setFont("helvetica", "normal");
					const ruleLines = pdf.splitTextToSize(item.rule, ruleWidth);
					if (item.link) {
						// For multi-line links, we'll just show the first line as a link
						pdf.textWithLink(ruleLines[0] || item.rule, ruleCol, yPosition, {
							url: item.link,
						});
						if (ruleLines.length > 1) {
							pdf.setTextColor(219, 39, 119);
							for (let i = 1; i < ruleLines.length; i++) {
								pdf.text(ruleLines[i], ruleCol, yPosition + i * 4);
							}
						}
					} else {
						pdf.text(ruleLines, ruleCol, yPosition);
					}

					// Calculate max lines for proper spacing
					const maxLines = Math.max(
						taskLines.length,
						notesLines.length,
						ruleLines.length,
						1
					);
					const rowHeight = maxLines * 4 + 2;

					// Draw column dividers for this row
					pdf.setDrawColor(230);
					pdf.line(
						taskCol - 2,
						startY - 2,
						taskCol - 2,
						startY + rowHeight - 2
					);
					pdf.line(
						notesCol - 2,
						startY - 2,
						notesCol - 2,
						startY + rowHeight - 2
					);
					pdf.line(
						ruleCol - 2,
						startY - 2,
						ruleCol - 2,
						startY + rowHeight - 2
					);

					yPosition += rowHeight;

					pdf.setTextColor(0);
					pdf.setFont("helvetica", "normal");
				});

				// Draw bottom border for table
				pdf.setDrawColor(200);
				pdf.line(margin, yPosition, margin + tableWidth, yPosition);

				yPosition += 8;
			});

			// Add new page for documents
			pdf.addPage();
			yPosition = margin;

			// Mandatory Documents section
			pdf.setFontSize(18);
			pdf.setFont("helvetica", "bold");
			pdf.setTextColor(0);
			pdf.text("Mandatory Documents", margin, yPosition);
			yPosition += 10;

			// Define column positions for documents
			const docCol = margin;
			const docRuleCol = margin + 100;
			const docWidth = 90;
			const docRuleWidth = 70;

			// Table header
			pdf.setFontSize(10);
			pdf.setFont("helvetica", "bold");
			pdf.text("Document", docCol, yPosition);
			pdf.text("Rule Reference", docRuleCol, yPosition);
			yPosition += 6;

			// Draw header line
			pdf.setDrawColor(200);
			pdf.line(margin, yPosition - 2, margin + contentWidth, yPosition - 2);

			// Draw column divider for header
			pdf.line(docRuleCol - 2, yPosition - 8, docRuleCol - 2, yPosition - 2);

			yPosition += 2;

			pdf.setFont("helvetica", "normal");
			searchResults.documents.forEach((doc) => {
				if (yPosition > pageHeight - 25) {
					pdf.addPage();
					yPosition = margin;
				}

				const startY = yPosition;

				// Document name
				pdf.setFontSize(9);
				pdf.setTextColor(0);
				const docLines = pdf.splitTextToSize(doc.item, docWidth);
				pdf.text(docLines, docCol, yPosition);

				// Rule reference with link
				pdf.setTextColor(219, 39, 119);
				const ruleLines = pdf.splitTextToSize(doc.rule, docRuleWidth);
				if (doc.link) {
					pdf.textWithLink(ruleLines[0] || doc.rule, docRuleCol, yPosition, {
						url: doc.link,
					});
					if (ruleLines.length > 1) {
						for (let i = 1; i < ruleLines.length; i++) {
							pdf.text(ruleLines[i], docRuleCol, yPosition + i * 4);
						}
					}
				} else {
					pdf.text(ruleLines, docRuleCol, yPosition);
				}

				const maxLines = Math.max(docLines.length, ruleLines.length, 1);
				const rowHeight = maxLines * 4 + 2;

				// Draw column divider
				pdf.setDrawColor(230);
				pdf.line(
					docRuleCol - 2,
					startY - 2,
					docRuleCol - 2,
					startY + rowHeight - 2
				);

				yPosition += rowHeight;
			});

			// Draw bottom border
			pdf.setDrawColor(200);
			pdf.line(margin, yPosition, margin + contentWidth, yPosition);

			yPosition += 10;

			// Conditional Documents section
			if (yPosition > pageHeight - 50) {
				pdf.addPage();
				yPosition = margin;
			}

			pdf.setFontSize(18);
			pdf.setFont("helvetica", "bold");
			pdf.setTextColor(0);
			pdf.text("Conditional Documents", margin, yPosition);
			yPosition += 10;

			// Table header
			pdf.setFontSize(10);
			pdf.setFont("helvetica", "bold");
			pdf.text("Document", docCol, yPosition);
			pdf.text("Rule Reference", docRuleCol, yPosition);
			yPosition += 6;

			// Draw header line
			pdf.setDrawColor(200);
			pdf.line(margin, yPosition - 2, margin + contentWidth, yPosition - 2);

			// Draw column divider for header
			pdf.line(docRuleCol - 2, yPosition - 8, docRuleCol - 2, yPosition - 2);

			yPosition += 2;

			pdf.setFont("helvetica", "normal");
			searchResults.conditional.forEach((doc) => {
				if (yPosition > pageHeight - 25) {
					pdf.addPage();
					yPosition = margin;
				}

				const startY = yPosition;

				// Document name
				pdf.setFontSize(9);
				pdf.setTextColor(0);
				const docLines = pdf.splitTextToSize(doc.item, docWidth);
				pdf.text(docLines, docCol, yPosition);

				// Rule reference with link
				pdf.setTextColor(219, 39, 119);
				const ruleLines = pdf.splitTextToSize(doc.rule, docRuleWidth);
				if (doc.link) {
					pdf.textWithLink(ruleLines[0] || doc.rule, docRuleCol, yPosition, {
						url: doc.link,
					});
					if (ruleLines.length > 1) {
						for (let i = 1; i < ruleLines.length; i++) {
							pdf.text(ruleLines[i], docRuleCol, yPosition + i * 4);
						}
					}
				} else {
					pdf.text(ruleLines, docRuleCol, yPosition);
				}

				const maxLines = Math.max(docLines.length, ruleLines.length, 1);
				const rowHeight = maxLines * 4 + 2;

				// Draw column divider
				pdf.setDrawColor(230);
				pdf.line(
					docRuleCol - 2,
					startY - 2,
					docRuleCol - 2,
					startY + rowHeight - 2
				);

				yPosition += rowHeight;
			});

			// Draw bottom border
			pdf.setDrawColor(200);
			pdf.line(margin, yPosition, margin + contentWidth, yPosition);

			// Add new page for governing rules
			pdf.addPage();
			yPosition = margin;

			// Governing Rules section
			pdf.setFontSize(18);
			pdf.setFont("helvetica", "bold");
			pdf.setTextColor(0);
			pdf.text("Governing Rules", margin, yPosition);
			yPosition += 12;

			searchResults.rules.forEach((rule) => {
				if (yPosition > pageHeight - 50) {
					pdf.addPage();
					yPosition = margin;
				}

				// Rule name
				pdf.setFontSize(12);
				pdf.setFont("helvetica", "bold");
				pdf.setTextColor(0);
				const nameLines = pdf.splitTextToSize(rule.name, contentWidth);
				pdf.text(nameLines, margin, yPosition);
				yPosition += nameLines.length * 6 + 3;

				// Rule text
				pdf.setFontSize(10);
				pdf.setFont("helvetica", "normal");
				pdf.setTextColor(60);
				const textLines = pdf.splitTextToSize(rule.text, contentWidth);
				pdf.text(textLines, margin, yPosition);
				yPosition += textLines.length * 4 + 4;

				// Source link
				if (rule.link) {
					pdf.setFontSize(10);
					pdf.setFont("helvetica", "normal");
					pdf.setTextColor(219, 39, 119);
					pdf.textWithLink("Source Link", margin, yPosition, {
						url: rule.link,
					});
				} else {
					pdf.setTextColor(100);
					pdf.text("Source Link", margin, yPosition);
				}

				yPosition += 12;
			});

			// Add footer to all pages
			const pageCount = pdf.getNumberOfPages();
			for (let i = 1; i <= pageCount; i++) {
				pdf.setPage(i);
				pdf.setFontSize(8);
				pdf.setTextColor(150);
				pdf.text(
					`Generated by Ingrid Technologies Inc. - Page ${i} of ${pageCount}`,
					margin,
					pageHeight - 10
				);
				pdf.text(
					`© 2025 Ingrid Technologies Inc. - Procedural information only, not legal advice.`,
					margin,
					pageHeight - 6
				);
			}

			// Save the PDF
			const fileName = `Filing_Requirements_${selectedJudge.replace(
				/\s+/g,
				"_"
			)}_${documentType.replace(/\s+/g, "_")}.pdf`;
			pdf.save(fileName);
		} catch (error) {
			console.error("Failed to generate PDF:", error);
			setError("Failed to generate PDF. Please try again.");
		} finally {
			setIsGeneratingPDF(false);
		}
	};

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
										value={documentType}
										onChange={(e) => setDocumentType(e.target.value)}
										className="w-full pl-3 pr-10 py-2 text-base border-gray-300 bg-gray-50/80 focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 sm:text-sm rounded-lg shadow-sm"
									>
										<option value="Motion for Summary Judgment">
											Motion for Summary Judgment
										</option>
										<option value="Motion to Dismiss (Demurrer)">
											Motion to Dismiss (Demurrer)
										</option>
										<option value="Motion to Compel Further Discovery Responses">
											Motion to Compel Further Discovery Responses
										</option>
										<option value="Motion to Strike">Motion to Strike</option>
										<option value="Answer">Answer</option>
										<option value="Complaint">Complaint</option>
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
				<main className="flex-1 ml-[28rem] bg-white">
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
									<div className="flex space-x-3">
										<button
											onClick={handleDownloadPDF}
											disabled={isGeneratingPDF}
											className="bg-pink-600 hover:bg-pink-700 disabled:bg-pink-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg flex items-center transition text-sm"
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
												<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
												<polyline points="7,10 12,15 17,10" />
												<line x1="12" y1="15" x2="12" y2="3" />
											</svg>
											{isGeneratingPDF ? "Generating PDF..." : "Download PDF"}
										</button>
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
								</div>

								{/* Hidden content for PDF generation */}
								<div ref={pdfContentRef} style={{ display: "none" }}>
									{/* PDF content will be generated programmatically */}
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
															<h3 className="text-lg font-semibold text-pink-700 mb-4">
																{phase}
															</h3>
															<div className="overflow-x-auto">
																<table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
																	<thead className="bg-gray-50">
																		<tr>
																			<th className="w-12 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
																				Done
																			</th>
																			<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
																				Task
																			</th>
																			<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
																				Notes
																			</th>
																			<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
																				Rule Reference
																			</th>
																		</tr>
																	</thead>
																	<tbody className="divide-y divide-gray-200">
																		{items.map((item, index) => (
																			<tr
																				key={`${item.task}-${index}`}
																				className="hover:bg-gray-50"
																			>
																				<td className="px-4 py-4 whitespace-nowrap">
																					<input
																						type="checkbox"
																						id={`${phase}-${index}`}
																						className="h-5 w-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
																					/>
																				</td>
																				<td className="px-4 py-4">
																					<div className="text-sm font-medium text-gray-900">
																						{item.task}
																					</div>
																				</td>
																				<td className="px-4 py-4">
																					<div className="text-sm text-gray-600">
																						{item.notes}
																					</div>
																				</td>
																				<td className="px-4 py-4">
																					{item.link ? (
																						<a
																							href={item.link}
																							target="_blank"
																							rel="noopener noreferrer"
																							className="text-sm text-pink-600 hover:text-pink-800 hover:underline flex items-center"
																						>
																							{item.rule}
																							<svg
																								className="w-3 h-3 ml-1 flex-shrink-0"
																								fill="none"
																								stroke="currentColor"
																								viewBox="0 0 24 24"
																							>
																								<path
																									strokeLinecap="round"
																									strokeLinejoin="round"
																									strokeWidth={2}
																									d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
																								/>
																							</svg>
																						</a>
																					) : (
																						<span className="text-sm text-gray-500">
																							{item.rule}
																						</span>
																					)}
																				</td>
																			</tr>
																		))}
																	</tbody>
																</table>
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
											<div className="overflow-x-auto">
												<table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
													<thead className="bg-gray-50">
														<tr>
															<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
																Document
															</th>
															<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
																Rule Reference
															</th>
														</tr>
													</thead>
													<tbody className="divide-y divide-gray-200">
														{searchResults.documents.map((doc, index) => (
															<tr
																key={`${doc.item}-${index}`}
																className="hover:bg-gray-50"
															>
																<td className="px-4 py-4">
																	<div className="text-sm font-medium text-gray-900">
																		{doc.item}
																	</div>
																</td>
																<td className="px-4 py-4">
																	{doc.link ? (
																		<a
																			href={doc.link}
																			target="_blank"
																			rel="noopener noreferrer"
																			className="text-sm text-pink-600 hover:text-pink-800 hover:underline flex items-center"
																		>
																			{doc.rule}
																			<svg
																				className="w-3 h-3 ml-1 flex-shrink-0"
																				fill="none"
																				stroke="currentColor"
																				viewBox="0 0 24 24"
																			>
																				<path
																					strokeLinecap="round"
																					strokeLinejoin="round"
																					strokeWidth={2}
																					d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
																				/>
																			</svg>
																		</a>
																	) : (
																		<span className="text-sm text-gray-500">
																			{doc.rule}
																		</span>
																	)}
																</td>
															</tr>
														))}
													</tbody>
												</table>
											</div>
										</section>
									)}

									{activeTab === "Conditional Docs" && (
										<section>
											<h2 className="text-xl font-bold text-gray-900 pb-3 mb-6 border-b border-gray-200">
												Conditional Documents
											</h2>
											<div className="overflow-x-auto">
												<table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
													<thead className="bg-gray-50">
														<tr>
															<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
																Document
															</th>
															<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
																Rule Reference
															</th>
														</tr>
													</thead>
													<tbody className="divide-y divide-gray-200">
														{searchResults.conditional.map((doc, index) => (
															<tr
																key={`${doc.item}-${index}`}
																className="hover:bg-gray-50"
															>
																<td className="px-4 py-4">
																	<div className="text-sm font-medium text-gray-900">
																		{doc.item}
																	</div>
																</td>
																<td className="px-4 py-4">
																	{doc.link ? (
																		<a
																			href={doc.link}
																			target="_blank"
																			rel="noopener noreferrer"
																			className="text-sm text-pink-600 hover:text-pink-800 hover:underline flex items-center"
																		>
																			{doc.rule}
																			<svg
																				className="w-3 h-3 ml-1 flex-shrink-0"
																				fill="none"
																				stroke="currentColor"
																				viewBox="0 0 24 24"
																			>
																				<path
																					strokeLinecap="round"
																					strokeLinejoin="round"
																					strokeWidth={2}
																					d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
																				/>
																			</svg>
																		</a>
																	) : (
																		<span className="text-sm text-gray-500">
																			{doc.rule}
																		</span>
																	)}
																</td>
															</tr>
														))}
													</tbody>
												</table>
											</div>
										</section>
									)}

									{activeTab === "Governing Rules" && (
										<section>
											<h2 className="text-xl font-bold text-gray-900 pb-3 mb-6 border-b border-gray-200">
												Governing Rules
											</h2>
											<div className="space-y-4">
												{searchResults.rules.map((rule, index) => (
													<div
														key={`${rule.name}-${index}`}
														className="p-5 bg-gray-100 rounded-xl border border-gray-200/80"
													>
														<p className="font-semibold text-gray-800">
															{rule.name}
														</p>
														<p className="text-sm text-gray-600 mt-1">
															{rule.text}
														</p>
														{rule.link ? (
															<a
																href={rule.link}
																target="_blank"
																rel="noopener noreferrer"
																className="text-sm text-pink-600 hover:text-pink-800 hover:underline mt-3 inline-flex items-center font-medium"
															>
																Source Link
																<svg
																	className="w-3 h-3 ml-1 flex-shrink-0"
																	fill="none"
																	stroke="currentColor"
																	viewBox="0 0 24 24"
																>
																	<path
																		strokeLinecap="round"
																		strokeLinejoin="round"
																		strokeWidth={2}
																		d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
																	/>
																</svg>
															</a>
														) : (
															<span className="text-sm text-gray-500 mt-3 inline-block font-medium">
																Source Link
															</span>
														)}
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
