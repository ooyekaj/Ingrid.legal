// Configuration for API endpoints
export const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_BASE_URL ||
	(process.env.NODE_ENV === "development"
		? "http://localhost:8000"
		: "https://ingrid.legal");

export const getApiUrl = (endpoint: string) => {
	return `${API_BASE_URL}${endpoint}`;
};
