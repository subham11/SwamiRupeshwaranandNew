import {
  Controller,
  Get,
  Post,
  Delete,
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
import { WishlistService } from './wishlist.service';
import {
  WishlistResponseDto,
  WishlistCheckResponseDto,
} from './dto';
import { JwtAuthGuard } from '@/common/guards';
import { CurrentUser, CurrentUserData } from '@/common/decorators';

@ApiTags('Wishlist')
@Controller('wishlist')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user wishlist' })
  @ApiResponse({ status: 200, description: 'Wishlist items', type: WishlistResponseDto })
  async getWishlist(@CurrentUser() user: CurrentUserData): Promise<WishlistResponseDto> {
    return this.wishlistService.getWishlist(user.sub);
  }

  @Post(':productId')
  @ApiOperation({ summary: 'Add product to wishlist' })
  @ApiParam({ name: 'productId', description: 'Product ID to add' })
  @ApiResponse({ status: 201, description: 'Product added to wishlist', type: WishlistResponseDto })
  async addToWishlist(
    @Param('productId') productId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<WishlistResponseDto> {
    return this.wishlistService.addToWishlist(user.sub, productId);
  }

  @Get('check/:productId')
  @ApiOperation({ summary: 'Check if product is in wishlist' })
  @ApiParam({ name: 'productId', description: 'Product ID to check' })
  @ApiResponse({ status: 200, description: 'Wishlist check result', type: WishlistCheckResponseDto })
  async isInWishlist(
    @Param('productId') productId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<WishlistCheckResponseDto> {
    return this.wishlistService.isInWishlist(user.sub, productId);
  }

  @Delete(':productId')
  @ApiOperation({ summary: 'Remove product from wishlist' })
  @ApiParam({ name: 'productId', description: 'Product ID to remove' })
  @ApiResponse({ status: 200, description: 'Product removed from wishlist', type: WishlistResponseDto })
  async removeFromWishlist(
    @Param('productId') productId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<WishlistResponseDto> {
    return this.wishlistService.removeFromWishlist(user.sub, productId);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear entire wishlist' })
  @ApiResponse({ status: 200, description: 'Wishlist cleared', type: WishlistResponseDto })
  async clearWishlist(@CurrentUser() user: CurrentUserData): Promise<WishlistResponseDto> {
    return this.wishlistService.clearWishlist(user.sub);
  }
}
