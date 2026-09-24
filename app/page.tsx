import { redirect } from "next/navigation";

/** Redirect root to the dashboard */
export default function RootPage() {
  redirect("/dashboard");
}
