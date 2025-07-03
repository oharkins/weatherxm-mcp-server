// WeatherXM API Type Definitions

// --- Core Types ---

export interface Location {
	lat: number
	lon: number
	elevation: number
}

export interface Observation {
	timestamp: string
	temperature: number
	feels_like: number
	dew_point: number
	precipitation_rate: number
	precipitation_accumulated: number
	humidity: number
	wind_speed: number
	wind_gust: number
	wind_direction: number
	uv_index: number
	pressure: number
	solar_irradiance: number
	icon: string
}

export interface Health {
	timestamp: string
	data_quality: {
		score: number
	}
	location_quality: {
		score: number
		reason: 'LOCATION_NOT_VERIFIED' | 'LOCATION_UNKNOWN' | string
	}
}

// --- Station Types ---

export interface Station {
	id: string
	name: string
	cellIndex: string
	location: Location
	createdAt: string
}

export interface Cell {
	index: string
	center: Location
	station_count: number
}

// --- Forecast Types ---

export interface HourlyForecastData {
	timestamp: string
	precipitation: number
	precipitation_probability: number
	temperature: number
	icon: string
	wind_speed: number
	wind_direction: number
	humidity: number
	pressure: number
	uv_index: number
	feels_like: number
}

export interface DailyForecast {
	temperature_max: number
	temperature_min: number
	precipitation_probability: number
	precipitation_intensity: number
	humidity: number
	uv_index: number
	pressure: number
	icon: string
	precipitation_type: string
	wind_speed: number
	wind_direction: number
	timestamp: string
}

export interface Forecast {
	tz: string
	date: string
	hourly: HourlyForecastData[]
	daily: DailyForecast
}

export interface HyperlocalHourlyForecast {
	timestamp: string
	variable: string
	value: number
}

export interface HyperlocalForecast {
	tz: string
	date: string
	hourly: HyperlocalHourlyForecast[]
}

// --- API Response Types ---

export interface WeatherXMLatestResponse {
	observation: Observation
	health: Health
	location: Location
}

export interface WeatherXMStationsResponse {
	stations: Station[]
}

export interface WeatherXMHourlyForecastResponse {
	forecast: HourlyForecastData[]
}

export interface WeatherXMDailyForecastResponse {
	forecast: DailyForecast[]
}

export interface WeatherXMHistoricalResponse {
	data: HistoricalDataPoint[]
}

export interface WeatherXMAlertsResponse {
	alerts: WeatherAlert[]
}

export interface WeatherXMCellsResponse {
	cells: Cell[]
}

// --- Search and Discovery Types ---

export interface SearchResult {
	stations: Station[]
	total: number
	page: number
	limit: number
}

export interface WeatherXMSearchResponse {
	results: SearchResult
}

// WeatherXM Pro API Type Definitions

// --- Core Types ---

export interface Location {
	lat: number
	lon: number
	elevation: number
}

export interface Observation {
	timestamp: string
	temperature: number
	feels_like: number
	dew_point: number
	precipitation_rate: number
	precipitation_accumulated: number
	humidity: number
	wind_speed: number
	wind_gust: number
	wind_direction: number
	uv_index: number
	pressure: number
	solar_irradiance: number
	icon: string
}

export interface Health {
	timestamp: string
	data_quality: {
		score: number
	}
	location_quality: {
		score: number
		reason: 'LOCATION_NOT_VERIFIED' | 'LOCATION_UNKNOWN' | string
	}
}

// --- Station Types ---

export interface Station {
	id: string
	name: string
	cellIndex: string
	location: Location
	createdAt: string
}

export interface Cell {
	index: string
	center: Location
	station_count: number
}

// --- Forecast Types ---

export interface HourlyForecastData {
	timestamp: string
	precipitation: number
	precipitation_probability: number
	temperature: number
	icon: string
	wind_speed: number
	wind_direction: number
	humidity: number
	pressure: number
	uv_index: number
	feels_like: number
}

export interface DailyForecast {
	temperature_max: number
	temperature_min: number
	precipitation_probability: number
	precipitation_intensity: number
	humidity: number
	uv_index: number
	pressure: number
	icon: string
	precipitation_type: string
	wind_speed: number
	wind_direction: number
	timestamp: string
}

export interface Forecast {
	tz: string
	date: string
	hourly: HourlyForecastData[]
	daily: DailyForecast
}

export interface HyperlocalHourlyForecast {
	timestamp: string
	variable: string
	value: number
}

export interface HyperlocalForecast {
	tz: string
	date: string
	hourly: HyperlocalHourlyForecast[]
}

// --- Historical Data Types ---

export interface HistoricalDataPoint {
	timestamp: string
	temperature: number
	feels_like: number
	dew_point: number
	precipitation_rate: number
	precipitation_accumulated: number
	humidity: number
	wind_speed: number
	wind_gust: number
	wind_direction: number
	uv_index: number
	pressure: number
	solar_irradiance: number
	icon: string
}

// --- Weather Alerts Types ---

export interface WeatherAlert {
	id: string
	type: string
	severity: string
	title: string
	description: string
	effective: string
	expires: string
	areas: string[]
}

// --- API Response Types ---

export interface WeatherXMLatestResponse {
	observation: Observation
	health: Health
	location: Location
}

export interface WeatherXMStationsResponse {
	stations: Station[]
}

export interface WeatherXMHourlyForecastResponse {
	forecast: HourlyForecastData[]
}

export interface WeatherXMDailyForecastResponse {
	forecast: DailyForecast[]
}

export interface WeatherXMHistoricalResponse {
	data: HistoricalDataPoint[]
}

export interface WeatherXMAlertsResponse {
	alerts: WeatherAlert[]
}

export interface WeatherXMCellsResponse {
	cells: Cell[]
}

// --- Search and Discovery Types ---

export interface SearchResult {
	stations: Station[]
	total: number
	page: number
	limit: number
}

export interface WeatherXMSearchResponse {
	results: SearchResult
} 