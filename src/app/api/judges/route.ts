import { NextResponse } from "next/server";
import { getApiUrl } from "@/lib/config";

export async function GET() {
	try {
		console.log("getApiUrl(/api/judges)", getApiUrl("/api/judges"));
		const response = await fetch(getApiUrl("/api/judges"));
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
