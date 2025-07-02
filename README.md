# WeatherXM MCP Server

[![smithery badge](https://smithery.ai/badge/@oharkins/weatherxm-mcp-server)](https://smithery.ai/server/@oharkins/weatherxm-mcp-server)

A Model Context Protocol (MCP) server for WeatherXM data, built with FastAPI and the MCP framework. This server provides various weather-related tools that can be used by AI assistants to retrieve current weather conditions, forecasts, air quality data, and more from the WeatherXM decentralized weather network.

## Features

- Current weather conditions using coordinates
- Weather forecasts (1-7 days)
- Historical weather data
- Air quality information
- Astronomy data (sunrise, sunset, moon phases)
- Nearby weather stations
- Station-specific weather data
- Location search and timezone information

## Requirements

- Python 3.13+
- [uv](https://github.com/astral-sh/uv) package manager
- [WeatherXM Pro](https://pro.weatherxm.com/) API key

## Installation

### Installing via Smithery

To install WeatherXM MCP Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@oharkins/weatherxm-mcp-server):

```bash
npx -y @smithery/cli install @oharkins/weatherxm-mcp-server --client claude
```

### Manual Installation
1. Clone this repository:
   ```
   git clone https://github.com/yourusername/weatherxm-mcp-server.git
   cd weatherxm-mcp-server
   ```

2. Install dependencies using uv:
   ```
   uv venv
   uv pip install -e .
   ```

3. Create a `.env` file in the project root with your WeatherXM API key:
   ```
   WEATHERXM_API_KEY=your_weatherxm_api_key_here
   ```

## Usage

Run the server:

```
python main.py
```

The server will start on http://localhost:8000 by default.

## API Endpoints

The server provides the following MCP tools:

- `weather_current(lat, lon)` - Get current weather for coordinates
- `weather_forecast(lat, lon, days)` - Get weather forecast (1-7 days)
- `weather_history(lat, lon, date)` - Get historical weather data
- `weather_stations(lat, lon, radius)` - Find nearby weather stations
- `weather_station_data(station_id, start_date, end_date)` - Get data from specific station
- `weather_airquality(lat, lon)` - Get air quality information
- `weather_astronomy(lat, lon, date)` - Get astronomy data
- `weather_location_search(query)` - Search for locations
- `weather_timezone(lat, lon)` - Get timezone information

## WeatherXM API

This server uses the [WeatherXM Pro API](https://pro.weatherxm.com/documentation) to provide hyper-local weather data from the world's first Decentralized Weather Network. WeatherXM uses a network of community-owned weather stations to provide accurate, real-time weather information.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
