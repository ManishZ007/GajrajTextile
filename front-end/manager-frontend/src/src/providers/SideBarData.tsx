import {
  IconActiveWorkers,
  IconAddProduct,
  IconArchived,
  IconAssignWorker,
  IconAssets,
  IconCategories,
  IconCreateReport,
  IconCustomers,
  IconDashboard,
  IconHoldCases,
  IconImageUpload,
  IconInventory,
  IconLinkedOrders,
  IconLowStock,
  IconOrders,
  IconOrderStats,
  IconPendingActions,
  IconPerformance,
  IconPerformanceActions,
  IconPreview,
  IconPriceChanges,
  IconProducts,
  IconQualityCheck,
  IconQuickLinks,
  IconRecentOrders,
  IconReports,
  IconRevenue,
  IconSettings,
  IconShipping,
  IconStockHistory,
  IconSupport,
  IconSupportStats,
  IconTrackProgress,
  IconUpdateStock,
  IconVariants,
  IconVerification,
  IconWorkers,
  IconWorkload,
} from "./Icons";

export const featureMap: Record<
  string,
  { icon: React.FC; href: string; tooltip: string }[]
> = {
  "/dashboard": [
    { icon: IconDashboard, href: "/dashboard", tooltip: "Overview" },
    {
      icon: IconRevenue,
      href: "/dashboard/revenue",
      tooltip: "Revenue summary",
    },
    {
      icon: IconOrderStats,
      href: "/dashboard/order-stats",
      tooltip: "Order stats",
    },
    {
      icon: IconActiveWorkers,
      href: "/dashboard/active-workers",
      tooltip: "Active workers",
    },
    {
      icon: IconPendingActions,
      href: "/dashboard/pending-actions",
      tooltip: "Pending actions",
    },
    {
      icon: IconRecentOrders,
      href: "/dashboard/recent-orders",
      tooltip: "Recent orders",
    },
    {
      icon: IconQuickLinks,
      href: "/dashboard/quick-links",
      tooltip: "Quick links",
    },
  ],
  "/products": [
    { icon: IconProducts, href: "/products", tooltip: "All products" },
    { icon: IconAddProduct, href: "/products/add", tooltip: "Add product" },
    {
      icon: IconCategories,
      href: "/products/categories",
      tooltip: "Categories",
    },
    { icon: IconVariants, href: "/products/variants", tooltip: "Variants" },
    {
      icon: IconImageUpload,
      href: "/products/images",
      tooltip: "Image upload",
    },
    { icon: IconPreview, href: "/products/preview", tooltip: "Preview" },
    { icon: IconArchived, href: "/products/archived", tooltip: "Archived" },
    { icon: IconAssets, href: "/products/assets", tooltip: "3D Assets" },
  ],
  "/orders": [
    { icon: IconOrders, href: "/orders", tooltip: "All orders" },
    {
      icon: IconAssignWorker,
      href: "/orders/assign",
      tooltip: "Assign worker",
    },
    {
      icon: IconTrackProgress,
      href: "/orders/progress",
      tooltip: "Track progress",
    },
    {
      icon: IconQualityCheck,
      href: "/orders/quality",
      tooltip: "Quality check",
    },
    { icon: IconShipping, href: "/orders/shipping", tooltip: "Shipping" },
    { icon: IconHoldCases, href: "/orders/holds", tooltip: "Hold cases" },
  ],
  "/workers": [
    { icon: IconWorkers, href: "/workers", tooltip: "All workers" },
    {
      icon: IconVerification,
      href: "/workers/verification",
      tooltip: "Verification queue",
    },
    {
      icon: IconPerformance,
      href: "/workers/performance",
      tooltip: "Performance",
    },
    {
      icon: IconPerformanceActions,
      href: "/workers/actions",
      tooltip: "Performance actions",
    },
    { icon: IconWorkload, href: "/workers/workload", tooltip: "Workload view" },
  ],
  "/support": [
    { icon: IconSupport, href: "/support", tooltip: "All tickets" },
    {
      icon: IconLinkedOrders,
      href: "/support/linked-orders",
      tooltip: "Linked orders",
    },
    {
      icon: IconSupportStats,
      href: "/support/stats",
      tooltip: "Support stats",
    },
  ],
  "/reports": [
    { icon: IconReports, href: "/reports", tooltip: "All reports" },
    {
      icon: IconCreateReport,
      href: "/reports/create",
      tooltip: "Create report",
    },
    {
      icon: IconPriceChanges,
      href: "/reports/price-requests",
      tooltip: "Price changes",
    },
  ],
  "/inventory": [
    { icon: IconInventory, href: "/inventory", tooltip: "Stock overview" },
    {
      icon: IconLowStock,
      href: "/inventory/low-stock",
      tooltip: "Low stock alerts",
    },
    {
      icon: IconUpdateStock,
      href: "/inventory/update",
      tooltip: "Update stock",
    },
    {
      icon: IconStockHistory,
      href: "/inventory/history",
      tooltip: "Stock history",
    },
  ],
  "/customers": [
    { icon: IconCustomers, href: "/customers", tooltip: "All customers" },
  ],
  "/settings": [{ icon: IconSettings, href: "/settings", tooltip: "Profile" }],
};
