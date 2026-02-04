import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
  BatchGetCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';

export interface QueryOptions {
  indexName?: string;
  keyConditionExpression: string;
  expressionAttributeNames?: Record<string, string>;
  expressionAttributeValues: Record<string, any>;
  filterExpression?: string;
  limit?: number;
  exclusiveStartKey?: Record<string, any>;
  scanIndexForward?: boolean;
}

export interface UpdateOptions {
  key: Record<string, any>;
  updateExpression: string;
  expressionAttributeNames?: Record<string, string>;
  expressionAttributeValues: Record<string, any>;
  conditionExpression?: string;
}

@Injectable()
export class DynamoDBService {
  private readonly tableName: string;

  constructor(
    @Inject('DYNAMODB_CLIENT')
    private readonly client: DynamoDBDocumentClient,
    private readonly configService: ConfigService,
  ) {
    const prefix = this.configService.get<string>(
      'DYNAMODB_TABLE_PREFIX',
      'swami-rupeshwaranand-api-dev',
    );
    this.tableName = `${prefix}-main`;
  }

  async get<T>(pk: string, sk: string): Promise<T | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { PK: pk, SK: sk },
    });

    const result = await this.client.send(command);
    return (result.Item as T) || null;
  }

  async put<T extends Record<string, any>>(item: T): Promise<T> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        ...item,
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    await this.client.send(command);
    return item;
  }

  async delete(pk: string, sk: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: { PK: pk, SK: sk },
    });

    await this.client.send(command);
  }

  async query<T>(options: QueryOptions): Promise<{ items: T[]; lastKey?: Record<string, any> }> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: options.indexName,
      KeyConditionExpression: options.keyConditionExpression,
      ExpressionAttributeNames: options.expressionAttributeNames,
      ExpressionAttributeValues: options.expressionAttributeValues,
      FilterExpression: options.filterExpression,
      Limit: options.limit,
      ExclusiveStartKey: options.exclusiveStartKey,
      ScanIndexForward: options.scanIndexForward ?? true,
    });

    const result = await this.client.send(command);
    return {
      items: (result.Items as T[]) || [],
      lastKey: result.LastEvaluatedKey,
    };
  }

  async scan<T>(
    filterExpression?: string,
    expressionAttributeValues?: Record<string, any>,
  ): Promise<T[]> {
    const command = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: filterExpression,
      ExpressionAttributeValues: expressionAttributeValues,
    });

    const result = await this.client.send(command);
    return (result.Items as T[]) || [];
  }

  async update<T>(options: UpdateOptions): Promise<T> {
    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: options.key,
      UpdateExpression: options.updateExpression,
      ExpressionAttributeNames: options.expressionAttributeNames,
      ExpressionAttributeValues: {
        ...options.expressionAttributeValues,
        ':updatedAt': new Date().toISOString(),
      },
      ConditionExpression: options.conditionExpression,
      ReturnValues: 'ALL_NEW',
    });

    const result = await this.client.send(command);
    return result.Attributes as T;
  }

  async batchGet<T>(keys: Array<{ PK: string; SK: string }>): Promise<T[]> {
    if (keys.length === 0) return [];

    // DynamoDB batch get limit is 100 items
    const chunks = this.chunkArray(keys, 100);
    const results: T[] = [];

    for (const chunk of chunks) {
      const command = new BatchGetCommand({
        RequestItems: {
          [this.tableName]: {
            Keys: chunk,
          },
        },
      });

      const result = await this.client.send(command);
      if (result.Responses?.[this.tableName]) {
        results.push(...(result.Responses[this.tableName] as T[]));
      }
    }

    return results;
  }

  async batchWrite(
    items: Array<{
      PutRequest?: { Item: Record<string, any> };
      DeleteRequest?: { Key: Record<string, any> };
    }>,
  ): Promise<void> {
    if (items.length === 0) return;

    // DynamoDB batch write limit is 25 items
    const chunks = this.chunkArray(items, 25);

    for (const chunk of chunks) {
      const command = new BatchWriteCommand({
        RequestItems: {
          [this.tableName]: chunk,
        },
      });

      await this.client.send(command);
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
