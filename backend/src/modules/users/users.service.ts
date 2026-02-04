import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService, DATABASE_SERVICE } from '@/common/database';
import { CognitoService } from '@/common/cognito';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto';

interface UserEntity {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class UsersService {
  private readonly entityType = 'USER';

  constructor(
    @Inject(DATABASE_SERVICE)
    private readonly databaseService: DatabaseService,
    private readonly cognitoService: CognitoService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const id = uuidv4();
    const temporaryPassword = this.generateTemporaryPassword();

    // Create user in Cognito
    await this.cognitoService.createUser(
      createUserDto.email,
      temporaryPassword,
      createUserDto.name,
    );

    // Create user in DynamoDB
    const user: UserEntity = {
      PK: `${this.entityType}#${id}`,
      SK: `${this.entityType}#${id}`,
      GSI1PK: `${this.entityType}`,
      GSI1SK: `EMAIL#${createUserDto.email}`,
      id,
      email: createUserDto.email,
      name: createUserDto.name,
      role: createUserDto.role || 'user',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.databaseService.put(user);

    return this.mapToResponse(user);
  }

  async findAll(): Promise<UserResponseDto[]> {
    const result = await this.databaseService.query<UserEntity>(this.entityType, {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk',
      expressionAttributeValues: {
        ':pk': this.entityType,
      },
    });

    return result.items.map(this.mapToResponse);
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.databaseService.get<UserEntity>(
      `${this.entityType}#${id}`,
      `${this.entityType}#${id}`,
    );

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.mapToResponse(user);
  }

  async findByEmail(email: string): Promise<UserResponseDto | null> {
    const result = await this.databaseService.query<UserEntity>(this.entityType, {
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :pk AND GSI1SK = :sk',
      expressionAttributeValues: {
        ':pk': this.entityType,
        ':sk': `EMAIL#${email}`,
      },
    });

    if (result.items.length === 0) {
      return null;
    }

    return this.mapToResponse(result.items[0]);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const existing = await this.findById(id);

    if (!existing) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    if (updateUserDto.name !== undefined) {
      updateExpressions.push('#name = :name');
      expressionAttributeNames['#name'] = 'name';
      expressionAttributeValues[':name'] = updateUserDto.name;

      // Update in Cognito too
      await this.cognitoService.updateUserAttributes(existing.email, {
        name: updateUserDto.name,
      });
    }

    if (updateUserDto.role !== undefined) {
      updateExpressions.push('#role = :role');
      expressionAttributeNames['#role'] = 'role';
      expressionAttributeValues[':role'] = updateUserDto.role;
    }

    if (updateUserDto.status !== undefined) {
      updateExpressions.push('#status = :status');
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = updateUserDto.status;
    }

    updateExpressions.push('updatedAt = :updatedAt');

    const updated = await this.databaseService.update<UserEntity>(this.entityType, {
      key: {
        PK: `${this.entityType}#${id}`,
        SK: `${this.entityType}#${id}`,
      },
      updateExpression: `SET ${updateExpressions.join(', ')}`,
      expressionAttributeNames,
      expressionAttributeValues,
    });

    return this.mapToResponse(updated);
  }

  async delete(id: string): Promise<void> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Delete from Cognito
    await this.cognitoService.deleteUser(user.email);

    // Delete from Database
    await this.databaseService.delete(`${this.entityType}#${id}`, `${this.entityType}#${id}`);
  }

  private mapToResponse(user: UserEntity): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}
