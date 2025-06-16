import { NextResponse } from "next/server";
import { getApiUrl } from "@/lib/config";

export async function GET() {
	try {
		console.log("getApiUrl(/api/hello)", getApiUrl("/api/hello"));
		const response = await fetch(getApiUrl("/api/hello"));
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
