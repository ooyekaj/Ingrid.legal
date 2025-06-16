import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		const response = await fetch("http://ingrid.legal/api/prepareDocket", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				state: body.state,
				county: body.county,
				division: body.division,
				judge: body.judge,
				document_type: body.document_type,
			}),
		});

		const data = await response.json();

		if (!response.ok) {
			return NextResponse.json(
				{ error: data.error || "Failed to prepare docket" },
				{ status: response.status }
			);
		}

		return NextResponse.json(data);
	} catch (error) {
		console.error("Failed to prepare docket:", error);
		return NextResponse.json(
			{ error: "Failed to prepare docket" },
			{ status: 500 }
		);
	}
}
