// Configuration for API endpoints
export const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_BASE_URL ||
	(process.env.NODE_ENV === "development"
		? "" // Use relative URLs in development to work with any port
		: "https://ingrid.legal");

export const getApiUrl = (endpoint: string) => {
	// In development, use relative URLs to work with dynamic ports
	if (process.env.NODE_ENV === "development" && typeof window !== 'undefined') {
		return endpoint; // Use relative URL
	}
	return `${API_BASE_URL}${endpoint}`;
};
