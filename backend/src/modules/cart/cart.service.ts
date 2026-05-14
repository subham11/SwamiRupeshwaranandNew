import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { DatabaseService, DATABASE_SERVICE } from '@/common/database';
import {
  AddToCartDto,
  UpdateCartItemDto,
  CartResponseDto,
  CartItemResponseDto,
  UpdateAddressDto,
  AddressResponseDto,
} from './dto';

// ============================================
// Entity Interfaces (DynamoDB Single-Table)
// ============================================

interface ProductVariant {
  id: string;
  label: string;
  labelHi?: string;
  price: number;
  originalPrice?: number;
}

interface CartItemEntity {
  PK: string; // CART#<userId>
  SK: string; // ITEM#<productId> or ITEM#<productId>#<variantId>
  GSI1PK: string; // CART
  GSI1SK: string; // USER#<userId>
  userId: string;
  productId: string;
  variantId?: string;
  variantLabel?: string;
  variantLabelHi?: string;
  quantity: number;
  // Denormalized product fields (snapshot at add time)
  title: string;
  titleHi?: string;
  slug: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  imageUrl?: string;
  stockStatus: string;
  createdAt: string;
  updatedAt: string;
}

interface ProductEntity {
  PK: string;
  SK: string;
  id: string;
  title: string;
  titleHi?: string;
  slug: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  variants?: ProductVariant[];
  images: string[];
  stockStatus: string;
  isActive: boolean;
}

