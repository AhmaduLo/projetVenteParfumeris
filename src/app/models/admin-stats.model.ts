/**
 * Modèles pour les statistiques admin
 */

export interface AdminStats {
  totalOrders: number;
  totalRevenue: string; // Format: "123.45"
  totalProducts: number;
  totalCustomers: number;
  recentOrders: number; // 7 derniers jours
  recentRevenue: string;
  averageOrderValue: string;
}

export interface StatsResponse {
  success: boolean;
  stats?: AdminStats;
  error?: string;
}
