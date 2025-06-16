import { NextRequest, NextResponse } from "next/server";

const MOCK_DB = {
	"Motion for Summary Judgment": {
		"Charles F. Adams": {
			documents: [
				{
					item: "Notice of Motion and Motion",
					rule: "CCP § 437c(a), CRC Rule 3.1350(b)",
					link: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=437c",
				},
				{
					item: "Memorandum of Points and Authorities",
					rule: "Limit: 20 pages [CRC Rule 3.1113(d)]",
					link: "https://www.courts.ca.gov/cms/rules/index.cfm?title=three&linkid=rule3_1113",
				},
				{
					item: "Separate Statement of Undisputed Material Facts",
					rule: "MANDATORY [CCP § 437c(b)(1), CRC Rule 3.1350(d)]",
					link: "https://www.courts.ca.gov/cms/rules/index.cfm?title=three&linkid=rule3_1350",
				},
			],
			conditional: [
				{
					item: "Request for Judicial Notice (RJN)",
					rule: "If relying on public records. [Evid. Code §§ 451, 452]",
					link: "https://leginfo.legislature.ca.gov/faces/sections_search.xhtml?sectionNum=451&lawCode=EVID",
				},
				{
					item: "Proposed Judgment",
					rule: "If MSJ is dispositive of entire case. [CRC Rule 3.1312]",
					link: "https://www.courts.ca.gov/cms/rules/index.cfm?title=three&linkid=rule3_1312",
				},
			],
			rules: [
				{
					name: "Governing Statute",
					text: "CCP § 437c is the comprehensive law for MSJs, setting the 75-day notice period and mandating the Separate Statement.",
					link: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=437c",
				},
				{
					name: "Formatting and Structure",
					text: "CRC Rule 3.1350 dictates the specific two-column format for the Separate Statement and sets the 20-page limit for the legal brief.",
					link: "https://www.courts.ca.gov/cms/rules/index.cfm?title=three&linkid=rule3_1350",
				},
			],
			checklist: [
				{
					phase: "Pre-Filing",
					task: "Reserve Hearing Date (CRS)",
					notes:
						"Must be at least 75 calendar days out, plus time for service.",
					rule: "[Local Protocol]",
					link: "#",
				},
				{
					phase: "Pre-Filing",
					task: "Review Judge Adams's Standing Orders",
					notes: "Check the court's website under his department directory.",
					rule: "[Judge Directory]",
					link: "https://www.scscourt.org/divisions/civil/judges.shtml",
				},
				{
					phase: "Drafting",
					task: "Draft Notice of Motion & Motion",
					notes: "Include hearing date, time, and department.",
					rule: "CCP § 1010",
					link: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1010",
				},
				{
					phase: "Drafting",
					task: "Draft Separate Statement",
					notes: "Use two-column format. Do not include argument.",
					rule: "CRC 3.1350(h)",
					link: "https://www.courts.ca.gov/cms/rules/index.cfm?title=three&linkid=rule3_1350",
				},
				{
					phase: "Filing & Service",
					task: "File Documents with Court",
					notes: "E-file via the court's portal.",
					rule: "[Local Rules]",
					link: "#",
				},
				{
					phase: "Filing & Service",
					task: "Serve All Parties",
					notes: "Serve via method agreed upon by parties (e-service typical).",
					rule: "CCP § 1010.6",
					link: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1010.6",
				},
			],
		},
	},
};

export async function POST(request: NextRequest) {
	try {
		const requestData = await request.json();

		const document_type = requestData.document_type || "";
		const judge = requestData.judge || "";

		const data =
			MOCK_DB[document_type as keyof typeof MOCK_DB]?.[
				judge as keyof (typeof MOCK_DB)[keyof typeof MOCK_DB]
			];

		if (!data) {
			return NextResponse.json(
				{ error: "No data found for the specified parameters" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			data: data,
			request_params: requestData,
		});
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}
}
