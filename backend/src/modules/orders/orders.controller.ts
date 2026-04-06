import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Res,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiProduces,
} from '@nestjs/swagger';
import { Response } from 'express';
import { OrdersService } from './orders.service';
import { InvoiceService } from './invoice.service';
import {
  VerifyProductOrderPaymentDto,
  UpdateOrderStatusDto,
  CheckoutResponseDto,
  OrderPaymentVerificationResponseDto,
  OrderResponseDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { CurrentUser, CurrentUserData, AdminOnly } from '@/common/decorators';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(
    private readonly ordersService: OrdersService,
    private readonly invoiceService: InvoiceService,
  ) {}

  // ============================================
  // Customer Endpoints
  // ============================================

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create order from cart and initiate Razorpay payment' })
  @ApiResponse({
    status: 201,
    description: 'Order created, Razorpay order returned',
    type: CheckoutResponseDto,
  })
  async checkout(@CurrentUser() user: CurrentUserData): Promise<CheckoutResponseDto> {
    return this.ordersService.checkout(user.sub, user.email);
  }

  @Post('verify-payment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Verify Razorpay payment and confirm order' })
  @ApiResponse({
    status: 200,
    description: 'Payment verified',
    type: OrderPaymentVerificationResponseDto,
  })
  async verifyPayment(
    @Body() dto: VerifyProductOrderPaymentDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<OrderPaymentVerificationResponseDto> {
    return this.ordersService.verifyPayment(dto, user.sub);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user orders' })
  @ApiResponse({ status: 200, description: 'User orders list', type: [OrderResponseDto] })
  async getMyOrders(@CurrentUser() user: CurrentUserData): Promise<OrderResponseDto[]> {
    return this.ordersService.getOrdersByUser(user.sub);
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Admin: Get order analytics/stats' })
  @ApiResponse({ status: 200, description: 'Order stats' })
  async getStats() {
    return this.ordersService.getStats();
  }

  @Get('admin/:id/invoice')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Admin: Download invoice PDF for any order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'Invoice PDF' })
  async getAdminInvoice(@Param('id') id: string, @Res() res: Response) {
    const order = await this.ordersService.getOrderById(id);
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    try {
      const pdfBuffer = await this.invoiceService.generateInvoice(order);
      const invoiceNo = `INV-${order.id.substring(0, 8).toUpperCase()}`;

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=invoice-${invoiceNo}.pdf`,
        'Content-Length': pdfBuffer.length.toString(),
      });
      res.end(pdfBuffer);
    } catch (error) {
      this.logger.error(`Failed to generate admin invoice for order ${id}: ${error.message}`);
      throw new InternalServerErrorException('Failed to generate invoice');
    }
  }

  @Get(':id/invoice')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Download invoice PDF for own order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'Invoice PDF' })
  async getInvoice(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Res() res: Response,
  ) {
    const order = await this.ordersService.getOrderById(id);
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    if (order.userId !== user.sub) {
      throw new ForbiddenException('You do not have access to this order');
    }

    try {
      const pdfBuffer = await this.invoiceService.generateInvoice(order);
      const invoiceNo = `INV-${order.id.substring(0, 8).toUpperCase()}`;

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=invoice-${invoiceNo}.pdf`,
        'Content-Length': pdfBuffer.length.toString(),
      });
      res.end(pdfBuffer);
    } catch (error) {
      this.logger.error(`Failed to generate invoice for order ${id}: ${error.message}`);
      throw new InternalServerErrorException('Failed to generate invoice');
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order details', type: OrderResponseDto })
  async getOrderById(@Param('id') id: string): Promise<OrderResponseDto | null> {
    return this.ordersService.getOrderById(id);
  }

  // ============================================
  // Admin Endpoints
  // ============================================

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Admin: Get all orders' })
  @ApiResponse({ status: 200, description: 'All orders', type: [OrderResponseDto] })
  async getAllOrders(): Promise<OrderResponseDto[]> {
    return this.ordersService.getAllOrders();
  }

  @Patch('admin/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Admin: Update order status' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order updated', type: OrderResponseDto })
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    return this.ordersService.updateOrderStatus(id, dto);
  }
}
