"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getApiUrl } from "@/lib/config";
import jsPDF from "jspdf";

// Types (Judge interface removed as it's not used)

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

interface ProceduralRoadmapData {
	documentType: string;
	jurisdiction: string;
	phases: {
		id: string;
		title: string;
		description: string;
		deadline: string;
		requirements: string[];
		ruleReference: string;
		ruleLink?: string;
	}[];
}

interface SearchResults {
	documents: Document[];
	conditional: Document[];
	rules: Rule[];
	checklist: ChecklistItem[];
	proceduralRoadmap?: ProceduralRoadmapData;
}

interface PreviousQuery {
	id: string;
	formData: {
		state: string;
		county: string;
		division: string;
		judge: string;
		documentType: string;
		courtType: string;
		department: string;
	};
	results: SearchResults;
	timestamp: Date;
	title: string;
}

export default function Demo() {
	const [showResults, setShowResults] = useState<boolean>(false);
	const [activeTab, setActiveTab] = useState<string>("Checklist");
	const [searchResults, setSearchResults] = useState<SearchResults | null>(
		null
	);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [progress, setProgress] = useState(0);
	const pdfContentRef = useRef<HTMLDivElement>(null);
	const [proceduralRoadmapData, setProceduralRoadmapData] = useState<ProceduralRoadmapData | null>(null);
	const [formData, setFormData] = useState({
		state: '',
		county: '',
		division: '',
		judge: '',
		documentType: '',
		courtType: 'state', // Fixed to state court only
		department: '' // Add department field
	});
	const [previousQueries, setPreviousQueries] = useState<PreviousQuery[]>([]);
	const [showPreviousQueries, setShowPreviousQueries] = useState(false);

	// Load previous queries from localStorage on component mount
	useEffect(() => {
		try {
			const saved = localStorage.getItem('ingrid-previous-queries');
			if (saved) {
				const parsed = JSON.parse(saved);
				// Convert timestamp strings back to Date objects
				const queriesWithDates = parsed.map((query: PreviousQuery & { timestamp: string }) => ({
					...query,
					timestamp: new Date(query.timestamp)
				}));
				setPreviousQueries(queriesWithDates);
				if (queriesWithDates.length > 0) {
					setShowPreviousQueries(false); // Don't auto-show on load
				}
			}
		} catch (error) {
			console.error('Error loading previous queries:', error);
		}
	}, []);

	// Save previous queries to localStorage whenever they change
	useEffect(() => {
		try {
			localStorage.setItem('ingrid-previous-queries', JSON.stringify(previousQueries));
		} catch (error) {
			console.error('Error saving previous queries:', error);
		}
	}, [previousQueries]);

	// Add progress timer effect
	useEffect(() => {
		let progressInterval: NodeJS.Timeout;
		
		if (loading) {
			setProgress(0);
			// Calculate increment based on expected API time (~15 seconds)
			const expectedDuration = 15000; // 15 seconds
			const updateInterval = 100; // Update every 100ms
			const incrementPerUpdate = (95 / (expectedDuration / updateInterval));
			
			progressInterval = setInterval(() => {
				setProgress(prev => {
					const nextProgress = prev + incrementPerUpdate;
					return nextProgress > 95 ? 95 : nextProgress; // Cap at 95% until complete
				});
			}, updateInterval);
		} else {
			// When loading completes, quickly fill to 100%
			setProgress(100);
			setTimeout(() => {
				setProgress(0);
			}, 300);
		}

		return () => {
			clearInterval(progressInterval);
		};
	}, [loading]);



	// Function to save a query to previous queries
	const saveQuery = (formData: {
		state: string;
		county: string;
		division: string;
		judge: string;
		documentType: string;
		courtType: string;
		department: string;
	}, results: SearchResults) => {
		const queryId = Date.now().toString();
		const title = `${formData.documentType} - ${formData.judge}`;
		
		const newQuery: PreviousQuery = {
			id: queryId,
			formData: { ...formData },
			results,
			timestamp: new Date(),
			title
		};

		setPreviousQueries(prev => {
			// Remove any existing query with the same parameters to avoid duplicates
			const filtered = prev.filter(q => 
				!(q.formData.state === formData.state &&
				  q.formData.county === formData.county &&
				  q.formData.division === formData.division &&
				  q.formData.judge === formData.judge &&
				  q.formData.documentType === formData.documentType &&
				  q.formData.department === formData.department)
			);
			
			// Add new query at the beginning and limit to 10 most recent
			return [newQuery, ...filtered].slice(0, 10);
		});

		// Show the previous queries sidebar after first successful query
		setShowPreviousQueries(true);
	};

	// Function to load a previous query
	const loadPreviousQuery = (query: PreviousQuery) => {
		setFormData(query.formData);
		setSearchResults(query.results);
		setShowResults(true);
		setActiveTab("Checklist");
		if (query.results.proceduralRoadmap) {
			setProceduralRoadmapData(query.results.proceduralRoadmap);
		} else {
			// Generate procedural roadmap data if not present
			const generatedProceduralRoadmapData = generateProceduralRoadmapData();
			setProceduralRoadmapData(generatedProceduralRoadmapData);
		}
	};

	// Function to generate mind map data from search results
	const generateProceduralRoadmapData = (): ProceduralRoadmapData => {
		return {
			documentType: formData.documentType,
			jurisdiction: `${formData.division}, ${formData.county}, ${formData.state}`,
			phases: [
				{
					id: 'preparation',
					title: 'Document Preparation Phase',
					description: 'Prepare and draft the required filing documents',
					deadline: 'Before filing deadline',
					requirements: [
						'Draft motion/pleading according to court formatting requirements',
						'Gather supporting evidence and exhibits',
						'Prepare declaration of service',
						'Review local court rules for specific requirements'
					],
					ruleReference: 'CCP § 1010 - Service requirements',
					ruleLink: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1010'
				},
				{
					id: 'filing',
					title: 'Initial Filing Phase',
					description: 'File the document with the court and serve all parties',
					deadline: 'Filing deadline per case schedule',
					requirements: [
						'File original document with court clerk',
						'Pay required filing fees',
						'Serve all parties per service requirements',
						'File proof of service with the court'
					],
					ruleReference: 'CCP § 1005(b) - Notice requirements',
					ruleLink: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1005'
				},
				{
					id: 'response-period',
					title: 'Response Period',
					description: 'Allow time for opposing parties to respond',
					deadline: '16 court days before hearing (if motion)',
					requirements: [
						'Monitor for opposing party responses',
						'Review any opposition filed',
						'Prepare reply brief if opposition is filed',
						'Coordinate with opposing counsel if needed'
					],
					ruleReference: 'CCP § 1005(b) - Response deadlines',
					ruleLink: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1005'
				},
				{
					id: 'hearing-preparation',
					title: 'Hearing Preparation Phase',
					description: 'Prepare for court hearing and oral argument',
					deadline: '5 court days before hearing',
					requirements: [
						'File reply brief if opposition was filed',
						'Prepare oral argument outline',
						'Review tentative ruling if issued',
						'Coordinate with court clerk for hearing logistics'
					],
					ruleReference: 'CRC Rule 3.1308 - Tentative rulings and oral argument',
					ruleLink: 'https://www.courts.ca.gov/cms/rules/index.cfm?title=three&linkid=rule3_1308'
				},
				{
					id: 'hearing-and-order',
					title: 'Hearing and Order Phase',
					description: 'Attend hearing and obtain court order',
					deadline: 'Hearing date',
					requirements: [
						'Appear at scheduled hearing',
						'Present oral argument if required',
						'Obtain signed order from court',
						'Serve order on all parties if required'
					],
					ruleReference: 'CRC Rule 3.1312 - Preparation and service of order',
					ruleLink: 'https://www.courts.ca.gov/cms/rules/index.cfm?title=three&linkid=rule3_1312'
				}
			]
		};
	};

	const handleSearch = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		
		// Validate required fields
		if (!formData.state || !formData.county || !formData.division || !formData.judge || !formData.department || !formData.documentType) {
			setError('Please fill in all required fields.');
			return;
		}

		setLoading(true);
		setProceduralRoadmapData(null);

		try {
			const response = await fetch(getApiUrl("/api/prepareDocket"), {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					state: formData.state,
					county: formData.county,
					division: formData.division,
					judge: formData.judge,
					department: formData.department,
					document_type: formData.documentType,
					court_type: formData.courtType,
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
				// Generate procedural roadmap data
				const generatedProceduralRoadmapData = generateProceduralRoadmapData();
				setProceduralRoadmapData(generatedProceduralRoadmapData);
				// Save this query to previous queries
				saveQuery(formData, result.data);
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

		setLoading(true);

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
			pdf.text(`${formData.documentType} - Judge ${formData.judge}, ${formData.department}`, margin, yPosition);
			yPosition += 8;

			pdf.setFontSize(12);
			pdf.text(
				`${formData.division}, ${formData.county}, ${formData.state}`,
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
			const fileName = `Filing_Requirements_${formData.judge.replace(
				/\s+/g,
				"_"
			)}_${formData.documentType.replace(/\s+/g, "_")}.pdf`;
			pdf.save(fileName);
		} catch (error) {
			console.error("Failed to generate PDF:", error);
			setError("Failed to generate PDF. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="bg-gradient-to-br from-gray-50 via-white to-pink-50/30 font-sans text-gray-800 min-h-screen">
			<div className="flex min-h-screen relative">
				{/* Sidebar */}
				<aside className={`fixed top-0 left-0 h-full w-full border-r border-white/20 bg-white/90 backdrop-blur-2xl p-8 overflow-y-auto shadow-2xl shadow-pink-500/5 transition-all duration-700 ease-in-out ${
					showResults 
						? 'max-w-0 -translate-x-full opacity-0' 
						: 'max-w-2xl'
				}`}>
					{/* Decorative gradient overlay */}
					<div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-purple-500/5 pointer-events-none" />
					
					<div className="relative z-10 space-y-10 h-full flex flex-col">
						{/* Header */}
						<Link href="/" className="flex items-center space-x-3 group">
							<div className="relative">
								<div className="absolute -inset-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl blur-lg opacity-20 group-hover:opacity-40 transition-all duration-500 animate-pulse" />
								<div className="relative bg-gradient-to-br from-pink-500 to-pink-600 p-2 rounded-xl shadow-lg group-hover:shadow-pink-500/25 transition-all duration-300 group-hover:scale-105">
									<svg
										width="28"
										height="28"
										viewBox="0 0 24 24"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
										className="text-white"
									>
										<path
											d="M9 12.5L11.5 15L16 10"
											stroke="currentColor"
											strokeWidth="2.5"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
									</svg>
								</div>
							</div>
							<div className="flex flex-col">
								<span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent group-hover:from-pink-600 group-hover:to-pink-700 transition-all duration-300">
									Ingrid
								</span>
								<span className="text-xs text-gray-500 font-medium tracking-wide">Legal Assistant</span>
							</div>
						</Link>

						{/* Form */}
						<form onSubmit={handleSearch} className="space-y-8 flex-grow">
							<div className="relative bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/40 shadow-xl shadow-pink-500/5">
								{/* Decorative elements */}
								<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 rounded-t-3xl" />
								<div className="absolute -top-px left-1/2 transform -translate-x-1/2 w-20 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
								
								<div className="relative">
									<h2 className="text-xl font-bold text-gray-900 tracking-tight mb-8 flex items-center">
										<div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
											<svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
											</svg>
										</div>
										Search Parameters
									</h2>

									{error && (
										<div className="bg-gradient-to-r from-red-50 to-pink-50 backdrop-blur-sm border border-red-200/50 text-red-700 px-6 py-4 rounded-2xl text-sm mb-8 shadow-lg shadow-red-500/10 relative overflow-hidden">
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

									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

										{/* State */}
										<div className="group relative">
											<label htmlFor="state" className="block text-sm font-bold text-gray-800 mb-3 tracking-wide">
												State
											</label>
											<div className="relative">
												<input
													type="text"
													id="state"
													value={formData.state}
													onChange={(e) => setFormData({...formData, state: e.target.value})}
													placeholder="e.g., California"
													className="w-full px-5 py-4 border-0 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-pink-500/20 placeholder-gray-400 transition-all duration-300 group-hover:shadow-xl bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm text-gray-800 font-medium"
												/>
												<div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
											</div>
										</div>

										{/* County */}
										<div className="group relative">
											<label htmlFor="county" className="block text-sm font-bold text-gray-800 mb-3 tracking-wide">
												County
											</label>
											<div className="relative">
												<input
													type="text"
													id="county"
													value={formData.county}
													onChange={(e) => setFormData({...formData, county: e.target.value})}
													placeholder="e.g., Los Angeles County"
													className="w-full px-5 py-4 border-0 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-pink-500/20 placeholder-gray-400 transition-all duration-300 group-hover:shadow-xl bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm text-gray-800 font-medium"
												/>
												<div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
											</div>
										</div>

										{/* Division */}
										<div className="group relative">
											<label htmlFor="division" className="block text-sm font-bold text-gray-800 mb-3 tracking-wide">
												Division
											</label>
											<div className="relative">
												<input
													type="text"
													id="division"
													value={formData.division}
													onChange={(e) => setFormData({...formData, division: e.target.value})}
													placeholder="e.g., Civil Division"
													className="w-full px-5 py-4 border-0 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-pink-500/20 placeholder-gray-400 transition-all duration-300 group-hover:shadow-xl bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm text-gray-800 font-medium"
												/>
												<div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
											</div>
										</div>

										{/* Department */}
										<div className="group relative">
											<label htmlFor="department" className="block text-sm font-bold text-gray-800 mb-3 tracking-wide">Department</label>
											<div className="relative">
												<input
													type="text"
													id="department"
													value={formData.department}
													onChange={(e) => setFormData({...formData, department: e.target.value})}
													placeholder="e.g., Department 1, Dept. A, Room 101"
													className="w-full px-5 py-4 border-0 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-pink-500/20 placeholder-gray-400 transition-all duration-300 group-hover:shadow-xl bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm text-gray-800 font-medium"
												/>
												<div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
											</div>
										</div>

										{/* Judge - Full Width */}
										<div className="md:col-span-2 group relative">
											<label htmlFor="judge" className="block text-sm font-bold text-gray-800 mb-3 tracking-wide">Judge</label>
											<div className="relative">
												<input
													type="text"
													id="judge"
													value={formData.judge}
													onChange={(e) => setFormData({...formData, judge: e.target.value})}
													placeholder="e.g., Hon. Jane Smith"
													className="w-full px-5 py-4 border-0 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-pink-500/20 placeholder-gray-400 transition-all duration-300 group-hover:shadow-xl bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm text-gray-800 font-medium"
												/>
												<div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
											</div>
										</div>

										{/* Document Type */}
										<div className="md:col-span-2 group relative">
											<label htmlFor="documentType" className="block text-sm font-bold text-gray-800 mb-3 tracking-wide">Document Type</label>
											<div className="relative">
												<input
													type="text"
													id="documentType"
													value={formData.documentType}
													onChange={(e) => setFormData({...formData, documentType: e.target.value})}
													placeholder="e.g., Motion for Summary Judgment, Complaint, Answer, Discovery Motion"
													className="w-full px-5 py-4 border-0 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-pink-500/20 placeholder-gray-400 transition-all duration-300 group-hover:shadow-xl bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm text-gray-800 font-medium"
												/>
												<div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
											</div>
										</div>
									</div>
								</div>
							</div>
							<div className="pt-8">
								<button
									type="submit"
									disabled={loading}
									className={`w-full relative overflow-hidden group ${
										loading 
											? 'bg-gradient-to-r from-pink-200 to-purple-200' 
											: 'bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 hover:from-pink-600 hover:via-pink-700 hover:to-purple-700 active:scale-[0.98] shadow-2xl shadow-pink-500/25 hover:shadow-pink-500/40'
									} disabled:cursor-not-allowed text-white font-bold py-5 px-8 rounded-2xl transition-all duration-500 ease-out focus:outline-none focus:ring-4 focus:ring-pink-500/30`}
								>
									{/* Animated background effects */}
									<div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20 -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
									
									{loading && (
										<>
											<div 
												className="absolute left-0 top-0 h-full bg-gradient-to-r from-pink-600 via-pink-700 to-purple-700 transition-all duration-300 ease-linear rounded-2xl"
												style={{
													width: `${progress}%`,
												}}
											/>
											<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-pulse" />
											{/* Shimmer effect */}
											<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 transform -translate-x-full animate-pulse" />
										</>
									)}
									
									<span className="relative z-10 flex items-center justify-center text-lg font-bold tracking-wide">
										{loading ? (
											<>
												<div className="relative mr-4">
													<svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
														<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
														<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
													</svg>
													<div className="absolute inset-0 animate-ping">
														<svg className="h-6 w-6 text-white opacity-20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
															<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
														</svg>
													</div>
												</div>
												<span className="bg-gradient-to-r from-white to-pink-100 bg-clip-text text-transparent">
													Generating Filing Requirements...
												</span>
											</>
										) : (
											<>
												<div className="relative mr-3 group-hover:scale-110 transition-transform duration-300">
													<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
													</svg>
													<div className="absolute -inset-1 bg-white/30 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
												</div>
												<span className="bg-gradient-to-r from-white to-pink-100 bg-clip-text text-transparent font-extrabold">
													Generate Filing Requirements
												</span>
											</>
										)}
									</span>
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

				{/* Previous Queries Sidebar */}
				{showPreviousQueries && showResults && (
					<aside className="fixed top-0 right-0 h-full w-80 bg-white/95 backdrop-blur-2xl border-l border-white/20 shadow-2xl shadow-pink-500/5 overflow-y-auto z-40 transition-all duration-500 ease-in-out">
						{/* Decorative gradient overlay */}
						<div className="absolute inset-0 bg-gradient-to-bl from-pink-500/5 via-transparent to-purple-500/5 pointer-events-none" />
						
						<div className="relative z-10 p-6 space-y-6">
							{/* Header */}
							<div className="flex items-center justify-between">
								<h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-pink-800 bg-clip-text text-transparent">
									Previous Queries
								</h3>
								<button
									onClick={() => setShowPreviousQueries(false)}
									className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
								>
									<svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
							
							{/* Previous Queries List */}
							<div className="space-y-3">
								{previousQueries.length === 0 ? (
									<p className="text-sm text-gray-500 text-center py-8">
										No previous queries yet
									</p>
								) : (
									previousQueries.map((query) => (
										<div
											key={query.id}
											onClick={() => loadPreviousQuery(query)}
											className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40 shadow-sm hover:shadow-md hover:bg-white/80 cursor-pointer transition-all duration-200 group"
										>
											<div className="flex items-start justify-between mb-2">
												<h4 className="text-sm font-semibold text-gray-900 group-hover:text-pink-600 transition-colors duration-200 line-clamp-2">
													{query.formData.documentType}
												</h4>
												<div className="text-xs text-gray-400 ml-2 flex-shrink-0">
													{query.timestamp.toLocaleDateString()}
												</div>
											</div>
											<div className="space-y-1 text-xs text-gray-600">
												<div className="flex items-center">
													<svg className="w-3 h-3 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
													</svg>
													<span className="truncate">{query.formData.judge}</span>
												</div>
												<div className="flex items-center">
													<svg className="w-3 h-3 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
													</svg>
													<span className="truncate">{query.formData.county}</span>
												</div>
												{query.formData.department && (
													<div className="flex items-center">
														<svg className="w-3 h-3 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
														</svg>
														<span className="truncate">{query.formData.department}</span>
													</div>
												)}
											</div>
											<div className="mt-3 flex items-center justify-between">
												<span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-pink-100 text-pink-700">
													{query.results.documents.length} docs
												</span>
												<svg className="w-4 h-4 text-gray-400 group-hover:text-pink-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
												</svg>
											</div>
										</div>
									))
								)}
							</div>
						</div>
					</aside>
				)}

				{/* Main Content */}
				<main className={`ml-auto w-full max-w-none min-h-screen bg-gradient-to-br from-white via-gray-50/50 to-pink-50/20 transition-all duration-700 ease-in-out ${
					showResults 
						? showPreviousQueries ? 'pl-0 pr-80' : 'pl-0' 
						: 'pl-[32rem]'
				}`}>
					{/* Decorative background elements */}
					<div className="absolute inset-0 overflow-hidden pointer-events-none">
						<div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-full blur-3xl" />
						<div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-full blur-3xl" />
					</div>
					
					<div className="relative z-10 p-8">
						{showResults && searchResults ? (
							<div className="space-y-8">
								{/* Header */}
								<div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-2xl shadow-pink-500/5 relative overflow-hidden">
									{/* Decorative gradient */}
									<div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500" />
									
									<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
										<div className="space-y-2">
											<h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-pink-800 bg-clip-text text-transparent tracking-tight">
												Filing Requirements Report
											</h1>
											<p className="text-gray-600 text-lg font-medium">
												For {formData.documentType} before Judge{" "}
												<span className="text-pink-600 font-semibold">{formData.judge}</span>, {formData.department}
											</p>
											<div className="flex items-center space-x-4 text-sm text-gray-500">
												<span className="flex items-center">
													<svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
													</svg>
													{formData.division}, {formData.county}, {formData.state}
												</span>
												<span className="flex items-center">
													<svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
													</svg>
													Generated {new Date().toLocaleDateString()}
												</span>
											</div>
										</div>
										<div className="flex flex-col sm:flex-row gap-3">
											<button
												onClick={handleDownloadPDF}
												disabled={loading}
												className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 disabled:from-pink-300 disabled:to-pink-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl flex items-center transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													width="20"
													height="20"
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
												{loading ? "Generating PDF..." : "Download PDF"}
											</button>
											{previousQueries.length > 0 && (
												<button
													onClick={() => setShowPreviousQueries(!showPreviousQueries)}
													className={`${
														showPreviousQueries 
															? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white' 
															: 'bg-white/80 backdrop-blur-sm hover:bg-white border border-gray-200 hover:border-gray-300 text-gray-700'
													} font-bold py-3 px-6 rounded-xl flex items-center transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105`}
												>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														width="20"
														height="20"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														strokeWidth="2.5"
														strokeLinecap="round"
														strokeLinejoin="round"
														className="mr-2"
													>
														<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
														<polyline points="9,22 9,12 15,12 15,22" />
													</svg>
													{showPreviousQueries ? 'Hide History' : `History (${previousQueries.length})`}
												</button>
											)}
											<button
												onClick={handleNewSearch}
												className="bg-white/80 backdrop-blur-sm hover:bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-bold py-3 px-6 rounded-xl flex items-center transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													width="20"
													height="20"
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
								</div>

								{/* Hidden content for PDF generation */}
								<div ref={pdfContentRef} style={{ display: "none" }}>
									{/* PDF content will be generated programmatically */}
								</div>

								{/* Tabs */}
								<div className="bg-white/60 backdrop-blur-xl rounded-3xl p-2 border border-white/50 shadow-xl shadow-pink-500/5">
									<nav className="flex space-x-2" aria-label="Tabs">
										{[
											"Checklist",
											"Procedural Roadmap",
											"Mandatory Docs",
											"Conditional Docs",
											"Governing Rules",
											".docx Shell",
										].map((tab) => (
											<button
												key={tab}
												onClick={() => setActiveTab(tab)}
												className={`relative flex-1 py-3 px-4 text-sm font-bold rounded-2xl transition-all duration-300 ${
													activeTab === tab
														? "bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/25 scale-105"
														: "text-gray-600 hover:text-gray-800 hover:bg-white/50 hover:shadow-md"
												}`}
											>
												<span className="relative z-10">{tab}</span>
												{activeTab === tab && (
													<div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 rounded-2xl" />
												)}
											</button>
										))}
									</nav>
								</div>

								{/* Tab Content */}
								<div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/50 shadow-xl shadow-pink-500/5 overflow-hidden">
									{activeTab === "Checklist" && (
										<section className="p-8">
											<h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-pink-800 bg-clip-text text-transparent pb-4 mb-8 border-b border-gray-200/50 flex items-center">
												<div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
													<svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
													</svg>
												</div>
												Filing Checklist
											</h2>
											<div className="space-y-10">
												{Object.entries(checklistByPhase || {}).map(
													([phase, items]) => (
														<div key={phase} className="bg-gradient-to-br from-white/80 to-gray-50/50 rounded-2xl p-6 border border-white/60 shadow-lg">
															<h3 className="text-xl font-bold text-pink-700 mb-6 flex items-center">
																<div className="w-6 h-6 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center mr-3">
																	<div className="w-2 h-2 bg-white rounded-full" />
																</div>
																{phase}
															</h3>
															<div className="overflow-hidden rounded-xl border border-gray-200/50 shadow-sm">
																<table className="min-w-full bg-white/80 backdrop-blur-sm">
																	<thead className="bg-gradient-to-r from-gray-50 to-pink-50/50">
																		<tr>
																			<th className="w-12 px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
																				Done
																			</th>
																			<th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
																				Task
																			</th>
																			<th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
																				Notes
																			</th>
																			<th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
																				Rule Reference
																			</th>
																		</tr>
																	</thead>
																	<tbody className="divide-y divide-gray-200/50">
																		{items.map((item, index) => (
																			<tr
																				key={`${item.task}-${index}`}
																				className="hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-purple-50/50 transition-all duration-200"
																			>
																				<td className="px-6 py-5 whitespace-nowrap">
																					<input
																						type="checkbox"
																						id={`${phase}-${index}`}
																						className="h-5 w-5 rounded-lg border-gray-300 text-pink-600 focus:ring-pink-500 shadow-sm"
																					/>
																				</td>
																				<td className="px-6 py-5">
																					<div className="text-sm font-semibold text-gray-900">
																						{item.task}
																					</div>
																				</td>
																				<td className="px-6 py-5">
																					<div className="text-sm text-gray-600 leading-relaxed">
																						{item.notes}
																					</div>
																				</td>
																				<td className="px-6 py-5">
																					{item.link ? (
																						<a
																							href={item.link}
																							target="_blank"
																							rel="noopener noreferrer"
																							className="text-sm text-pink-600 hover:text-pink-800 hover:underline flex items-center font-medium transition-colors duration-200"
																						>
																							{item.rule}
																							<svg
																								className="w-3 h-3 ml-2 flex-shrink-0"
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
																						<span className="text-sm text-gray-500 font-medium">
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

									{activeTab === "Procedural Roadmap" && (
										<section className="p-8">
											<h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-pink-800 bg-clip-text text-transparent pb-4 mb-8 border-b border-gray-200/50 flex items-center">
												<div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
													<svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
													</svg>
												</div>
												Procedural Roadmap
											</h2>
											{proceduralRoadmapData ? (
												<div className="space-y-8">
													{/* Document Info Header */}
													<div className="bg-gradient-to-br from-pink-50/80 to-purple-50/60 rounded-2xl p-6 border border-pink-200/50 shadow-lg">
														<h3 className="text-xl font-bold text-pink-700 mb-2">{proceduralRoadmapData.documentType}</h3>
														<p className="text-gray-600 font-medium">{proceduralRoadmapData.jurisdiction}</p>
													</div>

													{/* Timeline Steps */}
													<div className="relative">
														{/* Vertical Timeline Line */}
														<div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-pink-300 to-purple-300"></div>
														
														<div className="space-y-8">
															{proceduralRoadmapData.phases.map((phase, index) => (
																<div key={phase.id} className="relative flex items-start">
																	{/* Timeline Circle */}
																	<div className="relative z-10 flex-shrink-0">
																		<div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
																			<span className="text-white font-bold text-lg">{index + 1}</span>
																		</div>
																	</div>
																	
																	{/* Content Card */}
																	<div className="ml-8 flex-grow">
																		<div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
																			<div className="flex items-start justify-between mb-4">
																				<div>
																					<h4 className="text-xl font-bold text-gray-900 mb-2">{phase.title}</h4>
																					<p className="text-gray-600 leading-relaxed">{phase.description}</p>
																				</div>
																				<div className="ml-4 flex-shrink-0">
																					<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-700 border border-pink-200">
																						<svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
																						</svg>
																						{phase.deadline}
																					</span>
																				</div>
																			</div>
																			
																			{/* Requirements List */}
																			<div className="mb-6">
																				<h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Requirements:</h5>
																				<ul className="space-y-2">
																					{phase.requirements.map((requirement, reqIndex) => (
																						<li key={reqIndex} className="flex items-start">
																							<div className="w-2 h-2 bg-pink-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
																							<span className="text-gray-700 text-sm leading-relaxed">{requirement}</span>
																						</li>
																					))}
																				</ul>
																			</div>
																			
																			{/* Rule Reference */}
																			<div className="pt-4 border-t border-gray-200/50">
																				<div className="flex items-center">
																					<svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
																					</svg>
																					{phase.ruleLink ? (
																						<a 
																							href={phase.ruleLink} 
																							target="_blank"
																							rel="noopener noreferrer"
																							className="text-sm text-pink-600 hover:text-pink-800 hover:underline font-medium flex items-center"
																						>
																							{phase.ruleReference}
																							<svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
																							</svg>
																						</a>
																					) : (
																						<span className="text-sm text-gray-500 font-medium">{phase.ruleReference}</span>
																					)}
																				</div>
																			</div>
																		</div>
																	</div>
																</div>
															))}
														</div>
													</div>
												</div>
											) : (
												<div className="flex items-center justify-center h-64 text-gray-500">
													<div className="text-center">
														<svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
														</svg>
														<p>Loading procedural roadmap...</p>
													</div>
												</div>
											)}
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
														{searchResults.documents.map((doc) => (
															<tr
																key={doc.item}
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
														{searchResults.conditional.map((doc) => (
															<tr
																key={doc.item}
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
							<div className="flex flex-col items-center justify-center h-[calc(100vh-6rem)] text-center px-8">
								<div className="bg-white/60 backdrop-blur-xl rounded-3xl p-12 border border-white/50 shadow-xl shadow-pink-500/5 max-w-2xl">
									<div className="relative mb-8">
										<div className="absolute -inset-4 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full blur-2xl" />
										<div className="relative bg-gradient-to-br from-pink-500 to-pink-600 p-4 rounded-2xl shadow-lg">
											<svg
												width="48"
												height="48"
												viewBox="0 0 24 24"
												fill="none"
												xmlns="http://www.w3.org/2000/svg"
												className="text-white"
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
										</div>
									</div>

									<h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-pink-800 bg-clip-text text-transparent mb-4">
										Your Filing Requirements Report Will Appear Here
									</h2>
									<p className="text-gray-600 text-lg leading-relaxed">
										Complete the search parameters to generate your comprehensive filing requirements report, procedural checklist, and mind map visualization.
									</p>
									
									<div className="mt-8 flex items-center justify-center space-x-2 text-sm text-gray-500">
										<div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" />
										<span>Ready to generate your legal filing guide</span>
									</div>
								</div>
							</div>
						)}
					</div>
				</main>
			</div>
		</div>
	);
}

