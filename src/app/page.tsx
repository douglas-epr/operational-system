import { redirect } from "next/navigation";

/**
 * Root route — redirect authenticated users to Sandbox Planner.
 * Unauthenticated users are intercepted by middleware and sent to /signin
 * before this component is ever rendered.
 */
export default function RootPage() {
  redirect("/ideas-refiner");
}
