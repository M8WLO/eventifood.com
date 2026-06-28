from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from .models import Event, EventPreset
from .serializers import EventSerializer, EventPresetSerializer


class EventListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        events = Event.objects.filter(tenant=tenant)
        return Response(EventSerializer(events, many=True).data)

    def post(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = EventSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(tenant=tenant)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class EventDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, tenant):
        return Event.objects.filter(pk=pk, tenant=tenant).first()

    def get(self, request, pk):
        obj = self.get_object(pk, request.tenant)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(EventSerializer(obj).data)

    def patch(self, request, pk):
        obj = self.get_object(pk, request.tenant)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = EventSerializer(obj, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        obj = self.get_object(pk, request.tenant)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class EventActivateView(APIView):
    """POST {activate: true|false} — activates this event (deactivates all others) or deactivates."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        obj = Event.objects.filter(pk=pk, tenant=tenant).first()
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)

        activate = request.data.get('activate', True)
        if activate:
            # Deactivate all other events for this tenant first
            Event.objects.filter(tenant=tenant, is_active=True).exclude(pk=pk).update(is_active=False)
            obj.is_active = True
        else:
            obj.is_active = False
        obj.save(update_fields=['is_active'])
        return Response(EventSerializer(obj).data)


class EventPresetListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        presets = EventPreset.objects.filter(tenant=tenant)
        return Response(EventPresetSerializer(presets, many=True).data)

    def post(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'detail': 'Tenant not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = EventPresetSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(tenant=tenant)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class EventPresetDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, pk, tenant):
        return EventPreset.objects.filter(pk=pk, tenant=tenant).first()

    def delete(self, request, pk):
        obj = self._get(pk, request.tenant)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def patch(self, request, pk):
        obj = self._get(pk, request.tenant)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = EventPresetSerializer(obj, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)
