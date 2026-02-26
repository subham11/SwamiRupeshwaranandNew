import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CartService } from './cart.service';
import {
  AddToCartDto,
  UpdateCartItemDto,
  CartResponseDto,
  UpdateAddressDto,
  AddressResponseDto,
} from './dto';
import { JwtAuthGuard } from '@/common/guards';
import { CurrentUser, CurrentUserData } from '@/common/decorators';

@ApiTags('Cart')
@Controller('cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // ============================================
  // Cart Endpoints
  // ============================================

  @Get()
  @ApiOperation({ summary: 'Get current user cart' })
  @ApiResponse({ status: 200, description: 'Cart contents', type: CartResponseDto })
  async getCart(@CurrentUser() user: CurrentUserData): Promise<CartResponseDto> {
    return this.cartService.getCart(user.sub);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({ status: 201, description: 'Item added to cart', type: CartResponseDto })
  async addToCart(
    @Body() dto: AddToCartDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<CartResponseDto> {
    return this.cartService.addToCart(user.sub, dto);
  }

  @Put('items/:productId')
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Cart item updated', type: CartResponseDto })
  async updateCartItem(
    @Param('productId') productId: string,
    @Body() dto: UpdateCartItemDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<CartResponseDto> {
    return this.cartService.updateCartItem(user.sub, productId, dto);
  }

  @Delete('items/:productId')
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Item removed from cart', type: CartResponseDto })
  async removeFromCart(
    @Param('productId') productId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<CartResponseDto> {
    return this.cartService.removeFromCart(user.sub, productId);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear entire cart' })
  @ApiResponse({ status: 200, description: 'Cart cleared', type: CartResponseDto })
  async clearCart(@CurrentUser() user: CurrentUserData): Promise<CartResponseDto> {
    return this.cartService.clearCart(user.sub);
  }

  // ============================================
  // Address Endpoints
  // ============================================

  @Get('address')
  @ApiOperation({ summary: 'Get shipping address' })
  @ApiResponse({ status: 200, description: 'Shipping address' })
  async getAddress(@CurrentUser() user: CurrentUserData): Promise<AddressResponseDto | null> {
    return this.cartService.getAddress(user.sub);
  }

  @Put('address')
  @ApiOperation({ summary: 'Update shipping address' })
  @ApiResponse({ status: 200, description: 'Address updated', type: AddressResponseDto })
  async updateAddress(
    @Body() dto: UpdateAddressDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<AddressResponseDto> {
    return this.cartService.updateAddress(user.sub, dto);
  }
}
