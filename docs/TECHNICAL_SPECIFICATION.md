# FlavorMap — Technical Specification

> **Version:** 1.0  
> **Date:** 2026-03-28  
> **Project:** CSE-220 Web Programming | Acibadem University  
> **Tech Stack:** Django 6 (Backend) + Next.js 16 (Frontend)  
> **Source:** Based on [Product Requirements](./PRODUCT_REQUIREMENTS.md)

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Database Schema](#2-database-schema)
3. [API Design](#3-api-design)
4. [Authentication & Authorization](#4-authentication--authorization)
5. [File Storage](#5-file-storage)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Infrastructure](#7-infrastructure)
8. [Development Workflow](#8-development-workflow)

---

## 1. System Architecture

### 1.1 High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Browser]
        NextJS[Next.js 16 App]
    end

    subgraph "Backend Layer"
        Django[Django 6 API]
        Celery[Celery Workers]
    end

    subgraph "Data Layer"
        PostgreSQL[(PostgreSQL)]
        MinIO[MinIO Object Storage]
        Redis[(Redis Cache)]
    end

    Browser --> NextJS
    NextJS -->|REST API| Django
    Django --> PostgreSQL
    Django --> MinIO
    Django --> Redis
    Django --> Celery
```

### 1.2 Component Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js 16 (apps/web)                    │
├─────────────────────────────────────────────────────────────────┤
│  Pages          │  Components    │  Services     │  State       │
│  - Home         │  - RestaurantCard │ - api.ts   │  - AuthStore │
│  - Restaurant   │  - ReviewCard  │  - auth.ts   │  - UIStore   │
│  - Profile      │  - MapView     │  - search.ts │              │
│  - Search       │  - FilterPanel │              │              │
└─────────────────────────────────────────────────────────────────┘
                            │ REST API
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Django 6 (apps/api)                      │
├─────────────────────────────────────────────────────────────────┤
│  Apps:                                                           │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │ restaurants│ │  reviews   │ │   users    │ │   files    │   │
│  │            │ │            │ │            │ │            │   │
│  │ - models   │ │ - models   │ │ - models   │ │ - models   │   │
│  │ - views    │ │ - views    │ │ - views    │ │ - views    │   │
│  │ - urls     │ │ - urls     │ │ - urls     │ │ - urls     │   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  Middleware: AuthMiddleware, CORSMiddleware, RateLimitMiddleware │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Data Layer                               │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL (Primary)  │  MinIO (Files)  │  Redis (Cache)      │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Data Flow Patterns

#### Read Flow (e.g., Get Restaurant)

```
Client → Next.js SSR/ISR → Django API → PostgreSQL → Response → Client
                    ↓ (optional)
              Redis Cache (for frequently accessed data)
```

#### Write Flow (e.g., Create Review)

```
Client → Django API → Validate → Database Write → Response → Client
                    ↓ (async)
              Update Average Rating (Celery task)
```

#### File Upload Flow

```
Client → Django API (request presigned URL)
      → MinIO presigned URL response
Client → MinIO (upload file directly)
      → Django API (confirm upload, save metadata)
```

---

## 2. Database Schema

### 2.1 Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Review : writes
    User ||--o{ Restaurant : owns
    User ||--o{ Favorite : has
    User ||--o{ ReviewLike : gives

    Restaurant ||--o{ Review : receives
    Restaurant ||--o{ MenuItem : has
    Restaurant ||--o{ RestaurantPhoto : has
    Restaurant ||--o{ OpeningHour : has
    Restaurant }o--|| Category : belongs_to
    Restaurant ||--o{ Favorite : is_in

    Review ||--o{ Review : has_reply
    Review ||--o{ ReviewLike : receives

    RestaurantPhoto }o--|| File : uses

    User {
        uuid id PK
        string email UK
        string username UK
        string password_hash
        string display_name
        string bio
        string avatar_url
        string role "user|owner|admin"
        datetime created_at
        datetime updated_at
    }

    Restaurant {
        uuid id PK
        string name
        string slug UK
        text description
        string phone
        string website
        uuid category_id FK
        uuid owner_id FK
        string address_line1
        string address_line2
        string city
        string district
        string postal_code
        decimal latitude
        decimal longitude
        string price_range "1|2|3"
        decimal average_rating
        int review_count
        datetime created_at
        datetime updated_at
    }

    Category {
        uuid id PK
        string name UK
        string slug UK
        string description
        string icon_url
        int sort_order
    }

    Review {
        uuid id PK
        uuid restaurant_id FK
        uuid user_id FK
        uuid parent_id FK "nullable for replies"
        int rating "1-5"
        text content
        int like_count
        int dislike_count
        datetime created_at
        datetime updated_at
    }

    ReviewLike {
        uuid id PK
        uuid review_id FK
        uuid user_id FK
        boolean is_like
        datetime created_at
    }

    MenuItem {
        uuid id PK
        uuid restaurant_id FK
        string name
        text description
        decimal price
        string currency "EUR"
        boolean is_available
        int sort_order
    }

    OpeningHour {
        uuid id PK
        uuid restaurant_id FK
        int day_of_week "0-6 (Mon-Sun)"
        time open_time
        time close_time
        boolean is_closed
    }

    RestaurantPhoto {
        uuid id PK
        uuid restaurant_id FK
        uuid file_id FK
        string caption
        boolean is_primary
        int sort_order
    }

    Favorite {
        uuid id PK
        uuid user_id FK
        uuid restaurant_id FK
        datetime created_at
    }

    File {
        uuid id PK
        string object_key UK
        string original_filename
        string content_type
        int size_bytes
        int width "nullable"
        int height "nullable"
        uuid uploaded_by FK
        datetime created_at
    }
```

### 2.2 Model Definitions

#### User Model

```python
class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=50, unique=True)
    display_name = models.CharField(max_length=100)
    bio = models.TextField(blank=True)
    avatar_url = models.URLField(blank=True)
    role = models.CharField(
        max_length=20,
        choices=[('user', 'User'), ('owner', 'Restaurant Owner'), ('admin', 'Admin')],
        default='user'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
```

#### Restaurant Model

```python
class Restaurant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    description = models.TextField()
    phone = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True)

    # Relations
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='restaurants')
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='owned_restaurants')

    # Location
    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, db_index=True)
    district = models.CharField(max_length=100, blank=True, db_index=True)
    postal_code = models.CharField(max_length=20, blank=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True)

    # Metadata
    price_range = models.CharField(max_length=1, choices=[('1', '€'), ('2', '€€'), ('3', '€€€')])

    # Aggregated data (denormalized for performance)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    review_count = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['city', 'district']),
            models.Index(fields=['-average_rating']),
            models.Index(fields=['-created_at']),
        ]
```

#### Review Model

```python
class Review(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')

    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    content = models.TextField()

    # Aggregated data
    like_count = models.IntegerField(default=0)
    dislike_count = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['restaurant', '-created_at']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['restaurant', '-like_count']),
        ]
        constraints = [
            # User can only have one review per restaurant (excluding replies)
            models.UniqueConstraint(
                fields=['restaurant', 'user'],
                condition=models.Q(parent__isnull=True),
                name='unique_review_per_user_per_restaurant'
            )
        ]
```

### 2.3 Index Strategy

| Model      | Index                       | Purpose                           |
| ---------- | --------------------------- | --------------------------------- |
| Restaurant | `(city, district)`          | Location filtering                |
| Restaurant | `(-average_rating)`         | Popular ranking                   |
| Restaurant | `(-created_at)`             | Newest restaurants                |
| Review     | `(restaurant, -created_at)` | Restaurant reviews sorted by date |
| Review     | `(restaurant, -like_count)` | Reviews sorted by helpfulness     |
| Review     | `(user, -created_at)`       | User's review history             |
| User       | `(email)`                   | Login lookup                      |
| User       | `(username)`                | Profile lookup                    |

### 2.4 Migration Approach

```bash
# Generate migrations
cd apps/api
python manage.py makemigrations users
python manage.py makemigrations restaurants
python manage.py makemigrations reviews
python manage.py makemigrations files

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

---

## 3. API Design

### 3.1 Conventions

| Convention          | Implementation                                  |
| ------------------- | ----------------------------------------------- |
| **Base URL**        | `/api/v1/`                                      |
| **Naming**          | `snake_case` for all fields                     |
| **Date Format**     | ISO 8601 (`2026-03-28T12:00:00Z`)               |
| **Pagination**      | Cursor-based                                    |
| **Sorting**         | Prefix `-` for descending (e.g., `-created_at`) |
| **Field Selection** | `?fields=id,name,email`                         |
| **Includes**        | `?include=category,owner`                       |
| **Content Type**    | `application/json`                              |

### 3.2 Response Format

#### Success Response

```json
{
  "data": { ... },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-03-28T12:00:00Z"
  }
}
```

#### List Response (Paginated)

```json
{
  "data": [ ... ],
  "pagination": {
    "cursor": "eyJpZCI6MTAwfQ==",
    "has_more": true,
    "total": 500
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-03-28T12:00:00Z"
  }
}
```

#### Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "rating",
        "message": "Rating must be between 1 and 5"
      }
    ]
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-03-28T12:00:00Z"
  }
}
```

### 3.3 Endpoints

#### Authentication

| Method | Endpoint                | Description           | Auth          |
| ------ | ----------------------- | --------------------- | ------------- |
| POST   | `/api/v1/auth/register` | Register new user     | No            |
| POST   | `/api/v1/auth/login`    | Login (get tokens)    | No            |
| POST   | `/api/v1/auth/refresh`  | Refresh access token  | Refresh Token |
| POST   | `/api/v1/auth/logout`   | Logout (revoke token) | Yes           |
| GET    | `/api/v1/auth/me`       | Get current user      | Yes           |

**POST /api/v1/auth/register**

```json
// Request
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "securepassword123",
  "display_name": "John Doe"
}

// Response 201
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "johndoe",
    "display_name": "John Doe",
    "role": "user",
    "created_at": "2026-03-28T12:00:00Z"
  },
  "tokens": {
    "access": "eyJhbGciOiJIUzI1...",
    "refresh": "eyJhbGciOiJIUzI1...",
    "expires_in": 900
  }
}
```

**POST /api/v1/auth/login**

```json
// Request
{
  "email": "user@example.com",
  "password": "securepassword123"
}

// Response 200
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "johndoe",
    "display_name": "John Doe",
    "role": "user",
    "avatar_url": "https://minio.example.com/avatars/user.jpg"
  },
  "tokens": {
    "access": "eyJhbGciOiJIUzI1...",
    "refresh": "eyJhbGciOiJIUzI1...",
    "expires_in": 900
  }
}
```

#### Users

| Method | Endpoint                     | Description        | Auth |
| ------ | ---------------------------- | ------------------ | ---- |
| GET    | `/api/v1/users/{id}`         | Get user profile   | No   |
| PATCH  | `/api/v1/users/me`           | Update own profile | Yes  |
| POST   | `/api/v1/users/me/avatar`    | Upload avatar      | Yes  |
| GET    | `/api/v1/users/me/reviews`   | Get own reviews    | Yes  |
| GET    | `/api/v1/users/me/favorites` | Get favorites      | Yes  |

**PATCH /api/v1/users/me**

```json
// Request
{
  "display_name": "John Smith",
  "bio": "Food enthusiast"
}

// Response 200
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "johndoe",
    "display_name": "John Smith",
    "bio": "Food enthusiast",
    "avatar_url": "https://minio.example.com/avatars/user.jpg",
    "role": "user",
    "created_at": "2026-03-28T12:00:00Z"
  }
}
```

#### Categories

| Method | Endpoint                    | Description     | Auth  |
| ------ | --------------------------- | --------------- | ----- |
| GET    | `/api/v1/categories`        | List categories | No    |
| GET    | `/api/v1/categories/{slug}` | Get category    | No    |
| POST   | `/api/v1/categories`        | Create category | Admin |
| PATCH  | `/api/v1/categories/{id}`   | Update category | Admin |
| DELETE | `/api/v1/categories/{id}`   | Delete category | Admin |

**GET /api/v1/categories**

```json
// Response 200
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Turkish",
      "slug": "turkish",
      "description": "Traditional Turkish cuisine",
      "icon_url": "https://minio.example.com/icons/turkish.svg",
      "restaurant_count": 42
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Italian",
      "slug": "italian",
      "description": "Authentic Italian dishes",
      "icon_url": "https://minio.example.com/icons/italian.svg",
      "restaurant_count": 38
    }
  ]
}
```

#### Restaurants

| Method | Endpoint                                  | Description                     | Auth        |
| ------ | ----------------------------------------- | ------------------------------- | ----------- |
| GET    | `/api/v1/restaurants`                     | List restaurants (with filters) | No          |
| GET    | `/api/v1/restaurants/{slug}`              | Get restaurant details          | No          |
| POST   | `/api/v1/restaurants`                     | Create restaurant               | Owner/Admin |
| PATCH  | `/api/v1/restaurants/{id}`                | Update restaurant               | Owner/Admin |
| DELETE | `/api/v1/restaurants/{id}`                | Delete restaurant               | Owner/Admin |
| POST   | `/api/v1/restaurants/{id}/photos`         | Upload photo                    | Owner/Admin |
| GET    | `/api/v1/restaurants/{id}/menu`           | Get menu                        | No          |
| POST   | `/api/v1/restaurants/{id}/menu`           | Add menu item                   | Owner/Admin |
| PATCH  | `/api/v1/restaurants/{id}/menu/{item_id}` | Update menu item                | Owner/Admin |
| DELETE | `/api/v1/restaurants/{id}/menu/{item_id}` | Delete menu item                | Owner/Admin |
| GET    | `/api/v1/restaurants/{id}/hours`          | Get opening hours               | No          |
| PUT    | `/api/v1/restaurants/{id}/hours`          | Set opening hours               | Owner/Admin |

**GET /api/v1/restaurants**

```json
// Query Parameters
// ?category=turkish&city=istanbul&district=besiktas&price_range=2&min_rating=4&sort=-average_rating&cursor=xxx

// Response 200
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Sultan Sofrası",
      "slug": "sultan-sofrasi",
      "description": "Traditional Turkish restaurant...",
      "category": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "Turkish",
        "slug": "turkish"
      },
      "address": {
        "line1": "Bağdat Caddesi No: 123",
        "city": "Istanbul",
        "district": "Kadıköy",
        "postal_code": "34710"
      },
      "location": {
        "latitude": 40.9778,
        "longitude": 29.0296
      },
      "price_range": "2",
      "average_rating": 4.5,
      "review_count": 128,
      "primary_photo": "https://minio.example.com/photos/restaurant-123.jpg",
      "is_open": true
    }
  ],
  "pagination": {
    "cursor": "eyJpZCI6MTAwfQ==",
    "has_more": true
  }
}
```

**POST /api/v1/restaurants**

```json
// Request
{
  "name": "Sultan Sofrası",
  "description": "Traditional Turkish cuisine with a modern twist...",
  "category_id": "660e8400-e29b-41d4-a716-446655440001",
  "phone": "+90 216 123 4567",
  "website": "https://sultan-sofrasi.example.com",
  "address": {
    "line1": "Bağdat Caddesi No: 123",
    "city": "Istanbul",
    "district": "Kadıköy",
    "postal_code": "34710"
  },
  "location": {
    "latitude": 40.9778,
    "longitude": 29.0296
  },
  "price_range": "2",
  "opening_hours": [
    { "day_of_week": 0, "open_time": "09:00", "close_time": "22:00" },
    { "day_of_week": 1, "open_time": "09:00", "close_time": "22:00" },
    { "day_of_week": 2, "open_time": "09:00", "close_time": "22:00" },
    { "day_of_week": 3, "open_time": "09:00", "close_time": "22:00" },
    { "day_of_week": 4, "open_time": "09:00", "close_time": "23:00" },
    { "day_of_week": 5, "open_time": "09:00", "close_time": "23:00" },
    { "day_of_week": 6, "open_time": "10:00", "close_time": "22:00" }
  ]
}

// Response 201
{
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "name": "Sultan Sofrası",
    "slug": "sultan-sofrasi",
    "owner_id": "550e8400-e29b-41d4-a716-446655440000",
    ...
  }
}
```

#### Reviews

| Method | Endpoint                           | Description                 | Auth        |
| ------ | ---------------------------------- | --------------------------- | ----------- |
| GET    | `/api/v1/restaurants/{id}/reviews` | List reviews                | No          |
| POST   | `/api/v1/restaurants/{id}/reviews` | Create review               | Yes         |
| GET    | `/api/v1/reviews/{id}`             | Get review                  | No          |
| PATCH  | `/api/v1/reviews/{id}`             | Update review (owner only)  | Yes (owner) |
| DELETE | `/api/v1/reviews/{id}`             | Delete review (owner/admin) | Yes         |
| POST   | `/api/v1/reviews/{id}/reply`       | Reply to review             | Owner       |
| POST   | `/api/v1/reviews/{id}/like`        | Like review                 | Yes         |
| DELETE | `/api/v1/reviews/{id}/like`        | Remove like                 | Yes         |
| POST   | `/api/v1/reviews/{id}/dislike`     | Dislike review              | Yes         |
| DELETE | `/api/v1/reviews/{id}/dislike`     | Remove dislike              | Yes         |

**POST /api/v1/restaurants/{id}/reviews**

```json
// Request
{
  "rating": 5,
  "content": "Excellent food and service! The kebabs were amazing..."
}

// Response 201
{
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "restaurant_id": "770e8400-e29b-41d4-a716-446655440002",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "johndoe",
      "display_name": "John Doe",
      "avatar_url": null
    },
    "rating": 5,
    "content": "Excellent food and service! The kebabs were amazing...",
    "like_count": 0,
    "dislike_count": 0,
    "user_reaction": null,
    "replies": [],
    "created_at": "2026-03-28T12:00:00Z"
  },
  "restaurant_updated": {
    "average_rating": 4.6,
    "review_count": 129
  }
}
```

**GET /api/v1/restaurants/{id}/reviews**

```json
// Query Parameters
// ?sort=-like_count&include=replies

// Response 200
{
  "data": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "username": "johndoe",
        "display_name": "John Doe",
        "avatar_url": null
      },
      "rating": 5,
      "content": "Excellent food and service!",
      "like_count": 15,
      "dislike_count": 2,
      "user_reaction": "like",
      "replies": [
        {
          "id": "990e8400-e29b-41d4-a716-446655440004",
          "user": {
            "id": "110e8400-e29b-41d4-a716-446655440005",
            "username": "sultan_owner",
            "display_name": "Sultan Sofrası",
            "avatar_url": "https://minio.example.com/logos/sultan.jpg",
            "role": "owner"
          },
          "content": "Thank you for your kind words! We hope to see you again.",
          "created_at": "2026-03-28T14:00:00Z"
        }
      ],
      "created_at": "2026-03-28T12:00:00Z"
    }
  ],
  "pagination": {
    "cursor": null,
    "has_more": false
  },
  "summary": {
    "average_rating": 4.5,
    "total_count": 128,
    "rating_distribution": {
      "5": 80,
      "4": 30,
      "3": 10,
      "2": 5,
      "1": 3
    }
  }
}
```

#### Favorites

| Method | Endpoint                            | Description           | Auth |
| ------ | ----------------------------------- | --------------------- | ---- |
| GET    | `/api/v1/favorites`                 | List user's favorites | Yes  |
| POST   | `/api/v1/favorites/{restaurant_id}` | Add to favorites      | Yes  |
| DELETE | `/api/v1/favorites/{restaurant_id}` | Remove from favorites | Yes  |

**POST /api/v1/favorites/{restaurant_id}**

```json
// Response 201
{
  "data": {
    "restaurant_id": "770e8400-e29b-41d4-a716-446655440002",
    "added_at": "2026-03-28T12:00:00Z"
  }
}
```

#### Search & Discovery

| Method | Endpoint                        | Description           | Auth |
| ------ | ------------------------------- | --------------------- | ---- |
| GET    | `/api/v1/search`                | Full-text search      | No   |
| GET    | `/api/v1/restaurants/popular`   | Popular restaurants   | No   |
| GET    | `/api/v1/restaurants/top-rated` | Top-rated restaurants | No   |
| GET    | `/api/v1/restaurants/nearby`    | Nearby restaurants    | No   |
| GET    | `/api/v1/restaurants/map`       | Map data for markers  | No   |

**GET /api/v1/search**

```json
// Query Parameters
// ?q=kebab&category=turkish&city=istanbul

// Response 200
{
  "data": {
    "restaurants": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440002",
        "name": "Sultan Sofrası",
        "slug": "sultan-sofrasi",
        "type": "restaurant",
        "relevance_score": 0.95
      }
    ],
    "categories": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "Turkish",
        "slug": "turkish",
        "type": "category",
        "restaurant_count": 42
      }
    ]
  }
}
```

**GET /api/v1/restaurants/map**

```json
// Query Parameters
// ?north=41.1&south=40.9&east=29.2&west=28.9&category=turkish&price_range=2

// Response 200
{
  "data": {
    "markers": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440002",
        "name": "Sultan Sofrası",
        "slug": "sultan-sofrasi",
        "location": {
          "lat": 40.9778,
          "lng": 29.0296
        },
        "average_rating": 4.5,
        "price_range": "2",
        "primary_photo": "https://minio.example.com/photos/restaurant-123.jpg"
      }
    ],
    "clusters": []
  }
}
```

#### File Management

| Method | Endpoint                   | Description              | Auth |
| ------ | -------------------------- | ------------------------ | ---- |
| POST   | `/api/v1/files/upload-url` | Get presigned upload URL | Yes  |
| POST   | `/api/v1/files`            | Confirm upload           | Yes  |
| GET    | `/api/v1/files/{id}`       | Get file info            | No   |

**POST /api/v1/files/upload-url**

```json
// Request
{
  "filename": "restaurant-photo.jpg",
  "content_type": "image/jpeg",
  "size_bytes": 1048576,
  "purpose": "restaurant_photo"
}

// Response 200
{
  "data": {
    "upload_id": "upload_abc123",
    "presigned_url": "https://minio.example.com/flavormap-photos?...",
    "object_key": "photos/2026/03/28/abc123.jpg",
    "expires_in": 3600
  }
}
```

**POST /api/v1/files**

```json
// Request (after uploading to MinIO)
{
  "upload_id": "upload_abc123",
  "object_key": "photos/2026/03/28/abc123.jpg"
}

// Response 201
{
  "data": {
    "id": "ff0e8400-e29b-41d4-a716-446655440006",
    "object_key": "photos/2026/03/28/abc123.jpg",
    "original_filename": "restaurant-photo.jpg",
    "content_type": "image/jpeg",
    "size_bytes": 1048576,
    "url": "https://minio.example.com/flavormap-photos/photos/2026/03/28/abc123.jpg",
    "created_at": "2026-03-28T12:00:00Z"
  }
}
```

### 3.4 Error Codes

| Code               | HTTP Status | Description                                |
| ------------------ | ----------- | ------------------------------------------ |
| `VALIDATION_ERROR` | 400         | Invalid input data                         |
| `AUTH_REQUIRED`    | 401         | Authentication required                    |
| `TOKEN_EXPIRED`    | 401         | Access token expired                       |
| `TOKEN_INVALID`    | 401         | Invalid token                              |
| `FORBIDDEN`        | 403         | Insufficient permissions                   |
| `NOT_FOUND`        | 404         | Resource not found                         |
| `CONFLICT`         | 409         | Resource conflict (e.g., duplicate review) |
| `RATE_LIMITED`     | 429         | Rate limit exceeded                        |
| `INTERNAL_ERROR`   | 500         | Internal server error                      |

### 3.5 Rate Limiting

| Endpoint Category | Limit | Window   |
| ----------------- | ----- | -------- |
| Authentication    | 5     | 1 minute |
| Write operations  | 30    | 1 minute |
| Read operations   | 100   | 1 minute |
| Search            | 20    | 1 minute |

---

## 4. Authentication & Authorization

### 4.1 JWT Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    Authentication Flow                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Client                          Server                         │
│    │                               │                            │
│    │  POST /auth/login             │                            │
│    │  {email, password}            │                            │
│    │──────────────────────────────►│                            │
│    │                               │ Validate credentials       │
│    │                               │ Generate tokens            │
│    │  {access_token, refresh_token}│                            │
│    │◄──────────────────────────────│                            │
│    │                               │                            │
│    │  GET /restaurants             │                            │
│    │  Authorization: Bearer {at}   │                            │
│    │──────────────────────────────►│                            │
│    │                               │ Verify token               │
│    │  200 OK {data}                │                            │
│    │◄──────────────────────────────│                            │
│    │                               │                            │
│    │  (token expired)              │                            │
│    │                               │                            │
│    │  POST /auth/refresh           │                            │
│    │  {refresh_token}              │                            │
│    │──────────────────────────────►│                            │
│    │                               │ Validate refresh token     │
│    │  {new_access_token}           │ Generate new access token  │
│    │◄──────────────────────────────│                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Token Configuration

| Token         | Lifetime   | Storage         | Purpose              |
| ------------- | ---------- | --------------- | -------------------- |
| Access Token  | 15 minutes | Memory/State    | API requests         |
| Refresh Token | 7 days     | HttpOnly Cookie | Get new access token |

### 4.3 Role-Based Access Control

```python
# Role permissions
PERMISSIONS = {
    'user': [
        'view_restaurants',
        'create_reviews',
        'manage_own_reviews',
        'manage_favorites',
        'manage_own_profile',
    ],
    'owner': [
        # All user permissions, plus:
        'manage_owned_restaurants',
        'manage_menu',
        'manage_photos',
        'manage_opening_hours',
        'reply_to_reviews',
    ],
    'admin': [
        # All permissions
        'manage_all_restaurants',
        'manage_categories',
        'manage_users',
        'manage_files',
    ]
}
```

### 4.4 Permission Classes

```python
class IsAuthenticated(BasePermission):
    """User must be authenticated"""

class IsOwner(BasePermission):
    """User must own the resource or be admin"""

class IsAdmin(BasePermission):
    """User must be admin"""

class IsRestaurantOwner(BasePermission):
    """User must be the restaurant owner or admin"""

class IsReviewAuthor(BasePermission):
    """User must be the review author"""
```

---

## 5. File Storage

### 5.1 MinIO Configuration

```python
# settings.py
MINIO_CONFIG = {
    'endpoint': env('MINIO_ENDPOINT', 'minio:9000'),
    'access_key': env('MINIO_ACCESS_KEY'),
    'secret_key': env('MINIO_SECRET_KEY'),
    'bucket_photos': 'flavormap-photos',
    'bucket_avatars': 'flavormap-avatars',
    'secure': env.bool('MINIO_SECURE', False),
    'presigned_url_expiry': 3600,  # 1 hour
}
```

### 5.2 Upload Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant MinIO

    Client->>API: POST /files/upload-url
    API->>API: Validate file metadata
    API->>API: Generate unique object_key
    API->>MinIO: Generate presigned URL
    API-->>Client: Return presigned URL

    Client->>MinIO: PUT file (using presigned URL)
    MinIO-->>Client: 200 OK

    Client->>API: POST /files (confirm upload)
    API->>API: Create File record
    API-->>Client: File metadata

    Note over Client,API: Optional: Generate thumbnail (Celery)
```

### 5.3 Storage Structure

```
flavormap-photos/
├── restaurants/
│   ├── {restaurant_id}/
│   │   ├── {timestamp}_{random}.jpg
│   │   └── thumbnails/
│   │       └── {timestamp}_{random}_thumb.jpg
├── reviews/
│   └── {review_id}/
│       └── {timestamp}_{random}.jpg
└── misc/
    └── {timestamp}_{random}.{ext}

flavormap-avatars/
└── users/
    └── {user_id}/
        └── {timestamp}_{random}.jpg
```

### 5.4 File Processing

| Type             | Max Size | Allowed Types   | Thumbnails    |
| ---------------- | -------- | --------------- | ------------- |
| Restaurant Photo | 10 MB    | JPEG, PNG, WebP | Yes (3 sizes) |
| Review Photo     | 5 MB     | JPEG, PNG, WebP | Yes (2 sizes) |
| Avatar           | 2 MB     | JPEG, PNG, WebP | Yes (2 sizes) |

---

## 6. Frontend Architecture

### 6.1 Routing Structure

```
apps/web/src/
├── app/                          # Next.js 16 App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Homepage
│   ├── restaurants/
│   │   ├── page.tsx             # Restaurant list/search
│   │   └── [slug]/
│   │       ├── page.tsx         # Restaurant detail
│   │       ├── menu/page.tsx    # Menu
│   │       └── reviews/page.tsx # Reviews
│   ├── search/
│   │   └── page.tsx             # Search results
│   ├── map/
│   │   └── page.tsx             # Interactive map
│   ├── profile/
│   │   ├── page.tsx             # Own profile
│   │   ├── favorites/page.tsx   # Favorites list
│   │   └── reviews/page.tsx     # Own reviews
│   ├── auth/
│   │   ├── login/page.tsx       # Login
│   │   └── register/page.tsx    # Register
│   ├── owner/
│   │   └── dashboard/page.tsx   # Restaurant owner dashboard
│   └── admin/
│       └── page.tsx             # Admin panel
├── components/
│   ├── ui/                      # Reusable UI components
│   ├── restaurant/              # Restaurant-specific components
│   ├── review/                  # Review components
│   ├── map/                     # Map components
│   └── layout/                  # Layout components
├── lib/
│   ├── api/                     # API client
│   ├── auth/                    # Auth utilities
│   └── utils/                   # General utilities
└── stores/
    ├── auth-store.ts            # Auth state
    └── ui-store.ts              # UI state
```

### 6.2 State Management

```typescript
// stores/auth-store.ts
interface AuthState {
  user: User | null;
  tokens: {
    access: string | null;
    refresh: string | null;
  };
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshTokens: () => Promise<void>;
}

// stores/ui-store.ts
interface UIState {
  isMenuOpen: boolean;
  searchQuery: string;
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;
  clearFilters: () => void;
}
```

### 6.3 API Client

```typescript
// lib/api/client.ts
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: Add auth token
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await refreshTokens();
      return apiClient.request(error.config);
    }
    return Promise.reject(error);
  },
);
```

### 6.4 Component Organization

```
components/
├── ui/                          # Generic UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   ├── Pagination.tsx
│   └── StarRating.tsx
├── restaurant/
│   ├── RestaurantCard.tsx
│   ├── RestaurantGrid.tsx
│   ├── RestaurantFilters.tsx
│   ├── RestaurantMap.tsx
│   └── RestaurantForm.tsx
├── review/
│   ├── ReviewCard.tsx
│   ├── ReviewForm.tsx
│   ├── ReviewList.tsx
│   └── ReviewReply.tsx
├── map/
│   ├── MapView.tsx
│   ├── MapMarker.tsx
│   └── MapCluster.tsx
└── layout/
    ├── Header.tsx
    ├── Footer.tsx
    ├── Sidebar.tsx
    └── MobileNav.tsx
```

---

## 7. Infrastructure

### 7.1 Docker Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    ports:
      - '8000:8000'
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/flavormap
      - REDIS_URL=redis://redis:6379/0
      - MINIO_ENDPOINT=minio:9000
    depends_on:
      - db
      - redis
      - minio

  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    ports:
      - '3000:3000'
    environment:
      - NEXT_PUBLIC_API_URL=http://api:8000/api/v1
    depends_on:
      - api

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=flavormap
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin
    volumes:
      - minio_data:/data
    ports:
      - '9000:9000'
      - '9001:9001'

volumes:
  postgres_data:
  minio_data:
```

### 7.2 Environment Variables

```bash
# .env.example

# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/flavormap
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ACCESS_TOKEN_LIFETIME=900
JWT_REFRESH_TOKEN_LIFETIME=604800

# MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_SECURE=False
MINIO_BUCKET_PHOTOS=flavormap-photos
MINIO_BUCKET_AVATARS=flavormap-avatars

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxx
```

### 7.3 Development Workflow

```bash
# Start all services
docker-compose up -d

# Run Django migrations
docker-compose exec api python manage.py migrate

# Create superuser
docker-compose exec api python manage.py createsuperuser

# Run tests
docker-compose exec api python manage.py test
docker-compose exec web npm test

# View logs
docker-compose logs -f api
docker-compose logs -f web
```

---

## 8. Development Workflow

### 8.1 Branch Strategy

```
main
├── develop
│   ├── feature/restaurant-crud
│   ├── feature/review-system
│   ├── feature/user-auth
│   └── feature/map-integration
└── hotfix/bug-fix
```

### 8.2 Commit Convention

```
feat(restaurant): add opening hours management
fix(review): handle nested reply deletion
docs(api): update endpoint documentation
test(auth): add token refresh tests
refactor(files): simplify upload flow
```

### 8.3 Testing Strategy

| Layer              | Framework                | Coverage Target |
| ------------------ | ------------------------ | --------------- |
| Django Models      | pytest                   | 100%            |
| Django Views       | pytest + DRF test client | 90%             |
| Next.js Components | Vitest + Testing Library | 80%             |
| E2E                | Playwright               | Critical paths  |

### 8.4 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test-api:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
    steps:
      - uses: actions/checkout@v4
      - run: cd apps/api && pip install -r requirements.txt
      - run: cd apps/api && python manage.py test

  test-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cd apps/web && npm ci
      - run: cd apps/web && npm test
      - run: cd apps/web && npm run build
```

---

## Appendix

### A. API Versioning

All API endpoints are prefixed with `/api/v1/`. Future versions will use `/api/v2/`, etc.

### B. Caching Strategy

| Data              | TTL      | Strategy     |
| ----------------- | -------- | ------------ |
| Restaurant list   | 5 min    | Redis cache  |
| Category list     | 1 hour   | Redis cache  |
| Restaurant detail | 1 min    | Redis cache  |
| User profile      | No cache | Direct query |

### C. Database Backup

Daily automated backups using `pg_dump` with 30-day retention.

### D. Monitoring

- **Sentry** for error tracking
- **Prometheus + Grafana** for metrics
- **Health check endpoint** at `/api/v1/health`

---

_Last updated: 2026-03-28_
