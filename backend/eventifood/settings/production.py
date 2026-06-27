from .base import *  # noqa
import dj_database_url

DEBUG = False

DATABASES = {
    'default': dj_database_url.config(
        default=config('DATABASE_URL'),
        conn_max_age=600,
        ssl_require=False,  # Railway internal network is already secure
    )
}

CORS_ALLOW_ALL_ORIGINS = False
_cors_raw = config('CORS_ALLOWED_ORIGINS', default='')
CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors_raw.replace(',', ' ').split() if o.strip()]
CORS_ALLOWED_ORIGIN_REGEXES = [
    r'^https://[\w-]+\.eventifood\.com$',
]

EMAIL_BACKEND = config('EMAIL_BACKEND', default='django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = config('EMAIL_HOST', default='smtp.sendgrid.net')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = True
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='apikey')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')

STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'

SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
