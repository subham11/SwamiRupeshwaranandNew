import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService, DATABASE_SERVICE } from '@/common/database';
import { SettingCategory } from './dto';

// ============================================
// DynamoDB Settings Entity (single-table design)
// ============================================
interface SettingEntity {
  PK: string;          // SETTINGS#<key>
  SK: string;          // SETTINGS#<key>
  GSI1PK: string;      // SETTINGS
  GSI1SK: string;      // CATEGORY#<category>#KEY#<key>
  key: string;
  value: string;
  category: string;
  description?: string;
  isSecret: boolean;
  updatedAt: string;
  updatedBy?: string;
}

/**
 * SettingsService — DynamoDB-backed key-value settings with in-memory caching.
 *
 * Settings are loaded from DynamoDB with a 5-minute cache TTL.
 * Falls back to environment variables (ConfigService) if no DB value exists.
 * This allows the admin to override deploy-time env vars at runtime.
 */
@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  private readonly entityType = 'SETTINGS';

  // In-memory cache: key → { value, expiresAt }
  private cache = new Map<string, { value: string; expiresAt: number }>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    @Inject(DATABASE_SERVICE)
    private readonly db: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  // ============================================
  // Core: Get a setting value (with caching + env fallback)
  // ============================================

  /**
   * Get a setting value. Resolution order:
   * 1. In-memory cache (if not expired)
   * 2. DynamoDB SETTINGS entity
   * 3. Environment variable via ConfigService
   * 4. Default value
   */
  async get(key: string, defaultValue = ''): Promise<string> {
    // 1. Check cache
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    // 2. Check DynamoDB
    try {
      const entity = await this.db.get<SettingEntity>(
        `${this.entityType}#${key}`,
        `${this.entityType}#${key}`,
      );

      if (entity?.value) {
        this.setCache(key, entity.value);
        return entity.value;
      }
    } catch (error) {
      this.logger.warn(`Failed to read setting ${key} from DB: ${error.message}`);
    }

    // 3. Fall back to env var
    const envValue = this.configService.get<string>(key, '');
    if (envValue) {
      this.setCache(key, envValue);
      return envValue;
    }

    // 4. Default
    return defaultValue;
  }

  /**
   * Get multiple settings at once (for initializing Razorpay, etc.)
   */
  async getMultiple(keys: string[]): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    // Use Promise.all for parallel fetches
    await Promise.all(
      keys.map(async (key) => {
        result[key] = await this.get(key);
      }),
    );
    return result;
  }

  // ============================================
  // CRUD: Set/Update a setting
  // ============================================

  async set(
    key: string,
    value: string,
    options?: {
      category?: SettingCategory;
      description?: string;
      isSecret?: boolean;
      updatedBy?: string;
    },
  ): Promise<void> {
    const now = new Date().toISOString();
    const category = options?.category || SettingCategory.GENERAL;

    const entity: SettingEntity = {
      PK: `${this.entityType}#${key}`,
      SK: `${this.entityType}#${key}`,
      GSI1PK: this.entityType,
      GSI1SK: `CATEGORY#${category}#KEY#${key}`,
      key,
      value,
      category,
      description: options?.description,
      isSecret: options?.isSecret ?? false,
      updatedAt: now,
      updatedBy: options?.updatedBy,
    };

    await this.db.put(entity);

    // Update cache immediately
    this.setCache(key, value);

    this.logger.log(`Setting updated: ${key} (category: ${category})`);
  }

  /**
   * Bulk update settings for a category
   */
  async bulkSet(
    category: SettingCategory,
    settings: Array<{
      key: string;
      value: string;
      description?: string;
      isSecret?: boolean;
    }>,
    updatedBy?: string,
  ): Promise<void> {
    for (const setting of settings) {
      await this.set(setting.key, setting.value, {
        category,
        description: setting.description,
        isSecret: setting.isSecret,
        updatedBy,
      });
    }

    this.logger.log(`Bulk updated ${settings.length} settings in category: ${category}`);
  }

  // ============================================
  // Query: List settings by category
  // ============================================

  /**
   * List all settings for a category.
   * Secret values are masked in the response.
   */
  async getByCategory(category: string): Promise<Array<{
    key: string;
    value: string;
    category: string;
    description?: string;
    isSecret: boolean;
    updatedAt: string;
    updatedBy?: string;
  }>> {
    const result = await this.db.query<SettingEntity>(this.entityType, {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :skPrefix)',
      expressionAttributeValues: {
        ':pk': this.entityType,
        ':skPrefix': `CATEGORY#${category}#`,
      },
    });

    return result.items.map((item) => ({
      key: item.key,
      value: item.isSecret ? this.maskSecret(item.value) : item.value,
      category: item.category,
      description: item.description,
      isSecret: item.isSecret,
      updatedAt: item.updatedAt,
      updatedBy: item.updatedBy,
    }));
  }

  /**
   * List all settings across all categories (admin view)
   */
  async getAll(): Promise<Array<{
    key: string;
    value: string;
    category: string;
    description?: string;
    isSecret: boolean;
    updatedAt: string;
    updatedBy?: string;
  }>> {
    const result = await this.db.query<SettingEntity>(this.entityType, {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk',
      expressionAttributeValues: {
        ':pk': this.entityType,
      },
    });

    return result.items.map((item) => ({
      key: item.key,
      value: item.isSecret ? this.maskSecret(item.value) : item.value,
      category: item.category,
      description: item.description,
      isSecret: item.isSecret,
      updatedAt: item.updatedAt,
      updatedBy: item.updatedBy,
    }));
  }

  // ============================================
  // Delete a setting (reverts to env var fallback)
  // ============================================

  async delete(key: string): Promise<void> {
    await this.db.delete(
      `${this.entityType}#${key}`,
      `${this.entityType}#${key}`,
    );

    // Remove from cache
    this.cache.delete(key);

    this.logger.log(`Setting deleted: ${key} (will fall back to env var)`);
  }

  // ============================================
  // Razorpay-specific helpers
  // ============================================

  /**
   * Get current Razorpay configuration.
   * Returns keys needed for Razorpay SDK initialization.
   */
  async getRazorpayConfig(): Promise<{
    keyId: string;
    keySecret: string;
    webhookSecret: string;
  }> {
    const [keyId, keySecret, webhookSecret] = await Promise.all([
      this.get('RAZORPAY_KEY_ID'),
      this.get('RAZORPAY_KEY_SECRET'),
      this.get('RAZORPAY_WEBHOOK_SECRET'),
    ]);

    return { keyId, keySecret, webhookSecret };
  }

  /**
   * Test Razorpay credentials by making a simple API call.
   */
  async testRazorpayConnection(keyId: string, keySecret: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Razorpay = require('razorpay');
      const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });

      // Try fetching orders with limit 1 — if credentials are wrong, Razorpay throws 401
      await rzp.orders.all({ count: 1 });

      return {
        success: true,
        message: 'Razorpay connection successful! Credentials are valid.',
      };
    } catch (error) {
      const msg = error?.message || 'Unknown error';
      const statusCode = error?.statusCode || error?.error?.code;

      if (statusCode === 401 || msg.includes('Authentication')) {
        return {
          success: false,
          message: 'Authentication failed. Please check your Key ID and Key Secret.',
        };
      }

      return {
        success: false,
        message: `Connection failed: ${msg}`,
      };
    }
  }

  // ============================================
  // Cache invalidation
  // ============================================

  /**
   * Invalidate all cached settings.
   * Call this after bulk updates to force re-read from DB.
   */
  invalidateCache(): void {
    this.cache.clear();
    this.logger.log('Settings cache invalidated');
  }

  /**
   * Invalidate a specific key from cache.
   */
  invalidateCacheKey(key: string): void {
    this.cache.delete(key);
  }

  // ============================================
  // Private helpers
  // ============================================

  private setCache(key: string, value: string): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.CACHE_TTL_MS,
    });
  }

  /**
   * Mask a secret value for display: show first 4 and last 4 chars.
   * e.g., "rzp_test_SXBtiiF7gx5Uio" → "rzp_****5Uio"
   */
  private maskSecret(value: string): string {
    if (value.length <= 8) return '****';
    return value.substring(0, 4) + '****' + value.substring(value.length - 4);
  }
}
