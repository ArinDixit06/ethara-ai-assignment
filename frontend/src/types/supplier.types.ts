export interface Supplier {
  id: string;
  name: string; // Company Name
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  paymentTerms: string | null; // Net 15 / Net 30 / Net 60 / COD
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
  };
}

export interface SupplierQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface CreateSupplierInput {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms?: string;
  notes?: string;
  isActive?: boolean;
}

export interface UpdateSupplierInput {
  name?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms?: string;
  notes?: string;
  isActive?: boolean;
}
