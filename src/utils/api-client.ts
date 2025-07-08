// WeatherXM API client

// WeatherXM API base URL
const WEATHERXM_API_BASE = "https://pro.weatherxm.com/api/v1"

// User agent for API requests
const USER_AGENT = "WeatherXM-MCP-Server/1.0.0"

/**
 * Make a request to the WeatherXM API
 */
export async function weatherxmApiRequest(endpoint: string, apiKey: string): Promise<unknown> {
	const fullUrl = `${WEATHERXM_API_BASE}${endpoint}`
	console.log(`Making request to: ${fullUrl}`)
	
	try {
		const response = await fetch(fullUrl, {
			headers: {
				"User-Agent": USER_AGENT,
				"Accept": "application/json",
				"X-API-KEY": apiKey,
			},
		})

		console.log(`Response status: ${response.status} ${response.statusText}`)

		if (!response.ok) {
			// Handle specific WeatherXM API error cases
			if (response.status === 401) {
				throw new Error("Invalid API key. Please check your WeatherXM API key.")
			}
			if (response.status === 404) {
				throw new Error("Station not found or no data available")
			}
			if (response.status === 400) {
				// Try to get more specific error message
				try {
					const errorData = await response.json()
					if (errorData.message && errorData.message.includes("over limit")) {
						throw new Error("Requested date is too far in the past. The API has limits on historical data availability.")
					}
					throw new Error(`WeatherXM API error: ${errorData.message || response.statusText}`)
				} catch {
					throw new Error(`WeatherXM API error: ${response.status} ${response.statusText}`)
				}
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

		const data = await response.json()
		console.log(`Response data keys: ${Object.keys(data)}`)
		return data
	} catch (error: unknown) {
		console.error(`API request error:`, error)
		if (error instanceof Error && error.message.includes("fetch")) {
			throw new Error(
				"Unable to connect to WeatherXM service. Please check your internet connection.",
			)
		}
		throw error
	}
} 