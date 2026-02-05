#!/bin/bash

# Seed script for local development

echo "Seeding sample data..."

# Super Admin User - subham11@gmail.com
echo "Creating Super Admin user..."
aws dynamodb put-item \
    --table-name swami-rupeshwaranand-api-local-main \
    --item '{
        "PK": {"S": "USER#super-admin-001"},
        "SK": {"S": "USER#super-admin-001"},
        "GSI1PK": {"S": "USER"},
        "GSI1SK": {"S": "EMAIL#subham11@gmail.com"},
        "id": {"S": "super-admin-001"},
        "email": {"S": "subham11@gmail.com"},
        "name": {"S": "Subham (Super Admin)"},
        "role": {"S": "super_admin"},
        "status": {"S": "active"},
        "createdAt": {"S": "2026-02-05T00:00:00.000Z"},
        "updatedAt": {"S": "2026-02-05T00:00:00.000Z"}
    }' \
    --endpoint-url http://localhost:8000 \
    --region ap-south-1

echo "Super Admin user created!"

# Sample teaching
aws dynamodb put-item \
    --table-name swami-rupeshwaranand-api-local-main \
    --item '{
        "PK": {"S": "TEACHING#1"},
        "SK": {"S": "TEACHING#en"},
        "GSI1PK": {"S": "TEACHING#discourse"},
        "GSI1SK": {"S": "en#path-to-inner-peace"},
        "id": {"S": "1"},
        "locale": {"S": "en"},
        "slug": {"S": "path-to-inner-peace"},
        "title": {"S": "The Path to Inner Peace"},
        "content": {"S": "In the journey of life, inner peace is the greatest treasure..."},
        "excerpt": {"S": "Discover the timeless wisdom for achieving inner peace."},
        "category": {"S": "discourse"},
        "tags": {"L": [{"S": "peace"}, {"S": "meditation"}, {"S": "wisdom"}]},
        "status": {"S": "published"},
        "publishedAt": {"S": "2024-01-01T00:00:00.000Z"},
        "createdAt": {"S": "2024-01-01T00:00:00.000Z"},
        "updatedAt": {"S": "2024-01-01T00:00:00.000Z"}
    }' \
    --endpoint-url http://localhost:8000 \
    --region ap-south-1

# Sample event
aws dynamodb put-item \
    --table-name swami-rupeshwaranand-api-local-main \
    --item '{
        "PK": {"S": "EVENT#1"},
        "SK": {"S": "EVENT#en"},
        "GSI1PK": {"S": "EVENT"},
        "GSI1SK": {"S": "DATE#2024-03-15T10:00:00.000Z"},
        "id": {"S": "1"},
        "locale": {"S": "en"},
        "title": {"S": "Spiritual Retreat 2024"},
        "description": {"S": "Join us for a transformative spiritual retreat at the ashram."},
        "startDate": {"S": "2024-03-15T10:00:00.000Z"},
        "endDate": {"S": "2024-03-17T18:00:00.000Z"},
        "location": {"S": "Haridwar, Uttarakhand"},
        "venue": {"S": "Swami Rupeshwaranand Ashram"},
        "status": {"S": "upcoming"},
        "createdAt": {"S": "2024-01-01T00:00:00.000Z"},
        "updatedAt": {"S": "2024-01-01T00:00:00.000Z"}
    }' \
    --endpoint-url http://localhost:8000 \
    --region ap-south-1

echo "Sample data seeded successfully!"
