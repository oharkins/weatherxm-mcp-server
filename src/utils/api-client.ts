// WeatherXM API client

// WeatherXM API base URL
const WEATHERXM_API_BASE = "https://pro.weatherxm.com/api/v1"

// User agent for API requests
const USER_AGENT = "WeatherXM-MCP-Server/1.0.0"

/**
 * Make a request to the WeatherXM API
 */
export async function weatherxmApiRequest(endpoint: string, apiKey: string): Promise<unknown> {
	try {
		const response = await fetch(`${WEATHERXM_API_BASE}${endpoint}`, {
			headers: {
				"User-Agent": USER_AGENT,
				"Accept": "application/json",
				"X-API-KEY": apiKey,
			},
		})

		if (!response.ok) {
			// Handle specific WeatherXM API error cases
			if (response.status === 401) {
				throw new Error("Invalid API key. Please check your WeatherXM API key.")
			}
			if (response.status === 404) {
				throw new Error("Station not found or no data available")
			}
			if (response.status === 429) {
				throw new Error("API rate limit exceeded. Please try again later.")
			}
			if (response.status === 500) {
				throw new Error("WeatherXM service temporarily unavailable")
			}
			throw new Error(
				`WeatherXM API error: ${response.status} ${response.statusText}`,
			)
		}

		return await response.json()
	} catch (error: unknown) {
		if (error instanceof Error && error.message.includes("fetch")) {
			throw new Error(
				"Unable to connect to WeatherXM service. Please check your internet connection.",
			)
		}
		throw error
	}
} 