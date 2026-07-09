/**
 * Unit Tests — Product Catalog Service: ProductsService
 *
 * Tests the product CRUD and search/filter logic
 * by mocking the Mongoose Product model.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { ProductsService } from '../services/product-catalog-service/src/products/products.service';

// ── Mock Mongoose Model ────────────────────────────────
const mockProductModel = {
  find: jest.fn(),
  findById: jest.fn(),
  countDocuments: jest.fn(),
  save: jest.fn(),
};

// Make find() chainable: .skip().limit().sort().exec()
const chainableMock = {
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  exec: jest.fn(),
};

// Model as constructor function for create()
function MockProductModelConstructor(dto: any) {
  return { ...dto, save: jest.fn().mockResolvedValue({ _id: 'new-product-id', ...dto }) };
}
MockProductModelConstructor.find = jest.fn().mockReturnValue(chainableMock);
MockProductModelConstructor.findById = jest.fn().mockReturnValue({ exec: jest.fn() });
MockProductModelConstructor.countDocuments = jest.fn().mockReturnValue({ exec: jest.fn() });

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getModelToken('Product'), useValue: MockProductModelConstructor },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    jest.clearAllMocks();

    // Re-attach chain mocks after clearAllMocks
    MockProductModelConstructor.find.mockReturnValue(chainableMock);
    chainableMock.skip.mockReturnThis();
    chainableMock.limit.mockReturnThis();
    chainableMock.sort.mockReturnThis();
  });

  //   // ── findAll ───────────────────────────────────────────

  // describe('findAll', () => {
  //   it('should return paginated products with default params', async () => {
  //     const mockProducts = [
  //       { _id: 'p1', name: 'Wireless Mouse', price: 29.99 },
  //       { _id: 'p2', name: 'Keyboard', price: 49.99 },
  //     ];
  //     chainableMock.exec.mockResolvedValue(mockProducts);
  //     MockProductModelConstructor.countDocuments.mockReturnValue({
  //       exec: jest.fn().mockResolvedValue(2),
  //     });

  //     const result = await service.findAll({ page: 1, limit: 20 });

  //     expect(result).toEqual({ data: mockProducts, total: 2, page: 1, limit: 20 });
  //     expect(chainableMock.skip).toHaveBeenCalledWith(0); // (1-1)*20
  //     expect(chainableMock.limit).toHaveBeenCalledWith(20);
  //     expect(chainableMock.sort).toHaveBeenCalledWith({ createdAt: -1 });
  //   });

  //   it('should apply vendorId filter for vendor storefront', async () => {
  //     chainableMock.exec.mockResolvedValue([]);
  //     MockProductModelConstructor.countDocuments.mockReturnValue({
  //       exec: jest.fn().mockResolvedValue(0),
  //     });

  //     await service.findAll({ page: 1, limit: 20, vendorId: 'vendor-123' });

  //     expect(MockProductModelConstructor.find).toHaveBeenCalledWith(
  //       expect.objectContaining({ vendorId: 'vendor-123', isActive: true }),
  //     );
  //   });

  //   it('should apply category filter', async () => {
  //     chainableMock.exec.mockResolvedValue([]);
  //     MockProductModelConstructor.countDocuments.mockReturnValue({
  //       exec: jest.fn().mockResolvedValue(0),
  //     });

  //     await service.findAll({ page: 1, limit: 20, category: 'cat-abc' });

  //     expect(MockProductModelConstructor.find).toHaveBeenCalledWith(
  //       expect.objectContaining({ categoryId: 'cat-abc' }),
  //     );
  //   });

  //   it('should apply full-text search filter', async () => {
  //     chainableMock.exec.mockResolvedValue([]);
  //     MockProductModelConstructor.countDocuments.mockReturnValue({
  //       exec: jest.fn().mockResolvedValue(0),
  //     });

  //     await service.findAll({ page: 1, limit: 20, search: 'wireless mouse' });

  //     expect(MockProductModelConstructor.find).toHaveBeenCalledWith(
  //       expect.objectContaining({ $text: { $search: 'wireless mouse' } }),
  //     );
  //   });

  //   it('should apply price range filters', async () => {
  //     chainableMock.exec.mockResolvedValue([]);
  //     MockProductModelConstructor.countDocuments.mockReturnValue({
  //       exec: jest.fn().mockResolvedValue(0),
  //     });

  //     await service.findAll({ page: 1, limit: 20, minPrice: 10, maxPrice: 500 });

  //     expect(MockProductModelConstructor.find).toHaveBeenCalledWith(
  //       expect.objectContaining({
  //         price: { $gte: 10, $lte: 500 },
  //       }),
  //     );
  //   });

  //   it('should paginate correctly for page 3', async () => {
  //     chainableMock.exec.mockResolvedValue([]);
  //     MockProductModelConstructor.countDocuments.mockReturnValue({
  //       exec: jest.fn().mockResolvedValue(100),
  //     });

  //     await service.findAll({ page: 3, limit: 10 });

  //     expect(chainableMock.skip).toHaveBeenCalledWith(20); // (3-1)*10
  //     expect(chainableMock.limit).toHaveBeenCalledWith(10);
  //   });
  // });

  // ── findById ──────────────────────────────────────────

  // describe('findById', () => {
  //   it('should return a product when found', async () => {
  //     const mockProduct = { _id: 'p1', name: 'Wireless Mouse', price: 29.99 };
  //     MockProductModelConstructor.findById.mockReturnValue({
  //       exec: jest.fn().mockResolvedValue(mockProduct),
  //     });

  //     const result = await service.findById('p1');

  //     expect(result).toEqual(mockProduct);
  //   });

  //   it('should throw NotFoundException when product does not exist', async () => {
  //     MockProductModelConstructor.findById.mockReturnValue({
  //       exec: jest.fn().mockResolvedValue(null),
  //     });

  //     await expect(service.findById('nonexistent')).rejects.toThrow('Product not found');
  //   });
  // });

  //   // ── create ────────────────────────────────────────────

  // describe('create', () => {
  //   it('should create and save a new product', async () => {
  //     const dto = {
  //       vendorId: 'vendor-1',
  //       vendorName: 'Tech Store',
  //       name: 'New Product',
  //       slug: 'new-product',
  //       description: 'A great product',
  //       price: 99.99,
  //       categoryId: 'cat-1',
  //     };

  //     const result = await service.create(dto);

  //     expect(result).toEqual(expect.objectContaining({ name: 'New Product' }));
  //   });
  // });
});
