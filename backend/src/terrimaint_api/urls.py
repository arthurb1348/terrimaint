from django.urls import include, path

urlpatterns = [path("api/v1/", include("terrimaint_api.health.urls"))]
