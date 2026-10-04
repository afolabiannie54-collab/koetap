import { Badge } from "@/components/ui/badge";

// Status pills. active = green, inactive = grey, suspended = red, warning = amber, info = blue.
const VARIANTS = {
  active: "default",
  inactive: "secondary",
  suspended: "destructive",
  warning: "warning",
  info: "info",
};

export function KBadge({ variant = "inactive", ...props }) {
  return <Badge variant={VARIANTS[variant] ?? variant} {...props} />;
}
