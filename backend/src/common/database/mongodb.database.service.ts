import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongoClient, Db, Collection, Document } from 'mongodb';
import { DatabaseService, QueryOptions, UpdateOptions } from './database.interface';

@Injectable()
export class MongoDBDatabaseService implements DatabaseService {
  private client: MongoClient;
  private db: Db;
  private readonly dbName: string;

  constructor(private readonly configService: ConfigService) {
    const uri = this.configService.get<string>('MONGODB_URI', 'mongodb://localhost:27017/');
    const prefix = this.configService.get<string>('DYNAMODB_TABLE_PREFIX', 'swami-rupeshwaranand-api-local');
    this.dbName = prefix.replace(/-/g, '_');
    this.client = new MongoClient(uri);
  }

  async connect(): Promise<void> {
    await this.client.connect();
    this.db = this.client.db(this.dbName);
    console.log(`📦 Connected to MongoDB database: ${this.dbName}`);
  }

  async disconnect(): Promise<void> {
    await this.client.close();
  }

  private getCollection(entityType: string): Collection<Document> {
    // Extract entity type from PK format (e.g., "USER#123" -> "users")
    const collectionName = entityType.toLowerCase() + 's';
    return this.db.collection(collectionName);
  }

  private extractEntityType(pk: string): string {
    return pk.split('#')[0];
  }

  private extractId(pk: string): string {
    return pk.split('#')[1] || pk;
  }

  async get<T>(pk: string, sk: string): Promise<T | null> {
    const entityType = this.extractEntityType(pk);
    const collection = this.getCollection(entityType);
    
    const result = await collection.findOne({ PK: pk, SK: sk });
    return result as T | null;
  }

  async put<T extends Record<string, any>>(item: T): Promise<T> {
    const entityType = this.extractEntityType(item.PK);
    const collection = this.getCollection(entityType);

    const compositeId = `${item.PK}#${item.SK}`;
    const doc = {
      ...item,
      _id: compositeId as any,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await collection.replaceOne(
      { _id: compositeId as any },
      doc,
      { upsert: true }
    );

    return item;
  }

  async delete(pk: string, sk: string): Promise<void> {
    const entityType = this.extractEntityType(pk);
    const collection = this.getCollection(entityType);
    
    await collection.deleteOne({ PK: pk, SK: sk });
  }

  async query<T>(entityType: string, options: QueryOptions): Promise<{ items: T[]; lastKey?: Record<string, any> }> {
    const collection = this.getCollection(entityType);
    
    // Build MongoDB query from options
    let query: Record<string, any> = {};
    
    if (options.filter) {
      query = { ...options.filter };
    }
    
    // Handle GSI1 queries (common pattern)
    if (options.expressionAttributeValues) {
      const values = options.expressionAttributeValues;
      if (values[':pk']) {
        query.GSI1PK = values[':pk'];
      }
      if (values[':sk']) {
        query.GSI1SK = values[':sk'];
      }
    }

    let cursor = collection.find(query);

    // Apply sorting
    if (options.sort) {
      cursor = cursor.sort(options.sort);
    } else if (options.scanIndexForward !== undefined) {
      cursor = cursor.sort({ GSI1SK: options.scanIndexForward ? 1 : -1 });
    }

    // Apply limit
    if (options.limit) {
      cursor = cursor.limit(options.limit);
    }

    const items = await cursor.toArray();
    
    return {
      items: items as T[],
      lastKey: undefined, // MongoDB uses skip/limit instead of cursor-based pagination
    };
  }

  async scan<T>(entityType: string, filter?: Record<string, any>): Promise<T[]> {
    const collection = this.getCollection(entityType);
    
    let query: Record<string, any> = {};
    
    if (filter) {
      // Convert DynamoDB-style filter to MongoDB query
      // Handle "begins_with(PK, :prefix)" pattern
      if (typeof filter === 'object') {
        query = filter;
      }
    }

    const items = await collection.find(query).toArray();
    return items as T[];
  }

  async update<T>(entityType: string, options: UpdateOptions): Promise<T> {
    const collection = this.getCollection(entityType);
    
    const filter = {
      PK: options.key.PK,
      SK: options.key.SK,
    };

    // Build update document from expressionAttributeValues
    const updateDoc: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (options.expressionAttributeValues && options.expressionAttributeNames) {
      for (const [placeholder, value] of Object.entries(options.expressionAttributeValues)) {
        if (placeholder === ':updatedAt') continue;
        
        // Find the actual field name from expressionAttributeNames
        const namePlaceholder = placeholder.replace(':', '#');
        const fieldName = options.expressionAttributeNames[namePlaceholder] || placeholder.replace(':', '');
        updateDoc[fieldName] = value;
      }
    }

    if (options.update) {
      Object.assign(updateDoc, options.update);
    }

    const result = await collection.findOneAndUpdate(
      filter,
      { $set: updateDoc },
      { returnDocument: 'after' }
    );

    return result as T;
  }

  async batchGet<T>(keys: Array<{ PK: string; SK: string }>): Promise<T[]> {
    if (keys.length === 0) return [];

    // Group keys by entity type
    const grouped = new Map<string, Array<{ PK: string; SK: string }>>();
    for (const key of keys) {
      const entityType = this.extractEntityType(key.PK);
      if (!grouped.has(entityType)) {
        grouped.set(entityType, []);
      }
      grouped.get(entityType)!.push(key);
    }

    const results: T[] = [];
    
    for (const [entityType, entityKeys] of grouped) {
      const collection = this.getCollection(entityType);
      const orConditions = entityKeys.map(k => ({ PK: k.PK, SK: k.SK }));
      const items = await collection.find({ $or: orConditions }).toArray();
      results.push(...(items as T[]));
    }

    return results;
  }

  async batchWrite(items: Array<{ PutRequest?: { Item: Record<string, any> }; DeleteRequest?: { Key: Record<string, any> } }>): Promise<void> {
    for (const item of items) {
      if (item.PutRequest) {
        await this.put(item.PutRequest.Item);
      }
      if (item.DeleteRequest) {
        await this.delete(item.DeleteRequest.Key.PK, item.DeleteRequest.Key.SK);
      }
    }
  }
}
