"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { getApiUrl } from "@/lib/config";
import { downloadDocument } from "@/lib/documentDownload";
import jsPDF from "jspdf";
import IngridLogo from "../Ingridlogo";
import AutoSuggestInput from "./_components/AutoSuggestInput";

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
							Ingrid Demo
						</h1>
						<p className="text-gray-600 font-medium">
							Enter password to access the demo platform
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
											Access Demo
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

// Types (Judge interface removed as it's not used)

interface Document {
	item: string;
	rule: string;
	link: string;
	fullRuleText?: string;
	detailedFormatRequirements?: any;
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
	judge: string;
	department: string;
	flowchartSteps: {
		id: string;
		title: string;
		description: string;
		requirements: string[];
		deadline: string;
		ruleReference: string;
		ruleLink?: string;
		nextSteps: string[];
		stepType: "single" | "branching" | "decision";
		branchOptions?: {
			condition: string;
			nextStepId: string;
			description: string;
		}[];
	}[];
	keyDeadlines: {
		event: string;
		timing: string;
		rule: string;
		consequences: string;
	}[];
	judgeSpecificNotes: {
		category: string;
		note: string;
		source: string;
	}[];
}

interface SearchResults {
	documents: Document[];
	conditional: Document[];
	rules: Rule[];
	checklist: ChecklistItem[];
	proceduralRoadmap?: ProceduralRoadmapData;
	dataSource?: string;
	isKnowledgeGraphData?: boolean;
	source?: string;
	county?: string;
	last_updated?: string;
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
	const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
	const [showResults, setShowResults] = useState<boolean>(false);
	const typingElRef = useRef<HTMLSpanElement | null>(null);
	const tabContentRef = useRef<HTMLDivElement | null>(null);
	const [checkedCount, setCheckedCount] = useState<number>(0);
	const [totalCount, setTotalCount] = useState<number>(0);
	const [activeTab, setActiveTab] = useState<string>("Checklist");
	const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
	const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
	const [checklistCompletionTimes, setChecklistCompletionTimes] = useState<Map<string, Date>>(new Map());

	// Typing indicator text near the pink icon
	useEffect(() => {
		let mounted = true;
		const phrases = [
			"Ingrid has got you covered",
			"Any State",
			"Any County",
			"Any Court",
			"Any Judge",
			"Any Document",
		];
		const initialIndex = phrases.findIndex((p) => p.toLowerCase().startsWith("ingrid"));
		let phraseIndex = initialIndex >= 0 ? initialIndex : 0;
		let charIndex = 0;
		let direction: 'forward' | 'back' = 'forward';
		let timeout: number | undefined;

		const tick = () => {
			if (!mounted) return;
			const target = typingElRef.current;
			if (!target) {
				timeout = window.setTimeout(tick, 200);
				return;
			}
			const current = phrases[phraseIndex];
			if (direction === 'forward') {
				charIndex++;
				if (charIndex >= current.length) {
					direction = 'back';
					timeout = window.setTimeout(tick, 1200); // pause at full
					target.textContent = current;
					return;
				}
			} else {
				charIndex--;
				if (charIndex <= 0) {
					direction = 'forward';
					phraseIndex = (phraseIndex + 1) % phrases.length;
					timeout = window.setTimeout(tick, 300); // pause at empty
					target.textContent = '';
					return;
				}
			}
			target.textContent = current.slice(0, Math.max(0, Math.min(current.length, charIndex)));
			timeout = window.setTimeout(tick, direction === 'forward' ? 55 : 38);
		};

		timeout = window.setTimeout(tick, 600);
		return () => {
			mounted = false;
			if (timeout) window.clearTimeout(timeout);
		};
	}, []);

	// Compute checklist progress - only track Checklist tab checkboxes
	useEffect(() => {
		const handleChange = (e: Event) => {
			const target = e.target as HTMLInputElement;
			if (target.type === 'checkbox' && target.id) {
				setCheckedItems((prev) => {
					const next = new Set(prev);
					if (target.checked) {
						next.add(target.id);
						// Record completion timestamp
						setChecklistCompletionTimes((prevTimes) => {
							const newTimes = new Map(prevTimes);
							newTimes.set(target.id, new Date());
							return newTimes;
						});
					} else {
						next.delete(target.id);
						// Remove timestamp when unchecked
						setChecklistCompletionTimes((prevTimes) => {
							const newTimes = new Map(prevTimes);
							newTimes.delete(target.id);
							return newTimes;
						});
					}
					return next;
				});
			}
		};

		const container = tabContentRef.current;
		if (!container) return;

		// Restore checked state from memory whenever tab content renders
		const inputs = Array.from(
			container.querySelectorAll('input[type="checkbox"]')
		) as HTMLInputElement[];
		inputs.forEach((input) => {
			if (input.id && checkedItems.has(input.id)) {
				input.checked = true;
			}
		});

		// React to checkbox changes
		container.addEventListener('change', handleChange, true);

		// React to DOM updates when tab content changes
		const observer = new MutationObserver(() => {
			// Restore checked state after DOM updates
			const inputs = Array.from(
				container.querySelectorAll('input[type="checkbox"]')
			) as HTMLInputElement[];
			inputs.forEach((input) => {
				if (input.id && checkedItems.has(input.id)) {
					input.checked = true;
				}
			});
		});
		observer.observe(container, { childList: true, subtree: true });

		return () => {
			container.removeEventListener('change', handleChange, true);
			observer.disconnect();
		};
	}, [activeTab, searchResults, checkedItems]);

	// Compute total and checked counts from checklist data (not from DOM)
	useEffect(() => {
		if (!searchResults?.checklist) {
			setCheckedCount(0);
			setTotalCount(0);
			return;
		}

		// Group by phase first (same as checklistByPhase)
		const byPhase = searchResults.checklist.reduce<Record<string, any[]>>(
			(acc, item) => {
				if (!acc[item.phase]) acc[item.phase] = [];
				acc[item.phase].push(item);
				return acc;
			},
			{}
		);

		let total = 0;
		let checked = 0;

		// Iterate through phases and items, matching the rendering logic
		Object.entries(byPhase).forEach(([phase, items]) => {
			items.forEach((item, index) => {
				total++;
				const itemId = `${phase}-${index}`;
				if (checkedItems.has(itemId)) {
					checked++;
				}
			});
		});

		setCheckedCount(checked);
		setTotalCount(total);
	}, [searchResults, checkedItems]);

	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [progress, setProgress] = useState(0);
	const pdfContentRef = useRef<HTMLDivElement>(null);
	// const [proceduralRoadmapData, setProceduralRoadmapData] = useState<ProceduralRoadmapData | null>(null);
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
	// Add state to track current report date
	const [currentReportDate, setCurrentReportDate] = useState<Date | null>(null);
	const [downloadLoading, setDownloadLoading] = useState(false);

	// Check authentication on component mount
	useEffect(() => {
		const authenticated = localStorage.getItem("ingrid_authenticated");
		if (authenticated === "true") {
			setIsAuthenticated(true);
		}
	}, []);

	// Load previous queries from localStorage on component mount
	useEffect(() => {
		if (!isAuthenticated) return; // Only run if authenticated
		
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
	}, [isAuthenticated]);

	// Save previous queries to localStorage whenever they change
	useEffect(() => {
		if (!isAuthenticated) return; // Only run if authenticated
		
		try {
			localStorage.setItem('ingrid-previous-queries', JSON.stringify(previousQueries));
		} catch (error) {
			console.error('Error saving previous queries:', error);
		}
	}, [previousQueries, isAuthenticated]);

	// Add progress timer effect
	useEffect(() => {
		if (!isAuthenticated) return; // Only run if authenticated
		
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
	}, [loading, isAuthenticated]);

	// Handle password correct
	const handlePasswordCorrect = () => {
		setIsAuthenticated(true);
	};

	// Handle document download
	const handleDownloadDocument = async () => {
		if (!formData.state || !formData.county || !formData.division || !formData.judge || !formData.documentType) {
			alert('Please fill in all form fields before downloading');
			return;
		}

		setDownloadLoading(true);
		try {
			await downloadDocument(formData);
		} catch (error) {
			console.error('Download failed:', error);
			alert('Failed to download document. Please try again.');
		} finally {
			setDownloadLoading(false);
		}
	};

	// If not authenticated, show password protection
	if (!isAuthenticated) {
		return <PasswordProtection onPasswordCorrect={handlePasswordCorrect} />;
	}

	// Helper function to parse document items and separate title from requirements
	const parseDocumentItem = (item: string) => {
		// Look for patterns like "Document Name - Requirements" or "Document Name - Must include:"
		const separatorMatch = item.match(/^([^-]+)\s*-\s*(.+)$/);
		if (separatorMatch) {
			return {
				title: separatorMatch[1].trim(),
				requirements: separatorMatch[2].trim()
			};
		}
		// If no separator found, treat the whole thing as title
		return {
			title: item.trim(),
			requirements: ""
		};
	};

