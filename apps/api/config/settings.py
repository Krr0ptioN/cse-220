"""
Django settings for FlavorMap API.

Generated for CSE-220 Web Programming project.
"""

from pathlib import Path
from decouple import config

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config(
    "DJANGO_SECRET_KEY",
    default="django-insecure-change-me-in-production-!@#$%^&*()",
)

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config("DJANGO_DEBUG", default=True, cast=bool)

ALLOWED_HOSTS = config(
    "DJANGO_ALLOWED_HOSTS",
    default="localhost,127.0.0.1",
    cast=lambda v: [s.strip() for s in v.split(",")],
)

# Application definition
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "corsheaders",
    "rest_framework",
    "drf_spectacular",
    # Local apps
    "api",
    "users",
    "restaurants",
    "reviews",
    "files",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# Database
# https://docs.djangoproject.com/en/6.0/ref/settings/#databases
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# Password validation
# https://docs.djangoproject.com/en/6.0/ref/settings/#auth-password-validators
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/6.0/ref/settings/#static-files
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# Media files (User uploads)
# https://docs.djangoproject.com/en/6.0/ref/settings/#media
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Object file storage
FILE_STORAGE_BACKEND = config("FILE_STORAGE_BACKEND", default="local")
FILE_STORAGE_LOCAL_ROOT = config("FILE_STORAGE_LOCAL_ROOT", default=str(MEDIA_ROOT))
FILE_STORAGE_LOCAL_URL = config("FILE_STORAGE_LOCAL_URL", default=MEDIA_URL)
FILE_STORAGE_MAX_SIZE = config("FILE_STORAGE_MAX_SIZE", default=5 * 1024 * 1024, cast=int)
FILE_STORAGE_MAX_IMAGE_PIXELS = config(
    "FILE_STORAGE_MAX_IMAGE_PIXELS",
    default=20_000_000,
    cast=int,
)
FILE_STORAGE_THUMBNAIL_SIZES = config(
    "FILE_STORAGE_THUMBNAIL_SIZES",
    default="64,128,256",
    cast=lambda v: tuple(int(size.strip()) for size in v.split(",") if size.strip()),
)

MINIO_ENDPOINT = config("MINIO_ENDPOINT", default="localhost:9000")
MINIO_ACCESS_KEY = config("MINIO_ACCESS_KEY", default="minioadmin")
MINIO_SECRET_KEY = config("MINIO_SECRET_KEY", default="minioadmin")
MINIO_BUCKET_NAME = config("MINIO_BUCKET_NAME", default="uploads")
MINIO_SECURE = config("MINIO_SECURE", default=False, cast=bool)

# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Custom user model
AUTH_USER_MODEL = "users.User"

# CORS settings
is_debug = config("DEBUG", default=None)
if is_debug is None:
    is_debug = config("DJANGO_DEBUG", default=True, cast=bool)
else:
    is_debug = config("DEBUG", default=False, cast=bool)

if is_debug:
    ALLOWED_HOSTS = ["*"]
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOWED_ORIGINS = config(
        "CORS_ALLOWED_ORIGINS",
        default="http://localhost:3000,http://localhost:3001,http://localhost:8020",
        cast=lambda v: [s.strip() for s in v.split(",")],
    )
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = config(
    "CSRF_TRUSTED_ORIGINS",
    default=(
        "http://localhost:3000,http://localhost:3001,http://localhost:3050,"
        "http://localhost:8020,http://127.0.0.1:3000,http://127.0.0.1:3001,"
        "http://127.0.0.1:3050,http://127.0.0.1:8020,"
        "http://192.168.1.118:3000,http://192.168.1.118:3001,"
        "http://192.168.1.118:3050,http://192.168.1.118:8020"
    ),
    cast=lambda v: [s.strip() for s in v.split(",")],
)

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER": "api.exceptions.custom_exception_handler",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "FlavorMap API",
    "DESCRIPTION": (
        "Restaurant review and discovery platform — discover restaurants, "
        "write reviews, rate experiences, and manage favorites."
    ),
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "REDOC_UI_SETTINGS": {
        "theme": {
            "colors": {
                "primary": {"main": "#4A74E8"},
            },
            "typography": {
                "fontFamily": "Inter, sans-serif",
                "headings": {"fontFamily": "Inter, sans-serif"},
            },
        },
    },
    "COMPONENT_SPLIT_PATCH": True,
    "COMPONENT_SPLIT_REQUEST": True,
}
