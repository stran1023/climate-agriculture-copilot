const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type AssetType = "fish_pond" | "chicken_coop" | "rice_field" | "fruit_orchard" | string;
export type RiskLevel = "low" | "medium" | "high" | "critical" | string;
export type AssetStatus = "healthy" | "needs_attention" | "critical" | string;
export type Priority = "low" | "medium" | "high" | string;
export type RecommendationStatus = "pending_approval" | "approved" | "rejected" | string;

export interface AssetOverview {
  asset_id: string;
  asset_type: AssetType;
  name: string;
  grid_x: number;
  grid_y: number;
  risk_level: RiskLevel;
  health_score: number;
  status: AssetStatus;
  latest_alert: string | null;
}

export interface AssetReading {
  asset_id: string;
  ts: string;
  water_temp_c: number | null;
  ph: number | null;
  dissolved_oxygen_mg_l: number | null;
  feed_level_pct: number | null;
  biomass_kg: number | null;
  air_temp_c: number | null;
  humidity_pct: number | null;
  water_l: number | null;
  egg_count: number | null;
  growth_stage: string | null;
  soil_moisture_pct: number | null;
  nitrogen_ppm: number | null;
  irrigation_status: string | null;
  disease_risk_pct: number | null;
  harvest_readiness_pct: number | null;
}

export interface AssetRisk {
  asset_id: string;
  ts: string;
  risk_type: string;
  risk_level: RiskLevel;
  notes: string;
}

export interface AssetHistory {
  asset_id: string;
  period_label: string;
  metric_name: string;
  metric_value: number;
  notes: string | null;
}

export interface AssetDetail {
  asset: AssetOverview;
  latest_reading: AssetReading | null;
  latest_risk: AssetRisk | null;
  prediction: AssetRisk | null;
  history: AssetHistory[];
}

export interface Recommendation {
  recommendation_id: string;
  asset_id: string;
  created_at: string;
  recommendation: string;
  reason: string;
  evidence: string;
  priority: Priority;
  expected_impact: string;
  confidence_pct: number;
  status: RecommendationStatus;
  approved_by: string | null;
  approved_at: string | null;
}

export interface WeatherReading {
  ts: string;
  rainfall_mm: number;
  temp_c: number;
  humidity_pct: number;
  wind_speed_kmh: number;
  source: string;
}

export interface AssetStatusSummary {
  asset_id: string;
  asset_type: AssetType;
  name: string;
  health_score: number;
  status: AssetStatus;
}

export interface DashboardSummary {
  date: string;
  farm_health_score: number;
  active_alerts: AssetRisk[];
  tasks_due_today: Recommendation[];
  asset_count: number;
  weather: WeatherReading | null;
  top_recommendations: Recommendation[];
  assets: AssetStatusSummary[];
}

export interface BriefingToday {
  date: string;
  approved_recommendations: Recommendation[];
  rejected_recommendations: Recommendation[];
  summary: string;
}

export interface CopilotAnswer {
  question: string;
  answer: string;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new ApiError(`${init?.method ?? "GET"} ${path} failed: ${res.status} ${detail}`, res.status);
  }
  return res.json() as Promise<T>;
}

export function getAssets(): Promise<AssetOverview[]> {
  return apiFetch<AssetOverview[]>("/assets");
}

export function getAssetDetail(assetId: string): Promise<AssetDetail> {
  return apiFetch<AssetDetail>(`/assets/${assetId}`);
}

export function getAssetRecommendations(assetId: string): Promise<Recommendation[]> {
  return apiFetch<Recommendation[]>(`/assets/${assetId}/recommendations`);
}

export function approveRecommendation(recommendationId: string, approvedBy = "farm_manager"): Promise<Recommendation> {
  return apiFetch<Recommendation>(`/recommendations/${recommendationId}/approve`, {
    method: "POST",
    body: JSON.stringify({ approved_by: approvedBy }),
  });
}

export function rejectRecommendation(recommendationId: string, approvedBy = "farm_manager"): Promise<Recommendation> {
  return apiFetch<Recommendation>(`/recommendations/${recommendationId}/reject`, {
    method: "POST",
    body: JSON.stringify({ approved_by: approvedBy }),
  });
}

export function getDashboardSummary(): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>("/dashboard/summary");
}

export function getBriefingToday(): Promise<BriefingToday> {
  return apiFetch<BriefingToday>("/briefing/today");
}

export function askCopilot(question: string): Promise<CopilotAnswer> {
  return apiFetch<CopilotAnswer>("/copilot/ask", {
    method: "POST",
    body: JSON.stringify({ question }),
  });
}
