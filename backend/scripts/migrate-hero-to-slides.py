#!/usr/bin/env python3
"""Migrate hero_section from individual fields to slides array format."""

import boto3
from decimal import Decimal

ddb = boto3.resource('dynamodb', region_name='ap-south-1')
table = ddb.Table('swami-rupeshwaranand-api-dev-main')

# Hero component - migrate to slides format
hero_id = '714d9008-32f7-47e9-a9c3-325a9269c172'
new_fields = [
    {
        'key': 'slides',
        'value': [
            {
                'imageUrl': 'https://swami-rupeshwaranand-api-dev-content.s3.ap-south-1.amazonaws.com/images/1770448102554-fa232c8f.jpg',
                'heading': {'en': 'Sri Pitambara Peeth', 'hi': '\u0936\u094d\u0930\u0940 \u092a\u0940\u0924\u093e\u092e\u094d\u092c\u0930\u093e \u092a\u0940\u0920'},
                'subheading': {'en': 'A sacred abode of spiritual wisdom and divine grace', 'hi': '\u0906\u0927\u094d\u092f\u093e\u0924\u094d\u092e\u093f\u0915 \u091c\u094d\u091e\u093e\u0928 \u0914\u0930 \u0926\u0948\u0935\u0940\u092f \u0915\u0943\u092a\u093e \u0915\u093e \u092a\u0935\u093f\u0924\u094d\u0930 \u0927\u093e\u092e'},
                'ctaText': {'en': 'Learn More', 'hi': '\u0914\u0930 \u091c\u093e\u0928\u0947\u0902'},
                'ctaLink': '/swamiji'
            }
        ]
    },
    {'key': 'overlayOpacity', 'value': Decimal('0.5')},
    {'key': 'enableParallax', 'value': True}
]

resp = table.update_item(
    Key={'PK': f'CMS_COMPONENT#{hero_id}', 'SK': f'CMS_COMPONENT#{hero_id}'},
    UpdateExpression='SET #f = :fields',
    ExpressionAttributeNames={'#f': 'fields'},
    ExpressionAttributeValues={':fields': new_fields}
)
print('Hero updated:', resp['ResponseMetadata']['HTTPStatusCode'])

# Events component - add events array
events_data = table.scan(
    FilterExpression=boto3.dynamodb.conditions.Attr('componentType').eq('upcoming_events')
)
for item in events_data.get('Items', []):
    eid = item['PK'].replace('CMS_COMPONENT#', '')
    existing_fields = item.get('fields', [])
    title_field = next((f for f in existing_fields if f['key'] == 'title'), None)
    subtitle_field = next((f for f in existing_fields if f['key'] == 'subtitle'), None)

    new_event_fields = []
    if title_field:
        new_event_fields.append(title_field)
    if subtitle_field:
        new_event_fields.append(subtitle_field)
    new_event_fields.append({
        'key': 'events',
        'value': [
            {
                'title': {'en': 'Hanuman Chalisa Path', 'hi': '\u0939\u0928\u0941\u092e\u093e\u0928 \u091a\u093e\u0932\u0940\u0938\u093e \u092a\u093e\u0920'},
                'description': {'en': 'Weekly recitation of Hanuman Chalisa', 'hi': '\u0938\u093e\u092a\u094d\u0924\u093e\u0939\u093f\u0915 \u0939\u0928\u0941\u092e\u093e\u0928 \u091a\u093e\u0932\u0940\u0938\u093e \u092a\u093e\u0920'},
                'date': '2025-03-01T07:00:00',
                'location': {'en': 'Main Temple Hall', 'hi': '\u092e\u0941\u0916\u094d\u092f \u092e\u0902\u0926\u093f\u0930 \u0939\u0949\u0932'},
                'imageUrl': '',
                'link': '/events'
            }
        ]
    })

    resp = table.update_item(
        Key={'PK': item['PK'], 'SK': item['SK']},
        UpdateExpression='SET #f = :fields',
        ExpressionAttributeNames={'#f': 'fields'},
        ExpressionAttributeValues={':fields': new_event_fields}
    )
    print(f'Events component {eid} updated:', resp['ResponseMetadata']['HTTPStatusCode'])

print('Migration complete!')
