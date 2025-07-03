# WeatherXM Pro MCP Server

A Model Context Protocol (MCP) server that provides comprehensive access to real-time weather data from the WeatherXM decentralized weather network worldwide.

## Features

- **Real-time Weather Data**: Get current weather conditions from any WeatherXM station
- **Weather Forecasting**: Access hourly and daily weather forecasts
- **Historical Data**: Retrieve historical weather data for trend analysis
- **Weather Alerts**: Get active weather alerts and warnings
- **Station Discovery**: Find weather stations near any location
- **Advanced Search**: Search for stations by name or location
- **Weather Cells**: Explore the decentralized weather network coverage
- **Data Quality Assessment**: Check the reliability of weather data from specific stations
- **Comprehensive Weather Metrics**: Temperature, humidity, wind, pressure, UV index, solar irradiance, and precipitation data
- **Global Coverage**: Access weather data from WeatherXM stations around the world

## Prerequisites

- Node.js 18 or higher
- A WeatherXM Pro API key (get one at [pro.weatherxm.com](https://pro.weatherxm.com))

## Installation

1. Clone this repository:
```bash
git clone <repository-url>
cd weatherxm-mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Build the server:
```bash
npm run build
```

## Configuration

The server requires a WeatherXM Pro API key to function. You'll need to provide this when connecting to the server.

### Getting a WeatherXM Pro API Key

1. Visit [pro.weatherxm.com](https://pro.weatherxm.com)
2. Sign up for a Pro account
3. Navigate to the API section
4. Generate an API key

## Available Tools

### 1. Get Current Weather (`get_current_weather`)

Retrieves the latest weather observation from a specific WeatherXM station.

**Parameters:**
- `station_id` (string): WeatherXM station ID (e.g., "station_123" or "WXM123456")

**Returns:**
- Temperature (Fahrenheit and Celsius)
- Feels like temperature
- Weather conditions
- Humidity percentage
- Dew point
- Wind speed and direction
- Wind gust (if available)
- Barometric pressure
- UV index
- Solar irradiance
- Precipitation rate and accumulated precipitation
- Data quality score

### 2. Get Hourly Forecast (`get_hourly_forecast`)

Retrieves detailed hourly weather forecasts for a specific WeatherXM station.

**Parameters:**
- `station_id` (string): WeatherXM station ID
- `hours` (number, optional): Number of hours to forecast (1-48, default: 48)

**Returns:**
- Hourly temperature predictions
- Precipitation probability
- Wind conditions
- Humidity and pressure forecasts
- UV index predictions

### 3. Get Daily Forecast (`get_daily_forecast`)

Retrieves daily weather forecasts including high/low temperatures and precipitation.

**Parameters:**
- `station_id` (string): WeatherXM station ID
- `days` (number, optional): Number of days to forecast (1-7, default: 7)

**Returns:**
- Daily high and low temperatures
- Precipitation probability and type
- Wind conditions
- Humidity and pressure forecasts
- UV index predictions

### 4. Get Historical Weather Data (`get_historical_weather`)

Retrieves historical weather data for trend analysis and pattern recognition.

**Parameters:**
- `station_id` (string): WeatherXM station ID
- `start_date` (string): Start date in ISO format (YYYY-MM-DD)
- `end_date` (string): End date in ISO format (YYYY-MM-DD)

**Returns:**
- Historical temperature data
- Precipitation records
- Wind and pressure history
- Summary statistics
- Recent observations

### 5. Get Weather Alerts (`get_weather_alerts`)

Retrieves active weather alerts and warnings for a specific location.

**Parameters:**
- `latitude` (number): Latitude in decimal degrees
- `longitude` (number): Longitude in decimal degrees

**Returns:**
- Active weather alerts
- Alert severity and type
- Effective and expiration times
- Affected areas
- Alert descriptions

### 6. Find Weather Stations (`find_weather_stations`)

Discovers WeatherXM stations near a specified location.

**Parameters:**
- `latitude` (number): Latitude in decimal degrees
- `longitude` (number): Longitude in decimal degrees
- `radius` (number, optional): Search radius in kilometers (default: 50, max: 100)

**Returns:**
- List of nearby stations with their details
- Station names, IDs, and locations
- Station creation dates
- Cell index information

### 7. Search Weather Stations (`search_weather_stations`)

Searches for WeatherXM stations by name or location description.

**Parameters:**
- `query` (string): Search query (station name, city, or location)
- `page` (number, optional): Page number for pagination (default: 1)
- `limit` (number, optional): Results per page (1-50, default: 10)

**Returns:**
- Matching stations with details
- Total result count
- Pagination information

### 8. Get Weather Cells (`get_weather_cells`)

Retrieves WeatherXM weather cells (geographic areas) near a location.

**Parameters:**
- `latitude` (number): Latitude in decimal degrees
- `longitude` (number): Longitude in decimal degrees
- `radius` (number, optional): Search radius in kilometers (default: 50, max: 100)

**Returns:**
- Weather cell information
- Cell center coordinates
- Station count per cell
- Network coverage details

### 9. Get Station Health (`get_station_health`)

Assesses the data quality and reliability of a specific WeatherXM station.

**Parameters:**
- `station_id` (string): WeatherXM station ID

**Returns:**
- Data quality score (0-100%)
- Location quality score and reason
- Overall assessment of data reliability
- Health check timestamp

### 10. Get Station Local Time (`get_station_local_time`)

Gets the current local time at a station's location.

**Parameters:**
- `station_id` (string): WeatherXM station ID

**Returns:**
- Current local time at the station's location

## Usage Examples

### Example 1: Get Current Weather
```
What's the weather like at station WXM123456?
```

### Example 2: Get Weather Forecast
```
What's the hourly forecast for station WXM789012 for the next 24 hours?
```

### Example 3: Get Historical Data
```
Show me the weather data for station WXM345678 from January 1st to January 7th, 2024
```

### Example 4: Check Weather Alerts
```
Are there any weather alerts for New York City (40.7128, -74.0060)?
```

### Example 5: Find Stations Near a Location
```
Find weather stations within 25km of New York City (40.7128, -74.0060)
```

### Example 6: Search for Stations
```
Search for weather stations in "San Francisco"
```

### Example 7: Check Station Data Quality
```
How reliable is the weather data from station station_789?
```

### Example 8: Get Local Time
```
What time is it at station WXM456789?
```

## Data Units

The server provides weather data in the following units:
- **Temperature**: Celsius (with Fahrenheit conversion)
- **Wind Speed**: m/s (with mph conversion)
- **Pressure**: hPa (with inHg conversion)
- **Precipitation**: mm (with inches conversion)
- **Solar Irradiance**: W/m²
- **UV Index**: dimensionless
- **Humidity**: percentage

## Error Handling

The server handles various error conditions:
- **401 Unauthorized**: Invalid API key
- **404 Not Found**: Station not found or no data available
- **429 Too Many Requests**: API rate limit exceeded
- **500 Internal Server Error**: WeatherXM service temporarily unavailable
- **Network Errors**: Connection issues

## Development

### Running in Development Mode
```bash
npm run dev
```

### Building for Production
```bash
npm run build
```

## API Reference

This server uses the WeatherXM Pro API. For detailed API documentation, visit:
- [WeatherXM Pro API Documentation](https://pro.weatherxm.com/documentation)

### Key Endpoints Used
- `GET /stations/{station_id}/latest` - Get latest observation
- `GET /stations/{station_id}/forecast/hourly` - Get hourly forecast
- `GET /stations/{station_id}/forecast/daily` - Get daily forecast
- `GET /stations/{station_id}/historical` - Get historical data
- `GET /alerts` - Get weather alerts
- `GET /stations` - Find nearby stations
- `GET /stations/search` - Search for stations
- `GET /cells` - Get weather cells

## License

ISC

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues related to:
- **WeatherXM Pro API**: Contact WeatherXM support
- **MCP Server**: Open an issue in this repository
- **Weather Data**: Check the data quality scores provided by the server 