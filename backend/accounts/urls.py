from django.urls import path
from .views import RegisterView, LoginView, VerifyOTPView, ResendOTPView, LogoutView, SetupInitialAdminView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('verify-otp/', VerifyOTPView.as_view(), name='auth-verify-otp'),
    path('resend-otp/', ResendOTPView.as_view(), name='auth-resend-otp'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('setup-admin/', SetupInitialAdminView.as_view(), name='auth-setup-admin'),
]
