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
# ～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～～
import sys
import os
from django.conf import settings
from django.apps import AppConfig

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(
    os.path.realpath(__file__)))))


class AppManager(AppConfig):
    """ Manage a single instance of the chatbot shared over the website
    """
    name = 'api'

    def ready(self):
        """ Called by Django only once during startup
        """
        #Restart the service by loading static resources,
        #such as user dictionary
        pass
