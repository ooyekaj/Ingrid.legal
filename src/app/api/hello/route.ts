import { NextResponse } from "next/server";

export async function GET() {
	try {
		const response = await fetch("https://ingrid.legal/api/hello");
		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Failed to fetch from FastAPI:", error);
		return NextResponse.json(
			{ error: "Failed to fetch from FastAPI" },
			{ status: 500 }
		);
	}
}
