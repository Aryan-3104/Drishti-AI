const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

export interface Hotspot {
  junction_name: string;
  total_violations?: number;
  violation_count?: number;
  lat: number;
  lon: number;
  peak_hour?: number;
  top_vehicle?: string;
  main_road_pct?: number;
}

export interface PlanItem {
  junction_name: string;
  predicted_severity: number;
  lat: number;
  lon: number;
  peak_hour: number;
  top_vehicle: string;
  recommended_officers: number;
}

export interface PredictionResponse {
  junction: string;
  hour: number;
  day_of_week: number;
  predicted_severity: number;
  recommended_officers: number;
}

export interface SimulationResult {
  junction_name: string;
  adjusted_severity: number;
  recommended_officers: number;
  lat: number;
  lon: number;
}

export interface SimulationResponse {
  event_type: string;
  multiplier: number;
  hour: number;
  day_of_week: number;
  results: SimulationResult[];
}

export interface HourlyStat {
  hour: number;
  violation_count: number;
}

export interface HourlyStatsResponse {
  junction: string;
  stats: HourlyStat[];
}

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  /**
   * Get top hotspot junctions, optionally filtered by hour
   */
  async getHotspots(hour?: number, topN = 20): Promise<{ hotspots: Hotspot[]; hour: number | null; count: number }> {
    const params = new URLSearchParams();
    if (hour !== undefined && hour !== null) params.append('hour', hour.toString());
    params.append('top_n', topN.toString());
    return fetchJson<{ hotspots: Hotspot[]; hour: number | null; count: number }>(`/hotspots?${params.toString()}`);
  },

  /**
   * Get weekly calendar enforcement plans
   */
  async getPlan(dayOfWeek?: number, topN = 10): Promise<{ day_of_week?: number; plan?: PlanItem[]; weekly_plan?: Record<string, PlanItem[]> }> {
    const params = new URLSearchParams();
    if (dayOfWeek !== undefined && dayOfWeek !== null) params.append('day_of_week', dayOfWeek.toString());
    params.append('top_n', topN.toString());
    return fetchJson<any>(`/plan?${params.toString()}`);
  },

  /**
   * Dynamic XGBoost prediction for a junction and time slot
   */
  async predictSeverity(junction: string, hour: number, dayOfWeek: number): Promise<PredictionResponse> {
    return fetchJson<PredictionResponse>('/predict', {
      method: 'POST',
      body: JSON.stringify({ junction, hour, day_of_week: dayOfWeek }),
    });
  },

  /**
   * Run simulation scenario
   */
  async simulateEvent(eventType: string, hour: number, dayOfWeek: number, topN = 10): Promise<SimulationResponse> {
    return fetchJson<SimulationResponse>('/simulate', {
      method: 'POST',
      body: JSON.stringify({
        event_type: eventType,
        hour,
        day_of_week: dayOfWeek,
        top_n: topN,
      }),
    });
  },

  /**
   * Get hour-by-hour historical violation counts for a junction
   */
  async getHourlyStats(junction: string): Promise<HourlyStatsResponse> {
    const params = new URLSearchParams();
    params.append('junction', junction);
    return fetchJson<HourlyStatsResponse>(`/hourly-stats?${params.toString()}`);
  },

  /**
   * Get all hourly hotspots data from hourly_junction_stats.csv
   */
  async getAllHoursHotspots(): Promise<{ hotspots: AllHoursHotspot[] }> {
    return fetchJson<{ hotspots: AllHoursHotspot[] }>('/hotspots/all-hours');
  },

  /**
   * Get city-wide congestion summary: daily vehicle-hours lost + top impact junctions
   */
  async getCongestionSummary(): Promise<CongestionSummary> {
    return fetchJson<CongestionSummary>('/congestion-summary');
  },
};

export interface AllHoursHotspot {
  junction_name: string;
  hour: number;
  violation_count: number;
  congestion_impact: number;
  lat: number;
  lon: number;
}

export interface CongestionJunction {
  junction_name: string;
  total_congestion_impact: number;
  total_violations: number;
  daily_vehicle_hours_lost: number;
  main_road_pct: number;
  peak_hour: number;
  top_vehicle: string;
  lat: number;
  lon: number;
}

export interface CongestionSummary {
  daily_vehicle_hours_lost: number;
  top_impact_junctions: CongestionJunction[];
  note: string;
}