	// Helper function to convert requirements text to bullet points
	const formatRequirements = (requirements: string) => {
		if (!requirements) return [];
		
		// Split by periods followed by a space and capital letter or common starting words
		// But avoid splitting within parenthetical citations
		const bullets = requirements
			.split(/\.\s+(?=[A-Z][a-z]|Must|Required|Format|Page|Generally|Each|Copies|Filing|Service|Proof)(?![^(]*\))/)
			.map(bullet => bullet.trim())
			.filter(bullet => bullet.length > 0)
			.map(bullet => {
				// Clean up the bullet point
				bullet = bullet.replace(/\.$/, ''); // Remove trailing period only
				return bullet.trim();
			})
			.filter(bullet => bullet.length > 15); // Increase minimum length to avoid short fragments

		// If we couldn't split it meaningfully or got too many fragments, return the original as a single bullet
		if (bullets.length === 1 || bullets.length > 4) {
			return [requirements.trim()];
		}
		
		return bullets;
	};

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
		const generationDate = new Date();
		
		const newQuery: PreviousQuery = {
			id: queryId,
			formData: { ...formData },
			results,
			timestamp: generationDate,
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
		// Set current report date for new queries
		setCurrentReportDate(generationDate);
	};

	// Function to load a previous query
	const loadPreviousQuery = (query: PreviousQuery) => {
		setFormData(query.formData);
		setSearchResults(query.results);
		setShowResults(true);
		setShowPreviousQueries(false);
		setActiveTab("Checklist");
		// Store the original generation date for proper display
		setCurrentReportDate(query.timestamp);
	};

	// Function to delete a previous query
	const deletePreviousQuery = (queryId: string, e: React.MouseEvent) => {
		e.stopPropagation(); // Prevent triggering the load query action
		const updatedQueries = previousQueries.filter(query => query.id !== queryId);
		setPreviousQueries(updatedQueries);
	};

	// Function to generate mind map data from search results
	/* const generateProceduralRoadmapData = (): ProceduralRoadmapData => {
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
	}; */

	const handleSearch = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		
		// Validate required fields
		if (!formData.state || !formData.county || !formData.division || !formData.judge || !formData.department || !formData.documentType) {
			setError('Please fill in all required fields.');
			return;
		}

		setLoading(true);
		setSearchResults(null);
		// setProceduralRoadmapData(null);
		setActiveTab("Checklist");

