import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';

interface FindAllParams {
  page: number;
  limit: number;
  vendorId?: string;   // ← multi-vendor filter
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async findAll(params: FindAllParams) {
    const { page, limit, vendorId, category, search, minPrice, maxPrice } = params;
    const filter: FilterQuery<ProductDocument> = { isActive: true };

    // Vendor storefront filtering — core multi-vendor feature
    if (vendorId) {
      filter.vendorId = vendorId;
    }
    if (category) {
      filter.categoryId = category;
    }
    if (search) {
      filter.$text = { $search: search };
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }

    const [data, total] = await Promise.all([
      this.productModel
        .find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.productModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page, limit };
  }

  async findById(id: string) {
    const product = await this.productModel.findById(id).exec();
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(dto: CreateProductDto) {
    const product = new this.productModel(dto);
    return product.save();
  }
}
