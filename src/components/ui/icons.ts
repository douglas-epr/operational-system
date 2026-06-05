/**
 * Canonical icon catalog — single source of truth for every icon used
 * across the app.
 *
 * Pages MUST import from here, never directly from `lucide-react`.
 * This is what guarantees that "Edit" looks the same on `/projects` and
 * `/okrs`, that "Delete" never drifts, etc.
 *
 * If you need a new icon: add it here first with a semantic name. Resist
 * adding multiple icons for the same concept — pick one canonical glyph.
 */

export {
  // Row actions
  Pencil           as EditIcon,
  Trash2           as DeleteIcon,
  Copy             as DuplicateIcon,
  Archive          as ArchiveIcon,
  MoreHorizontal   as KebabIcon,
  MoreVertical     as KebabVerticalIcon,
  // Add / remove / close / confirm
  Plus             as AddIcon,
  Minus            as MinusIcon,
  X                as CloseIcon,
  Check            as CheckIcon,
  // Search & filter
  Search           as SearchIcon,
  Filter           as FilterIcon,
  SlidersHorizontal as SlidersIcon,
  // Navigation
  ChevronDown      as ChevronDownIcon,
  ChevronUp        as ChevronUpIcon,
  ChevronLeft      as ChevronLeftIcon,
  ChevronRight     as ChevronRightIcon,
  ArrowLeft        as BackIcon,
  ArrowRight       as ArrowRightIcon,
  ArrowUpRight     as ExternalArrowIcon,
  // Files / attachments
  Paperclip        as AttachmentIcon,
  Download         as DownloadIcon,
  Upload           as UploadIcon,
  File             as FileIcon,
  FileText         as DocumentIcon,
  Image            as ImageIcon,
  Video            as VideoIcon,
  Link             as LinkIcon,
  ExternalLink     as ExternalLinkIcon,
  // Communication
  MessageCircle    as ChatIcon,
  MessageSquare    as MessageIcon,
  Mail             as EmailIcon,
  Phone            as PhoneIcon,
  Bell             as BellIcon,
  Send             as SendIcon,
  // People
  User             as UserIcon,
  Users            as UsersIcon,
  UserPlus         as UserPlusIcon,
  // Time / calendar
  Calendar         as CalendarIcon,
  Clock            as ClockIcon,
  // Status / feedback
  AlertCircle      as AlertIcon,
  AlertTriangle    as WarningIcon,
  AlertTriangle    as AlertTriangleIcon,
  CheckCircle2     as SuccessIcon,
  XCircle          as ErrorIcon,
  Info             as InfoIcon,
  CircleDot        as DotIcon,
  // Misc
  Settings         as SettingsIcon,
  Eye              as EyeIcon,
  EyeOff           as EyeOffIcon,
  Star             as StarIcon,
  Sparkles         as SparkleIcon,
  Lightbulb        as IdeaIcon,
  Tag              as TagIcon,
  Folder           as FolderIcon,
  Briefcase        as BriefcaseIcon,
  Target           as TargetIcon,
  TrendingUp       as TrendUpIcon,
  TrendingDown     as TrendDownIcon,
  BarChart3        as ChartIcon,
  Megaphone        as MegaphoneIcon,
  Rocket           as RocketIcon,
  Globe            as GlobeIcon,
  LayoutDashboard  as DashboardIcon,
  Book             as BookIcon,
  LogOut           as LogoutIcon,
  GripVertical     as DragHandleIcon,
  // Theme toggle (light / dark / follow-system)
  Sun              as SunIcon,
  Moon             as MoonIcon,
  Monitor          as MonitorIcon,
  // Sidebar collapse / expand
  PanelLeftClose   as SidebarCollapseIcon,
  PanelLeftOpen    as SidebarExpandIcon,
  // Auth / credentials
  Lock             as LockIcon,
  KeyRound         as KeyIcon,
} from "lucide-react";

/**
 * Default icon size token. Most row-action / nav icons are 16px (w-4 h-4),
 * but exporting a constant lets specific call sites override consistently.
 */
export const ICON_SIZE = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
} as const;
