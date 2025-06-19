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

Return ONLY a JSON object with this exact structure:

{
  "documents": [
    {
      "item": "Document name",
      "rule": "Legal citation/rule reference", 
      "link": "Official legal resource URL"
    }
  ],
  "conditional": [
    {
      "item": "Optional document name",
      "rule": "Condition when required [Legal citation]",
      "link": "Official legal resource URL"
    }
  ],
  "rules": [
    {
      "name": "Rule category name",
      "text": "Detailed explanation of the legal requirement",
      "link": "Official legal resource URL"
    }
  ],
  "checklist": [
    {
      "phase": "Preparation phase (e.g., Pre-Filing, Drafting, etc.)",
      "task": "Specific actionable task",
      "notes": "Practical guidance and timing requirements",
      "rule": "Applicable legal citation",
      "link": "Official legal resource URL"
    }
  ],
  "mindMap": {
    "centralTopic": {
      "title": "Filing of ${document_type}",
      "details": "A brief, one-sentence description of the document's primary purpose"
    },
    "scenarios": [
      {
        "id": "filing_response",
        "title": "Opposing Party's Potential Responses",
        "description": "Possible responses and actions the opposing party may take",
        "likelihood": "High/Medium/Low",
        "nextSteps": [
          {
            "id": "opposition_filing",
            "title": "Opposition/Response Filing",
            "description": "Expected timeline and requirements for opposition",
            "rule": "Applicable legal citation",
            "link": "Official resource URL"
          }
        ]
      },
      {
        "id": "court_actions",
        "title": "Court/Judge Actions",
        "description": "Potential court proceedings and judicial decisions",
        "likelihood": "High/Medium/Low",
        "nextSteps": [
          {
            "id": "hearing_scheduling",
            "title": "Hearing/Conference Scheduling",
            "description": "Timeline and requirements for court proceedings",
            "rule": "Court scheduling rules",
            "link": "Court calendar rules URL"
          }
        ]
      },
      {
        "id": "your_next_steps",
        "title": "Your Follow-up Actions",
        "description": "Potential responses to opposing party or court actions",
        "likelihood": "High/Medium/Low",
        "nextSteps": [
          {
            "id": "reply_brief",
            "title": "Reply Brief/Response",
            "description": "Requirements and deadlines for your reply",
            "rule": "Reply brief rules citation",
            "link": "Court rules URL"
          }
        ]
      }
    ]
  }
}

REQUIREMENTS:
- ALWAYS use the full, formal judge name (with "Hon." prefix) throughout the entire response
- Automatically correct any incomplete judge names (e.g., "Adams" → "Hon. Charles F. Adams")
- Verify and correct judge-department assignments if necessary
- Include all mandatory documents for the specified document type in the jurisdiction
- List conditional documents that may be required based on case circumstances
- Provide governing legal rules and statutes
- Create a practical step-by-step checklist organized by phases
- Use official government/court websites for links when possible
- If specific judge preferences/standing orders are known, incorporate them
- Ensure all legal citations are accurate for the specified jurisdiction
- Include realistic scenarios for opposing party responses
- Detail likely court actions and hearing timelines
- Specify follow-up actions and reply deadlines
- Provide jurisdiction-specific timing requirements
- Include relevant local rules and standing orders

Focus on practical, actionable guidance that a legal practitioner can immediately use.`;

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
