# coding: utf8
# Copyright 2017 Stephen.Z. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# ============================================================================
from django.conf.urls import url
from django.contrib import admin
from . import views
#from hotsearch_keyword_search_engine import views as hotsearch_views
#from text_labeled import views as label_views

urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'^api/first_show[/]?$', views.first_show),
    url(r'^api/get_cache[/]?$', views.get_cache),
    url(r'^api/get_recomm[/]?$', views.get_recomm)
    #url(r'^api/image1[/]?$', views.get_image)
]
