import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Headers,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import {
  InitiateSubscriptionPaymentDto,
  VerifyOrderPaymentDto,
  VerifySubscriptionPaymentDto,
  InitiateDonationPaymentDto,
  VerifyDonationPaymentDto,
  SubscriptionPaymentResponseDto,
  DonationPaymentResponseDto,
  PaymentVerificationResponseDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import {
  Public,
  AdminOnly,
  CurrentUser,
  CurrentUserData,
} from '@/common/decorators';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService) {}

  // ============================================
  // Subscription Payment Endpoints
  // ============================================

  @Post('subscription/initiate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Initiate subscription payment',
    description:
      'Creates a Razorpay Order (one-time) or Subscription (autopay) based on the plan. Returns data for frontend checkout.',
  })
  @ApiResponse({
    status: 201,
    description: 'Payment initiated successfully',
    type: SubscriptionPaymentResponseDto,
  })
  async initiateSubscriptionPayment(
    @Body() dto: InitiateSubscriptionPaymentDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<SubscriptionPaymentResponseDto> {
    return this.paymentService.initiateSubscriptionPayment(dto, user.sub, user.email);
  }

  @Post('subscription/verify-order')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Verify one-time order payment',
    description: 'Verifies Razorpay signature for one-time payments (5100/21000 plans) and activates subscription.',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment verified',
    type: PaymentVerificationResponseDto,
  })
  async verifyOrderPayment(
    @Body() dto: VerifyOrderPaymentDto,
  ): Promise<PaymentVerificationResponseDto> {
    return this.paymentService.verifyOrderPayment(dto);
  }

  @Post('subscription/verify-subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Verify autopay subscription payment',
    description: 'Verifies Razorpay signature for autopay subscription and activates it.',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription payment verified',
    type: PaymentVerificationResponseDto,
  })
  async verifySubscriptionPayment(
    @Body() dto: VerifySubscriptionPaymentDto,
  ): Promise<PaymentVerificationResponseDto> {
    return this.paymentService.verifySubscriptionPayment(dto);
  }

  // ============================================
  // Donation Payment Endpoints
  // ============================================

  @Post('donation/initiate')
  @Public()
  @ApiOperation({
    summary: 'Initiate donation payment',
    description: 'Creates a Razorpay Order for a donation. No auth required.',
  })
  @ApiResponse({
    status: 201,
    description: 'Donation payment initiated',
    type: DonationPaymentResponseDto,
  })
  async initiateDonationPayment(
    @Body() dto: InitiateDonationPaymentDto,
  ): Promise<DonationPaymentResponseDto> {
    return this.paymentService.initiateDonationPayment(dto);
  }

  @Post('donation/verify')
  @Public()
  @ApiOperation({
    summary: 'Verify donation payment',
    description: 'Verifies Razorpay signature for donation payment.',
  })
  @ApiResponse({
    status: 200,
    description: 'Donation verified',
    type: PaymentVerificationResponseDto,
  })
  async verifyDonationPayment(
    @Body() dto: VerifyDonationPaymentDto,
  ): Promise<PaymentVerificationResponseDto> {
    return this.paymentService.verifyDonationPayment(dto);
  }

  // ============================================
  // Razorpay Webhook
  // ============================================

  @Post('webhook/razorpay')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Razorpay webhook handler',
    description: 'Handles all Razorpay webhook events (payment captured, failed, subscription events, etc.)',
  })
  async handleRazorpayWebhook(
    @Body() body: any,
    @Headers('x-razorpay-signature') signature: string,
  ): Promise<{ status: string }> {
    try {
      await this.paymentService.handleWebhook(body, signature);
      return { status: 'ok' };
    } catch (error) {
      this.logger.error('Webhook processing error', error);
      // Return 200 to prevent Razorpay from retrying on validation errors
      return { status: 'error' };
    }
  }

  // ============================================
  // Admin Endpoints
  // ============================================

  @Get('failures')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get payment failures (Admin only)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPaymentFailures(@Query('limit') limit?: number): Promise<any[]> {
    return this.paymentService.getPaymentFailures({ limit });
  }

  @Get('user-payments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user payment history' })
  async getUserPayments(@CurrentUser() user: CurrentUserData): Promise<any[]> {
    return this.paymentService.getPaymentsByUser(user.sub);
  }
}