		try {
			// First, try to get data from county knowledge graph
			console.log(`Checking for knowledge graph data for ${formData.county} county...`);
			const knowledgeGraphResponse = await fetch(getApiUrl("/api/countyKnowledgeGraph"), {
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

			const knowledgeGraphResult = await knowledgeGraphResponse.json();

			// If knowledge graph data is available, use it
			if (knowledgeGraphResult.success && knowledgeGraphResult.hasKnowledgeGraph && knowledgeGraphResult.data) {
				console.log(`✅ Knowledge graph data found for ${formData.county} county - using local data`);
				const reportGenerationDate = new Date();
				const dataWithSource = {
					...knowledgeGraphResult.data,
					dataSource: 'Knowledge Graph (Local)',
					isKnowledgeGraphData: true
				};
				setSearchResults(dataWithSource);
				setShowResults(true);
				setActiveTab("Checklist");
				setCurrentReportDate(reportGenerationDate);
				saveQuery(formData, dataWithSource);
				return; // Exit early since we have the data
			}

			// If no knowledge graph data, fall back to Gemini API
			console.log(`❌ No knowledge graph data for ${formData.county} county - using Gemini API`);
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
				const reportGenerationDate = new Date();
				const dataWithSource = {
					...result.data,
					dataSource: 'Gemini AI',
					isKnowledgeGraphData: false
				};
				setSearchResults(dataWithSource);
				setShowResults(true);
				setActiveTab("Checklist");
				setCurrentReportDate(reportGenerationDate);
				// Generate procedural roadmap data
				// const generatedProceduralRoadmapData = generateProceduralRoadmapData();
				// setProceduralRoadmapData(generatedProceduralRoadmapData);
				// Save this query to previous queries with the current timestamp
				saveQuery(formData, dataWithSource);
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
		setCurrentReportDate(null);
		setShowPreviousQueries(false);
		// Clear checklist state for new search
		setCheckedItems(new Set());
		setChecklistCompletionTimes(new Map());
		setCheckedCount(0);
		setTotalCount(0);
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
			const pdf = new jsPDF("p", "mm", "letter"); // US Letter 8.5" x 11"
			const pageWidth = pdf.internal.pageSize.getWidth();
			const pageHeight = pdf.internal.pageSize.getHeight();
			const margin = 15;
			const contentWidth = pageWidth - margin * 2; // Safe print area
			let yPosition = margin;

			// Add title
			pdf.setFontSize(26);
			pdf.setFont("helvetica", "bold");
			pdf.text("Filing Requirements Report", margin, yPosition);
			yPosition += 10;

			// Subtitle with document info
			pdf.setFontSize(11);
			pdf.setFont("helvetica", "normal");
			pdf.setTextColor(80);
			const subtitleLines = pdf.splitTextToSize(
				`${formData.documentType} - Judge ${formData.judge}, ${formData.department}`,
				contentWidth
			);
			pdf.text(subtitleLines, margin, yPosition);
			yPosition += subtitleLines.length * 5;

			pdf.setFontSize(10);
			pdf.text(`${formData.division}, ${formData.county}, ${formData.state}`, margin, yPosition);
			yPosition += 12;

			// Reset text color
			pdf.setTextColor(0);

			// Add Filing Checklist section
			pdf.setFontSize(20);
			pdf.setFont("helvetica", "bold");
			pdf.text("Filing Checklist", margin, yPosition);
			yPosition += 10;

			Object.entries(checklistByPhase || {}).forEach(([phase, items]) => {
				// Check if we need a new page for phase header
				if (yPosition > pageHeight - 80) {
					pdf.addPage();
					yPosition = margin;
				}

				// Phase header with background
				pdf.setFillColor(219, 39, 119);
				pdf.rect(margin, yPosition - 5, contentWidth, 8, 'F');
				pdf.setFontSize(13);
				pdf.setFont("helvetica", "bold");
				pdf.setTextColor(255, 255, 255);
				pdf.text(phase, margin + 3, yPosition);
				yPosition += 8;

				// Reset colors
				pdf.setTextColor(0);
				pdf.setFont("helvetica", "normal");

				// Each checklist item as a card
				items.forEach((item, index) => {
					const itemId = `${phase}-${index}`;
					const isChecked = checkedItems.has(itemId);
					const completionTime = checklistCompletionTimes.get(itemId);

					// Prepare all text elements first
					const textWidth = contentWidth - 10; // Account for card padding
					const taskLines = pdf.splitTextToSize(item.task, textWidth);
					const notesLines = pdf.splitTextToSize(item.notes, textWidth);
					const rules = item.rule ? item.rule.split(',').map((r: string) => r.trim()) : [];
					
					// Pre-calculate wrapped rules
					const wrappedRules = rules.map((rule) => pdf.splitTextToSize(`• ${rule}`, textWidth - 8));
					
					// Calculate actual card height with all components
					let estimatedHeight = 6; // Top padding
					estimatedHeight += 7; // Status badge height
					estimatedHeight += taskLines.length * 4.5 + 3; // Task with spacing
					estimatedHeight += notesLines.length * 4 + 3; // Notes with spacing
					if (wrappedRules.length > 0) {
						estimatedHeight += 4; // "RULE REFERENCES:" label
						wrappedRules.forEach((wrapped) => {
							estimatedHeight += wrapped.length * 3.5;
						});
					}
					estimatedHeight += 3; // Bottom padding

					// Check if we need a new page (leave 20mm margin at bottom)
					if (yPosition + estimatedHeight > pageHeight - 20) {
						pdf.addPage();
						yPosition = margin;
					}

					const cardStartY = yPosition;
					
					// Draw card background
					pdf.setFillColor(250, 250, 252);
					pdf.setDrawColor(230, 230, 235);
					pdf.roundedRect(margin, yPosition, contentWidth, estimatedHeight, 2, 2, 'FD');

					yPosition += 6;

					// Status badge or completion info
					if (isChecked && completionTime) {
						const formattedDate = completionTime.toLocaleDateString('en-US', {
							month: 'short',
							day: 'numeric',
							year: 'numeric'
						});
						const formattedTime = completionTime.toLocaleTimeString('en-US', {
							hour: 'numeric',
							minute: '2-digit',
							hour12: true
						});
						
						pdf.setFillColor(34, 197, 94);
						pdf.roundedRect(margin + 3, yPosition - 2, 45, 5, 1, 1, 'F');
						pdf.setFontSize(7);
						pdf.setFont("helvetica", "bold");
						pdf.setTextColor(255, 255, 255);
						pdf.text("✓ COMPLETED", margin + 4.5, yPosition + 1.5);
						
						pdf.setFontSize(7);
						pdf.setFont("helvetica", "normal");
						pdf.setTextColor(34, 197, 94);
						pdf.text(`on ${formattedDate} at ${formattedTime}`, margin + 50, yPosition + 1.5);
						yPosition += 7;
					} else {
						pdf.setDrawColor(200, 200, 200);
						pdf.setFillColor(255, 255, 255);
						pdf.roundedRect(margin + 3, yPosition - 1.5, 4, 4, 0.5, 0.5, 'D');
						pdf.setFontSize(8);
						pdf.setFont("helvetica", "normal");
						pdf.setTextColor(120, 120, 120);
						pdf.text("Not completed", margin + 10, yPosition + 1.5);
						yPosition += 7;
					}

					// Task title
					pdf.setFontSize(10);
					pdf.setFont("helvetica", "bold");
					pdf.setTextColor(30, 30, 30);
					pdf.text(taskLines, margin + 3, yPosition);
					yPosition += taskLines.length * 4.5 + 3;

					// Notes section
					pdf.setFontSize(8.5);
					pdf.setFont("helvetica", "normal");
					pdf.setTextColor(100, 100, 100);
					pdf.text(notesLines, margin + 3, yPosition);
					yPosition += notesLines.length * 4 + 3;

					// Rule references
					if (wrappedRules.length > 0) {
						const links = item.link ? item.link.split(',').map((l: string) => l.trim()) : [];
						
						pdf.setFontSize(7.5);
						pdf.setFont("helvetica", "bold");
						pdf.setTextColor(120, 120, 120);
						pdf.text("RULE REFERENCES:", margin + 3, yPosition);
						yPosition += 4;

						wrappedRules.forEach((wrappedRule, ruleIndex) => {
							const ruleLink = links.length === 1 ? links[0] : (links[ruleIndex] || links[0] || '');
							pdf.setFontSize(8);
							pdf.setFont("helvetica", "normal");
							pdf.setTextColor(219, 39, 119);
							
							if (ruleLink) {
								// Only make first line clickable to avoid link issues
								pdf.textWithLink(wrappedRule[0], margin + 5, yPosition, { url: ruleLink });
								for (let i = 1; i < wrappedRule.length; i++) {
									pdf.text(wrappedRule[i], margin + 5, yPosition + i * 3.5);
								}
							} else {
								pdf.text(wrappedRule, margin + 5, yPosition);
							}
							yPosition += wrappedRule.length * 3.5;
						});
					}

					yPosition = cardStartY + estimatedHeight + 4; // Add spacing between cards
				});

				yPosition += 3;
			});

			// Add new page for documents
			pdf.addPage();
			yPosition = margin;

			// Mandatory Documents section
			pdf.setFontSize(16);
			pdf.setFont("helvetica", "bold");
			pdf.setTextColor(0);
			pdf.text("Mandatory Documents", margin, yPosition);
			yPosition += 10;

			searchResults.documents.forEach((doc) => {
				const textWidth = contentWidth;
				
				// Check if we need a new page
				if (yPosition > pageHeight - 40) {
					pdf.addPage();
					yPosition = margin;
				}

				// Document item as bullet point
				pdf.setFontSize(10);
				pdf.setFont("helvetica", "normal");
				pdf.setTextColor(0);
				const docLines = pdf.splitTextToSize(`• ${doc.item}`, textWidth - 5);
				pdf.text(docLines, margin + 5, yPosition);
				yPosition += docLines.length * 5 + 3;

				// Rule reference
				if (doc.rule) {
					pdf.setFontSize(9);
					pdf.setFont("helvetica", "italic");
					pdf.setTextColor(100);
					const ruleLines = pdf.splitTextToSize(`  Rule: ${doc.rule}`, textWidth - 5);
					pdf.text(ruleLines, margin + 5, yPosition);
					yPosition += ruleLines.length * 4.5 + 5;
				}
			});

			yPosition += 5;

			// Conditional Documents section
			if (yPosition > pageHeight - 50) {
				pdf.addPage();
				yPosition = margin;
			}

			pdf.setFontSize(16);
			pdf.setFont("helvetica", "bold");
			pdf.setTextColor(0);
			pdf.text("Conditional Documents", margin, yPosition);
			yPosition += 10;

			searchResults.conditional.forEach((doc) => {
				const textWidth = contentWidth;
				
				// Check if we need a new page
				if (yPosition > pageHeight - 40) {
					pdf.addPage();
					yPosition = margin;
				}

				// Document item as bullet point
				pdf.setFontSize(10);
				pdf.setFont("helvetica", "normal");
				pdf.setTextColor(0);
				const docLines = pdf.splitTextToSize(`• ${doc.item}`, textWidth - 5);
				pdf.text(docLines, margin + 5, yPosition);
				yPosition += docLines.length * 5 + 3;

				// Rule reference
				if (doc.rule) {
					pdf.setFontSize(9);
					pdf.setFont("helvetica", "italic");
					pdf.setTextColor(100);
					const ruleLines = pdf.splitTextToSize(`  Rule: ${doc.rule}`, textWidth - 5);
					pdf.text(ruleLines, margin + 5, yPosition);
					yPosition += ruleLines.length * 4.5 + 5;
				}
			});

			// Add new page for governing rules
			pdf.addPage();
			yPosition = margin;

			// Governing Rules section
			pdf.setFontSize(16);
			pdf.setFont("helvetica", "bold");
			pdf.setTextColor(0);
			pdf.text("Governing Rules", margin, yPosition);
			yPosition += 10;

			searchResults.rules.forEach((rule) => {
				const textWidth = contentWidth;
				
				// Check if we need a new page
				if (yPosition > pageHeight - 60) {
					pdf.addPage();
					yPosition = margin;
				}

				// Rule name as subheading
				pdf.setFontSize(12);
				pdf.setFont("helvetica", "bold");
				pdf.setTextColor(0);
				const nameLines = pdf.splitTextToSize(rule.name, textWidth);
				pdf.text(nameLines, margin, yPosition);
				yPosition += nameLines.length * 6 + 3;

				// Rule text
				pdf.setFontSize(10);
				pdf.setFont("helvetica", "normal");
				pdf.setTextColor(60);
				const textLines = pdf.splitTextToSize(rule.text, textWidth);
				pdf.text(textLines, margin, yPosition);
				yPosition += textLines.length * 5 + 5;

				// Source link
				if (rule.link) {
					pdf.setFontSize(9);
					pdf.setFont("helvetica", "italic");
					pdf.setTextColor(100);
					pdf.text("Source: Official Rule", margin, yPosition);
					yPosition += 8;
				} else {
					yPosition += 5;
				}
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
			<div className="flex min-h-screen relative" style={{ ['--sidebar-width' as any]: 'clamp(18rem, 30vw, 32rem)' }}>
				{/* Sidebar */}
				<aside className={`fixed top-0 left-0 h-full w-full sm:w-[var(--sidebar-width)] z-30 border-r border-white/20 bg-white/90 backdrop-blur-2xl p-8 overflow-y-auto shadow-2xl shadow-pink-500/5 transition-all duration-700 ease-in-out ${
					showResults 
						? '-translate-x-full opacity-0 pointer-events-none' 
						: 'translate-x-0 opacity-100'
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
									<div className="group relative bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/40 shadow-xl shadow-pink-500/5 transition-all duration-300 hover:shadow-2xl hover:shadow-pink-500/10 overflow-visible animate-fade-in">
								{/* Decorative elements */}
										<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 rounded-t-3xl" />
										<div className="absolute -top-px left-1/2 transform -translate-x-1/2 w-20 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
										{/* Shimmer accent on hover */}
										<div className="absolute top-0 left-0 w-full h-[2px] rounded-t-3xl opacity-0 group-hover:opacity-100 animate-shimmer" />
								
								<div className="relative">
										<h2 className="text-xl font-bold text-gray-900 tracking-tight mb-8 flex items-center animate-fade-in">
											<div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center mr-3 shadow-lg animate-float group-hover:scale-110 transition-transform duration-500">
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

									<div className="relative z-40 grid grid-cols-1 lg:grid-cols-2 gap-6">
									<AutoSuggestInput
										id="state"
										label="State"
										placeholder="e.g., California"
										value={formData.state}
										onChange={(next) => setFormData({ ...formData, state: next })}
										localStorageKey="ingrid_state_recents"
										staticOptions={[
											"California",
											"New York",
											"Texas",
											"Florida",
											"Illinois",
										]}
									/>

									<AutoSuggestInput
										id="county"
										label="County"
										placeholder="e.g., Los Angeles County"
										value={formData.county}
										onChange={(next) => setFormData({ ...formData, county: next })}
										localStorageKey="ingrid_county_recents"
										staticOptions={[
											"Los Angeles County",
											"San Francisco County",
											"Santa Clara County",
											"San Mateo County",
											"Alameda County",
										]}
									/>

									<AutoSuggestInput
										id="division"
										label="Division"
										placeholder="e.g., Civil Division"
										value={formData.division}
										onChange={(next) => setFormData({ ...formData, division: next })}
										localStorageKey="ingrid_division_recents"
										staticOptions={[
											"Civil Division",
											"Complex Civil Litigation",
											"Family Law",
											"Probate",
										]}
									/>

									<AutoSuggestInput
										id="department"
										label="Department"
										placeholder="e.g., Department 1, Dept. A, Room 101"
										value={formData.department}
										onChange={(next) => setFormData({ ...formData, department: next })}
										localStorageKey="ingrid_department_recents"
										staticOptions={[
											"Department 1",
											"Department 2",
											"Dept. A",
											"Room 101",
										]}
									/>

									<div className="lg:col-span-2">
										<AutoSuggestInput
											id="judge"
											label="Judge"
											placeholder="e.g., Hon. Jane Smith"
											value={formData.judge}
											onChange={(next) => setFormData({ ...formData, judge: next })}
											localStorageKey="ingrid_judge_recents"
											staticOptions={[
												"Charles F. Adams",
												"Carol Overton",
												"Panteha E. Saban",
												"Lori E. Pegg",
												"JoAnne McCracken",
												"Julia Alloggiamento",
											]}
											getDynamicOptions={async (q) => {
												// If division provided, prefer API filtering
												try {
													const division = encodeURIComponent(formData.division || "");
													const res = await fetch(`/api/judges?division=${division}`);
													const data = await res.json();
													const names: string[] = (data.judges || []).map((j: any) => j.name);
													return names.filter((n) => n.toLowerCase().includes(q.toLowerCase()));
												} catch {
													return [];
												}
											}}
										/>
									</div>

									<div className="lg:col-span-2">
										<AutoSuggestInput
											id="documentType"
											label="Document Type"
											placeholder="e.g., Motion for Summary Judgment, Complaint, Answer, Discovery Motion"
											value={formData.documentType}
											onChange={(next) => setFormData({ ...formData, documentType: next })}
											localStorageKey="ingrid_document_type_recents"
											staticOptions={[
												"Complaint",
												"Answer",
												"Motion for Summary Judgment",
												"Motion to Dismiss (Demurrer)",
												"Motion to Compel Further Discovery Responses",
												"Motion to Strike",
											]}
										/>
									</div>
									</div>
							</div>
							<div className="relative z-10 pt-8">
								<button
									type="submit"
									disabled={loading}
									className={`w-full relative overflow-hidden group ${
										loading 
											? 'bg-gradient-to-r from-pink-200 to-purple-200' 
											: 'bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 hover:from-pink-600 hover:via-pink-700 hover:to-purple-700 active:translate-y-[1px] shadow-[0_18px_40px_-12px_rgba(236,72,153,0.45),0_12px_24px_-16px_rgba(147,51,234,0.45)] hover:shadow-[0_22px_48px_-12px_rgba(236,72,153,0.55),0_16px_30px_-16px_rgba(147,51,234,0.55)]'
									} disabled:cursor-not-allowed text-white font-extrabold py-5 px-8 rounded-2xl transition-all duration-300 ease-out focus:outline-none focus:ring-4 focus:ring-pink-500/30 border border-white/20`}
								>
									{/* 3D base glow */}
									<div className="absolute -bottom-3 left-6 right-6 h-6 bg-gradient-to-r from-pink-500/40 to-purple-600/40 blur-xl rounded-full pointer-events-none" />
									{/* Animated background effects */}
									<div className="absolute inset-0 bg-gradient-to-r from-white/25 via-transparent to-white/25 -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
									{/* Subtle top gloss */}
									<div className="pointer-events-none absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
									
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
												</div>
												<span className="bg-gradient-to-r from-white to-pink-100 bg-clip-text text-transparent">
													Generating Filing Requirements...
												</span>
											</>
										) : (
											<>
												<div className="relative mr-3 group-hover:scale-125 transition-transform duration-300">
													<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
													</svg>
												</div>
												<span className="bg-gradient-to-r from-white to-pink-100 bg-clip-text text-transparent font-extrabold">
													Generate Filing Requirements
												</span>
											</>
										)}
									</span>
								</button>
									</div>
									{/* Close form card container */}
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

				{/* Previous Queries Sidebar - Shows on main screen when there are previous queries */}
				{!showResults && previousQueries.length > 0 && (
					<aside className="fixed top-0 right-0 h-full w-80 bg-white/95 backdrop-blur-2xl border-l border-white/20 shadow-2xl shadow-pink-500/5 overflow-y-auto z-40 transition-all duration-500 ease-in-out">
						{/* Decorative gradient overlay */}
						<div className="absolute inset-0 bg-gradient-to-bl from-pink-500/5 via-transparent to-purple-500/5 pointer-events-none" />
						
						<div className="relative z-10 p-6 space-y-6">
							{/* Header */}
							<div className="flex items-center justify-between">
								<h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-pink-800 bg-clip-text text-transparent">
									Previous Reports
								</h3>
								<div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
									{previousQueries.length} saved
								</div>
							</div>
							
							<p className="text-sm text-gray-600 leading-relaxed">
								Click any report below to instantly load it without regenerating.
							</p>
							
							{/* Previous Queries List */}
							<div className="space-y-3">
								{previousQueries.map((query) => (
									<div
										key={query.id}
										className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40 shadow-sm hover:shadow-md hover:bg-white/80 transition-all duration-200 group relative"
									>
										{/* Delete button - positioned in top right */}
										<button
											onClick={(e) => deletePreviousQuery(query.id, e)}
											className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
											title="Delete query"
										>
											<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
											</svg>
										</button>

										{/* Clickable content area */}
										<div
											onClick={() => loadPreviousQuery(query)}
											className="cursor-pointer"
										>
											<div className="flex items-start justify-between mb-2 pr-8">
												<h4 className="text-sm font-semibold text-gray-900 group-hover:text-pink-600 transition-colors duration-200 line-clamp-2">
													{query.formData.documentType}
												</h4>
												<div className="text-xs text-blue-600 ml-2 flex-shrink-0 font-medium">
													<svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
													</svg>
													{query.timestamp.toLocaleDateString()}
												</div>
											</div>
											<div className="space-y-1.5 text-xs text-gray-600">
												<div className="flex items-center">
													<svg className="w-3 h-3 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
													</svg>
													<span className="truncate font-medium">{query.formData.judge}</span>
												</div>
												<div className="flex items-center">
													<svg className="w-3 h-3 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
													</svg>
													<span className="truncate">{query.formData.county}, {query.formData.state}</span>
												</div>
												{query.formData.department && (
													<div className="flex items-center">
														<svg className="w-3 h-3 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
														</svg>
														<span className="truncate">{query.formData.department}</span>
													</div>
												)}
												<div className="flex items-center text-green-600">
													<svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
													</svg>
													<span className="text-xs font-medium">Click to load instantly</span>
												</div>
											</div>
											<div className="mt-3 flex items-center justify-between">
												<div className="flex space-x-2">
													<span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-pink-100 text-pink-700 font-medium">
														{query.results.documents.length} docs
													</span>
													<span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 font-medium">
														{query.results.checklist.length} tasks
													</span>
												</div>
												<svg className="w-4 h-4 text-gray-400 group-hover:text-pink-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
												</svg>
											</div>
										</div>

										{/* Interaction tip */}
										<div className="mt-2 text-xs text-gray-600 flex items-center">
											<div className="inline-flex items-center px-2 py-1 rounded-md bg-white/70 backdrop-blur-sm border border-gray-200 shadow-sm">
												<svg className="w-3.5 h-3.5 text-pink-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
												</svg>
												<span className="font-medium">Tip:</span>
												<span className="ml-1">Start typing and press</span>
												<kbd className="ml-1 px-1.5 py-0.5 rounded border border-gray-300 bg-white shadow-xs">Tab</kbd>
												<span className="ml-1">to accept a suggestion</span>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					</aside>
				)}

				{/* Previous Queries Sidebar - Shows when viewing reports */}
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
									<div className="text-center py-8">
										<div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
											<svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
											</svg>
											<p className="text-sm text-gray-500 mb-2 font-medium">No previous reports yet</p>
											<p className="text-xs text-gray-400 leading-relaxed">
												Generate your first report and it will appear here for easy access without needing to regenerate.
											</p>
										</div>
									</div>
								) : (
									previousQueries.map((query) => (
										<div
											key={query.id}
											className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40 shadow-sm hover:shadow-md hover:bg-white/80 transition-all duration-200 group relative"
										>
											{/* Delete button - positioned in top right */}
											<button
												onClick={(e) => deletePreviousQuery(query.id, e)}
												className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
												title="Delete query"
											>
												<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
												</svg>
											</button>

											{/* Clickable content area */}
											<div
												onClick={() => loadPreviousQuery(query)}
												className="cursor-pointer"
											>
												<div className="flex items-start justify-between mb-2 pr-8">
													<h4 className="text-sm font-semibold text-gray-900 group-hover:text-pink-600 transition-colors duration-200 line-clamp-2">
														{query.formData.documentType}
													</h4>
													<div className="text-xs text-blue-600 ml-2 flex-shrink-0 font-medium">
														<svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
														</svg>
														{query.timestamp.toLocaleDateString()}
													</div>
												</div>
												<div className="space-y-1.5 text-xs text-gray-600">
													<div className="flex items-center">
														<svg className="w-3 h-3 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
														</svg>
														<span className="truncate font-medium">{query.formData.judge}</span>
													</div>
													<div className="flex items-center">
														<svg className="w-3 h-3 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
														</svg>
														<span className="truncate">{query.formData.county}, {query.formData.state}</span>
													</div>
													{query.formData.department && (
														<div className="flex items-center">
															<svg className="w-3 h-3 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
															</svg>
															<span className="truncate">{query.formData.department}</span>
														</div>
													)}
													<div className="flex items-center text-green-600">
														<svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
														</svg>
														<span className="text-xs font-medium">Report ready - Click to load</span>
													</div>
												</div>
												<div className="mt-3 flex items-center justify-between">
													<div className="flex space-x-2">
														<span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-pink-100 text-pink-700 font-medium">
															{query.results.documents.length} docs
														</span>
														<span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 font-medium">
															{query.results.checklist.length} tasks
														</span>
													</div>
													<svg className="w-4 h-4 text-gray-400 group-hover:text-pink-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
													</svg>
												</div>
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
						? (showPreviousQueries ? 'pl-0 sm:pr-80' : 'pl-0') 
						: (previousQueries.length > 0 ? 'pl-0 sm:pl-[var(--sidebar-width)] sm:pr-80' : 'pl-0 sm:pl-[var(--sidebar-width)]')
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
											<div className="flex items-center space-x-3">
												<h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-pink-800 bg-clip-text text-transparent tracking-tight">
													Filing Requirements Report
												</h1>
												{currentReportDate && currentReportDate.toDateString() !== new Date().toDateString() && (
													<span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700 font-medium border border-blue-200">
														<svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
														</svg>
														From History
													</span>
												)}
											</div>
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
													Report generated on {currentReportDate ? currentReportDate.toLocaleDateString() : new Date().toLocaleDateString()}
												</span>
												{/* Data source indicator */}
												{searchResults && (
													<span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
														searchResults.isKnowledgeGraphData 
															? 'bg-green-100 text-green-800 border border-green-200' 
															: 'bg-blue-100 text-blue-800 border border-blue-200'
													}`}>
														{searchResults.isKnowledgeGraphData ? (
															<>
																<svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																	<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
																</svg>
																Knowledge Graph Data
															</>
														) : (
															<>
																<svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																	<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
																</svg>
																AI Generated
															</>
														)}
													</span>
												)}
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
											<button
												onClick={() => setShowPreviousQueries(!showPreviousQueries)}
												disabled={previousQueries.length === 0}
												className={`${
													showPreviousQueries 
														? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white' 
														: previousQueries.length > 0
															? 'bg-white/80 backdrop-blur-sm hover:bg-white border border-gray-200 hover:border-gray-300 text-gray-700'
															: 'bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-200'
												} font-bold py-3 px-6 rounded-xl flex items-center transition-all duration-300 shadow-lg hover:shadow-xl ${previousQueries.length > 0 ? 'hover:scale-105' : ''}`}
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
												{previousQueries.length === 0 
													? 'No History' 
													: showPreviousQueries 
														? 'Hide History' 
														: `History (${previousQueries.length})`
												}
											</button>
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
											"Mandatory Docs",
											"Conditional Docs",
											"Governing Rules",
											".docx Shell",
											"Procedural Roadmap",
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

								{/* Progress indicator - Always visible when report is generated */}
								{searchResults && (
									<div className="bg-white/60 backdrop-blur-xl rounded-3xl p-4 border border-white/50 shadow-xl shadow-pink-500/5 mt-4">
										<div className="flex items-center gap-4">
											<div className="flex-1 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-inner p-3 transition-all duration-500">
												<div className="flex items-center justify-between mb-2">
													<div className="flex items-center text-sm font-bold text-gray-700">
														<svg className="w-4 h-4 mr-2 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
														</svg>
														<span>Checklist Progress</span>
													</div>
													<div className="text-xs text-gray-600">
														{totalCount > 0 ? `${checkedCount}/${totalCount} completed` : 'No items'}
													</div>
												</div>
												<div className="h-3 w-full bg-gray-200/60 rounded-xl overflow-hidden">
													<div
														className="h-full bg-gradient-to-r from-pink-500 to-pink-600 transition-all duration-500"
														style={{ width: totalCount > 0 ? `${Math.round((checkedCount / totalCount) * 100)}%` : '0%' }}
													/>
												</div>
											</div>
											
											{/* Share button - appears when 100% complete */}
											{totalCount > 0 && checkedCount === totalCount && (
												<button
													onClick={() => {
														// TODO: Add share functionality
														console.log('Share clicked');
													}}
													className="group relative overflow-hidden bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2 animate-fade-in"
												>
													{/* Shimmer effect */}
													<div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20 -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
													
													<svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
													</svg>
													<span className="relative z-10">Share</span>
												</button>
											)}
										</div>
									</div>
								)}

								{/* Tab Content */}
								<div ref={tabContentRef} className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/50 shadow-xl shadow-pink-500/5 overflow-hidden">
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
											{checklistByPhase && Object.keys(checklistByPhase).length > 0 ? (
												<div className="space-y-10">
													{Object.entries(checklistByPhase).map(
														([phase, items]) => (
															<div key={phase} className="bg-gradient-to-br from-white/80 to-gray-50/50 rounded-2xl p-6 border border-white/60 shadow-lg">
																<h3 className="text-xl font-bold text-pink-700 mb-6 flex items-center">
																	<div className="w-6 h-6 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center mr-3">
																		<div className="w-2 h-2 bg-white rounded-full" />
																	</div>
																	{phase}
																</h3>
																<div className="overflow-hidden rounded-xl border border-gray-200/50 shadow-sm">
																	{items.map((item, index) => {
																		// Parse multiple rules and links separated by commas
																		const rules = item.rule ? item.rule.split(',').map((r: string) => r.trim()) : [];
																		const links = item.link ? item.link.split(',').map((l: string) => l.trim()) : [];
																		
																		// If there's only one link for multiple rules, use it for all
																		// Otherwise, pair each rule with its corresponding link
																		const ruleLinkPairs = rules.map((rule, idx) => ({
																			rule,
																			link: links.length === 1 ? links[0] : (links[idx] || links[0] || '')
																		}));
																		
																		return (
																			<div
																				key={`${item.task}-${index}`}
																				className="group relative bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/50 shadow-lg hover:shadow-xl hover:border-pink-200/50 transition-all duration-300 mb-4"
																			>
																				<div className="flex gap-6">
																					{/* Main Content */}
																					<div className="flex-1">
																						{/* Checkbox and Task Header */}
																						<div className="flex items-start gap-4 mb-4">
																							<div className="flex-shrink-0 pt-1">
																								<input
																									type="checkbox"
																									id={`${phase}-${index}`}
																									className="h-6 w-6 rounded-lg border-gray-300 text-pink-600 focus:ring-pink-500 shadow-sm cursor-pointer transition-transform hover:scale-110"
																								/>
																							</div>
																							<div className="flex-1">
																								<h4 className="text-base font-bold text-gray-900 group-hover:text-pink-700 transition-colors duration-200">
																									{item.task}
																								</h4>
																							</div>
																						</div>
																						
																						{/* Notes Section */}
																						<div className="ml-10 bg-gradient-to-br from-gray-50/80 to-white/80 rounded-xl p-4 border border-gray-200/50">
																							<div className="flex items-center mb-2">
																								<svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
																								</svg>
																								<span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Notes</span>
																							</div>
																							<div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
																								{item.notes}
																							</div>
																						</div>
																					</div>
																					
																					{/* Rule References Sidebar */}
																					<div className="w-64 flex-shrink-0">
																						<div className="sticky top-4 bg-gradient-to-br from-pink-50/80 to-purple-50/80 backdrop-blur-sm rounded-xl p-4 border border-pink-200/50">
																							<div className="flex items-center mb-3">
																								<svg className="w-4 h-4 text-pink-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
																								</svg>
																								<span className="text-xs font-bold text-pink-900 uppercase tracking-wider">Rule References</span>
																							</div>
																							<div className="space-y-2">
																								{ruleLinkPairs.map((pair, ruleIndex) => (
																									pair.link ? (
																										<a
																											key={ruleIndex}
																											href={pair.link}
																											target="_blank"
																											rel="noopener noreferrer"
																											className="group/link flex items-start text-xs text-pink-700 hover:text-pink-900 font-medium transition-colors duration-200 py-1.5 px-2 rounded-lg hover:bg-white/60"
																										>
																											<svg
																												className="w-3 h-3 mt-0.5 mr-1.5 flex-shrink-0 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform duration-200"
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
																											<span className="underline decoration-pink-300 group-hover/link:decoration-pink-600 leading-tight">{pair.rule}</span>
																										</a>
																									) : (
																										<div key={ruleIndex} className="text-xs text-gray-700 font-medium py-1.5 px-2 leading-tight">
																											{pair.rule}
																										</div>
																									)
																								))}
																							</div>
																						</div>
																					</div>
																				</div>
																			</div>
																		);
																	})}
																</div>
															</div>
														)
													)}
												</div>
											) : (
												<div className="text-center py-12">
													<div className="text-gray-500 text-lg mb-4">No checklist data available</div>
													<p className="text-gray-400">The checklist will appear here once you generate a report.</p>
												</div>
											)}
										</section>
									)}

									{activeTab === "Mandatory Docs" && (
										<section className="p-8">
											<h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-pink-800 bg-clip-text text-transparent pb-4 mb-8 border-b border-gray-200/50 flex items-center">
												<div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
													<svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
													</svg>
												</div>
												Mandatory Documents
											</h2>
											<div className="mb-6">
												<h3 className="text-lg font-semibold text-gray-600">
													Document Type: {formData.documentType || 'Not specified'}
												</h3>
											</div>
											{searchResults?.documents && searchResults.documents.length > 0 ? (
												<div className="space-y-6">
													{searchResults.documents.map((doc, docIndex) => {
														const parsed = parseDocumentItem(doc.item);
														return (
															<div key={`${doc.item}-${docIndex}`} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
																{/* Document Header */}
																<div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
																	<h4 className="text-lg font-bold text-gray-900 mb-2">
																		📄 {parsed.title}
																	</h4>
																	{doc.link ? (
																		<a
																			href={doc.link}
																			target="_blank"
																			rel="noopener noreferrer"
																			className="text-sm text-pink-600 hover:text-pink-800 hover:underline inline-flex items-center font-medium"
																		>
																			<span className="mr-2">📖</span>
																			{doc.rule}
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
																		<span className="text-sm text-gray-600 inline-flex items-center">
																			<span className="mr-2">📖</span>
																			{doc.rule}
																		</span>
																	)}
																</div>
																
																{/* Document Requirements */}
																{parsed.requirements && (
																	<div className="px-6 py-4">
																		<h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
																			Requirements & Details:
																		</h5>
																		<ul className="space-y-3">
																			{formatRequirements(parsed.requirements).map((bullet, index) => (
																				<li key={index} className="flex text-sm text-gray-600 leading-relaxed">
																					<span className="text-blue-500 mr-3 flex-shrink-0 font-bold leading-relaxed">•</span>
																					<span className="flex-1">{bullet}</span>
																				</li>
																			))}
																		</ul>
																	</div>
																)}
																
																{/* Full Rule Text */}
																{doc.fullRuleText && (
																	<div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
																		<h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide flex items-center">
																			<span className="mr-2">⚖️</span>
																			Full Rule Text (Verbatim):
																		</h5>
																		<div className="bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-700 leading-relaxed font-mono">
																			{doc.fullRuleText}
																		</div>
																	</div>
																)}
															</div>
														);
													})}
												</div>
											) : (
												<div className="text-center py-12">
													<div className="text-gray-500 text-lg mb-4">No mandatory documents available</div>
													<p className="text-gray-400">Mandatory documents will appear here once you generate a report.</p>
												</div>
											)}
										</section>
									)}

									{activeTab === "Conditional Docs" && (
										<section className="p-8">
											<h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-pink-800 bg-clip-text text-transparent pb-4 mb-8 border-b border-gray-200/50 flex items-center">
												<div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
													<svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
													</svg>
												</div>
												Conditional Documents
											</h2>
											<div className="mb-6">
												<h3 className="text-lg font-semibold text-gray-600">
													Document Type: {formData.documentType || 'Not specified'}
												</h3>
											</div>
											{searchResults?.conditional && searchResults.conditional.length > 0 ? (
												<div className="space-y-6">
													{searchResults.conditional.map((doc, docIndex) => {
														const parsed = parseDocumentItem(doc.item);
														return (
															<div key={`${doc.item}-${docIndex}`} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
																{/* Document Header */}
																<div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-gray-200">
																	<h4 className="text-lg font-bold text-gray-900 mb-2">
																		📋 {parsed.title}
																	</h4>
																	{doc.link ? (
																		<a
																			href={doc.link}
																			target="_blank"
																				rel="noopener noreferrer"
																		className="text-sm text-pink-600 hover:text-pink-800 hover:underline inline-flex items-center font-medium"
																		>
																			<span className="mr-2">📖</span>
																			{doc.rule}
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
																		<span className="text-sm text-gray-600 inline-flex items-center">
																			<span className="mr-2">📖</span>
																			{doc.rule}
																		</span>
																	)}
																</div>
																
																{/* Document Requirements */}
																{parsed.requirements && (
																	<div className="px-6 py-4">
																		<h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
																			Requirements & Details:
																		</h5>
																		<ul className="space-y-3">
																			{formatRequirements(parsed.requirements).map((bullet, index) => (
																				<li key={index} className="flex text-sm text-gray-600 leading-relaxed">
																					<span className="text-amber-500 mr-3 flex-shrink-0 font-bold leading-relaxed">•</span>
																					<span className="flex-1">{bullet}</span>
																				</li>
																			))}
																		</ul>
																	</div>
																)}
																
																{/* Full Rule Text */}
																{doc.fullRuleText && (
																	<div className="px-6 py-4 bg-amber-50 border-t border-gray-200">
																		<h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide flex items-center">
																			<span className="mr-2">⚖️</span>
																			Full Rule Text (Verbatim):
																		</h5>
																		<div className="bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-700 leading-relaxed font-mono">
																			{doc.fullRuleText}
																		</div>
																	</div>
																)}
															</div>
														);
													})}
												</div>
											) : (
												<div className="text-center py-12">
													<div className="text-gray-500 text-lg mb-4">No conditional documents available</div>
													<p className="text-gray-400">Conditional documents will appear here once you generate a report.</p>
												</div>
											)}
										</section>
									)}

									{activeTab === "Governing Rules" && (
										<section className="p-8">
											<h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-pink-800 bg-clip-text text-transparent pb-4 mb-8 border-b border-gray-200/50 flex items-center">
												<div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
													<svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
													</svg>
												</div>
												Governing Rules
											</h2>
											{searchResults?.rules && searchResults.rules.length > 0 ? (
												<div className="space-y-6">
													{searchResults.rules.map((rule, ruleIndex) => (
														<div
															key={`${rule.name}-${ruleIndex}`}
															className="bg-gradient-to-br from-white/80 to-gray-50/50 rounded-2xl p-6 border border-white/60 shadow-lg"
														>
															<h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
																<div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
																	<div className="w-2 h-2 bg-white rounded-full" />
																</div>
																{rule.name}
															</h3>
															<p className="text-sm text-gray-600 leading-relaxed mb-4">
																{rule.text}
															</p>
															{rule.link ? (
																<a
																	href={rule.link}
																	target="_blank"
																	rel="noopener noreferrer"
																	className="text-sm text-pink-600 hover:text-pink-800 hover:underline inline-flex items-center font-medium transition-colors duration-200"
																>
																	<span className="mr-2">🔗</span>
																	View Source
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
																<span className="text-sm text-gray-500 inline-flex items-center">
																	<span className="mr-2">🔗</span>
																	Source Link
																</span>
															)}
														</div>
													))}
												</div>
											) : (
												<div className="text-center py-12">
													<div className="text-gray-500 text-lg mb-4">No governing rules available</div>
													<p className="text-gray-400">Governing rules will appear here once you generate a report.</p>
												</div>
											)}
										</section>
									)}

									{activeTab === ".docx Shell" && (
										<section className="p-8">
											<h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-pink-800 bg-clip-text text-transparent pb-4 mb-8 border-b border-gray-200/50 flex items-center">
												<div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
													<svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
													</svg>
												</div>
												Document Templates
											</h2>
											<div className="space-y-6">
												<div className="bg-gradient-to-br from-white/80 to-gray-50/50 rounded-2xl p-6 border border-white/60 shadow-lg">
													<div className="flex justify-between items-start">
														<div className="flex-1">
															<h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center">
																<span className="mr-3 text-2xl">📄</span>
																Motion for Summary Judgment Shell
															</h3>
															<p className="text-sm text-gray-600 mb-4 leading-relaxed">
																A pre-formatted .docx template for the notice of motion with proper formatting, headers, and required sections.
															</p>
															<div className="text-xs text-green-600 bg-green-100 px-3 py-1 rounded-full inline-block">
																Available Now
															</div>
														</div>
														<button
															onClick={handleDownloadDocument}
															disabled={downloadLoading}
															className="bg-pink-600 hover:bg-pink-700 disabled:bg-gray-200 disabled:text-gray-500 text-white font-semibold py-3 px-6 rounded-xl text-sm transition-all duration-200 ml-4 flex items-center"
														>
															{downloadLoading ? (
																<>
																	<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
																		<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
																		<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
																	</svg>
																	Downloading...
																</>
															) : (
																<>
																	<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
																	</svg>
																	Download
																</>
															)}
														</button>
													</div>
												</div>
												<div className="bg-gradient-to-br from-white/80 to-gray-50/50 rounded-2xl p-6 border border-white/60 shadow-lg">
													<div className="flex justify-between items-start">
														<div className="flex-1">
															<h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center">
																<span className="mr-3 text-2xl">📋</span>
																Separate Statement Shell
															</h3>
															<p className="text-sm text-gray-600 mb-4 leading-relaxed">
																A pre-formatted .docx template with the required two-column format for separate statements with proper numbering and formatting.
															</p>
															<div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full inline-block">
																Coming Soon
															</div>
														</div>
														<button
															disabled
															className="bg-gray-200 text-gray-500 font-semibold py-3 px-6 rounded-xl text-sm cursor-not-allowed transition-all duration-200 ml-4"
														>
															Download
														</button>
													</div>
												</div>
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
											{searchResults?.proceduralRoadmap ? (
												(() => {
													const roadmap = searchResults.proceduralRoadmap;
													
													// Function to determine party responsibility and color scheme
													const getPartyInfo = (title: string, description: string) => {
														const titleLower = title.toLowerCase();
														const descLower = description.toLowerCase();
														
														// Court/Judge actions
														if (titleLower.includes('court') || titleLower.includes('judge') || titleLower.includes('ruling') || 
															titleLower.includes('hearing') || titleLower.includes('judgment') || titleLower.includes('order') ||
															descLower.includes('court') || descLower.includes('judge') || descLower.includes('ruling')) {
															return {
																party: 'Court/Judge',
																bgColor: 'bg-white',
																borderColor: 'border-purple-400',
																textColor: 'text-purple-900',
																headerBg: 'bg-purple-100',
																icon: '⚖️'
															};
														}
														
														// Opposition/Defendant actions
														if (titleLower.includes('opposition') || titleLower.includes('response') || titleLower.includes('answer') ||
															titleLower.includes('objection') || descLower.includes('opposing party') || descLower.includes('defendant') ||
															descLower.includes('opposition')) {
															return {
																party: 'Opposing Party',
																bgColor: 'bg-white',
																borderColor: 'border-red-400',
																textColor: 'text-red-900',
																headerBg: 'bg-red-100',
																icon: '🛡️'
															};
														}
														
														// Your actions (Moving party/Plaintiff)
														if (titleLower.includes('initiate') || titleLower.includes('prepare') || titleLower.includes('file') ||
															titleLower.includes('serve') || titleLower.includes('motion') || titleLower.includes('reply') ||
															descLower.includes('moving party') || descLower.includes('plaintiff')) {
															return {
																party: 'You (Moving Party)',
																bgColor: 'bg-white',
																borderColor: 'border-blue-400',
																textColor: 'text-blue-900',
																headerBg: 'bg-blue-100',
																icon: '📋'
															};
														}
														
														// Neutral/System actions
														return {
															party: 'System/Process',
															bgColor: 'bg-white',
															borderColor: 'border-gray-400',
															textColor: 'text-gray-900',
															headerBg: 'bg-gray-100',
															icon: '⚙️'
														};
													};

													// Remove stage simulation - show as overview only
													
													return (
														<div className="space-y-8">
															{/* Header Info */}
															<div className="bg-gradient-to-br from-pink-50/80 to-purple-50/60 rounded-2xl p-6 border border-pink-200/50 shadow-lg">
																<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
																	<div>
																		<h3 className="text-xl font-bold text-pink-700 mb-1">{roadmap.documentType}</h3>
																		<p className="text-gray-600 font-medium">{roadmap.jurisdiction}</p>
							</div>
																	<div className="text-right">
																		<p className="text-lg font-semibold text-gray-700">{roadmap.judge}</p>
																		<p className="text-gray-600">{roadmap.department}</p>
																	</div>
																</div>
															</div>

															{/* Complex Flowchart Layout */}
															<div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
																<h3 className="text-2xl font-bold text-center text-gray-900 mb-2">Civil Case Procedural Flowchart</h3>
																<p className="text-center text-gray-600 mb-8">{roadmap.jurisdiction}</p>

																{/* Flowchart Container */}
																<div className="relative">
																	{/* Step 1: Initial Filing */}
																	<div className="flex justify-center mb-8">
																		{(() => {
																			const step = roadmap.flowchartSteps[0];
																			const partyInfo = getPartyInfo(step?.title || '', step?.description || '');
																			
																			return (
																				<div className={`relative ${partyInfo.bgColor} border-2 ${partyInfo.borderColor} rounded-lg p-4 w-80`}>
																					<h3 className={`font-bold text-sm mb-2 text-center ${partyInfo.headerBg} py-1 rounded uppercase`}>
																						{step?.title || 'INITIAL FILING'}
																					</h3>
																					<p className="text-xs text-gray-700 leading-tight">
																						{step?.description || 'Begin the legal process by filing the initial motion or complaint with the court.'}
																					</p>
																					<div className="text-xs text-blue-600 mt-2">
																						{step?.ruleReference || 'Filing Rules Apply'}
																					</div>
																				</div>
																			);
																		})()}
																	</div>

																	{/* Step 2: Branching - Fee Payment */}
																	<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
																		<div className={`${getPartyInfo('PAY FEES', '').bgColor} border-2 border-gray-300 rounded-lg p-4 shadow-sm`}>
																			<h3 className="font-bold text-sm mb-2 text-center bg-blue-100 py-1 rounded">PAY FILING FEES</h3>
																			<p className="text-xs text-gray-700 leading-tight">
																				Pay the required filing fees to the court clerk. Filing fees vary by document type and jurisdiction.
																			</p>
																			<div className="text-xs text-blue-600 mt-2">Fee Schedule Rules</div>
																		</div>
																		<div className={`${getPartyInfo('MOTION TO PROCEED', '').bgColor} border-2 border-gray-300 rounded-lg p-4 shadow-sm`}>
																			<h3 className="font-bold text-sm mb-2 text-center bg-blue-100 py-1 rounded">MOTION TO PROCEED WITHOUT FEES</h3>
																			<p className="text-xs text-gray-700 leading-tight">
																				Alternative: File a motion to proceed in forma pauperis if unable to afford filing fees.
																			</p>
																			<div className="text-xs text-blue-600 mt-2">In Forma Pauperis Rules</div>
																		</div>
																	</div>

																{/* Step 3: Service of Process */}
																	<div className="flex justify-center mb-8">
																		<div className={`${getPartyInfo('SERVICE', '').bgColor} border-2 border-gray-300 rounded-lg p-4 w-80 shadow-sm`}>
																			<h3 className="font-bold text-sm mb-2 text-center bg-blue-100 py-1 rounded">SERVICE OF PROCESS</h3>
																			<p className="text-xs text-gray-700 leading-tight">
																				Serve all documents on opposing parties according to proper service rules and deadlines.
																			</p>
																			<div className="text-xs text-blue-600 mt-2">Service Rules</div>
																		</div>
																	</div>

																	{/* Three-way branching */}
																	<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
																		<div className={`${getPartyInfo('MOTION DENIED', '').bgColor} border-2 border-red-300 rounded-lg p-4 shadow-sm`}>
																			<h3 className="font-bold text-sm mb-2 text-center bg-red-100 py-1 rounded">MOTION DENIED</h3>
																			<p className="text-xs text-gray-700 leading-tight">
																				If the motion to proceed without fees is denied, you must pay the filing fees to continue.
																			</p>
																		</div>
																		<div className={`${getPartyInfo('OPPOSITION', 'opposing party').bgColor} border-2 border-red-300 rounded-lg p-4 shadow-sm`}>
																			<h3 className="font-bold text-sm mb-2 text-center bg-red-100 py-1 rounded">OPPOSITION FILED</h3>
																			<p className="text-xs text-gray-700 leading-tight">
																				Opposing party files opposition papers challenging your motion within required timeframe.
																			</p>
																		</div>
																		<div className={`${getPartyInfo('NO OPPOSITION', '').bgColor} border-2 border-gray-300 rounded-lg p-4 shadow-sm`}>
																			<h3 className="font-bold text-sm mb-2 text-center bg-gray-100 py-1 rounded">NO OPPOSITION</h3>
																			<p className="text-xs text-gray-700 leading-tight">
																				No opposition is filed by the deadline. Motion may be granted as unopposed.
																			</p>
																		</div>
																	</div>

																	{/* Discovery Phase (Parallel Process) */}
																	<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
																		<div className={`${getPartyInfo('DISCOVERY', '').bgColor} border-2 border-gray-300 rounded-lg p-4 shadow-sm`}>
																			<h3 className="font-bold text-sm mb-2 text-center bg-gray-100 py-1 rounded">DISCOVERY PROCESS</h3>
																			<p className="text-xs text-gray-700 leading-tight">
																				Exchange of information, documents, and evidence between parties through various discovery methods.
																			</p>
																			<div className="text-xs text-blue-600 mt-2">Discovery Rules</div>
																		</div>
																		<div className={`${getPartyInfo('MOTIONS', '').bgColor} border-2 border-gray-300 rounded-lg p-4 shadow-sm`}>
																			<h3 className="font-bold text-sm mb-2 text-center bg-gray-100 py-1 rounded">CASE MANAGEMENT</h3>
																			<p className="text-xs text-gray-700 leading-tight">
																				Court may issue case management orders, scheduling orders, and handle various motions during this phase.
																			</p>
																			<div className="text-xs text-blue-600 mt-2">Case Management Rules</div>
																		</div>
																	</div>

																	{/* Hearing Phase */}
																	<div className="flex justify-center mb-8">
																		<div className={`${getPartyInfo('HEARING', 'court').bgColor} border-2 border-purple-300 rounded-lg p-4 w-80 shadow-sm`}>
																			<h3 className="font-bold text-sm mb-2 text-center bg-purple-100 py-1 rounded">HEARING ON MOTION</h3>
																			<p className="text-xs text-gray-700 leading-tight">
																				Court conducts hearing where both parties present oral arguments. Judge may ask questions and review evidence.
																			</p>
																			<div className="text-xs text-blue-600 mt-2">Hearing Procedures</div>
																		</div>
																	</div>

																																	{/* Final Decision Branching */}
																<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
																	<div className={`${getPartyInfo('MOTION GRANTED', 'court').bgColor} border-2 border-purple-300 rounded-lg p-4 shadow-sm`}>
																		<h3 className="font-bold text-sm mb-2 text-center bg-green-100 py-1 rounded">MOTION GRANTED</h3>
																		<p className="text-xs text-gray-700 leading-tight">
																			Court grants the motion. Judgment may be entered in your favor. Case may conclude or proceed to limited issues.
																		</p>
																		<div className="text-xs text-green-600 mt-2">Favorable Outcome</div>
																	</div>
																	<div className={`${getPartyInfo('MOTION DENIED', 'court').bgColor} border-2 border-purple-300 rounded-lg p-4 shadow-sm`}>
																		<h3 className="font-bold text-sm mb-2 text-center bg-orange-100 py-1 rounded">MOTION DENIED</h3>
																		<p className="text-xs text-gray-700 leading-tight">
																			Court denies the motion. Case proceeds to trial or further proceedings. Consider appeal options.
																		</p>
																		<div className="text-xs text-orange-600 mt-2">Proceed to Trial</div>
																	</div>
																</div>

																	{/* Final Outcomes */}
																	<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
																		<div className={`${getPartyInfo('JUDGMENT', 'court').bgColor} border-2 border-purple-300 rounded-lg p-4 shadow-sm`}>
																			<h3 className="font-bold text-sm mb-2 text-center bg-purple-100 py-1 rounded">JUDGMENT ENTERED</h3>
																			<p className="text-xs text-gray-700 leading-tight">
																				Court enters final judgment. Case concludes unless appealed.
																			</p>
																		</div>
																		<div className={`${getPartyInfo('TRIAL', 'court').bgColor} border-2 border-purple-300 rounded-lg p-4 shadow-sm`}>
																			<h3 className="font-bold text-sm mb-2 text-center bg-purple-100 py-1 rounded">PROCEED TO TRIAL</h3>
																			<p className="text-xs text-gray-700 leading-tight">
																				Case proceeds to full trial with jury or bench trial.
																			</p>
																		</div>
																		<div className={`${getPartyInfo('APPEAL', '').bgColor} border-2 border-gray-300 rounded-lg p-4 shadow-sm`}>
																			<h3 className="font-bold text-sm mb-2 text-center bg-gray-100 py-1 rounded">NOTICE OF APPEAL</h3>
																			<p className="text-xs text-gray-700 leading-tight">
																				Option to appeal unfavorable decisions within required timeframe.
																			</p>
																		</div>
																	</div>
																</div>
															</div>

															{/* Key Deadlines */}
															{roadmap.keyDeadlines && roadmap.keyDeadlines.length > 0 && (
																<div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-6 shadow-lg">
																	<h3 className="text-xl font-bold text-red-800 mb-6 flex items-center">
																		<span className="mr-3 text-2xl">⚠️</span>
																		Critical Deadlines
																	</h3>
																	<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
																		{roadmap.keyDeadlines.map((deadline, index) => (
																			<div key={index} className="bg-white rounded-xl p-4 border-2 border-red-200 shadow-md hover:shadow-lg transition-shadow duration-300">
																				<div className="flex items-start space-x-3">
																					<div className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-1">
																						{index + 1}
																					</div>
																					<div className="flex-1">
																						<div className="font-bold text-red-800 text-sm mb-1">{deadline.event}</div>
																						<div className="text-sm text-red-600 mb-2 font-medium">{deadline.timing}</div>
																						<div className="text-xs text-gray-600 mb-2 italic">{deadline.consequences}</div>
																						<div className="text-xs text-blue-600 font-medium">{deadline.rule}</div>
																					</div>
																				</div>
																			</div>
																		))}
																	</div>
																</div>
															)}

															{/* Judge-Specific Notes */}
															{roadmap.judgeSpecificNotes && roadmap.judgeSpecificNotes.length > 0 && (
																<div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-2xl p-6 shadow-lg">
																	<h3 className="text-xl font-bold text-purple-800 mb-6 flex items-center">
																		<span className="mr-3 text-2xl">👨‍⚖️</span>
																		Judge-Specific Guidance
																	</h3>
																	<div className="space-y-4">
																		{roadmap.judgeSpecificNotes.map((note, index) => (
																			<div key={index} className="bg-white rounded-xl p-5 border-2 border-purple-200 shadow-md hover:shadow-lg transition-shadow duration-300">
																				<div className="flex items-start space-x-4">
																					<div className="bg-purple-500 text-white rounded-lg w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">
																						<span className="text-lg">⚖️</span>
																					</div>
																					<div className="flex-1">
																						<div className="font-bold text-purple-800 text-base mb-2">{note.category}</div>
																						<div className="text-sm text-purple-700 leading-relaxed mb-3">{note.note}</div>
																						<div className="text-xs text-gray-500 font-medium">
																							<span className="mr-1">📋</span>
																							Source: {note.source}
																						</div>
																					</div>
																				</div>
																			</div>
																		))}
																	</div>
																</div>
															)}
														</div>
													);
												})()
											) : (
												<div className="text-center py-12">
													<div className="text-gray-500 text-lg mb-4">No procedural roadmap available</div>
													<p className="text-gray-400">The procedural roadmap will appear here once you generate a report.</p>
												</div>
											)}
										</section>
									)}
								</div>
							</div>
						) : (
							<div className="space-y-8">
								{/* Main Report Message */}
								<div className="flex flex-col items-center justify-center h-[calc(50vh-3rem)] text-center px-8">
								<div className="group bg-white/60 backdrop-blur-xl rounded-3xl p-12 border border-white/50 shadow-xl shadow-pink-500/5 max-w-2xl animate-fade-in transition-all duration-300 hover:shadow-2xl hover:shadow-pink-500/10 hover:scale-[1.01]">
										<div className="relative mb-8">
										<div className="absolute -inset-4 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full blur-2xl animate-elegant-glow" />
										<div className="relative bg-gradient-to-br from-pink-500 to-pink-600 p-4 rounded-2xl shadow-lg animate-float transition-transform duration-300 group-hover:scale-105 flex items-center gap-3 pr-4">
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
											{/* Typing text inside the pink block */}
											<span className="ml-2 whitespace-nowrap text-3xl font-bold text-white select-none">
												<span ref={typingElRef} />
											</span>
										</div>
										</div>

										<h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-pink-800 bg-clip-text text-transparent mb-4 animate-fade-in">
											Your Filing Requirements Report Will Appear Here
										</h2>
										<p className="text-gray-600 text-lg leading-relaxed mb-4 animate-fade-in">
											Complete the search parameters to generate your comprehensive filing requirements report, procedural checklist, and mind map visualization.
										</p>
										<div className="relative overflow-hidden bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
											<div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 animate-shimmer" />
											<div className="flex items-center mb-2">
												<svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
												</svg>
												<span className="font-semibold text-blue-800">Report Features</span>
											</div>
											<p className="text-blue-700">
												Once generated, your report will include 6 interactive tabs: <strong>Checklist</strong>, <strong>Mandatory Docs</strong>, <strong>Conditional Docs</strong>, <strong>Governing Rules</strong>, <strong>.docx Shell</strong>, and <strong>Procedural Roadmap</strong>.
											</p>
										</div>
										
										<div className="mt-8 flex items-center justify-center space-x-2 text-sm text-gray-500">
											<div className="w-2 h-2 bg-pink-500 rounded-full animate-gentle-pulse" />
											<span>Ready to generate your legal filing guide</span>
										</div>
									</div>
								</div>

								{/* Demo Tab Interface */}
								<div className="px-8">
									<div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-xl shadow-pink-500/5 max-w-4xl mx-auto">
										<h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-pink-800 bg-clip-text text-transparent mb-6 text-center">
											Report Preview - Tab Interface
										</h3>
										<p className="text-gray-600 text-center mb-8">
											This is how your report will be organized once generated. Each tab will contain relevant information for your filing requirements.
										</p>

										{/* Demo Tabs */}
										<div className="bg-white/60 backdrop-blur-xl rounded-3xl p-2 border border-white/50 shadow-xl shadow-pink-500/5 mb-6">
											<nav className="flex space-x-2" aria-label="Tabs">
												{[
													"Checklist",
													"Mandatory Docs", 
													"Conditional Docs",
													"Governing Rules",
													".docx Shell",
													"Procedural Roadmap",
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

										{/* Demo Tab Content */}
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
													<div className="text-center py-12">
														<div className="text-gray-500 text-lg mb-4">Your step-by-step filing checklist will appear here</div>
														<p className="text-gray-400">Generate a report to see your personalized checklist with tasks, deadlines, and requirements.</p>
													</div>
												</section>
											)}

											{activeTab === "Mandatory Docs" && (
												<section className="p-8">
													<h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-pink-800 bg-clip-text text-transparent pb-4 mb-8 border-b border-gray-200/50 flex items-center">
														<div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
															<svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
															</svg>
														</div>
														Mandatory Documents
													</h2>
													<div className="text-center py-12">
														<div className="text-gray-500 text-lg mb-4">Required documents for your filing will appear here</div>
														<p className="text-gray-400">Generate a report to see all mandatory documents with formatting requirements and rules.</p>
													</div>
												</section>
											)}

											{activeTab === "Conditional Docs" && (
												<section className="p-8">
													<h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-pink-800 bg-clip-text text-transparent pb-4 mb-8 border-b border-gray-200/50 flex items-center">
														<div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
															<svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
															</svg>
														</div>
														Conditional Documents
													</h2>
													<div className="text-center py-12">
														<div className="text-gray-500 text-lg mb-4">Conditional documents based on your case will appear here</div>
														<p className="text-gray-400">Generate a report to see documents that may be required depending on your specific circumstances.</p>
													</div>
												</section>
											)}

											{activeTab === "Governing Rules" && (
												<section className="p-8">
													<h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-pink-800 bg-clip-text text-transparent pb-4 mb-8 border-b border-gray-200/50 flex items-center">
														<div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
															<svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
															</svg>
														</div>
														Governing Rules
													</h2>
													<div className="text-center py-12">
														<div className="text-gray-500 text-lg mb-4">Applicable court rules and statutes will appear here</div>
														<p className="text-gray-400">Generate a report to see the specific rules governing your document type and jurisdiction.</p>
													</div>
												</section>
											)}

											{activeTab === ".docx Shell" && (
												<section className="p-8">
													<h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-pink-800 bg-clip-text text-transparent pb-4 mb-8 border-b border-gray-200/50 flex items-center">
														<div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
															<svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
															</svg>
														</div>
														Document Templates
													</h2>
													<div className="text-center py-12">
														<div className="text-gray-500 text-lg mb-4">Downloadable document templates will appear here</div>
														<p className="text-gray-400">Generate a report to access pre-formatted .docx templates for your specific documents.</p>
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
													<div className="text-center py-12">
														<div className="text-gray-500 text-lg mb-4">Your customized procedural flowchart will appear here</div>
														<p className="text-gray-400">Generate a report to see a visual roadmap of your case procedure with deadlines and decision points.</p>
													</div>
												</section>
											)}
										</div>
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

