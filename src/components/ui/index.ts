/**
 * Single import path for the design-system primitives.
 *
 *   import {
 *     Button, IconButton, Input, Modal, ModalBody, ModalFooter,
 *     Avatar, AvatarStack, UserMultiSelect, Tabs, …
 *   } from "@/components/ui";
 *
 * The icon catalog lives at `@/components/ui/icons` (separate so the
 * type-checker doesn't try to bundle every lucide-react export through
 * here).
 */

export { default as Avatar, AvatarStack } from "./Avatar";
export type { AvatarSize } from "./Avatar";

export { default as Badge } from "./Badge";
export type { BadgeVariant, BadgeSize } from "./Badge";

export { default as Button } from "./Button";
export type { ButtonVariant, ButtonSize } from "./Button";

export { default as Card, CardHeader, CardBody, CardFooter } from "./Card";
export type { CardSize } from "./Card";

export { default as ConfirmDialog } from "./ConfirmDialog";

export { default as DataTable } from "./DataTable";
export type { DataTableColumn } from "./DataTable";

export { default as Drawer } from "./Drawer";

export { default as EmptyState } from "./EmptyState";

export { default as IconButton } from "./IconButton";
export type { IconButtonSize, IconButtonTone } from "./IconButton";

export { default as Input } from "./Input";
export type { InputProps } from "./Input";

export { default as KpiCard } from "./KpiCard";

export { default as Modal, ModalBody, ModalFooter } from "./Modal";
export type { ModalSize } from "./Modal";

export { default as NotificationDot } from "./NotificationDot";

export { default as Select } from "./Select";
export type { SelectProps, SelectOption } from "./Select";

export { default as Skeleton, SkeletonLines } from "./Skeleton";
export type { SkeletonVariant } from "./Skeleton";

export { default as StatusBadge, STATUS_LABEL } from "./StatusBadge";
export type { StatusKind } from "./StatusBadge";

export { default as Tabs } from "./Tabs";
export type { TabItem } from "./Tabs";

export { default as Textarea } from "./Textarea";
export type { TextareaProps } from "./Textarea";

export { default as Toolbar } from "./Toolbar";

export { default as UserMultiSelect } from "./UserMultiSelect";
export type { UserMultiSelectOption } from "./UserMultiSelect";
