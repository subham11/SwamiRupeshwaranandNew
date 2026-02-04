/**
 * Database abstraction interface
 * Allows switching between MongoDB (local) and DynamoDB (production)
 */

export interface QueryOptions {
  indexName?: string;
  keyConditionExpression?: string;
  expressionAttributeNames?: Record<string, string>;
  expressionAttributeValues?: Record<string, any>;
  filterExpression?: string;
  filter?: Record<string, any>;
  limit?: number;
  exclusiveStartKey?: Record<string, any>;
  scanIndexForward?: boolean;
  sort?: Record<string, 1 | -1>;
}

export interface UpdateOptions {
  key: Record<string, any>;
  updateExpression?: string;
  expressionAttributeNames?: Record<string, string>;
  expressionAttributeValues?: Record<string, any>;
  conditionExpression?: string;
  update?: Record<string, any>;
}

export interface DatabaseService {
  get<T>(pk: string, sk: string): Promise<T | null>;
  put<T extends Record<string, any>>(item: T): Promise<T>;
  delete(pk: string, sk: string): Promise<void>;
  query<T>(entityType: string, options: QueryOptions): Promise<{ items: T[]; lastKey?: Record<string, any> }>;
  scan<T>(entityType: string, filter?: Record<string, any>): Promise<T[]>;
  update<T>(entityType: string, options: UpdateOptions): Promise<T>;
  batchGet<T>(keys: Array<{ PK: string; SK: string }>): Promise<T[]>;
  batchWrite(items: Array<{ PutRequest?: { Item: Record<string, any> }; DeleteRequest?: { Key: Record<string, any> } }>): Promise<void>;
}

export const DATABASE_SERVICE = 'DATABASE_SERVICE';
