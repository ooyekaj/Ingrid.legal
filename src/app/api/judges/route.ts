import { NextResponse } from "next/server";

export async function GET() {
	try {
		const response = await fetch("http://ingrid.legal/api/judges");
		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Failed to fetch judges:", error);
		return NextResponse.json(
			{ error: "Failed to fetch judges from backend" },
			{ status: 500 }
		);
	}
}
