/**
 * DICA Supply Chain & Inventory Management Platform
 * Domain Types Barrel File
 * 
 * Each domain has its own cleanly separated type definitions:
 * - common: API wrappers, pagination, filters
 * - organization: Organizations, facilities, stock locations, departments
 * - catalog: Ingredients, units, conversions, suppliers
 * - requests: Supply requests, order demands
 * - orders: Purchase orders & fulfillment orders
 * - delivery: Dispatches, receipts, discrepancies
 * - inventory: Stock balances, ledgers, transfers, stocktakes, adjustments
 * - operations: POS menu mappings, recipes, BOM, variances, alert rules
 * - auth: Users, roles, permissions, credentials
 * - audit: Audit logs, system events, notifications
 */

export * from "./common";
export * from "./organization";
export * from "./catalog";
export * from "./requests";
export * from "./orders";
export * from "./delivery";
export * from "./inventory";
export * from "./operations";
export * from "./auth";
export * from "./audit";
