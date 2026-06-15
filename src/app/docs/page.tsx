import { requirePageAccess, redirectForRole } from "@/lib/auth/page-gate";

/**
 * The Docs page has been retired from the navigation. Any direct hit to
 * `/docs` resolves the caller's role and bounces them to their role-home.
 * (The docs server actions + components remain in `src/app/docs/` because
 * the Ideas-Refiner Playbook step still imports the playbook-version
 * actions from `@/app/docs/actions`.)
 */
export default async function DocsPage() {
  const { role } = await requirePageAccess({ allowAll: true });
  redirectForRole(role);
}
