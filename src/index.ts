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
	WeatherXMHealthResponse,
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
		"Get current weather conditions for a specific WeatherXM station by station ID. Use this when you already know the station ID. For location-based queries, use 'get_weather_for_location' or 'search_weather_by_location' instead.",
		{
			station_id: z
				.string()
				.describe(
					"WeatherXM station ID. Example: '812c3670-1cff-11ed-9972-4f669f2d96bd'",
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

				// Data quality (health field is deprecated, may not be available)
				if (health) {
					markdown += `\n**Data Quality Score:** ${(health.data_quality.score * 100).toFixed(0)}%\n`
				} else {
					markdown += `\n**Data Quality:** Not available (use dedicated health endpoint)\n`
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

	// Tool: Get Hourly Forecast
	server.tool(
		"get_hourly_forecast",
		"Get hourly weather forecast for a specific WeatherXM station by station ID. Use this when you already know the station ID. For location-based queries, use 'get_weather_forecast_for_location' instead.",
		{
			station_id: z
				.string()
				.describe(
					"WeatherXM station ID. Example: '812c3670-1cff-11ed-9972-4f669f2d96bd'",
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
		"Get daily weather forecast for a specific WeatherXM station by station ID. Use this when you already know the station ID. For location-based queries, use 'get_weather_forecast_for_location' instead.",
		{
			station_id: z
				.string()
				.describe(
					"WeatherXM station ID. Example: '812c3670-1cff-11ed-9972-4f669f2d96bd'",
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

	// Tool: Get Stations Near Location
	server.tool(
		"get_stations_near",
		"Get a list of WeatherXM stations within a specified radius from a location. Uses the stations/near endpoint with radius in meters.",
		{
			lat: z
				.number()
				.describe(
					"Latitude of the center of the area in decimal degrees. Example: 40.7128 for New York City.",
				),
			lon: z
				.number()
				.describe(
					"Longitude of the center of the area in decimal degrees. Example: -74.0060 for New York City.",
				),
			radius: z
				.number()
				.default(10000)
				.describe(
					"Radius in meters for which stations are queried. Example: 5000 for 5km radius.",
				),
		},
		async ({ lat, lon, radius }) => {
			try {
				const data = (await weatherxmApiRequest(
					`/stations/near?lat=${lat}&lon=${lon}&radius=${radius}`,
					config.apiKey,
				)) as WeatherXMStationsResponse

				const stations = data.stations || []

				if (stations.length === 0) {
					return {
						content: [
							{
								type: "text",
								text: `# WeatherXM Stations Near ${lat}, ${lon}\n\nNo weather stations found within ${radius}m (${(radius/1000).toFixed(1)}km) of the specified location.`,
							},
						],
					}
				}

				let markdown = `# WeatherXM Stations Near ${lat}, ${lon}\n\n`
				markdown += `Found ${stations.length} station(s) within ${radius}m (${(radius/1000).toFixed(1)}km)\n\n`

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

	// Tool: Get Historical Observations
	server.tool(
		"get_historical_observations",
		"Get historical weather observations for a specific WeatherXM station on a specific date. Use this when you already know the station ID and want to see past weather data. Note: Only recent past dates are supported (typically last few days). Future dates are not supported.",
		{
			station_id: z
				.string()
				.describe(
					"WeatherXM station ID. Example: '812c3670-1cff-11ed-9972-4f669f2d96bd'",
				),
			date: z
				.string()
				.describe(
					"Date in YYYY-MM-DD format (UTC). Must be a recent past date (typically last few days), not in the future. Example: '2025-07-01'",
				),
		},
		async ({ station_id, date }) => {
			try {
				// Validate date format
				const dateRegex = /^\d{4}-\d{2}-\d{2}$/
				if (!dateRegex.test(date)) {
					return {
						content: [
							{
								type: "text",
								text: `Error: Invalid date format. Please use YYYY-MM-DD format (e.g., '2024-10-29')`,
							},
						],
					}
				}

				// Validate that the date is not in the future
				const requestedDate = new Date(date + 'T00:00:00Z')
				const today = new Date()
				today.setUTCHours(0, 0, 0, 0) // Set to start of today in UTC
				
				if (requestedDate > today) {
					return {
						content: [
							{
								type: "text",
								text: `Error: Cannot request historical data for future dates. The date ${date} is in the future. Please use a past date.`,
							},
						],
					}
				}

				// Validate that the date is not too far in the past (WeatherXM API has very short limits)
				const oneWeekAgo = new Date()
				oneWeekAgo.setUTCDate(oneWeekAgo.getUTCDate() - 7)
				oneWeekAgo.setUTCHours(0, 0, 0, 0)
				
				if (requestedDate < oneWeekAgo) {
					return {
						content: [
							{
								type: "text",
								text: `Error: The date ${date} is too far in the past. WeatherXM API has very strict limits on historical data and typically only provides data from the last few days. Please use a more recent date.`,
							},
						],
					}
				}

				console.log(`Requesting historical data for station ${station_id} on date ${date}`)
				
				const data = (await weatherxmApiRequest(
					`/stations/${station_id}/history?date=${date}`,
					config.apiKey,
				)) as WeatherXMHistoricalResponse

				console.log(`Historical data response received for station ${station_id}`)

				const observations = data.observations || []
				const location = data.location
				const health = data.health

				if (observations.length === 0) {
					return {
						content: [
							{
								type: "text",
								text: `No historical observations available for station ${station_id} on ${date}. This could be because:\n- The station has no data for this specific date\n- The station was not operational on this date\n- The data is not available in the WeatherXM API`,
							},
						],
					}
				}

				let markdown = `# Historical Weather Observations\n\n`
				markdown += `**Station ID:** ${station_id}\n`
				markdown += `**Date:** ${date}\n`
				markdown += `**Location:** ${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}\n`
				markdown += `**Elevation:** ${location.elevation}m\n\n`

				// Data quality information
				if (health) {
					markdown += `**Data Quality Score:** ${(health.data_quality.score * 100).toFixed(0)}%\n`
					markdown += `**Location Quality Score:** ${(health.location_quality.score * 100).toFixed(0)}%\n`
					if (health.location_quality.reason) {
						markdown += `**Location Quality Reason:** ${health.location_quality.reason}\n`
					}
					markdown += `**Health Timestamp:** ${formatLocalTime(health.timestamp)}\n\n`
				}

				markdown += `**Total Observations:** ${observations.length}\n\n`

				// Group observations by hour for better readability
				const hourlyGroups = new Map<string, typeof observations>()
				for (const obs of observations) {
					const hour = obs.timestamp.substring(0, 13) + ":00:00" // Group by hour
					if (!hourlyGroups.has(hour)) {
						hourlyGroups.set(hour, [])
					}
					hourlyGroups.get(hour)!.push(obs)
				}

				// Sort hours chronologically
				const sortedHours = Array.from(hourlyGroups.keys()).sort()

				for (const hour of sortedHours) {
					const hourObservations = hourlyGroups.get(hour)!
					const localTime = formatLocalTime(hour)
					
					markdown += `## ${localTime}\n\n`
					markdown += `**Observations in this hour:** ${hourObservations.length}\n\n`

					// Show the first observation of the hour as representative
					const representative = hourObservations[0]
					const windDirection = getWindDirection(representative.wind_direction)
					
					markdown += `**Temperature:** ${formatTemperature(representative.temperature)}\n`
					markdown += `**Feels Like:** ${formatTemperature(representative.feels_like)}\n`
					markdown += `**Conditions:** ${getWeatherIconDescription(representative.icon)}\n`
					markdown += `**Humidity:** ${representative.humidity.toFixed(0)}%\n`
					markdown += `**Dew Point:** ${formatTemperature(representative.dew_point)}\n`
					markdown += `**Wind:** ${formatWindSpeed(representative.wind_speed)} from ${windDirection} (${representative.wind_direction}°)\n`
					
					if (representative.wind_gust > representative.wind_speed) {
						markdown += `**Wind Gust:** ${formatWindSpeed(representative.wind_gust)}\n`
					}
					
					markdown += `**Pressure:** ${formatPressure(representative.pressure)}\n`
					
					if (representative.uv_index > 0) {
						markdown += `**UV Index:** ${representative.uv_index.toFixed(1)}\n`
					}
					
					if (representative.solar_irradiance > 0) {
						markdown += `**Solar Irradiance:** ${representative.solar_irradiance.toFixed(0)} W/m²\n`
					}
					
					if (representative.precipitation_rate > 0) {
						markdown += `**Precipitation Rate:** ${formatPrecipitation(representative.precipitation_rate)}/hr\n`
					}
					
					if (representative.precipitation_accumulated > 0) {
						markdown += `**Precipitation Accumulated:** ${formatPrecipitation(representative.precipitation_accumulated)}\n`
					}

					// If there are multiple observations in this hour, show a summary
					if (hourObservations.length > 1) {
						const temps = hourObservations.map(o => o.temperature)
						const minTemp = Math.min(...temps)
						const maxTemp = Math.max(...temps)
						markdown += `**Temperature Range:** ${formatTemperature(minTemp)} to ${formatTemperature(maxTemp)}\n`
					}

					markdown += "\n---\n\n"
				}

				return {
					content: [{ type: "text", text: markdown }],
				}
			} catch (e: unknown) {
				console.error(`Historical observations error:`, e)
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
