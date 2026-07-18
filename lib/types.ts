export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type UrgencyLevel = "low" | "medium" | "high";

export interface Agent {
  id: number;
  name: string;
  email: string;
  role: string;
  team: string | null;
  is_active: boolean;
  availability: string
  created_at: string;
}

export interface Ticket {
  id: number;
  subject: string;
  body: string;
  source: string;
  status: TicketStatus;
  intent: string | null;
  confidence: number | null;
  needs_review: boolean;
  urgency: UrgencyLevel | null;
  sentiment: string | null;
  sentiment_score: number | null;
  assigned_team: string | null;
  assigned_agent_id: number | null;
  created_at: string;
  updated_at: string | null;
  resolved_at: string | null;
}

export interface TicketListResponse {
  tickets: Ticket[];
  total: number;
  page: number;
  page_size: number;
}

export interface ClassificationResult {
  intent: string;
  confidence: number;
  needs_review: boolean;
  all_scores: Record<string, number>;
  urgency: string;
  sentiment: string;
  sentiment_score: number;
  assigned_team: string;
  templates: TemplateSuggestion[];
}

export interface TemplateSuggestion {
  template_id: number;
  title: string;
  body: string;
  similarity: number;
}

export interface Metrics {
  total_tickets: number;
  open_tickets: number;
  resolved_tickets: number;
  needs_review: number;
  total_feedback: number;
  avg_confidence: number | null;
  feedback_accuracy: number | null;
  intent_distribution: Record<string, number>;
  urgency_distribution: Record<string, number>;
  sentiment_distribution: Record<string, number>;
  agent_workload: AgentWorkload[];
}

export interface AgentWorkload {
  agent_id: number;
  name: string;
  team: string;
  open_tickets: number;
}
export interface Ticket {
  id: number;
  subject: string;
  body: string;
  source: string;
  status: TicketStatus;
  intent: string | null;
  confidence: number | null;
  needs_review: boolean;
  urgency: UrgencyLevel | null;
  sentiment: string | null;
  sentiment_score: number | null;
  assigned_team: string | null;
  assigned_agent_id: number | null;
  initial_response_sent_at: string | null;
  initial_template_id: number | null;
  initial_response_text: string | null;
  resolved_by_agent_id: number | null;
  resolution_note: string | null;
  resolution_sent_at: string | null;
  created_at: string;
  updated_at: string | null;
  resolved_at: string | null;
}

export interface TrendPoint {
  date: string;
  count: number;
}