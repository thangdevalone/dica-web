/**
 * Organization, Facilities, Stock Locations & Departments Domain Types
 */

export type FacilityType = "CENTRAL_WAREHOUSE" | "CENTRAL_KITCHEN" | "BRANCH";
export type StockLocationType = "PHYSICAL" | "IN_TRANSIT";
export type DepartmentType = "KITCHEN" | "TABLE" | "WAREHOUSE" | "INVENTORY" | "OTHER";

export interface Organization {
  id: string;
  code: string;
  name: string;
  active: boolean;
  createdAt: string;
}

export interface Facility {
  id: string;
  code: string;
  name: string;
  type: FacilityType;
  address?: string;
  active: boolean;
  createdAt: string;
}

export interface StockLocation {
  id: string;
  facility_id: string;
  facilityName?: string;
  code: string;
  name: string;
  type: StockLocationType;
  createdAt: string;
}

export interface Department {
  id: string;
  facility_id: string;
  facilityName?: string;
  stock_location_id?: string;
  code: string;
  name: string;
  type: DepartmentType;
  createdAt: string;
}
