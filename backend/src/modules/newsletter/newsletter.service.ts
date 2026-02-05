import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService, DATABASE_SERVICE } from '@/common/database';
import { EmailService } from '@/common/email/email.service';
import {
  SubscribeNewsletterDto,
  UpdateSubscriberDto,
  SubscriberResponseDto,
  CreateCampaignDto,
  UpdateCampaignDto,
  CampaignResponseDto,
  SendCampaignDto,
  NewsletterStatsDto,
  SubscriberStatus,
  CampaignStatus,
  LocalizedStringDto,
} from './dto';

// ============================================
// Entity Interfaces
// ============================================

interface SubscriberEntity {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  id: string;
  email: string;
  name?: string;
  status: SubscriberStatus;
  source?: string;
  tags: string[];
  subscribedAt: string;
  unsubscribedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface CampaignEntity {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  id: string;
  subject: LocalizedStringDto;
  content: LocalizedStringDto;
  previewText?: string;
  targetTags: string[];
  status: CampaignStatus;
  scheduledAt?: string;
  sentAt?: string;
  stats: {
    totalRecipients: number;
    sent: number;
    failed: number;
    opened?: number;
    clicked?: number;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);
  private readonly subscriberEntityType = 'NEWSLETTER_SUBSCRIBER';
  private readonly campaignEntityType = 'NEWSLETTER_CAMPAIGN';

  constructor(
    @Inject(DATABASE_SERVICE) private readonly db: DatabaseService,
    private readonly emailService: EmailService,
  ) {}

  // ============================================
  // Subscriber Methods
  // ============================================

  async subscribe(dto: SubscribeNewsletterDto): Promise<SubscriberResponseDto> {
    // Check if already subscribed
    const existing = await this.findSubscriberByEmail(dto.email);
    if (existing) {
      if (existing.status === SubscriberStatus.ACTIVE) {
        throw new BadRequestException('Email is already subscribed');
      }
      // Reactivate subscription
      return this.updateSubscriber(existing.id, { status: SubscriberStatus.ACTIVE });
    }

    const now = new Date().toISOString();
    const id = uuidv4();

    const entity: SubscriberEntity = {
      PK: `${this.subscriberEntityType}#${id}`,
      SK: `${this.subscriberEntityType}#${id}`,
      GSI1PK: this.subscriberEntityType,
      GSI1SK: `EMAIL#${dto.email.toLowerCase()}`,
      id,
      email: dto.email.toLowerCase(),
      name: dto.name,
      status: SubscriberStatus.ACTIVE,
      source: dto.source || 'website',
      tags: [],
      subscribedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.put(entity);

    // Send welcome email
    this.sendWelcomeEmail(dto.email, dto.name);

    return this.mapSubscriberToResponse(entity);
  }

  async unsubscribe(email: string): Promise<void> {
    const subscriber = await this.findSubscriberByEmail(email);
    if (!subscriber) {
      throw new NotFoundException('Subscriber not found');
    }

    await this.updateSubscriber(subscriber.id, {
      status: SubscriberStatus.UNSUBSCRIBED,
    });
  }

  async findAllSubscribers(status?: SubscriberStatus): Promise<SubscriberResponseDto[]> {
    const result = await this.db.query<SubscriberEntity>(this.subscriberEntityType, {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk',
      expressionAttributeValues: {
        ':pk': this.subscriberEntityType,
      },
    });

    let subscribers = result.items as SubscriberEntity[];

    if (status) {
      subscribers = subscribers.filter((s) => s.status === status);
    }

    return subscribers
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((s) => this.mapSubscriberToResponse(s));
  }

  async findSubscriberById(id: string): Promise<SubscriberResponseDto | null> {
    const result = await this.db.get<SubscriberEntity>(
      `${this.subscriberEntityType}#${id}`,
      `${this.subscriberEntityType}#${id}`,
    );

    if (!result) return null;
    return this.mapSubscriberToResponse(result as SubscriberEntity);
  }

  async findSubscriberByEmail(email: string): Promise<SubscriberEntity | null> {
    const result = await this.db.query<SubscriberEntity>(this.subscriberEntityType, {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk AND GSI1SK = :sk',
      expressionAttributeValues: {
        ':pk': this.subscriberEntityType,
        ':sk': `EMAIL#${email.toLowerCase()}`,
      },
    });

    return (result.items[0] as SubscriberEntity) || null;
  }

  async updateSubscriber(id: string, dto: UpdateSubscriberDto): Promise<SubscriberResponseDto> {
    const existing = await this.findSubscriberById(id);
    if (!existing) {
      throw new NotFoundException('Subscriber not found');
    }

    const updateExpression: string[] = ['#updatedAt = :updatedAt'];
    const expressionAttributeNames: Record<string, string> = { '#updatedAt': 'updatedAt' };
    const expressionAttributeValues: Record<string, unknown> = { ':updatedAt': new Date().toISOString() };

    if (dto.name !== undefined) {
      updateExpression.push('#name = :name');
      expressionAttributeNames['#name'] = 'name';
      expressionAttributeValues[':name'] = dto.name;
    }

    if (dto.status !== undefined) {
      updateExpression.push('#status = :status');
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = dto.status;

      if (dto.status === SubscriberStatus.UNSUBSCRIBED) {
        updateExpression.push('unsubscribedAt = :unsubscribedAt');
        expressionAttributeValues[':unsubscribedAt'] = new Date().toISOString();
      }
    }

    if (dto.tags !== undefined) {
      updateExpression.push('tags = :tags');
      expressionAttributeValues[':tags'] = dto.tags;
    }

    await this.db.update<SubscriberEntity>(this.subscriberEntityType, {
      key: {
        PK: `${this.subscriberEntityType}#${id}`,
        SK: `${this.subscriberEntityType}#${id}`,
      },
      updateExpression: `SET ${updateExpression.join(', ')}`,
      expressionAttributeNames,
      expressionAttributeValues,
    });

    return this.findSubscriberById(id) as Promise<SubscriberResponseDto>;
  }

  async deleteSubscriber(id: string): Promise<void> {
    await this.db.delete(
      `${this.subscriberEntityType}#${id}`,
      `${this.subscriberEntityType}#${id}`,
    );
  }

  // ============================================
  // Campaign Methods
  // ============================================

  async createCampaign(dto: CreateCampaignDto, createdBy: string): Promise<CampaignResponseDto> {
    const now = new Date().toISOString();
    const id = uuidv4();

    const entity: CampaignEntity = {
      PK: `${this.campaignEntityType}#${id}`,
      SK: `${this.campaignEntityType}#${id}`,
      GSI1PK: this.campaignEntityType,
      GSI1SK: `DATE#${now}`,
      id,
      subject: dto.subject,
      content: dto.content,
      previewText: dto.previewText,
      targetTags: dto.targetTags || [],
      status: dto.scheduledAt ? CampaignStatus.SCHEDULED : CampaignStatus.DRAFT,
      scheduledAt: dto.scheduledAt,
      stats: {
        totalRecipients: 0,
        sent: 0,
        failed: 0,
      },
      createdBy,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.put(entity);
    return this.mapCampaignToResponse(entity);
  }

  async findAllCampaigns(): Promise<CampaignResponseDto[]> {
    const result = await this.db.query<CampaignEntity>(this.campaignEntityType, {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk',
      expressionAttributeValues: {
        ':pk': this.campaignEntityType,
      },
    });

    return (result.items as CampaignEntity[])
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((c) => this.mapCampaignToResponse(c));
  }

  async findCampaignById(id: string): Promise<CampaignResponseDto | null> {
    const result = await this.db.get<CampaignEntity>(
      `${this.campaignEntityType}#${id}`,
      `${this.campaignEntityType}#${id}`,
    );

    if (!result) return null;
    return this.mapCampaignToResponse(result as CampaignEntity);
  }

  async updateCampaign(id: string, dto: UpdateCampaignDto): Promise<CampaignResponseDto> {
    const existing = await this.findCampaignById(id);
    if (!existing) {
      throw new NotFoundException('Campaign not found');
    }

    if (existing.status === CampaignStatus.SENT) {
      throw new BadRequestException('Cannot update a sent campaign');
    }

    const updateExpression: string[] = ['#updatedAt = :updatedAt'];
    const expressionAttributeNames: Record<string, string> = { '#updatedAt': 'updatedAt' };
    const expressionAttributeValues: Record<string, unknown> = { ':updatedAt': new Date().toISOString() };

    if (dto.subject !== undefined) {
      updateExpression.push('subject = :subject');
      expressionAttributeValues[':subject'] = dto.subject;
    }

    if (dto.content !== undefined) {
      updateExpression.push('content = :content');
      expressionAttributeValues[':content'] = dto.content;
    }

    if (dto.previewText !== undefined) {
      updateExpression.push('previewText = :previewText');
      expressionAttributeValues[':previewText'] = dto.previewText;
    }

    if (dto.targetTags !== undefined) {
      updateExpression.push('targetTags = :targetTags');
      expressionAttributeValues[':targetTags'] = dto.targetTags;
    }

    if (dto.scheduledAt !== undefined) {
      updateExpression.push('scheduledAt = :scheduledAt');
      expressionAttributeValues[':scheduledAt'] = dto.scheduledAt;
    }

    if (dto.status !== undefined) {
      updateExpression.push('#status = :status');
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = dto.status;
    }

    await this.db.update<CampaignEntity>(this.campaignEntityType, {
      key: {
        PK: `${this.campaignEntityType}#${id}`,
        SK: `${this.campaignEntityType}#${id}`,
      },
      updateExpression: `SET ${updateExpression.join(', ')}`,
      expressionAttributeNames,
      expressionAttributeValues,
    });

    return this.findCampaignById(id) as Promise<CampaignResponseDto>;
  }

  async deleteCampaign(id: string): Promise<void> {
    const existing = await this.findCampaignById(id);
    if (!existing) {
      throw new NotFoundException('Campaign not found');
    }

    if (existing.status === CampaignStatus.SENDING) {
      throw new BadRequestException('Cannot delete a campaign that is being sent');
    }

    await this.db.delete(
      `${this.campaignEntityType}#${id}`,
      `${this.campaignEntityType}#${id}`,
    );
  }

  async sendCampaign(id: string, dto: SendCampaignDto): Promise<CampaignResponseDto> {
    const campaign = await this.findCampaignById(id);
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.status === CampaignStatus.SENT) {
      throw new BadRequestException('Campaign has already been sent');
    }

    // Get target subscribers
    let subscribers = await this.findAllSubscribers(SubscriberStatus.ACTIVE);

    // Filter by tags if specified
    if (campaign.targetTags.length > 0) {
      subscribers = subscribers.filter((s) =>
        s.tags.some((tag) => campaign.targetTags.includes(tag)),
      );
    }

    // Update campaign status to sending
    await this.updateCampaign(id, { status: CampaignStatus.SENDING });

    const locale = dto.locale || 'en';
    let sent = 0;
    let failed = 0;

    // Send emails in batches
    for (const subscriber of subscribers) {
      try {
        await this.emailService.sendEmail({
          to: subscriber.email,
          toName: subscriber.name,
          subject: campaign.subject[locale] || campaign.subject.en,
          html: this.wrapEmailContent(
            campaign.content[locale] || campaign.content.en,
            subscriber.email,
          ),
        });
        sent++;
      } catch (error) {
        this.logger.error(`Failed to send to ${subscriber.email}:`, error);
        failed++;
      }
    }

    // Update campaign with results
    const now = new Date().toISOString();
    await this.db.update<CampaignEntity>(this.campaignEntityType, {
      key: {
        PK: `${this.campaignEntityType}#${id}`,
        SK: `${this.campaignEntityType}#${id}`,
      },
      updateExpression: 'SET #status = :status, sentAt = :sentAt, stats = :stats, #updatedAt = :updatedAt',
      expressionAttributeNames: {
        '#status': 'status',
        '#updatedAt': 'updatedAt',
      },
      expressionAttributeValues: {
        ':status': CampaignStatus.SENT,
        ':sentAt': now,
        ':stats': {
          totalRecipients: subscribers.length,
          sent,
          failed,
        },
        ':updatedAt': now,
      },
    });

    return this.findCampaignById(id) as Promise<CampaignResponseDto>;
  }

  // ============================================
  // Stats
  // ============================================

  async getStats(): Promise<NewsletterStatsDto> {
    const subscribers = await this.findAllSubscribers();
    const campaigns = await this.findAllCampaigns();

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const activeSubscribers = subscribers.filter((s) => s.status === SubscriberStatus.ACTIVE);
    const recentSubscribers = subscribers.filter(
      (s) => new Date(s.subscribedAt) >= thirtyDaysAgo,
    );

    return {
      totalSubscribers: subscribers.length,
      activeSubscribers: activeSubscribers.length,
      unsubscribed: subscribers.filter((s) => s.status === SubscriberStatus.UNSUBSCRIBED).length,
      thirtyDayGrowth: recentSubscribers.length,
      totalCampaignsSent: campaigns.filter((c) => c.status === CampaignStatus.SENT).length,
    };
  }

  // ============================================
  // Helper Methods
  // ============================================

  private async sendWelcomeEmail(email: string, name?: string): Promise<void> {
    try {
      await this.emailService.sendEmail({
        to: email,
        toName: name,
        subject: 'Welcome to Swami Rupeshwaranand Ashram Newsletter 🙏',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #F97316;">॥ ॐ नमः शिवाय ॥</h2>
            <p>Dear ${name || 'Devotee'},</p>
            <p>Thank you for subscribing to our newsletter. You will now receive:</p>
            <ul>
              <li>Updates on upcoming events and satsangs</li>
              <li>Spiritual teachings and wisdom</li>
              <li>News from the ashram</li>
            </ul>
            <p>May Swamiji's blessings be with you always.</p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              If you did not subscribe, you can <a href="#">unsubscribe here</a>.
            </p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error('Failed to send welcome email:', error);
    }
  }

  private wrapEmailContent(content: string, subscriberEmail: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        ${content}
        <hr style="margin-top: 40px; border: none; border-top: 1px solid #eee;" />
        <p style="color: #666; font-size: 12px;">
          You are receiving this email because you subscribed to our newsletter.<br/>
          <a href="#">Unsubscribe</a> | <a href="#">Update Preferences</a>
        </p>
      </div>
    `;
  }

  private mapSubscriberToResponse(entity: SubscriberEntity): SubscriberResponseDto {
    return {
      id: entity.id,
      email: entity.email,
      name: entity.name,
      status: entity.status,
      source: entity.source,
      tags: entity.tags,
      subscribedAt: entity.subscribedAt,
      unsubscribedAt: entity.unsubscribedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private mapCampaignToResponse(entity: CampaignEntity): CampaignResponseDto {
    return {
      id: entity.id,
      subject: entity.subject,
      content: entity.content,
      previewText: entity.previewText,
      targetTags: entity.targetTags,
      status: entity.status,
      scheduledAt: entity.scheduledAt,
      sentAt: entity.sentAt,
      stats: entity.stats,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
