import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
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
import { DatabaseService, QueryOptions, UpdateOptions } from './database.interface';

@Injectable()
export class DynamoDBDatabaseService implements DatabaseService {
  private readonly client: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor(private readonly configService: ConfigService) {
    const isLocal = this.configService.get<string>('NODE_ENV') === 'development';
    const endpoint = this.configService.get<string>('DYNAMODB_ENDPOINT');

    const clientConfig: any = {
      region: this.configService.get<string>('AWS_REGION', 'ap-south-1'),
    };

    if (isLocal && endpoint) {
      clientConfig.endpoint = endpoint;
      clientConfig.credentials = {
        accessKeyId: 'local',
        secretAccessKey: 'local',
      };
    }

    const dynamoClient = new DynamoDBClient(clientConfig);
    this.client = DynamoDBDocumentClient.from(dynamoClient, {
      marshallOptions: {
        convertEmptyValues: false,
        removeUndefinedValues: true,
        convertClassInstanceToMap: true,
      },
      unmarshallOptions: {
        wrapNumbers: false,
      },
    });

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

  async query<T>(
    entityType: string,
    options: QueryOptions,
  ): Promise<{ items: T[]; lastKey?: Record<string, any> }> {
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

  async scan<T>(entityType: string, filter?: Record<string, any>): Promise<T[]> {
    const command = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: filter ? 'begins_with(PK, :prefix)' : undefined,
      ExpressionAttributeValues: filter ? { ':prefix': `${entityType}#` } : undefined,
    });

    const result = await this.client.send(command);
    return (result.Items as T[]) || [];
  }

  async update<T>(entityType: string, options: UpdateOptions): Promise<T> {
    // Build update expression from simplified 'update' object if provided
    let updateExpression = options.updateExpression;
    let expressionAttributeNames = options.expressionAttributeNames || {};
    let expressionAttributeValues = options.expressionAttributeValues || {};

    if (options.update && !updateExpression) {
      const setParts: string[] = [];
      Object.entries(options.update).forEach(([key, value], index) => {
        const attrName = `#attr${index}`;
        const attrValue = `:val${index}`;
        setParts.push(`${attrName} = ${attrValue}`);
        expressionAttributeNames[attrName] = key;
        expressionAttributeValues[attrValue] = value;
      });
      // Always add updatedAt
      setParts.push('#updatedAt = :updatedAt');
      expressionAttributeNames['#updatedAt'] = 'updatedAt';
      expressionAttributeValues[':updatedAt'] = new Date().toISOString();
      
      updateExpression = `SET ${setParts.join(', ')}`;
    } else if (updateExpression) {
      // Add updatedAt to existing expression
      expressionAttributeValues[':updatedAt'] = new Date().toISOString();
    }

    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: options.key,
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ExpressionAttributeValues: Object.keys(expressionAttributeValues).length > 0 ? expressionAttributeValues : undefined,
      ConditionExpression: options.conditionExpression,
      ReturnValues: 'ALL_NEW',
    });

    const result = await this.client.send(command);
    return result.Attributes as T;
  }

  async batchGet<T>(keys: Array<{ PK: string; SK: string }>): Promise<T[]> {
    if (keys.length === 0) return [];

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
