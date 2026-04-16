import { SPOT_CATEGORIES, type DateCourse, type SpotCategory } from "@/types/course";

function isSpotCategory(v: unknown): v is SpotCategory {
  return typeof v === "string" && (SPOT_CATEGORIES as string[]).includes(v);
}

function isValidSpot(raw: unknown): boolean {
  if (!raw || typeof raw !== "object") return false;
  const s = raw as Record<string, unknown>;
  return (
    typeof s.order === "number" &&
    Number.isFinite(s.order) &&
    typeof s.name === "string" &&
    s.name.trim().length > 0 &&
    isSpotCategory(s.category) &&
    typeof s.address === "string" &&
    typeof s.estimated_cost_per_person === "number" &&
    Number.isFinite(s.estimated_cost_per_person) &&
    typeof s.duration_minutes === "number" &&
    Number.isFinite(s.duration_minutes) &&
    s.duration_minutes >= 0 &&
    typeof s.description === "string" &&
    typeof s.lat === "number" &&
    Number.isFinite(s.lat) &&
    typeof s.lng === "number" &&
    Number.isFinite(s.lng) &&
    typeof s.tip === "string"
  );
}

export function validateDateCourse(data: unknown): DateCourse | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const bd = o.budget_breakdown;
  if (
    typeof o.course_title !== "string" ||
    !o.course_title.trim() ||
    typeof o.total_estimated_cost !== "number" ||
    !Number.isFinite(o.total_estimated_cost) ||
    typeof o.total_duration_hours !== "number" ||
    !Number.isFinite(o.total_duration_hours) ||
    !Array.isArray(o.spots) ||
    o.spots.length < 1 ||
    typeof o.course_vibe !== "string" ||
    !bd ||
    typeof bd !== "object"
  ) {
    return null;
  }
  const b = bd as Record<string, unknown>;
  if (
    typeof b.food !== "number" ||
    !Number.isFinite(b.food) ||
    typeof b.activity !== "number" ||
    !Number.isFinite(b.activity) ||
    typeof b.transport !== "number" ||
    !Number.isFinite(b.transport)
  ) {
    return null;
  }
  if (!o.spots.every(isValidSpot)) return null;
  return data as DateCourse;
}
