// Weather data formatting utilities

/**
 * Format temperature in both Celsius and Fahrenheit
 */
export function formatTemperature(tempC: number): string {
	const tempF = (tempC * 9) / 5 + 32
	return `${tempF.toFixed(1)}°F (${tempC.toFixed(1)}°C)`
}

/**
 * Convert wind speed from m/s to mph
 */
export function formatWindSpeed(windSpeedMs: number): string {
	const windMph = (windSpeedMs * 2.237).toFixed(1)
	return `${windMph} mph`
}

/**
 * Convert pressure from hPa to inHg
 */
export function formatPressure(pressureHpa: number): string {
	const pressureInHg = (pressureHpa * 0.02953).toFixed(2)
	return `${pressureInHg} inHg`
}

/**
 * Convert precipitation from mm to inches
 */
export function formatPrecipitation(mm: number): string {
	const inches = (mm / 25.4).toFixed(2)
	return `${inches} in`
}

/**
 * Get wind direction as cardinal direction from degrees
 */
export function getWindDirection(degrees: number): string {
	const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
	const index = Math.round(degrees / 22.5) % 16
	return directions[index]
}

/**
 * Format date/time in a readable format
 */
export function formatLocalTime(timestamp: string): string {
	const date = new Date(timestamp)
	return date.toLocaleString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	})
}

/**
 * Format time ago from timestamp
 */
export function formatTimeAgo(timestamp: string): string {
	const observationDate = new Date(timestamp)
	const now = new Date()
	const diffMs = now.getTime() - observationDate.getTime()

	// Convert to minutes
	const diffMinutes = Math.floor(diffMs / (1000 * 60))

	if (diffMinutes < 1) {
		return "just now"
	} else if (diffMinutes < 60) {
		return `${diffMinutes}m ago`
	} else {
		const hours = Math.floor(diffMinutes / 60)
		const minutes = diffMinutes % 60
		if (minutes === 0) {
			return `${hours}h ago`
		} else {
			return `${hours}h ${minutes}m ago`
		}
	}
}

/**
 * Get weather icon description from icon name
 */
export function getWeatherIconDescription(icon: string): string {
	const iconMap: Record<string, string> = {
		"clear-day": "Clear",
		"clear-night": "Clear",
		"partly-cloudy-day": "Partly Cloudy",
		"partly-cloudy-night": "Partly Cloudy",
		"cloudy": "Cloudy",
		"fog": "Foggy",
		"rain": "Rainy",
		"sleet": "Sleet",
		"snow": "Snowy",
		"wind": "Windy",
		"thunderstorm": "Thunderstorm",
	}
	return iconMap[icon] || "Unknown"
} 