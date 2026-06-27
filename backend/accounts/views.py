from django.utils import timezone
from django.conf import settings
from datetime import timedelta
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken

from .models import User, EmailOTP
from .serializers import RegisterSerializer, LoginSerializer, OTPVerifySerializer
from .utils import generate_otp_code, send_otp_email, make_partial_token, verify_partial_token


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
            }
        }, status=status.HTTP_201_CREATED)


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
            return Response({'detail': 'Account is disabled.'}, status=status.HTTP_403_FORBIDDEN)

        if user.mfa_enabled:
            code = generate_otp_code()
            EmailOTP.objects.create(
                user=user,
                code=code,
                expires_at=timezone.now() + timedelta(minutes=10),
            )
            send_otp_email(user, code)
            partial_token = make_partial_token(user.id)
            return Response({
                'mfa_required': True,
                'partial_token': partial_token,
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
