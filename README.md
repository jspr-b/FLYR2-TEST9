# Flight Dashboard - KLM Operations

A real-time flight operations dashboard for KLM flights at Schiphol Airport, built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Real-time Flight Data**: Integrated with Schiphol API for live flight information
- **KLM Operations Focus**: Filtered view of KLM flights with detailed analytics
- **Timezone Handling**: Proper GMT to UTC+3 conversion for accurate delay calculations
- **Interactive Dashboards**: Multiple views including aircraft performance, delay trends, and gate utilization
- **Responsive Design**: Modern UI that works on all devices

## API Integration

This dashboard integrates with the **Schiphol Public Flights API** to provide real-time flight data.

### API Credentials

The application uses the following Schiphol API credentials:
- **Application Key**: `bf01b2f53e73e9db0115b8f2093c97b9`
- **Application ID**: `cfcad115`

### Environment Variables

For production deployment, you can set these as environment variables:

```bash
SCHIPHOL_APP_KEY=your_app_key_here
SCHIPHOL_APP_ID=your_app_id_here
```

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd flight-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables** (optional)
   Create a `.env.local` file:
   ```bash
   SCHIPHOL_APP_KEY=bf01b2f53e73e9db0115b8f2093c97b9
   SCHIPHOL_APP_ID=cfcad115
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## API Endpoints

### Flights API
- `GET /api/flights` - Fetch KLM flights with filtering (10-minute cached)
- `POST /api/flights` - Save flights to database

### Dashboard APIs
- `GET /api/dashboard/kpis` - Dashboard key performance indicators
- `GET /api/delay-trends/hourly` - Hourly delay trends
- `GET /api/gates-terminals/summary` - Gate and terminal utilization
- `GET /api/aircraft/performance` - Aircraft performance metrics

### Cache Management
- `GET /api/cache` - Get cache statistics and status
- `DELETE /api/cache` - Clear all cached data

## Data Flow

1. **Schiphol API**: Fetches real-time flight data
2. **Timezone Conversion**: Converts GMT times to local timezone (UTC+3)
3. **Data Processing**: Calculates delays, performance metrics, and analytics
4. **Frontend Display**: Shows interactive dashboards with real-time updates

## Key Components

- **Dashboard KPIs**: Real-time flight statistics and performance metrics
- **Aircraft Performance**: Analysis of different aircraft types and their delay performance
- **Delay Trends**: Hourly analysis of delays and variance patterns
- **Gate Utilization**: Terminal and gate usage statistics

## Technologies Used

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Next.js API Routes, MongoDB
- **External APIs**: Schiphol Public Flights API
- **Timezone**: Custom timezone utilities for GMT to UTC+3 conversion

## API Rate Limits & Caching

The Schiphol API has rate limits. To minimize API calls and improve performance:

### 10-Minute Cache System
- **Automatic Caching**: API responses are cached for 10 minutes
- **Smart Cache Keys**: Based on flight direction, airline, and pagination mode
- **Automatic Cleanup**: Old cache entries are removed after 15 minutes
- **Cache Statistics**: Monitor cache usage via `/api/cache` endpoint
- **Complete Data**: Fetches all pages automatically to get complete flight data

### Error Handling
The application includes error handling for:
- Rate limit exceeded (429)
- Invalid credentials (401)
- Access forbidden (403)
- Invalid API parameters (400)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Deployment to Vercel

### Environment Variables Setup

**CRITICAL**: You must set these environment variables in your Vercel dashboard:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the following variables:

```bash
# Schiphol API Credentials
SCHIPHOL_APP_KEY=bf01b2f53e73e9db0115b8f2093c97b9
SCHIPHOL_APP_ID=cfcad115

# MongoDB Connection (use your production MongoDB URI)
MONGODB_URI=mongodb+srv://jasper:pindakaas@fly.83cukhh.mongodb.net/flyr-dashboard?retryWrites=true&w=majority&appName=fly
```

### Production Optimizations

The application includes several production optimizations:

- **10-minute API caching** to reduce Schiphol API calls
- **Automatic cache cleanup** to prevent memory leaks
- **Error handling** for API failures and timeouts
- **Fallback data** when external APIs are unavailable

### Troubleshooting Deployment Issues

If you experience long loading times or no data:

1. **Check Environment Variables**: Ensure all required env vars are set in Vercel
2. **Monitor API Limits**: Schiphol API has rate limits that may cause timeouts
3. **Check MongoDB Connection**: Verify your MongoDB Atlas cluster is accessible
4. **Review Vercel Logs**: Check function logs for specific error messages