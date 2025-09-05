/**
 * Weather Tool
 * Provides weather information and forecasts (mock implementation for template)
 */

import { ToolDefinition, ToolContext } from '../types/index.js';
import { log } from '../utils/logger.js';

/**
 * Weather tool implementation
 */
export const weatherTool: ToolDefinition = {
  name: 'weather',
  description: 'Get current weather information and forecasts for any location',
  inputSchema: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'Location name (city, country) or coordinates (lat,lon)',
      },
      units: {
        type: 'string',
        enum: ['metric', 'imperial', 'kelvin'],
        default: 'metric',
        description: 'Temperature units',
      },
      forecast: {
        type: 'boolean',
        default: false,
        description: 'Include 5-day forecast',
      },
    },
    required: ['location'],
  },
  handler: async (args: Record<string, unknown>, context: ToolContext) => {
    const {
      location,
      units = 'metric',
      forecast = false,
    } = args as {
      location: string;
      units?: 'metric' | 'imperial' | 'kelvin';
      forecast?: boolean;
    };

    try {
      log.withContext(context.requestId).info('Fetching weather data', {
        location,
        units,
        forecast,
      });

      // Mock weather data - in a real implementation, you'd call a weather API
      const weatherData = generateMockWeatherData(location, units, forecast);

      log.withContext(context.requestId).info('Weather data retrieved successfully', {
        location: weatherData.location,
        temperature: weatherData.current.temperature,
      });

      return {
        content: [
          {
            type: 'text',
            text: formatWeatherData(weatherData),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown weather service error';

      log
        .withContext(context.requestId)
        .error(
          'Weather data fetch failed',
          error instanceof Error ? error : new Error(String(error)),
          {
            location,
          }
        );

      return {
        content: [
          {
            type: 'text',
            text: `Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  },
};

/**
 * Weather data interface
 */
interface WeatherData {
  location: string;
  current: {
    temperature: number;
    feelsLike: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    description: string;
    icon: string;
  };
  forecast?: Array<{
    date: string;
    high: number;
    low: number;
    description: string;
    icon: string;
  }>;
  units: {
    temperature: string;
    windSpeed: string;
    pressure: string;
  };
}

/**
 * Generate mock weather data for demonstration
 */
function generateMockWeatherData(
  location: string,
  units: string,
  includeForecast: boolean
): WeatherData {
  const baseTemp = Math.floor(Math.random() * 40) + 5; // 5-45°C

  const unitLabels = {
    metric: { temperature: '°C', windSpeed: 'm/s', pressure: 'hPa' },
    imperial: { temperature: '°F', windSpeed: 'mph', pressure: 'inHg' },
    kelvin: { temperature: 'K', windSpeed: 'm/s', pressure: 'hPa' },
  };

  const descriptions = [
    'Sunny',
    'Cloudy',
    'Partly Cloudy',
    'Rainy',
    'Thunderstorms',
    'Snow',
    'Foggy',
  ];
  const description = descriptions[Math.floor(Math.random() * descriptions.length)] || 'Clear';

  const data: WeatherData = {
    location,
    current: {
      temperature: baseTemp,
      feelsLike: baseTemp + Math.floor(Math.random() * 6) - 3,
      humidity: Math.floor(Math.random() * 40) + 30,
      pressure: Math.floor(Math.random() * 100) + 1000,
      windSpeed: Math.floor(Math.random() * 20) + 5,
      description,
      icon: description.toLowerCase().replace(/\s+/g, '_'),
    },
    units: unitLabels[units as keyof typeof unitLabels] || unitLabels.metric,
  };

  if (includeForecast) {
    data.forecast = Array.from({ length: 5 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i + 1);
      const forecastDescription =
        descriptions[Math.floor(Math.random() * descriptions.length)] || 'Clear';

      return {
        date: date.toISOString().split('T')[0] || '',
        high: baseTemp + Math.floor(Math.random() * 10) - 5,
        low: baseTemp - Math.floor(Math.random() * 10) - 5,
        description: forecastDescription,
        icon: forecastDescription.toLowerCase().replace(/\s+/g, '_'),
      };
    });
  }

  return data;
}

/**
 * Format weather data for display
 */
function formatWeatherData(data: WeatherData): string {
  let output = `Weather for ${data.location}\n`;
  output += `Current: ${data.current.temperature}${data.units.temperature} (feels like ${data.current.feelsLike}${data.units.temperature})\n`;
  output += `Condition: ${data.current.description}\n`;
  output += `Humidity: ${data.current.humidity}%\n`;
  output += `Wind: ${data.current.windSpeed} ${data.units.windSpeed}\n`;
  output += `Pressure: ${data.current.pressure} ${data.units.pressure}\n`;

  if (data.forecast) {
    output += '\n5-Day Forecast:\n';
    data.forecast.forEach(day => {
      output += `${day.date}: ${day.high}/${day.low}${data.units.temperature} - ${day.description}\n`;
    });
  }

  return output;
}
