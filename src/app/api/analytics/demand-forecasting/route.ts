import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '@/lib/services/AnalyticsService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const regionId = searchParams.get('region_id');
    const forecastHours = parseInt(searchParams.get('forecast_hours') || '24');
    const includeRecommendations = searchParams.get('include_recommendations') !== 'false';
    const confidenceLevel = parseFloat(searchParams.get('confidence_level') || '0.85');

    if (forecastHours > 168) { // Max 7 days
      return NextResponse.json(
        { error: 'forecast_hours cannot exceed 168 (7 days)' },
        { status: 400 }
      );
    }

    if (confidenceLevel < 0.1 || confidenceLevel > 1.0) {
      return NextResponse.json(
        { error: 'confidence_level must be between 0.1 and 1.0' },
        { status: 400 }
      );
    }

    const analyticsService = new AnalyticsService();
    const demandForecast = await analyticsService.getDemandForecasting(regionId || undefined);

    // Filter forecast data based on requested hours
    const filteredForecast = {
      ...demandForecast,
      hourly_forecast: demandForecast.hourly_forecast.slice(0, forecastHours)
    };

    // Remove recommendations if not requested
    if (!includeRecommendations) {
      delete filteredForecast.recommendations;
    }

    // Calculate summary statistics
    const totalPredictedDemand = filteredForecast.hourly_forecast.reduce(
      (sum, hour) => sum + hour.predicted_rides, 0
    );
    
    const averageConfidence = filteredForecast.hourly_forecast.reduce(
      (sum, hour) => sum + (hour.confidence_interval.upper - hour.confidence_interval.lower) / hour.predicted_rides, 0
    ) / filteredForecast.hourly_forecast.length;

    return NextResponse.json({
      success: true,
      data: filteredForecast,
      summary: {
        total_predicted_demand: totalPredictedDemand,
        average_hourly_demand: Math.round(totalPredictedDemand / forecastHours),
        peak_demand_hour: filteredForecast.hourly_forecast.reduce((max, hour, index) => 
          hour.predicted_rides > filteredForecast.hourly_forecast[max].predicted_rides ? index : max, 0),
        average_confidence: Math.round(averageConfidence * 100) / 100,
        forecast_period_hours: forecastHours
      },
      query_parameters: {
        region_id: regionId,
        forecast_hours: forecastHours,
        include_recommendations: includeRecommendations,
        confidence_level: confidenceLevel
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Demand forecasting API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get demand forecasting',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      region_ids, 
      forecast_type, 
      external_factors,
      model_parameters,
      output_format 
    } = body;

    if (region_ids && Array.isArray(region_ids) && region_ids.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 regions allowed per request' },
        { status: 400 }
      );
    }

    const validForecastTypes = ['hourly', 'daily', 'weekly'];
    if (forecast_type && !validForecastTypes.includes(forecast_type)) {
      return NextResponse.json(
        { error: `Invalid forecast_type. Must be one of: ${validForecastTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const analyticsService = new AnalyticsService();
    
    // If multiple regions requested, get forecasts for each
    let forecasts;
    if (region_ids && Array.isArray(region_ids)) {
      forecasts = await Promise.all(
        region_ids.map(regionId => analyticsService.getDemandForecasting(regionId))
      );
    } else {
      forecasts = [await analyticsService.getDemandForecasting()];
    }

    // Aggregate results if multiple regions
    let aggregatedForecast;
    if (forecasts.length > 1) {
      aggregatedForecast = {
        forecast_summary: {
          period: forecasts[0].forecast_summary.period,
          total_predicted_demand: forecasts.reduce((sum, f) => sum + f.forecast_summary.total_predicted_demand, 0),
          confidence_score: forecasts.reduce((sum, f) => sum + f.forecast_summary.confidence_score, 0) / forecasts.length,
          model_accuracy: forecasts.reduce((sum, f) => sum + f.forecast_summary.model_accuracy, 0) / forecasts.length,
          last_updated: new Date().toISOString()
        },
        hourly_forecast: forecasts[0].hourly_forecast, // Use first region as template
        regional_forecast: forecasts.flatMap(f => f.regional_forecast),
        external_factors: forecasts[0].external_factors,
        recommendations: {
          driver_positioning: forecasts.flatMap(f => f.recommendations.driver_positioning),
          pricing_strategy: forecasts.flatMap(f => f.recommendations.pricing_strategy)
        }
      };
    } else {
      aggregatedForecast = forecasts[0];
    }

    // Apply external factors if provided
    if (external_factors) {
      if (external_factors.weather_multiplier) {
        aggregatedForecast.hourly_forecast = aggregatedForecast.hourly_forecast.map(hour => ({
          ...hour,
          predicted_rides: Math.round(hour.predicted_rides * external_factors.weather_multiplier)
        }));
      }
      
      if (external_factors.event_multiplier) {
        aggregatedForecast.forecast_summary.total_predicted_demand = 
          Math.round(aggregatedForecast.forecast_summary.total_predicted_demand * external_factors.event_multiplier);
      }
    }

    return NextResponse.json({
      success: true,
      data: aggregatedForecast,
      metadata: {
        regions_analyzed: region_ids?.length || 1,
        forecast_type: forecast_type || 'hourly',
        model_version: 'v2.1',
        external_factors_applied: !!external_factors,
        last_model_training: '2025-09-01T00:00:00Z'
      },
      query_parameters: {
        region_ids,
        forecast_type,
        external_factors,
        model_parameters,
        output_format
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Demand forecasting API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate demand forecasting',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}