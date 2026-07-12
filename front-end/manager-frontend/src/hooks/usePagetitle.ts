import { featureMap } from "@/providers/SideBarData";
import { usePathname } from "next/navigation";

export function usePageTitle() {
  const pathname = usePathname();
  const baseRoute = "/" + pathname.split("/")[1];
  const feature = featureMap[baseRoute] || [];
  const active = feature?.find((item) => item.href == pathname);
  return (
    active?.tooltip ||
    baseRoute.replace("/", "").charAt(0).toUpperCase() + baseRoute.slice(2)
  );
}
