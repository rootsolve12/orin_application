export type Role = "organizer" | "college_admin" | "platform_admin";
export type Actor = {
  id: string;
  full_name: string;
  email: string;
  email_verified: boolean;
  college_id: string | null;
  verification_status: string;
  year: number | null;
  branch: string | null;
  degree_level: string | null;
  roles: { role: Role; college_id: string | null }[];
};
export type CampusEvent = {
  id: string;
  college_id: string;
  organizer_id: string;
  title: string;
  description: string;
  genre: string;
  venue: string;
  visibility: "public" | "partner" | "college_only";
  status: "draft" | "published" | "ongoing" | "completed" | "cancelled";
  capacity: number;
  registration_deadline: string;
  starts_at: string;
  ends_at: string;
  version: number;
  eligibility: {
    years?: number[];
    branches?: string[];
    degreeLevels?: string[];
  };
};
export type Registration = {
  id: string;
  event_id: string;
  user_id: string;
  status: string;
  title?: string;
  qr_token?: string;
  created_at: string;
};
export type Notice = {
  id: string;
  kind: string;
  payload: Record<string, unknown>;
  read_at: string | null;
};
export type Certificate = {
  code: string;
  title: string;
  full_name: string;
  award: string;
  issued_at: string;
  revoked_at: string | null;
};
export type Review = {
  id: string;
  kind: "college" | "organizer";
  user_id: string;
  college_id: string;
  full_name: string;
  email: string;
  evidence: string;
  status: string;
};
export type Json = Record<string, unknown>;
// Transport is shared; UI and credential storage are platform-specific.
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export class OrinClient {
  constructor(
    public baseUrl: string,
    public token: string | null = null,
  ) {}
  async request<T>(path: string, method = "GET", body?: unknown): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: "no-store",
        signal: controller.signal,
      });
      if (response.status === 204) return undefined as T;
      const payload = await response.json();
      if (!response.ok)
        throw new ApiError(response.status, payload.error || "Request failed");
      return payload as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}
