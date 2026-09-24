import type { WidgetInstance, DeviceMode } from "./dashboardStore";

export interface PublishedDashboard {
  id: string;
  title: string;
  widgets: WidgetInstance[];
  dateRange: "7D" | "30D" | "90D" | "1Y";
  deviceMode: DeviceMode;
  publishedAt: string;
}

const STORAGE_PREFIX = "pulse_dashboard_";
const INDEX_KEY = "pulse_dashboards_index";

/**
 * Persists dashboard state to LocalStorage under a dashboard id.
 */
export function savePublishedDashboard(data: {
  id?: string;
  title: string;
  widgets: WidgetInstance[];
  dateRange?: "7D" | "30D" | "90D" | "1Y";
  deviceMode?: DeviceMode;
}): PublishedDashboard {
  if (typeof window === "undefined") {
    throw new Error("LocalStorage is only available in the browser");
  }

  // Generate a clean slug id if not provided
  const slug = (data.title || "executive-dashboard")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 20);

  const id = data.id || `${slug || "dash"}-${Date.now().toString(36)}`;

  const record: PublishedDashboard = {
    id,
    title: data.title || "Executive Dashboard",
    widgets: data.widgets,
    dateRange: data.dateRange || "30D",
    deviceMode: data.deviceMode || "desktop",
    publishedAt: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(
      `${STORAGE_PREFIX}${id}`,
      JSON.stringify(record)
    );

    // Update published dashboard index registry
    const rawIndex = window.localStorage.getItem(INDEX_KEY);
    const indexList: { id: string; title: string; publishedAt: string }[] =
      rawIndex ? JSON.parse(rawIndex) : [];

    const existingIdx = indexList.findIndex((item) => item.id === id);
    if (existingIdx >= 0) {
      indexList[existingIdx] = {
        id,
        title: record.title,
        publishedAt: record.publishedAt,
      };
    } else {
      indexList.unshift({
        id,
        title: record.title,
        publishedAt: record.publishedAt,
      });
    }

    window.localStorage.setItem(
      INDEX_KEY,
      JSON.stringify(indexList.slice(0, 30))
    );
  } catch (err) {
    console.error("Failed to persist dashboard to LocalStorage:", err);
  }

  return record;
}

/**
 * Retrieves a published dashboard by id from LocalStorage.
 */
export function getPublishedDashboard(id: string): PublishedDashboard | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${id}`);
    if (!raw) return null;
    return JSON.parse(raw) as PublishedDashboard;
  } catch (err) {
    console.error(`Failed to load dashboard [${id}] from LocalStorage:`, err);
    return null;
  }
}

/**
 * Retrieves all registered published dashboard summaries.
 */
export function getAllPublishedDashboards(): {
  id: string;
  title: string;
  publishedAt: string;
}[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

