// Service-order domain types and display labels.
import type {
  BillingStatus,
  OrderStatus,
  ServiceOrderRow,
} from "@/types/database";

export type ServiceOrder = ServiceOrderRow;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  requested: "Requested",
  confirmed: "Confirmed",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const BILLING_STATUS_LABELS: Record<BillingStatus, string> = {
  unpaid: "Unpaid",
  pending: "Pending",
  paid: "Paid",
  refunded: "Refunded",
  not_applicable: "Not applicable",
};
