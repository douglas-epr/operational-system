"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import type { UserProfile } from "@/types/projects";
import { createClient } from "@/lib/supabase/client";
import Avatar from "@/components/ui/Avatar";
import {
  DashboardIcon,
  DocumentIcon,
  TargetIcon,
  FolderIcon,
  StarIcon,
  BriefcaseIcon,
  ChatIcon,
  BookIcon,
  UsersIcon,
  ChartIcon,
  UserIcon,
  IdeaIcon,
  MegaphoneIcon,
  SettingsIcon,
  ChevronUpIcon,
  LogoutIcon,
  SidebarCollapseIcon,
  SidebarExpandIcon,
} from "@/components/ui/icons";
import { useSidebar } from "./SidebarContext";

// Old hand-rolled SVGs replaced by lucide imports above. Pages should
// follow the same rule: never inline an `<svg>` for a concept that has
// a canonical icon — import from `@/components/ui/icons`.

const IconGrid       = DashboardIcon;
const IconDocument   = DocumentIcon;
const IconTarget     = TargetIcon;
const IconFolder     = FolderIcon;
const IconStar       = StarIcon;
const IconBriefcase  = BriefcaseIcon;
const IconChatBubble = ChatIcon;
const IconBook       = BookIcon;
const IconUsers      = UsersIcon;
const IconChart      = ChartIcon;
const IconPerson     = UserIcon;
const IconLightbulb  = IdeaIcon;
const IconMegaphone  = MegaphoneIcon;
const IconStarFilled = StarIcon;
const IconPrompt     = DocumentIcon;
const IconSettings   = SettingsIcon;

type SidebarRole =
  | "admin"
  | "manager"
  | "operational"
  | "developer"
  | "client"
  | "qa"
  | "referrer"
  | "lead";

type NavIcon = React.ComponentType<{ className?: string; strokeWidth?: number | string }>;

interface NavItem {
  label: string;
  href: string;
  icon: NavIcon;
  roles: readonly SidebarRole[];
  group?: "workspace" | "collaboration" | "operations" | "administration";
}

const ALL_STAFF_AND_CLIENTS: readonly SidebarRole[] = [
  "admin", "manager", "operational", "developer", "qa", "client",
];

const ADMIN_MANAGER: readonly SidebarRole[] = ["admin", "manager"];
const ADMIN_MANAGER_OPERATIONAL: readonly SidebarRole[] = [
  "admin", "manager", "operational",
];

