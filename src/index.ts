import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

// Import schemas
import {
	WeatherXMLatestResponse,
	WeatherXMStationsResponse,
	WeatherXMHourlyForecastResponse,
	WeatherXMDailyForecastResponse,
	WeatherXMHistoricalResponse,
	WeatherXMAlertsResponse,
	WeatherXMCellsResponse,
	WeatherXMSearchResponse,
	Station,
	WeatherAlert,
} from "./schemas/index.js"

// Import utilities
import {
	formatTemperature,
	formatWindSpeed,
	formatPressure,
	formatPrecipitation,
	getWindDirection,
	formatLocalTime,
	formatTimeAgo,
	getWeatherIconDescription,
	weatherxmApiRequest,
} from "./utils/index.js"

// Configuration schema to require API key
export const configSchema = z.object({
	apiKey: z.string().describe("WeatherXM Pro API key required for accessing weather data"),
})

export default function createStatelessServer({
	config,
}: {
	config: z.infer<typeof configSchema>
}) {
	const server = new McpServer({
		name: "WeatherXM Pro MCP Server",
		version: "2.0.0",
	})

	// Tool: Get Current Weather for a Station
	server.tool(
		"get_current_weather",
		"Get current weather conditions for a specific WeatherXM station. Perfect for 'What's the weather like at station [station_id]?' questions.",
		{
			station_id: z
				.string()
				.describe(
					"WeatherXM station ID. Example: 'station_123' or 'WXM123456'",
				),
		},
		async ({ station_id }) => {
			try {
				const data = (await weatherxmApiRequest(
					`/stations/${station_id}/latest`,
					config.apiKey,
				)) as WeatherXMLatestResponse

				const obs = data.observation
				const location = data.location
				const health = data.health

				// Format current weather as markdown
				let markdown = "# Current Weather\n\n"
				markdown += `**Station ID:** ${station_id}\n`
				markdown += `**Location:** ${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}\n`
				markdown += `**Elevation:** ${location.elevation}m\n\n`

				// Show observation time with age
				const localObsTime = formatLocalTime(obs.timestamp)
				const timeAgo = formatTimeAgo(obs.timestamp)
				markdown += `**Observed:** ${localObsTime} - ${timeAgo}\n\n`

				// Temperature
				markdown += `**Temperature:** ${formatTemperature(obs.temperature)}\n`

				// "Feels like" temperature
				markdown += `**Feels Like:** ${formatTemperature(obs.feels_like)}\n`

				// Conditions
				markdown += `**Conditions:** ${getWeatherIconDescription(obs.icon)}\n`

				// Humidity
				markdown += `**Humidity:** ${obs.humidity.toFixed(0)}%\n`

				// Dew point
				markdown += `**Dew Point:** ${formatTemperature(obs.dew_point)}\n`

				// Wind
				const windDirection = getWindDirection(obs.wind_direction)
				markdown += `**Wind:** ${formatWindSpeed(obs.wind_speed)} from ${windDirection} (${obs.wind_direction}°)\n`

				// Wind gust
				if (obs.wind_gust > obs.wind_speed) {
					markdown += `**Wind Gust:** ${formatWindSpeed(obs.wind_gust)}\n`
				}

				// Pressure
				markdown += `**Pressure:** ${formatPressure(obs.pressure)}\n`

				// UV Index
				if (obs.uv_index > 0) {
					markdown += `**UV Index:** ${obs.uv_index.toFixed(1)}\n`
				}

				// Solar Irradiance
				if (obs.solar_irradiance > 0) {
					markdown += `**Solar Irradiance:** ${obs.solar_irradiance.toFixed(0)} W/m²\n`
				}

				// Precipitation
				if (obs.precipitation_rate > 0) {
					markdown += `**Precipitation Rate:** ${formatPrecipitation(obs.precipitation_rate)}/hr\n`
				}

				if (obs.precipitation_accumulated > 0) {
					markdown += `**Precipitation Accumulated:** ${formatPrecipitation(obs.precipitation_accumulated)}\n`
				}

				// Data quality
				markdown += `\n**Data Quality Score:** ${(health.data_quality.score * 100).toFixed(0)}%\n`

				return {
					content: [{ type: "text", text: markdown }],
				}
			} catch (e: unknown) {
				return {
					content: [
						{
							type: "text",
							text: `Error: ${e instanceof Error ? e.message : "Unknown error"}`,
						},
					],
				}
			}
		},
	)

	// Tool: Get Hourly Forecast
	server.tool(
		"get_hourly_forecast",
		"Get hourly weather forecast for a specific WeatherXM station. Shows detailed hourly predictions for the next 48 hours.",
		{
			station_id: z
				.string()
				.describe(
					"WeatherXM station ID. Example: 'station_123' or 'WXM123456'",
				),
			hours: z
				.number()
				.optional()
				.default(48)
				.describe(
					"Number of hours to forecast (1-48, default 48)",
				),
		},
		async ({ station_id, hours }) => {
			try {
				const data = (await weatherxmApiRequest(
					`/stations/${station_id}/forecast/hourly?hours=${hours}`,
					config.apiKey,
				)) as WeatherXMHourlyForecastResponse

				const forecast = data.forecast || []

				if (forecast.length === 0) {
					return {
						content: [
							{
								type: "text",
								text: `No hourly forecast available for station ${station_id}`,
							},
						],
					}
				}

				let markdown = `# Hourly Forecast - ${station_id}\n\n`
				markdown += `Forecast for the next ${hours} hours\n\n`

				for (const hour of forecast) {
					const localTime = formatLocalTime(hour.timestamp)
					const windDirection = getWindDirection(hour.wind_direction)
					
					markdown += `## ${localTime}\n\n`
					markdown += `**Temperature:** ${formatTemperature(hour.temperature)}\n`
					markdown += `**Feels Like:** ${formatTemperature(hour.feels_like)}\n`
					markdown += `**Conditions:** ${getWeatherIconDescription(hour.icon)}\n`
					markdown += `**Precipitation:** ${formatPrecipitation(hour.precipitation)} (${(hour.precipitation_probability * 100).toFixed(0)}% chance)\n`
					markdown += `**Wind:** ${formatWindSpeed(hour.wind_speed)} from ${windDirection}\n`
					markdown += `**Humidity:** ${hour.humidity.toFixed(0)}%\n`
					markdown += `**Pressure:** ${formatPressure(hour.pressure)}\n`
					markdown += `**UV Index:** ${hour.uv_index.toFixed(1)}\n\n`
					markdown += "---\n\n"
				}

				return {
					content: [{ type: "text", text: markdown }],
				}
			} catch (e: unknown) {
				return {
					content: [
						{
							type: "text",
							text: `Error: ${e instanceof Error ? e.message : "Unknown error"}`,
						},
					],
				}
			}
		},
	)

	// Tool: Get Daily Forecast
	server.tool(
		"get_daily_forecast",
		"Get daily weather forecast for a specific WeatherXM station. Shows daily predictions including high/low temperatures and precipitation.",
		{
			station_id: z
				.string()
				.describe(
					"WeatherXM station ID. Example: 'station_123' or 'WXM123456'",
				),
			days: z
				.number()
				.optional()
				.default(7)
				.describe(
					"Number of days to forecast (1-7, default 7)",
				),
		},
		async ({ station_id, days }) => {
			try {
				const data = (await weatherxmApiRequest(
					`/stations/${station_id}/forecast/daily?days=${days}`,
					config.apiKey,
				)) as WeatherXMDailyForecastResponse

				const forecast = data.forecast || []

				if (forecast.length === 0) {
					return {
						content: [
							{
								type: "text",
								text: `No daily forecast available for station ${station_id}`,
							},
						],
					}
				}

				let markdown = `# Daily Forecast - ${station_id}\n\n`
				markdown += `Forecast for the next ${days} days\n\n`

				for (const day of forecast) {
					const localTime = formatLocalTime(day.timestamp)
					const windDirection = getWindDirection(day.wind_direction)
					
					markdown += `## ${localTime}\n\n`
					markdown += `**High:** ${formatTemperature(day.temperature_max)}\n`
					markdown += `**Low:** ${formatTemperature(day.temperature_min)}\n`
					markdown += `**Conditions:** ${getWeatherIconDescription(day.icon)}\n`
					markdown += `**Precipitation:** ${(day.precipitation_probability * 100).toFixed(0)}% chance, ${day.precipitation_type}\n`
					markdown += `**Wind:** ${formatWindSpeed(day.wind_speed)} from ${windDirection}\n`
					markdown += `**Humidity:** ${day.humidity.toFixed(0)}%\n`
					markdown += `**Pressure:** ${formatPressure(day.pressure)}\n`
					markdown += `**UV Index:** ${day.uv_index.toFixed(1)}\n\n`
					markdown += "---\n\n"
				}

				return {
					content: [{ type: "text", text: markdown }],
				}
			} catch (e: unknown) {
				return {
					content: [
						{
							type: "text",
							text: `Error: ${e instanceof Error ? e.message : "Unknown error"}`,
						},
					],
				}
			}
		},
	)

	// Tool: Get Historical Weather Data
	server.tool(
		"get_historical_weather",
		"Get historical weather data for a specific WeatherXM station. Useful for analyzing past weather patterns and trends.",
		{
			station_id: z
				.string()
				.describe(
					"WeatherXM station ID. Example: 'station_123' or 'WXM123456'",
				),
			start_date: z
				.string()
				.describe(
					"Start date in ISO format (YYYY-MM-DD). Example: '2024-01-01'",
				),
			end_date: z
				.string()
				.describe(
					"End date in ISO format (YYYY-MM-DD). Example: '2024-01-07'",
				),
		},
		async ({ station_id, start_date, end_date }) => {
			try {
				const data = (await weatherxmApiRequest(
					`/stations/${station_id}/historical?start=${start_date}&end=${end_date}`,
					config.apiKey,
				)) as WeatherXMHistoricalResponse

				const historicalData = data.data || []

				if (historicalData.length === 0) {
					return {
						content: [
							{
								type: "text",
								text: `No historical data available for station ${station_id} between ${start_date} and ${end_date}`,
							},
						],
					}
				}

				let markdown = `# Historical Weather Data - ${station_id}\n\n`
				markdown += `Period: ${start_date} to ${end_date}\n`
				markdown += `Data points: ${historicalData.length}\n\n`

				// Calculate summary statistics
				const temperatures = historicalData.map(d => d.temperature)
				const maxTemp = Math.max(...temperatures)
				const minTemp = Math.min(...temperatures)
				const avgTemp = temperatures.reduce((a, b) => a + b, 0) / temperatures.length

				const precipTotal = historicalData.reduce((sum, d) => sum + d.precipitation_accumulated, 0)

				markdown += `## Summary Statistics\n\n`
				markdown += `**Temperature Range:** ${formatTemperature(minTemp)} to ${formatTemperature(maxTemp)}\n`
				markdown += `**Average Temperature:** ${formatTemperature(avgTemp)}\n`
				markdown += `**Total Precipitation:** ${formatPrecipitation(precipTotal)}\n\n`

				markdown += `## Recent Observations\n\n`

				// Show last 10 observations
				const recentData = historicalData.slice(-10)
				for (const obs of recentData) {
					const localTime = formatLocalTime(obs.timestamp)
					markdown += `**${localTime}:** ${formatTemperature(obs.temperature)}, ${obs.humidity.toFixed(0)}% humidity, ${formatWindSpeed(obs.wind_speed)}\n`
				}

				return {
					content: [{ type: "text", text: markdown }],
				}
			} catch (e: unknown) {
				return {
					content: [
						{
							type: "text",
							text: `Error: ${e instanceof Error ? e.message : "Unknown error"}`,
						},
					],
				}
			}
		},
	)

	// Tool: Get Weather Alerts
	server.tool(
		"get_weather_alerts",
		"Get weather alerts and warnings for a specific location or area. Shows active weather alerts from official sources.",
		{
			latitude: z
				.number()
				.describe(
					"Latitude in decimal degrees. Example: 40.7128 for New York City.",
				),
			longitude: z
				.number()
				.describe(
					"Longitude in decimal degrees. Example: -74.0060 for New York City.",
				),
		},
		async ({ latitude, longitude }) => {
			try {
				const data = (await weatherxmApiRequest(
					`/alerts?lat=${latitude}&lon=${longitude}`,
					config.apiKey,
				)) as WeatherXMAlertsResponse

				const alerts = data.alerts || []

				if (alerts.length === 0) {
					return {
						content: [
							{
								type: "text",
								text: `No active weather alerts for location ${latitude}, ${longitude}`,
							},
						],
					}
				}

				let markdown = `# Weather Alerts\n\n`
				markdown += `Location: ${latitude}, ${longitude}\n`
				markdown += `Active alerts: ${alerts.length}\n\n`

				for (const alert of alerts) {
					const effectiveTime = formatLocalTime(alert.effective)
					const expiresTime = formatLocalTime(alert.expires)
					
					markdown += `## ${alert.title}\n\n`
					markdown += `**Type:** ${alert.type}\n`
					markdown += `**Severity:** ${alert.severity}\n`
					markdown += `**Effective:** ${effectiveTime}\n`
					markdown += `**Expires:** ${expiresTime}\n`
					markdown += `**Areas:** ${alert.areas.join(', ')}\n\n`
					markdown += `${alert.description}\n\n`
					markdown += "---\n\n"
				}

				return {
					content: [{ type: "text", text: markdown }],
				}
			} catch (e: unknown) {
				return {
					content: [
						{
							type: "text",
							text: `Error: ${e instanceof Error ? e.message : "Unknown error"}`,
						},
					],
				}
			}
		},
	)

	// Tool: Find Weather Stations
	server.tool(
		"find_weather_stations",
		"Find WeatherXM weather stations near a location. Useful for discovering available weather stations in an area.",
		{
			latitude: z
				.number()
				.describe(
					"Latitude in decimal degrees. Example: 40.7128 for New York City.",
				),
			longitude: z
				.number()
				.describe(
					"Longitude in decimal degrees. Example: -74.0060 for New York City.",
				),
			radius: z
				.number()
				.optional()
				.default(50)
				.describe(
					"Search radius in kilometers (1-100, default 50).",
				),
		},
		async ({ latitude, longitude, radius }) => {
			try {
				const data = (await weatherxmApiRequest(
					`/stations?lat=${latitude}&lon=${longitude}&radius=${radius}`,
					config.apiKey,
				)) as WeatherXMStationsResponse

				const stations = data.stations || []

				if (stations.length === 0) {
					return {
						content: [
							{
								type: "text",
								text: `# WeatherXM Stations\n\nNo weather stations found within ${radius}km of ${latitude}, ${longitude}.`,
							},
						],
					}
				}

				let markdown = `# WeatherXM Stations Near ${latitude}, ${longitude}\n\n`
				markdown += `Found ${stations.length} station(s) within ${radius}km\n\n`

				for (const station of stations) {
					markdown += `## ${station.name}\n\n`
					markdown += `**Station ID:** ${station.id}\n`
					markdown += `**Name:** ${station.name}\n`
					markdown += `**Location:** ${station.location.lat.toFixed(4)}, ${station.location.lon.toFixed(4)}\n`
					markdown += `**Elevation:** ${station.location.elevation}m\n`
					markdown += `**Created:** ${formatLocalTime(station.createdAt)}\n`
					markdown += `**Cell Index:** ${station.cellIndex}\n`

					markdown += "\n---\n\n"
				}

				return {
					content: [{ type: "text", text: markdown }],
				}
			} catch (e: unknown) {
				return {
					content: [
						{
							type: "text",
							text: `Error: ${e instanceof Error ? e.message : "Unknown error"}`,
						},
					],
				}
			}
		},
	)

	// Tool: Search Weather Stations
	server.tool(
		"search_weather_stations",
		"Search for WeatherXM weather stations by name or location. Useful for finding specific stations or stations in particular areas.",
		{
			query: z
				.string()
				.describe(
					"Search query. Can be station name, city, or location description.",
				),
			page: z
				.number()
				.optional()
				.default(1)
				.describe(
					"Page number for pagination (default 1)",
				),
			limit: z
				.number()
				.optional()
				.default(10)
				.describe(
					"Number of results per page (1-50, default 10)",
				),
		},
		async ({ query, page, limit }) => {
			try {
				const data = (await weatherxmApiRequest(
					`/stations/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
					config.apiKey,
				)) as WeatherXMSearchResponse

				const results = data.results
				const stations = results.stations || []

				if (stations.length === 0) {
					return {
						content: [
							{
								type: "text",
								text: `No weather stations found matching "${query}"`,
							},
						],
					}
				}

				let markdown = `# Weather Station Search Results\n\n`
				markdown += `Query: "${query}"\n`
				markdown += `Found ${results.total} total stations\n`
				markdown += `Page ${results.page} of ${Math.ceil(results.total / results.limit)}\n\n`

				for (const station of stations) {
					markdown += `## ${station.name}\n\n`
					markdown += `**Station ID:** ${station.id}\n`
					markdown += `**Location:** ${station.location.lat.toFixed(4)}, ${station.location.lon.toFixed(4)}\n`
					markdown += `**Elevation:** ${station.location.elevation}m\n`
					markdown += `**Created:** ${formatLocalTime(station.createdAt)}\n`
					markdown += `**Cell Index:** ${station.cellIndex}\n`

					markdown += "\n---\n\n"
				}

				return {
					content: [{ type: "text", text: markdown }],
				}
			} catch (e: unknown) {
				return {
					content: [
						{
							type: "text",
							text: `Error: ${e instanceof Error ? e.message : "Unknown error"}`,
						},
					],
				}
			}
		},
	)

	// Tool: Get Weather Cells
	server.tool(
		"get_weather_cells",
		"Get WeatherXM weather cells (geographic areas) near a location. Shows the decentralized weather network coverage areas.",
		{
			latitude: z
				.number()
				.describe(
					"Latitude in decimal degrees. Example: 40.7128 for New York City.",
				),
			longitude: z
				.number()
				.describe(
					"Longitude in decimal degrees. Example: -74.0060 for New York City.",
				),
			radius: z
				.number()
				.optional()
				.default(50)
				.describe(
					"Search radius in kilometers (1-100, default 50).",
				),
		},
		async ({ latitude, longitude, radius }) => {
			try {
				const data = (await weatherxmApiRequest(
					`/cells?lat=${latitude}&lon=${longitude}&radius=${radius}`,
					config.apiKey,
				)) as WeatherXMCellsResponse

				const cells = data.cells || []

				if (cells.length === 0) {
					return {
						content: [
							{
								type: "text",
								text: `No weather cells found within ${radius}km of ${latitude}, ${longitude}`,
							},
						],
					}
				}

				let markdown = `# WeatherXM Cells Near ${latitude}, ${longitude}\n\n`
				markdown += `Found ${cells.length} cell(s) within ${radius}km\n\n`

				for (const cell of cells) {
					markdown += `## Cell ${cell.index}\n\n`
					markdown += `**Center:** ${cell.center.lat.toFixed(4)}, ${cell.center.lon.toFixed(4)}\n`
					markdown += `**Elevation:** ${cell.center.elevation}m\n`
					markdown += `**Stations:** ${cell.station_count}\n`

					markdown += "\n---\n\n"
				}

				return {
					content: [{ type: "text", text: markdown }],
				}
			} catch (e: unknown) {
				return {
					content: [
						{
							type: "text",
							text: `Error: ${e instanceof Error ? e.message : "Unknown error"}`,
						},
					],
				}
			}
		},
	)

	// Tool: Get Station Health
	server.tool(
		"get_station_health",
		"Get health and data quality information for a WeatherXM station. Useful for understanding the reliability of weather data from a specific station.",
		{
			station_id: z
				.string()
				.describe(
					"WeatherXM station ID. Example: 'station_123' or 'WXM123456'",
				),
		},
		async ({ station_id }) => {
			try {
				const data = (await weatherxmApiRequest(
					`/stations/${station_id}/latest`,
					config.apiKey,
				)) as WeatherXMLatestResponse

				const health = data.health
				const location = data.location

				let markdown = `# Station Health - ${station_id}\n\n`
				markdown += `**Location:** ${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}\n`
				markdown += `**Elevation:** ${location.elevation}m\n\n`

				// Health timestamp
				const healthTime = formatLocalTime(health.timestamp)
				markdown += `**Health Check:** ${healthTime}\n\n`

				// Data quality
				const dataQualityPercent = (health.data_quality.score * 100).toFixed(0)
				markdown += `**Data Quality Score:** ${dataQualityPercent}%\n`

				// Location quality
				const locationQualityPercent = (health.location_quality.score * 100).toFixed(0)
				markdown += `**Location Quality Score:** ${locationQualityPercent}%\n`
				markdown += `**Location Quality Reason:** ${health.location_quality.reason}\n\n`

				// Quality interpretation
				if (health.data_quality.score >= 0.8) {
					markdown += "**Overall Assessment:** Excellent data quality\n"
				} else if (health.data_quality.score >= 0.6) {
					markdown += "**Overall Assessment:** Good data quality\n"
				} else if (health.data_quality.score >= 0.4) {
					markdown += "**Overall Assessment:** Fair data quality\n"
				} else {
					markdown += "**Overall Assessment:** Poor data quality - use with caution\n"
				}

				return {
					content: [{ type: "text", text: markdown }],
				}
			} catch (e: unknown) {
				return {
					content: [
						{
							type: "text",
							text: `Error: ${e instanceof Error ? e.message : "Unknown error"}`,
						},
					],
				}
			}
		},
	)

	// Tool: Get Local Time for Station
	server.tool(
		"get_station_local_time",
		"Get the current local time for a WeatherXM station location. Shows what time it is right now at the station's location.",
		{
			station_id: z
				.string()
				.describe(
					"WeatherXM station ID. Example: 'station_123' or 'WXM123456'",
				),
		},
		async ({ station_id }) => {
			try {
				const data = (await weatherxmApiRequest(
					`/stations/${station_id}/latest`,
					config.apiKey,
				)) as WeatherXMLatestResponse

				const location = data.location
				const now = new Date()

				// Use the station's timezone from the observation timestamp
				const stationTimezone = new Date(data.observation.timestamp).getTimezoneOffset()
				const localTime = new Date(now.getTime() - (stationTimezone * 60 * 1000))

				const formattedTime = localTime.toLocaleString("en-US", {
					year: "numeric",
					month: "short",
					day: "numeric",
					hour: "numeric",
					minute: "2-digit",
					hour12: true,
				})

				return {
					content: [
						{
							type: "text",
							text: `Current local time at station ${station_id} (${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}): ${formattedTime}`,
						},
					],
				}
			} catch (e: unknown) {
				return {
					content: [
						{
							type: "text",
							text: `Error: ${e instanceof Error ? e.message : "Unknown error"}`,
						},
					],
				}
			}
		},
	)

	return server.server
}
