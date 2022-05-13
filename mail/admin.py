from django.contrib import admin
from .models import User, Email


class EmailAdmin(admin.ModelAdmin):
    list_display = ('sender', 'subject', 'timestamp')
    list_filter = ('sender',)

# Register your models here.
admin.site.register(User)
admin.site.register(Email, EmailAdmin)