interface UserAddressEntity {
  PK: string; // USER#<userId> (or USER#<email>)
  SK: string; // ADDRESS
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    @Inject(DATABASE_SERVICE)
    private readonly databaseService: DatabaseService,
  ) {}

  // ============================================
  // Cart Operations
  // ============================================

  /** DynamoDB SK for a cart line. Variant products get a per-variant line. */
  private itemSk(productId: string, variantId?: string): string {
    return variantId ? `ITEM#${productId}#${variantId}` : `ITEM#${productId}`;
  }

  async addToCart(userId: string, dto: AddToCartDto): Promise<CartResponseDto> {
    const quantity = dto.quantity || 1;

    // Fetch the product to get current info
    const product = await this.databaseService.get<ProductEntity>(
      `PRODUCT#${dto.productId}`,
      `PRODUCT#${dto.productId}`,
    );

    if (!product) {
      throw new NotFoundException(`Product with ID ${dto.productId} not found`);
    }

    if (!product.isActive) {
      throw new BadRequestException('This product is not available');
    }

    if (product.stockStatus === 'out_of_stock') {
      throw new BadRequestException('This product is out of stock');
    }

    // Resolve variant (if the product has size/price variants)
    let variant: ProductVariant | undefined;
    if (product.variants && product.variants.length > 0) {
      if (!dto.variantId) {
        throw new BadRequestException('Please select a size for this product');
      }
      variant = product.variants.find((v) => v.id === dto.variantId);
      if (!variant) {
        throw new BadRequestException('Selected size is not available');
      }
    } else if (dto.variantId) {
      throw new BadRequestException('This product does not have selectable sizes');
    }

    const price = variant ? variant.price : product.price;
    const originalPrice = variant ? variant.originalPrice : product.originalPrice;
    const discountPercent =
      originalPrice && originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : product.discountPercent;
    const sk = this.itemSk(dto.productId, variant?.id);

    // Check if this exact line (product + variant) is already in cart
    const existing = await this.databaseService.get<CartItemEntity>(`CART#${userId}`, sk);

    const now = new Date().toISOString();

    if (existing) {
      // Update quantity + refresh price snapshot
      const newQty = existing.quantity + quantity;
      await this.databaseService.update('CART', {
        key: { PK: `CART#${userId}`, SK: sk },
        updateExpression:
          'SET quantity = :qty, updatedAt = :now, price = :price, title = :title, stockStatus = :stockStatus',
        expressionAttributeValues: {
          ':qty': newQty,
          ':now': now,
          ':price': price,
          ':title': product.title,
          ':stockStatus': product.stockStatus,
        },
      });
    } else {
      // Add new item
      const imageUrl = product.images && product.images.length > 0 ? product.images[0] : undefined;

      const cartItem: CartItemEntity = {
        PK: `CART#${userId}`,
        SK: sk,
        GSI1PK: 'CART',
        GSI1SK: `USER#${userId}`,
        userId,
        productId: dto.productId,
        variantId: variant?.id,
        variantLabel: variant?.label,
        variantLabelHi: variant?.labelHi,
        quantity,
        title: product.title,
        titleHi: product.titleHi,
        slug: product.slug,
        price,
        originalPrice,
        discountPercent,
        imageUrl,
        stockStatus: product.stockStatus,
        createdAt: now,
        updatedAt: now,
      };

      await this.databaseService.put(cartItem);
    }

    return this.getCart(userId);
  }

  async getCart(userId: string): Promise<CartResponseDto> {
    const result = await this.databaseService.query<CartItemEntity>('CART', {
      keyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      expressionAttributeValues: {
        ':pk': `CART#${userId}`,
        ':skPrefix': 'ITEM#',
      },
    });

    const items: CartItemResponseDto[] = result.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      variantLabel: item.variantLabel,
      variantLabelHi: item.variantLabelHi,
      title: item.title,
      titleHi: item.titleHi,
      slug: item.slug,
      price: item.price,
      originalPrice: item.originalPrice,
      discountPercent: item.discountPercent,
      imageUrl: item.imageUrl,
      quantity: item.quantity,
      stockStatus: item.stockStatus,
      subtotal: item.price * item.quantity,
    }));

    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    const totalAmount = items.reduce((sum, i) => sum + i.subtotal, 0);

    return {
      items,
      totalItems,
      totalAmount,
      currency: 'INR',
    };
  }

  async updateCartItem(
    userId: string,
    productId: string,
    dto: UpdateCartItemDto,
    variantId?: string,
  ): Promise<CartResponseDto> {
    const sk = this.itemSk(productId, variantId);
    const existing = await this.databaseService.get<CartItemEntity>(`CART#${userId}`, sk);

    if (!existing) {
      throw new NotFoundException('Item not found in cart');
    }

    await this.databaseService.update('CART', {
      key: { PK: `CART#${userId}`, SK: sk },
      updateExpression: 'SET quantity = :qty, updatedAt = :now',
      expressionAttributeValues: {
        ':qty': dto.quantity,
        ':now': new Date().toISOString(),
      },
    });

    return this.getCart(userId);
  }

  async removeFromCart(
    userId: string,
    productId: string,
    variantId?: string,
  ): Promise<CartResponseDto> {
    await this.databaseService.delete(`CART#${userId}`, this.itemSk(productId, variantId));
    return this.getCart(userId);
  }

  async clearCart(userId: string): Promise<CartResponseDto> {
    const result = await this.databaseService.query<CartItemEntity>('CART', {
      keyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      expressionAttributeValues: {
        ':pk': `CART#${userId}`,
        ':skPrefix': 'ITEM#',
      },
    });

    // Delete all cart items
    for (const item of result.items) {
      await this.databaseService.delete(item.PK, item.SK);
    }

    return { items: [], totalItems: 0, totalAmount: 0, currency: 'INR' };
  }

  // ============================================
  // Address Operations
  // ============================================

  async getAddress(userId: string): Promise<AddressResponseDto | null> {
    const address = await this.databaseService.get<UserAddressEntity>(`CART#${userId}`, 'ADDRESS');

    if (!address) return null;

    return {
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      country: address.country,
    };
  }

  async updateAddress(userId: string, dto: UpdateAddressDto): Promise<AddressResponseDto> {
    const now = new Date().toISOString();

    const existing = await this.databaseService.get<UserAddressEntity>(`CART#${userId}`, 'ADDRESS');

    const addressEntity: UserAddressEntity = {
      PK: `CART#${userId}`,
      SK: 'ADDRESS',
      fullName: dto.fullName,
      phone: dto.phone,
      addressLine1: dto.addressLine1,
      addressLine2: dto.addressLine2,
      city: dto.city,
      state: dto.state,
      pincode: dto.pincode,
      country: dto.country || 'India',
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    await this.databaseService.put(addressEntity);

    return {
      fullName: addressEntity.fullName,
      phone: addressEntity.phone,
      addressLine1: addressEntity.addressLine1,
      addressLine2: addressEntity.addressLine2,
      city: addressEntity.city,
      state: addressEntity.state,
      pincode: addressEntity.pincode,
      country: addressEntity.country,
    };
  }
}