const NAV_ITEMS: readonly NavItem[] = [
  // Workspace
  { label: "Dashboard",            href: "/dashboard",            icon: IconGrid,       roles: ADMIN_MANAGER,                         group: "workspace" },
  { label: "Projects",             href: "/projects",             icon: IconBriefcase,  roles: ALL_STAFF_AND_CLIENTS,                 group: "workspace" },
  { label: "Internal Projects",    href: "/internal-projects",    icon: IconFolder,     roles: ADMIN_MANAGER_OPERATIONAL,             group: "workspace" },
  { label: "Recommended Projects", href: "/recommended-projects", icon: IconStar,       roles: [...ADMIN_MANAGER_OPERATIONAL, "referrer"] as const, group: "workspace" },

  // Collaboration
  { label: "Chat",                 href: "/chat",                 icon: IconChatBubble, roles: ALL_STAFF_AND_CLIENTS,                 group: "collaboration" },
  { label: "Docs",                 href: "/docs",                 icon: IconBook,       roles: ALL_STAFF_AND_CLIENTS,                 group: "collaboration" },

  // Operations
  { label: "OKRs",                 href: "/okrs",                 icon: IconTarget,     roles: ADMIN_MANAGER_OPERATIONAL,             group: "operations" },
  { label: "SOPs",                 href: "/sops",                 icon: IconDocument,   roles: ALL_STAFF_AND_CLIENTS,                 group: "operations" },
  { label: "Talent Pool",          href: "/talent-pool",          icon: IconUsers,      roles: ADMIN_MANAGER_OPERATIONAL,             group: "operations" },
  { label: "Leads",                href: "/leads",                icon: IconChart,      roles: ADMIN_MANAGER_OPERATIONAL,             group: "operations" },
  { label: "Idea Refiner",         href: "/idea-refiner",         icon: IconLightbulb,  roles: ["admin","manager","operational","developer","client","lead"] as const, group: "operations" },
  { label: "Marketing",            href: "/marketing",            icon: IconMegaphone,  roles: ADMIN_MANAGER,                         group: "operations" },

  // Administration
  { label: "Users",                href: "/users",                icon: IconPerson,     roles: ADMIN_MANAGER,                         group: "administration" },
  { label: "Prompts",              href: "/prompts",              icon: IconPrompt,     roles: ADMIN_MANAGER,                         group: "administration" },
  { label: "Feedback",             href: "/feedback",             icon: IconStarFilled, roles: ["admin","manager","operational","developer","client","qa","referrer","lead"] as const, group: "administration" },
  { label: "Settings",             href: "/settings",             icon: IconSettings,   roles: ["admin","manager","operational","developer","client","qa","lead"] as const, group: "administration" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function Sidebar({ profile }: { profile: UserProfile | null }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { pinned, hovered, expanded, togglePin, setHovered } = useSidebar();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const userName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "User";
  const userRole = profile?.type
    ? profile.type.charAt(0).toUpperCase() + profile.type.slice(1)
    : "";

  // Close popover when clicking outside.
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  // Close popover when sidebar visually contracts (avoids drifting overlay).
  useEffect(() => {
    if (!expanded) setMenuOpen(false);
  }, [expanded]);

  // Hover handlers — delayed close so the popover and submenus don't
  // snap shut when the cursor crosses a sub-element edge.
  function handleMouseEnter() {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setHovered(true);
  }
  function handleMouseLeave() {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setHovered(false), 150);
  }
  // Cleanup pending timer on unmount.
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/signin");
  }

  // Resolve the visible nav for this role.
  const role = (profile?.type ?? null) as SidebarRole | null;
  const visible: readonly NavItem[] =
    role === "referrer"
      ? [
          { label: "Dashboard", href: "/recommended-projects", icon: IconGrid,       roles: ["referrer"] as const, group: "workspace" },
          { label: "Feedback",  href: "/feedback",             icon: IconStarFilled, roles: ["referrer"] as const, group: "administration" },
        ]
      : NAV_ITEMS.filter((item) => (role ? item.roles.includes(role) : false));

  const GROUPS = [
    { key: "workspace",      label: "Workspace"      },
    { key: "collaboration",  label: "Collaboration"  },
    { key: "operations",     label: "Operations"     },
    { key: "administration", label: "Administration" },
  ] as const;

  function renderItem({ label, href, icon: Icon }: NavItem) {
    const isActive =
      pathname === href ||
      (href !== "/dashboard" && pathname.startsWith(href));
    return (
      <Link
        key={href}
        href={href}
        title={!expanded ? label : undefined}
        aria-label={label}
        className={[
          "relative flex items-center rounded-md text-sm mb-0.5 transition-colors",
          expanded ? "gap-2.5 pl-4 pr-3 py-2" : "justify-center w-9 h-9 mx-auto",
          isActive
            ? "bg-accent-subtle text-text-primary font-medium"
            : "text-text-secondary hover:text-text-primary hover:bg-muted",
        ].join(" ")}
      >
        {isActive && expanded && (
          <span
            aria-hidden
            className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r bg-accent"
          />
        )}
        <Icon
          className={[
            "w-4 h-4 shrink-0 transition-colors",
            isActive ? "text-accent" : "text-text-muted",
          ].join(" ")}
          strokeWidth={1.8}
        />
        {expanded && <span className="truncate leading-none">{label}</span>}
      </Link>
    );
  }

  // Width strategy:
  // - pinned       → element width = layout var (--sidebar-width = 232 px)
  // - hovered only → element width = 232 px (overlay) but layout var stays 60 px
  // - default      → element width = layout var (60 px)
  const overlayWidth = "232px";
  const isOverlay = !pinned && hovered;
  const asideStyle: React.CSSProperties = {
    width: pinned ? "var(--sidebar-width)" : isOverlay ? overlayWidth : "var(--sidebar-width)",
    zIndex: isOverlay ? 30 : undefined,
    boxShadow: isOverlay ? "var(--shadow-lg)" : undefined,
    transition: "width 180ms ease, box-shadow 200ms ease",
  };

  return (
    <aside
      className="sidebar"
      style={asideStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* ── Logo + pin toggle ───────────────────────────────────── */}
      <div
        className={[
          "shrink-0 flex items-center pt-5 pb-4",
          expanded ? "gap-2.5 px-4" : "flex-col gap-3 px-2",
        ].join(" ")}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center text-white text-sm font-bold select-none leading-none font-display shrink-0">
            b
          </div>
          {expanded && (
            <span className="text-[15px] font-semibold text-text-primary tracking-tight font-display truncate">
              Blur Studio
            </span>
          )}
        </div>
        {/* Pin toggle — only meaningful when sidebar is open (pinned or hovered). */}
        {expanded && (
          <button
            type="button"
            onClick={togglePin}
            aria-label={pinned ? "Unpin sidebar" : "Pin sidebar open"}
            aria-pressed={pinned}
            title={pinned ? "Unpin sidebar" : "Pin sidebar open"}
            className={[
              "shrink-0 w-7 h-7 rounded-md inline-flex items-center justify-center transition-colors",
              pinned
                ? "text-accent hover:bg-muted"
                : "text-text-muted hover:text-text-primary hover:bg-muted",
            ].join(" ")}
          >
            {pinned ? (
              <SidebarCollapseIcon className="w-4 h-4" strokeWidth={1.8} />
            ) : (
              <SidebarExpandIcon className="w-4 h-4" strokeWidth={1.8} />
            )}
          </button>
        )}
      </div>

      {/* ── Navigation ────────────────────────────────────────────── */}
      <nav
        className={[
          "flex-1 overflow-y-auto pb-2",
          expanded ? "px-2" : "px-1",
        ].join(" ")}
      >
        {GROUPS.map(({ key, label }, idx) => {
          const items = visible.filter((i) => i.group === key);
          if (items.length === 0) return null;
          return (
            <div key={key}>
              {expanded ? (
                <div className={`px-3 mb-2 text-label ${idx === 0 ? "mt-1" : "mt-5"}`}>{label}</div>
              ) : (
                idx > 0 && <div aria-hidden className="my-3 mx-3 border-t border-border" />
              )}
              {items.map(renderItem)}
            </div>
          );
        })}
      </nav>

      {/* ── User ──────────────────────────────────────────────────── */}
      <div ref={menuRef} className="relative shrink-0 border-t border-border">
        {menuOpen && (
          <div
            className={[
              "absolute bottom-full mb-1 bg-elevated border border-border rounded-md overflow-hidden z-50 shadow-[var(--shadow-lg)]",
              expanded ? "left-2 right-2" : "left-full ml-1 w-44",
            ].join(" ")}
          >
            <Link
              href="/profile"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-muted transition-colors"
            >
              <UserIcon className="w-4 h-4 shrink-0" strokeWidth={1.8} />
              Profile
            </Link>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-text-secondary hover:text-danger-strong hover:bg-muted transition-colors border-t border-border/60"
            >
              <LogoutIcon className="w-4 h-4 shrink-0" strokeWidth={1.8} />
              Sign out
            </button>
          </div>
        )}

        <button
          onClick={() => setMenuOpen((v) => !v)}
          title={!expanded ? `${userName} · ${userRole}` : undefined}
          className={[
            "w-full flex items-center hover:bg-muted/50 transition-colors",
            expanded ? "px-3 py-3 gap-2.5" : "py-3 justify-center",
          ].join(" ")}
        >
          <Avatar
            name={userName}
            src={profile?.picture ?? null}
            size="md"
            variant={profile?.picture ? "muted" : "accent"}
          />
          {expanded && (
            <>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-xs font-semibold text-text-primary truncate leading-tight">
                  {userName}
                </p>
                <p className="text-[11px] text-text-muted truncate capitalize leading-tight mt-0.5">
                  {userRole}
                </p>
              </div>
              <ChevronUpIcon
                className={`w-3.5 h-3.5 shrink-0 text-text-muted transition-transform ${menuOpen ? "" : "rotate-180"}`}
                strokeWidth={2}
              />
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
