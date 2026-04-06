import { Injectable, Logger } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { StorageService } from '@/common/storage';
import { OrderResponseDto } from './dto';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(private readonly storageService: StorageService) {}

  /**
   * Generate a professional PDF invoice for an order.
   */
  async generateInvoice(order: OrderResponseDto): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const pageWidth = doc.page.width;
        const marginLeft = 50;
        const marginRight = 50;
        const contentWidth = pageWidth - marginLeft - marginRight;

        // Colors
        const orange = '#F97316';
        const darkText = '#1F2937';
        const grayText = '#6B7280';
        const lightGray = '#F3F4F6';
        const lineGray = '#E5E7EB';

        const invoiceNo = `INV-${order.id.substring(0, 8).toUpperCase()}`;
        const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        // ============================================
        // Header
        // ============================================
        doc.rect(0, 0, pageWidth, 100).fill(orange);

        doc
          .font('Helvetica-Bold')
          .fontSize(22)
          .fillColor('#FFFFFF')
          .text('Swami Rupeshwaranand ji', marginLeft, 30, { width: contentWidth / 2 });

        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor('rgba(255,255,255,0.85)')
          .text('Ashram & Spiritual Store', marginLeft, 58);

        doc
          .font('Helvetica-Bold')
          .fontSize(18)
          .fillColor('#FFFFFF')
          .text('TAX INVOICE', marginLeft + contentWidth / 2, 35, {
            width: contentWidth / 2,
            align: 'right',
          });

        // ============================================
        // Invoice Details (right) and Bill To (left)
        // ============================================
        let yPos = 120;

        // Invoice details - right side
        const detailsX = marginLeft + contentWidth / 2 + 20;
        const detailsWidth = contentWidth / 2 - 20;

        doc.font('Helvetica-Bold').fontSize(9).fillColor(grayText);
        doc.text('Invoice No:', detailsX, yPos, { width: 80 });
        doc.font('Helvetica').fontSize(9).fillColor(darkText);
        doc.text(invoiceNo, detailsX + 80, yPos, { width: detailsWidth - 80 });

        yPos += 16;
        doc.font('Helvetica-Bold').fontSize(9).fillColor(grayText);
        doc.text('Date:', detailsX, yPos, { width: 80 });
        doc.font('Helvetica').fontSize(9).fillColor(darkText);
        doc.text(invoiceDate, detailsX + 80, yPos, { width: detailsWidth - 80 });

        yPos += 16;
        doc.font('Helvetica-Bold').fontSize(9).fillColor(grayText);
        doc.text('Order ID:', detailsX, yPos, { width: 80 });
        doc.font('Helvetica').fontSize(9).fillColor(darkText);
        doc.text(order.id, detailsX + 80, yPos, { width: detailsWidth - 80 });

        // Bill To - left side
        const billToY = 120;
        doc.font('Helvetica-Bold').fontSize(10).fillColor(orange);
        doc.text('BILL TO', marginLeft, billToY);

        const addr = order.shippingAddress;
        doc.font('Helvetica-Bold').fontSize(10).fillColor(darkText);
        doc.text(addr.fullName, marginLeft, billToY + 18, { width: contentWidth / 2 - 20 });

        doc.font('Helvetica').fontSize(9).fillColor(grayText);
        let addrLine = addr.addressLine1;
        if (addr.addressLine2) addrLine += ', ' + addr.addressLine2;
        doc.text(addrLine, marginLeft, billToY + 34, { width: contentWidth / 2 - 20 });
        doc.text(`${addr.city}, ${addr.state} - ${addr.pincode}`, marginLeft, billToY + 48, {
          width: contentWidth / 2 - 20,
        });
        doc.text(addr.country, marginLeft, billToY + 62, { width: contentWidth / 2 - 20 });
        doc.text(`Phone: ${addr.phone}`, marginLeft, billToY + 76, {
          width: contentWidth / 2 - 20,
        });

        // ============================================
        // Divider
        // ============================================
        yPos = 215;
        doc
          .moveTo(marginLeft, yPos)
          .lineTo(pageWidth - marginRight, yPos)
          .strokeColor(lineGray)
          .lineWidth(1)
          .stroke();

        // ============================================
        // Items Table
        // ============================================
        yPos += 15;

        // Column widths
        const colSno = 40;
        const colItem = contentWidth - 40 - 50 - 80 - 90;
        const colQty = 50;
        const colPrice = 80;
        const colAmount = 90;

        // Table header background
        doc.rect(marginLeft, yPos - 5, contentWidth, 25).fill(orange);

        doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF');
        let colX = marginLeft + 8;
        doc.text('S.No', colX, yPos, { width: colSno, align: 'left' });
        colX += colSno;
        doc.text('Item', colX, yPos, { width: colItem, align: 'left' });
        colX += colItem;
        doc.text('Qty', colX, yPos, { width: colQty, align: 'center' });
        colX += colQty;
        doc.text('Price', colX, yPos, { width: colPrice, align: 'right' });
        colX += colPrice;
        doc.text('Amount', colX, yPos, { width: colAmount - 8, align: 'right' });

        yPos += 25;

        // Table rows
        order.items.forEach((item, index) => {
          // Alternating row background
          if (index % 2 === 0) {
            doc.rect(marginLeft, yPos - 5, contentWidth, 22).fill(lightGray);
          }

          doc.font('Helvetica').fontSize(9).fillColor(darkText);
          colX = marginLeft + 8;
          doc.text(`${index + 1}`, colX, yPos, { width: colSno, align: 'left' });
          colX += colSno;
          doc.text(item.title, colX, yPos, { width: colItem, align: 'left' });
          colX += colItem;
          doc.text(`${item.quantity}`, colX, yPos, { width: colQty, align: 'center' });
          colX += colQty;
          doc.text(`Rs. ${item.price.toFixed(2)}`, colX, yPos, { width: colPrice, align: 'right' });
          colX += colPrice;
          doc.text(`Rs. ${item.subtotal.toFixed(2)}`, colX, yPos, {
            width: colAmount - 8,
            align: 'right',
          });

          yPos += 22;
        });

        // Table bottom line
        doc
          .moveTo(marginLeft, yPos)
          .lineTo(pageWidth - marginRight, yPos)
          .strokeColor(lineGray)
          .lineWidth(1)
          .stroke();

        // ============================================
        // Totals
        // ============================================
        yPos += 15;
        const totalsX = marginLeft + contentWidth - 200;
        const totalsLabelW = 100;
        const totalsValueW = 100;

        doc.font('Helvetica').fontSize(9).fillColor(grayText);
        doc.text('Subtotal:', totalsX, yPos, { width: totalsLabelW, align: 'right' });
        doc.font('Helvetica').fontSize(9).fillColor(darkText);
        doc.text(`Rs. ${order.totalAmount.toFixed(2)}`, totalsX + totalsLabelW, yPos, {
          width: totalsValueW,
          align: 'right',
        });

        yPos += 18;
        doc.font('Helvetica').fontSize(9).fillColor(grayText);
        doc.text('Shipping:', totalsX, yPos, { width: totalsLabelW, align: 'right' });
        doc.font('Helvetica').fontSize(9).fillColor(darkText);
        doc.text('Free', totalsX + totalsLabelW, yPos, {
          width: totalsValueW,
          align: 'right',
        });

        yPos += 5;
        doc
          .moveTo(totalsX + 10, yPos + 12)
          .lineTo(totalsX + totalsLabelW + totalsValueW, yPos + 12)
          .strokeColor(lineGray)
          .lineWidth(1)
          .stroke();

        yPos += 20;
        doc.font('Helvetica-Bold').fontSize(12).fillColor(darkText);
        doc.text('Total Amount:', totalsX - 10, yPos, { width: totalsLabelW + 10, align: 'right' });
        doc.font('Helvetica-Bold').fontSize(12).fillColor(orange);
        doc.text(`Rs. ${order.totalAmount.toFixed(2)}`, totalsX + totalsLabelW, yPos, {
          width: totalsValueW,
          align: 'right',
        });

        // ============================================
        // Payment Info
        // ============================================
        yPos += 40;
        doc
          .moveTo(marginLeft, yPos)
          .lineTo(pageWidth - marginRight, yPos)
          .strokeColor(lineGray)
          .lineWidth(1)
          .stroke();

        yPos += 12;
        doc.font('Helvetica-Bold').fontSize(10).fillColor(orange);
        doc.text('PAYMENT INFORMATION', marginLeft, yPos);

        yPos += 18;
        doc.font('Helvetica').fontSize(9).fillColor(grayText);

        if (order.razorpayPaymentId) {
          doc.text(`Payment ID: ${order.razorpayPaymentId}`, marginLeft, yPos);
          yPos += 14;
        }

        doc.text(`Payment Method: Razorpay`, marginLeft, yPos);
        yPos += 14;

        const statusLabel =
          order.paymentStatus === 'captured'
            ? 'Paid'
            : order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1);
        doc.text(`Status: ${statusLabel}`, marginLeft, yPos);

        // ============================================
        // Footer
        // ============================================
        const footerY = doc.page.height - 80;

        doc
          .moveTo(marginLeft, footerY)
          .lineTo(pageWidth - marginRight, footerY)
          .strokeColor(lineGray)
          .lineWidth(1)
          .stroke();

        doc.font('Helvetica-Bold').fontSize(10).fillColor(darkText);
        doc.text('Thank you for your purchase!', marginLeft, footerY + 12, {
          width: contentWidth,
          align: 'center',
        });

        doc.font('Helvetica').fontSize(8).fillColor(grayText);
        doc.text(
          'www.swamirupeshwaranand.com  |  contact@swamirupeshwaranand.com',
          marginLeft,
          footerY + 28,
          { width: contentWidth, align: 'center' },
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate invoice PDF and upload to S3. Returns the public URL.
   */
  async generateAndUpload(order: OrderResponseDto): Promise<string> {
    const buffer = await this.generateInvoice(order);
    const key = `invoices/${order.id}.pdf`;

    const result = await this.storageService.uploadFileWithKey(key, buffer, 'application/pdf');

    this.logger.log(`Invoice uploaded for order ${order.id}: ${result.url}`);
    return result.url;
  }
}
