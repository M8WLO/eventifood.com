from django.urls import path
from .views import (
    RegisterView, LoginView, VerifyOTPView, ResendOTPView, LogoutView,
    SetupInitialAdminView, AdminUserDetailView, AdminUserPasswordResetView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('verify-otp/', VerifyOTPView.as_view(), name='auth-verify-otp'),
    path('resend-otp/', ResendOTPView.as_view(), name='auth-resend-otp'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('setup-admin/', SetupInitialAdminView.as_view(), name='auth-setup-admin'),
    path('admin/users/<int:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/users/<int:pk>/reset-password/', AdminUserPasswordResetView.as_view(), name='admin-user-reset-password'),
]
