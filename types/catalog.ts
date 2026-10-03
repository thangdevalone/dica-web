/**
 * Catalog, Ingredients, Units, Conversions & Suppliers Domain Types
 */

export interface Unit {
  id: string;
  code: string;
  name: string;
  symbol: string;
  description?: string;
}

export interface UnitConversion {
  id: string;
  ingredient_id?: string;
  ingredientName?: string;
  from_unit_id: string;
  fromUnitName: string;
  to_unit_id: string;
  toUnitName: string;
  factor: number;
}

export interface IngredientGroup {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface Ingredient {
  id: string;
  code: string;
  name: string;
  group_id: string;
  groupName?: string;
  base_unit_id: string;
  baseUnitSymbol?: string;
  cost_price: number;
  min_stock: number;
  max_stock: number;
  shelf_life_days: number;
  barcode?: string;
  active: boolean;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  lead_time_days: number;
  tax_code: string;
  rating: number;
  active: boolean;
}

export interface SupplierIngredient {
  id: string;
  supplier_id: string;
  supplierName?: string;
  ingredient_id: string;
  ingredientName?: string;
  purchasing_unit_id: string;
  purchasingUnitSymbol?: string;
  price: number;
  moq: number;
  is_preferred: boolean;
}
