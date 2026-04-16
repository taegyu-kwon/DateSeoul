export type SpotCategory =
  | "카페"
  | "식당"
  | "액티비티"
  | "문화"
  | "쇼핑";

export const SPOT_CATEGORIES: SpotCategory[] = [
  "카페",
  "식당",
  "액티비티",
  "문화",
  "쇼핑",
];

export interface CourseSpot {
  order: number;
  name: string;
  category: SpotCategory;
  address: string;
  estimated_cost_per_person: number;
  duration_minutes: number;
  description: string;
  lat: number;
  lng: number;
  tip: string;
}

export interface BudgetBreakdown {
  food: number;
  activity: number;
  transport: number;
}

export interface DateCourse {
  course_title: string;
  total_estimated_cost: number;
  total_duration_hours: number;
  spots: CourseSpot[];
  budget_breakdown: BudgetBreakdown;
  course_vibe: string;
}

export type TimeOfDay = "오전" | "오후" | "종일";

export const DATE_STYLES = [
  "액티비티",
  "로맨틱",
  "문화생활",
  "힐링",
] as const;

export type DateStyle = (typeof DATE_STYLES)[number];

export function isDateStyle(v: unknown): v is DateStyle {
  return typeof v === "string" && (DATE_STYLES as readonly string[]).includes(v);
}

export interface GenerateCourseRequest {
  budget: number;
  location: string;
  time_of_day: TimeOfDay;
  people_count: number;
  /** 없으면 스타일 제약 없이 코스 생성 */
  date_style?: DateStyle | null;
  /** Optional free-text hint (place, vibe, pacing). Max length enforced server-side. */
  keyword?: string | null;
}
