import { NextResponse } from "next/server";

const JUDGES = [
	{ name: "Charles F. Adams", division: "Complex Civil Litigation" },
	{ name: "Carol Overton", division: "Complex Civil Litigation" },
	{ name: "Panteha E. Saban", division: "Civil Division" },
	{ name: "Lori E. Pegg", division: "Civil Division" },
	{ name: "JoAnne McCracken", division: "Civil Division" },
	{ name: "Julia Alloggiamento", division: "Civil Division" },
];

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const division = searchParams.get("division");
	const judges = JUDGES.filter((judge) => judge.division === division);
	return NextResponse.json({
		judges,
	});
}
