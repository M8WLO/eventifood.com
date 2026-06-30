from django.utils import timezone
from django.conf import settings
from datetime import timedelta
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken

from .models import User, EmailOTP, PlatformConfig
from .serializers import RegisterSerializer, LoginSerializer, OTPVerifySerializer
from .utils import (
    generate_otp_code, send_otp_email, make_partial_token, verify_partial_token,
    make_email_verify_token, verify_email_token, send_verification_email,
)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from tenants.models import Tenant
        from tenants.serializers import TenantSerializer

        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        store_name = request.data.get('store_name', '').strip()
        store_slug = request.data.get('store_slug', '').strip()
        if not store_name or not store_slug:
            return Response({'detail': 'store_name and store_slug are required.'}, status=status.HTTP_400_BAD_REQUEST)
        if Tenant.objects.filter(slug=store_slug).exists():
            return Response({'store_slug': ['A store with this URL already exists.']}, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
        user.is_active = False
        user.email_verified = False
        user.save()

        tenant = Tenant.objects.create(name=store_name, slug=store_slug)
        tenant.generate_qr_code()
        tenant.save()
        from accounts.models import TenantMembership
        TenantMembership.objects.create(user=user, tenant=tenant, role='owner')

        token = make_email_verify_token(user.id)
        send_verification_email(user, token)

        return Response(
            {'detail': 'Account created. Please check your email to verify and activate your store.'},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.check_password(password):
            return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            if not getattr(user, 'email_verified', True):
                return Response(
                    {'detail': 'Please verify your email address first. Check your inbox for the activation link.'},
                    status=status.HTTP_403_FORBIDDEN,
                )
            return Response({'detail': 'Account is disabled.'}, status=status.HTTP_403_FORBIDDEN)

        if PlatformConfig.get().mfa_required and user.mfa_enabled:
            from accounts.models import TenantMembership
            membership = TenantMembership.objects.filter(user=user).select_related('tenant').first()
            is_demo = bool(membership and membership.tenant.is_demo)

            if not is_demo:
                code = generate_otp_code()
                EmailOTP.objects.create(
                    user=user,
                    code=code,
                    expires_at=timezone.now() + timedelta(minutes=10),
                )
                sent = send_otp_email(user, code)
                if not sent:
                    return Response(
                        {'detail': 'Could not send login code — email service unavailable. Please try again shortly.'},
                        status=status.HTTP_503_SERVICE_UNAVAILABLE,
                    )
            partial_token = make_partial_token(user.id)
            return Response({
                'mfa_required': True,
                'partial_token': partial_token,
                'is_demo': is_demo,
            }, status=status.HTTP_200_OK)

        refresh = RefreshToken.for_user(user)
        refresh['email'] = user.email
        refresh['full_name'] = user.full_name
        refresh['is_superadmin'] = user.is_superadmin
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_200_OK)


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user_id = verify_partial_token(serializer.validated_data['partial_token'])
        if user_id is None:
            return Response({'detail': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_400_BAD_REQUEST)

        code = serializer.validated_data['code']

        # Demo mode: accept 000000 only if the tenant is flagged is_demo in the DB.
        # This is determined server-side — no client-supplied parameter is trusted.
        from accounts.models import TenantMembership
        membership = TenantMembership.objects.filter(user=user).select_related('tenant').first()
        is_demo = bool(membership and membership.tenant.is_demo)

        if is_demo and code == '000000':
            pass  # accepted — skip OTP DB check
        else:
            otp = EmailOTP.objects.filter(user=user, code=code, is_used=False).order_by('-created_at').first()
            if not otp or not otp.is_valid:
                return Response({'detail': 'Invalid or expired OTP.'}, status=status.HTTP_400_BAD_REQUEST)
            otp.is_used = True
            otp.save()

        refresh = RefreshToken.for_user(user)
        refresh['email'] = user.email
        refresh['full_name'] = user.full_name
        refresh['is_superadmin'] = user.is_superadmin
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_200_OK)


class ResendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        partial_token = request.data.get('partial_token')
        if not partial_token:
            return Response({'detail': 'partial_token is required.'}, status=status.HTTP_400_BAD_REQUEST)

        user_id = verify_partial_token(partial_token)
        if user_id is None:
            return Response({'detail': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_400_BAD_REQUEST)

        code = generate_otp_code()
        EmailOTP.objects.create(
            user=user,
            code=code,
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        send_otp_email(user, code)
        return Response({'detail': 'OTP resent.'}, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass
        return Response({'detail': 'Logged out.'}, status=status.HTTP_200_OK)


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'is_superadmin', False))


class AdminUserDetailView(APIView):
    permission_classes = [IsSuperAdmin]

    def _get_user(self, pk):
        try:
            return User.objects.get(pk=pk)
        except User.DoesNotExist:
            return None

    def get(self, request, pk):
        user = self._get_user(pk)
        if not user:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response({
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'is_active': user.is_active,
            'is_superadmin': user.is_superadmin,
            'mfa_enabled': user.mfa_enabled,
            'date_joined': user.date_joined,
        })

    def patch(self, request, pk):
        user = self._get_user(pk)
        if not user:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        allowed = {'email', 'full_name', 'is_active', 'mfa_enabled'}
        for field in allowed:
            if field in request.data:
                setattr(user, field, request.data[field])
        user.save()
        return Response({
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'is_active': user.is_active,
            'mfa_enabled': user.mfa_enabled,
            'date_joined': user.date_joined,
        })


class AdminUserPasswordResetView(APIView):
    permission_classes = [IsSuperAdmin]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        new_password = request.data.get('password', '').strip()
        if len(new_password) < 8:
            return Response({'detail': 'Password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)
        user.save()
        return Response({'detail': 'Password updated.'})


class SetupInitialAdminView(APIView):
    """One-time superadmin bootstrap. Only works in TEST_MODE and when no superadmin exists."""
    permission_classes = [AllowAny]

    def post(self, request):
        if not getattr(settings, 'TEST_MODE', False):
            return Response({'error': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        if User.objects.filter(is_superadmin=True).exists():
            return Response({'error': 'Superadmin already exists'}, status=status.HTTP_400_BAD_REQUEST)
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '')
        full_name = request.data.get('full_name', 'Admin')
        if not email or not password:
            return Response({'error': 'email and password required'}, status=status.HTTP_400_BAD_REQUEST)
        u, created = User.objects.get_or_create(email=email, defaults={'full_name': full_name})
        u.full_name = full_name
        u.is_superadmin = True
        u.is_staff = True
        u.is_superuser = True
        u.mfa_enabled = False
        u.set_password(password)
        u.save()
        return Response({'status': 'ok', 'created': created, 'email': u.email})


class PlatformConfigView(APIView):
    permission_classes = [IsSuperAdmin]

    def _serialize(self, config):
        return {
            'mfa_required': config.mfa_required,
            'sandbox_mode': config.sandbox_mode,
            'health_check_emails': config.health_check_emails,
            'health_check_subject': config.health_check_subject,
            'updated_at': config.updated_at,
        }

    def get(self, request):
        return Response(self._serialize(PlatformConfig.get()))

    def patch(self, request):
        config = PlatformConfig.get()
        if 'mfa_required' in request.data:
            config.mfa_required = bool(request.data['mfa_required'])
        if 'sandbox_mode' in request.data:
            config.sandbox_mode = bool(request.data['sandbox_mode'])
        if 'health_check_emails' in request.data:
            config.health_check_emails = request.data['health_check_emails']
        if 'health_check_subject' in request.data:
            config.health_check_subject = request.data['health_check_subject']
        config.save()
        return Response(self._serialize(config))


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token', '').strip()
        if not token:
            return Response({'detail': 'Token is required.'}, status=status.HTTP_400_BAD_REQUEST)

        user_id = verify_email_token(token)
        if user_id is None:
            return Response({'detail': 'Verification link is invalid or has expired.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_400_BAD_REQUEST)

        user.is_active = True
        user.email_verified = True
        user.save()

        # Activate the tenant too
        from accounts.models import TenantMembership
        from tenants.models import Promotion
        membership = TenantMembership.objects.filter(user=user, role='owner').select_related('tenant').first()
        if membership:
            tenant = membership.tenant
            tenant.is_active = True
            update_fields = ['is_active']

            promo = Promotion.get_active()
            if promo:
                tenant.trial_expires_at = promo.trial_until
                tenant.july_giveaway = True
                update_fields += ['trial_expires_at', 'july_giveaway']

            tenant.save(update_fields=update_fields)

            if promo and promo.plan:
                from subscriptions.models import TenantPlan
                TenantPlan.objects.update_or_create(
                    tenant=tenant,
                    defaults={'plan': promo.plan},
                )

        refresh = RefreshToken.for_user(user)
        refresh['email'] = user.email
        refresh['full_name'] = user.full_name
        refresh['is_superadmin'] = user.is_superadmin
        tenant_slug = membership.tenant.slug if membership else None
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'tenant_slug': tenant_slug,
        }, status=status.HTTP_200_OK)


class OrphanedUsersView(APIView):
    """Users with no tenant — typically failed or unverified registrations."""
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        from accounts.models import TenantMembership
        orphans = User.objects.filter(
            memberships__isnull=True,
            is_superadmin=False,
        ).order_by('date_joined')
        return Response([{
            'id': u.id,
            'email': u.email,
            'full_name': u.full_name,
            'is_active': u.is_active,
            'email_verified': getattr(u, 'email_verified', True),
            'date_joined': u.date_joined,
        } for u in orphans])

    def delete(self, request):
        user_id = request.data.get('user_id')
        email = request.data.get('email', '').strip().lower()
        if not user_id and not email:
            return Response({'detail': 'user_id or email is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            if user_id:
                user = User.objects.get(pk=user_id, is_superadmin=False)
            else:
                user = User.objects.get(email__iexact=email, is_superadmin=False)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        user.delete()
        return Response({'detail': f'User {user.email} deleted.'}, status=status.HTTP_200_OK)
