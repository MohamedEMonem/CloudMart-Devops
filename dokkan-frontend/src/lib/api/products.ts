import api from './client';

export interface Product {
  _id: string;
  vendorId: string;
  vendorName: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
}

export async function getProducts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}): Promise<ProductsResponse> {
  const { data } = await api.get<ProductsResponse>('/products', { params });
  return data;
}
