import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const { state, county, division, judge, document_type } =
			await request.json();
		const apiKey = "AIzaSyDqfzvfuUrRazJsyJobHNCnbM8ybQtHZXk";

		// System prompt for legal docket preparation
		const systemPrompt = `You are an expert legal assistant specializing in court procedures and legal document preparation. Your role is to provide accurate, jurisdiction-specific guidance for legal practitioners preparing court filings.

IMPORTANT INSTRUCTIONS:
1. Generate ONLY valid JSON objects - no additional text, explanations, or markdown formatting
2. Use actual, verifiable legal citations and statutes for the specified jurisdiction
3. Provide working links to official legal resources when possible
4. Structure your response exactly as specified in the template
5. If you cannot find specific information for a judge, provide general rules for that court/division
6. Include practical, actionable guidance in checklists and notes`;

		// User prompt template
		const userPrompt = `Generate a comprehensive legal docket preparation guide for:
- State: ${state}
- County: ${county}  
- Division: ${division}
- Judge: ${judge}
- Document Type: ${document_type}

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
  ]
}

REQUIREMENTS:
- Include all mandatory documents for the specified document type in the jurisdiction
- List conditional documents that may be required based on case circumstances
- Provide governing legal rules and statutes
- Create a practical step-by-step checklist organized by phases
- Use official government/court websites for links when possible
- If specific judge preferences/standing orders are known, incorporate them
- Ensure all legal citations are accurate for the specified jurisdiction

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
					request_params: { state, county, division, judge, document_type },
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
					"Expected JSON with state, county, division, judge, and document_type",
			},
			{ status: 400 }
		);
	}
}
