import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const { state, county, division, judge, department, document_type, court_type } =
			await request.json();
		const apiKey = process.env.GEMINI_API_KEY || "AIzaSyDqfzvfuUrRazJsyJobHNCnbM8ybQtHZXk";

		// System prompt for legal docket preparation
		const systemPrompt = `You are an expert legal assistant specializing in court procedures and legal document preparation. Your role is to provide accurate, jurisdiction-specific guidance for legal practitioners preparing court filings.

IMPORTANT INSTRUCTIONS:
1. Generate ONLY valid JSON objects - no additional text, explanations, or markdown formatting
2. Use actual, verifiable legal citations and statutes for the specified jurisdiction
3. Provide working links to official legal resources when possible
4. Structure your response exactly as specified in the template
5. If you cannot find specific information for a judge, provide general rules for that court/division
6. Include practical, actionable guidance in checklists and notes
7. CRITICAL: If the provided judge and department combination appears incorrect (e.g., judge is assigned to a different department), automatically correct the department number in your response to match the judge's actual assignment. Do not mention the correction - simply use the correct department throughout your response.
8. CRITICAL: If the provided judge name is incomplete or informal (e.g., "Adams", "Smith", "Judge Johnson"), automatically expand it to the full formal name (e.g., "Hon. Charles F. Adams", "Hon. Patricia M. Smith") based on your knowledge of judges in that jurisdiction. Use the full formal name consistently throughout your response in all references, titles, and procedural guidance.`;

		// User prompt template
		const userPrompt = `Generate a comprehensive legal docket preparation guide for:
- Court Type: ${court_type || 'state'}
- State: ${state}
- County: ${county}  
- Division: ${division}
- Judge: ${judge}
- Department: ${department}
- Document Type: ${document_type}

IMPORTANT: 
1. JUDGE NAME EXPANSION: If the judge name "${judge}" is incomplete or informal, expand it to the full formal name (e.g., "Adams" → "Hon. Charles F. Adams"). Use the complete formal name consistently throughout your response.
2. DEPARTMENT VERIFICATION: Verify that the expanded judge name is correctly assigned to Department ${department}. If this combination is incorrect based on your knowledge of court assignments, automatically use the correct department number for this judge throughout your response. The correct department should be reflected in all references to court location, filing instructions, and procedural requirements.

CRITICAL FORMATTING REQUIREMENTS TO INCLUDE:
- Include detailed document formatting rules with specific citations and working hyperlinks
- Cover paper size, font requirements, margins, line spacing, page numbering
- Include pleading format requirements, caption formatting, signature requirements
- Specify filing requirements, service requirements, and proof of service formats
- Include local court rules for the specific jurisdiction
- Provide working links to official court websites and rule sources

COMPREHENSIVE DOCUMENT PREPARATION REQUIREMENTS:
- List ALL documents required for filing ${document_type} in ${division}, ${county}, ${state}
- Include main document plus all supporting documents, attachments, and exhibits
- Specify content requirements for each document (what must be included)
- Detail filing procedures: number of copies, filing fees, electronic vs paper filing
- Service requirements: who must be served, how, and by when
- Proof of service requirements and formats
- Local court-specific requirements and procedures
- Judge-specific preferences and standing orders
- Deadline calculations and timing requirements
- Fee schedules and payment methods

Return ONLY a JSON object with this exact structure:

{
  "documents": [
    {
      "item": "Main Document (e.g., Notice of Motion and Motion for Summary Judgment) - Must include: case caption, statement of relief sought, factual background, legal argument, conclusion. Format: 8.5x11 white paper, 12pt Times New Roman, double-spaced, 1-inch margins, numbered pages.",
      "rule": "Legal citation with content and formatting requirements", 
      "link": "Official legal resource URL (must be working link)"
    },
    {
      "item": "Supporting Documents (e.g., Memorandum of Points and Authorities) - Must include: table of contents, table of authorities, statement of facts, argument section, conclusion. Page limits apply per local rules.",
      "rule": "Legal citation with content requirements and page limits",
      "link": "Official legal resource URL"
    },
    {
      "item": "Required Attachments (e.g., Separate Statement, Declarations, Exhibits) - Must be properly labeled, authenticated, and referenced in main document. Each exhibit must be separately tabbed.",
      "rule": "Legal citation for attachment requirements",
      "link": "Official legal resource URL"
    },
    {
      "item": "Proof of Service - Must specify method of service, date served, persons served, and include declaration under penalty of perjury. Required for all served documents.",
      "rule": "Service rule citation with specific requirements",
      "link": "Official service rules URL"
    }
  ],
  "conditional": [
    {
      "item": "Optional document name with formatting requirements",
      "rule": "Condition when required with formatting specifications [Legal citation]",
      "link": "Official legal resource URL (must be working link)"
    }
  ],
      "rules": [
      {
        "name": "Document Formatting Requirements",
        "text": "Paper: 8.5 x 11 inches, white, unpleated. Font: 12-point Times New Roman or equivalent serif font. Spacing: Double-spaced text, single-spaced footnotes. Margins: 1 inch minimum on all sides. Pages: Numbered consecutively at bottom center. Line numbering: Required in some jurisdictions (28 lines per page).",
        "link": "Official court formatting rules URL"
      },
      {
        "name": "Content Requirements for ${document_type}",
        "text": "Must include: proper case caption, clear statement of relief sought, factual background with supporting evidence, legal argument with citations to relevant authority, specific conclusion. Supporting documents must include table of contents and table of authorities if over specified page limit.",
        "link": "Official content requirements URL"
      },
      {
        "name": "Filing Procedures and Requirements", 
        "text": "File original plus required copies (typically 2-3 copies). Filing fees: [specific amount for document type]. Electronic filing: [mandatory/optional in this jurisdiction]. Courtesy copies: [required for this judge/department]. File stamp: Required on all copies.",
        "link": "Official filing procedures URL"
      },
      {
        "name": "Service Requirements",
        "text": "Service method: Personal service, mail, or electronic service per local rules. Timing: Serve all parties simultaneously with filing or within [X] days. Proof of service: Must be filed within [X] days of service. Service list: Must serve all parties of record.",
        "link": "Official service rules URL"
      },
      {
        "name": "Deadlines and Timing Requirements",
        "text": "Filing deadline: [specific to document type and case]. Service deadline: [specific timing requirements]. Response deadline: [time allowed for opposition]. Hearing date: [scheduling requirements]. Calendar requirements: [local calendar rules].",
        "link": "Official deadline rules URL"
      },
      {
        "name": "Fee Schedule and Payment",
        "text": "Filing fee: [specific amount for ${document_type}]. Payment methods: Cash, check, money order, credit card (if accepted). Fee waivers: Available for qualified parties. Additional fees: [motion fees, hearing fees, etc.]. Refund policy: [if applicable].",
        "link": "Official fee schedule URL"
      }
    ],
      "checklist": [
      {
        "phase": "Research and Planning",
        "task": "Determine all required documents for ${document_type}",
        "notes": "Identify main document, supporting memorandum, required attachments (separate statement, declarations, exhibits), proof of service. Check local rules for jurisdiction-specific requirements.",
        "rule": "Local court rules and statutes governing ${document_type}",
        "link": "Working URL to local court rules"
      },
      {
        "phase": "Document Preparation",
        "task": "Draft main document with required content",
        "notes": "Include: proper case caption, clear statement of relief sought, factual background with supporting evidence, legal argument with authority citations, specific conclusion. Follow content requirements for ${document_type}.",
        "rule": "Content requirements statute/rule for ${document_type}",
        "link": "Working URL to content requirements"
      },
      {
        "phase": "Document Preparation",
        "task": "Prepare all supporting documents and attachments",
        "notes": "Draft memorandum of points and authorities, separate statement (if required), declarations under penalty of perjury, exhibits with proper authentication. Ensure all attachments are referenced in main document.",
        "rule": "Supporting document requirements rule",
        "link": "Working URL to supporting document rules"
      },
      {
        "phase": "Document Preparation",
        "task": "Format all documents according to court rules",
        "notes": "Use 8.5x11 white paper, 12-point Times New Roman font, double-spaced, 1-inch margins, numbered pages. Include proper caption and signature blocks. Follow page limits.",
        "rule": "Court formatting rules (e.g., Local Rule 2.1, CRC Rule 2.100)",
        "link": "Working URL to formatting rules"
      },
      {
        "phase": "Pre-Filing Review",
        "task": "Calculate and verify all deadlines",
        "notes": "Confirm filing deadline, service deadlines, response deadlines, hearing date requirements. Account for court holidays and weekends. Calculate service extensions for mail service.",
        "rule": "Deadline calculation rules and local calendar",
        "link": "Working URL to deadline rules"
      },
      {
        "phase": "Pre-Filing Review",
        "task": "Determine filing fees and payment method",
        "notes": "Calculate total filing fees for ${document_type}. Determine accepted payment methods. Check fee waiver eligibility if applicable. Prepare exact payment amount.",
        "rule": "Court fee schedule for ${document_type}",
        "link": "Working URL to fee schedule"
      },
      {
        "phase": "Filing Preparation",
        "task": "Prepare correct number of copies",
        "notes": "File original plus required copies (typically 2-3). Prepare courtesy copies if required by judge. Ensure all copies are identical and complete. Check electronic filing requirements.",
        "rule": "Local filing rules for copy requirements",
        "link": "Working URL to filing procedures"
      },
      {
        "phase": "Filing and Service",
        "task": "File documents with court clerk",
        "notes": "Submit original and copies to court clerk. Pay filing fees. Obtain file-stamped copies. Verify electronic filing if required. Ensure all documents are properly filed.",
        "rule": "Filing procedures rule",
        "link": "Working URL to filing procedures"
      },
      {
        "phase": "Filing and Service",
        "task": "Serve all parties according to service rules",
        "notes": "Serve all parties of record using proper service method (personal, mail, electronic). Serve simultaneously with filing or within required timeframe. Maintain service list.",
        "rule": "Service of process rules",
        "link": "Working URL to service rules"
      },
      {
        "phase": "Post-Filing",
        "task": "File proof of service",
        "notes": "Prepare and file proof of service within required timeframe. Include method of service, date served, persons served, declaration under penalty of perjury.",
        "rule": "Proof of service requirements",
        "link": "Working URL to proof of service rules"
      }
    ],
  "proceduralRoadmap": {
    "documentType": "${document_type}",
    "jurisdiction": "${division}, ${county}, ${state}",
    "judge": "Judge ${judge}",
    "department": "Department ${department}",
    "flowchartSteps": [
      {
        "id": "step1",
        "title": "Document Preparation & Formatting",
        "description": "Prepare ${document_type} according to specific formatting requirements for ${division}, ${county}, ${state}",
        "requirements": [
          "Format on 8.5x11 inch white paper with 12-point Times New Roman font",
          "Use double-spacing with 1-inch margins on all sides", 
          "Include proper caption with court name, case title, and case number",
          "Add attorney signature block with bar number and contact information",
          "Number pages consecutively at bottom center"
        ],
        "deadline": "Before filing deadline",
        "ruleReference": "Applicable formatting rule citation for this jurisdiction",
        "ruleLink": "Working URL to official formatting rules",
        "nextSteps": ["step2"],
        "stepType": "single"
      }
    ],
    "keyDeadlines": [
      {
        "event": "Document formatting compliance check",
        "timing": "Before filing",
        "rule": "Court formatting rules",
        "consequences": "Document may be rejected by clerk if non-compliant"
      }
    ],
    "judgeSpecificNotes": [
      {
        "category": "Formatting Preferences",
        "note": "Specific formatting preferences or requirements for Judge ${judge} or Department ${department}",
        "source": "Local court website or standing orders"
      }
    ]
  }
}

MANDATORY REQUIREMENTS FOR ALL RESPONSES:
1. COMPLETE DOCUMENT PREPARATION: Always include comprehensive preparation requirements:
   - ALL required documents for ${document_type} (main document, supporting docs, attachments)
   - Content requirements for each document (what must be included)
   - Formatting requirements (paper, font, spacing, margins, numbering)
   - Filing requirements (copies, fees, procedures)
   - Service requirements (who, how, when)
   - Deadline calculations and timing requirements
   - Local court-specific procedures and preferences
   
2. FORMATTING RULES: Include specific formatting requirements in every section:
   - Paper size (8.5 x 11 inches, white, unpleated)
   - Font requirements (12-point Times New Roman or equivalent serif font)
   - Spacing (double-spaced text, single-spaced footnotes)
   - Margins (1 inch on all sides minimum)
   - Page numbering (consecutive, bottom center)
   - Line numbering (if required by jurisdiction)
   - Caption format (court name, case title, case number)
   - Signature block requirements (attorney name, bar number, address)

3. WORKING HYPERLINKS: Every "link" field must contain a working URL to official sources:
   - Court websites with local rules
   - State legislature websites with statutes
   - Official court forms and templates
   - Bar association resources
   - Government legal databases

4. JURISDICTION-SPECIFIC REQUIREMENTS: Include all requirements specific to ${state}, ${county}, ${division}:
   - Local court rules for document preparation and filing
   - Electronic filing requirements and procedures
   - Specific pleading paper and formatting requirements
   - Court-specific caption formats and content
   - Local filing procedures, fees, and deadlines
   - Judge-specific preferences and standing orders

5. DOCUMENT TYPE SPECIFIC REQUIREMENTS: Tailor all requirements to ${document_type}:
   - Specific documents required for this filing type
   - Content requirements unique to this document type
   - Special formatting or attachment requirements
   - Service requirements specific to this document type
   - Deadlines and timing specific to this filing
   - Fee structure for this document type

6. COMPREHENSIVE COVERAGE: Include complete preparation requirements in ALL sections:
   - Documents section: All required docs with content and format requirements
   - Conditional section: Optional documents with full requirements
   - Rules section: Complete preparation, filing, and service rules
   - Checklist section: Step-by-step preparation and filing tasks
   - Procedural roadmap: Complete workflow from preparation to resolution

Focus on practical, actionable formatting guidance that ensures compliance with ${division}, ${county}, ${state} court requirements for ${document_type}.`;

		try {
			console.log("Calling Gemini API for legal docket preparation...");
			const response = await fetch(
				`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						contents: [
							{
								parts: [
									{
										text: systemPrompt + "\n\n" + userPrompt,
									},
								],
							},
						],
						generationConfig: {
							temperature: 0.3, // Lower temperature for more consistent legal guidance
						},
					}),
				}
			);

			if (!response.ok) {
				throw new Error(`Gemini API error: ${response.status}`);
			}

			const geminiResponse = await response.json();
			const rawContent =
				geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text || "";

			// Clean the response to ensure it's valid JSON
			let cleanedContent = rawContent.trim();

			// Remove any markdown code block formatting if present
			if (cleanedContent.startsWith("```json")) {
				cleanedContent = cleanedContent
					.replace(/^```json\s*/, "")
					.replace(/\s*```$/, "");
			} else if (cleanedContent.startsWith("```")) {
				cleanedContent = cleanedContent
					.replace(/^```\s*/, "")
					.replace(/\s*```$/, "");
			}

			try {
				const parsedData = JSON.parse(cleanedContent);

				return NextResponse.json({
					success: true,
					data: parsedData,
					request_params: { state, county, division, judge, department, document_type, court_type },
				});
			} catch (parseError) {
				console.error("JSON parsing error:", parseError);
				console.error("Raw content:", rawContent);

				return NextResponse.json(
					{
						error: "Failed to parse AI response as JSON",
						raw_response: rawContent,
					},
					{ status: 500 }
				);
			}
		} catch (error) {
			console.error("Error calling Gemini API:", error);
			return NextResponse.json(
				{
					error: "Failed to generate legal docket guide",
					details: error instanceof Error ? error.message : "Unknown error",
				},
				{ status: 500 }
			);
		}
	} catch (error) {
		console.error("Request parsing error:", error);
		return NextResponse.json(
			{
				error: "Invalid request format",
				details:
					"Expected JSON with state, county, division, judge, department, document_type, and court_type",
			},
			{ status: 400 }
		);
	}
}
