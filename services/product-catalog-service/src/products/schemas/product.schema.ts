import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true, collection: 'products' })
export class Product {
  // ── Vendor ownership ────────────────────────────────────────────
  // Stores the VendorProfile.userId from the Identity Service.
  // This is a cross-service reference (not a Mongoose ObjectId ref)
  // because Product Catalog must NOT query the Identity DB directly.
  @Prop({ required: true, index: true })
  vendorId: string;

  @Prop({ required: true, trim: true })
  vendorName: string; // denormalized snapshot — avoids cross-service lookup on reads

  // ── Core product fields ─────────────────────────────────────────
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  @Prop({ type: Object, default: {} })
  attributes: Record<string, any>;

  @Prop({ default: true })
  isActive: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Compound index: vendor + category for storefront filtering
ProductSchema.index({ vendorId: 1, categoryId: 1 });
ProductSchema.index({ vendorId: 1, isActive: 1 });
ProductSchema.index({ slug: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ name: 'text', description: 'text' });
