# coding: utf8
# Copyright 2017 Stephen. All Rights Reserved.
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

from django.http import HttpResponse
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import authentication_classes
from rest_framework.decorators import permission_classes
from recomm import api as r_api
import json
from util.mail import send_mail
import logging

#@aesponsecation_classes((SessionAuthentication, BasicAuthentication))
#@permission_classes((IsAuthenticated,)

@api_view(['GET', 'POST'])
def first_show(request):
    IP = request.META.get("HTTP_X_REAL_IP")
    result = r_api.get_hot(str(IP))
    return HttpResponse(json.dumps(result, ensure_ascii=False))


@api_view(['GET', 'POST'])
def get_cache(request):
    IP = request.META.get("HTTP_X_REAL_IP")
    result = r_api.v_get_cache(str(IP))
    return HttpResponse(json.dumps(result, ensure_ascii=False))


@api_view(['GET', 'POST'])
def get_recomm(request):
    IP = request.META.get("HTTP_X_REAL_IP")
    result = r_api._get_recomm(str(IP))
    return HttpResponse(json.dumps(result, ensure_ascii=False))


@api_view(['GET', 'POST'])
def like(request):
    IP = request.META.get("HTTP_X_REAL_IP")
    pid = request.POST.get("pid")
    type_ = "like"
    result = api.write_to_neo4j(IP, pid, type_)
    return Response(result)


@api_view(['GET', 'POST'])
def forward(request):
    IP = request.META.get("HTTP_X_REAL_IP")
    pid = request.POST.get("pid")
    type_ = "forward"
    result = api.write_to_neo4j(IP, pid, type_)
    return Response(result)


@api_view(['GET', 'POST'])
def comment(request):
    IP = request.META.get("HTTP_X_REAL_IP")
    pid = request.POST.get("pid")
    content = request.POST.get("content")
    type_ = "comment"
    result = api.write_to_neo4j(IP, pid, type_, content)


@api_view(['GET', 'POST'])
def cancel_like(request):
    IP = request.META.get("HTTP_X_REAL_IP")
    pid = request.POST.get("pid")
    type_ = "like"
    result = api.cancel_to_neo4j(IP, pid, type_)