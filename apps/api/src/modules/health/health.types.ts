export interface IHealthStatus {
  status: "ok";
}

export interface IReadinessStatus extends IHealthStatus {
  checks: { database: "ok" };
}
