# -*- coding: utf-8 -*-
# Copyright (c) 2020, GreyCube Technologies and Contributors
# See license.txt
from __future__ import unicode_literals

import frappe
from frappe.utils import cstr
from six import string_types
import json
import requests
from frappe import _


logger = frappe.logger("whatsapp_business", allow_site=frappe.local.site)


class WABA(object):
    @classmethod
    def send_message(
        cls, receiver_list, template_name, doctype=None, docname=None, media_link=None
    ):
        if isinstance(receiver_list, string_types):
            receiver_list = json.loads(receiver_list)
            if not isinstance(receiver_list, list):
                receiver_list = [receiver_list]

        for rec in receiver_list:
            WABA()._send(
                mobile_no=rec,
                template_name=template_name,
                doctype=doctype,
                docname=docname,
                media_link=None,
            )

    def __init__(self):
        self.settings = frappe.get_doc("Whatsapp Business Settings").as_dict()

        self.messages_endpoint = "{api_endpoint}/v1/messages".format(
            **self.settings
        )
        self.templates_endpoint = "{api_endpoint}/v1/configs/templates".format(
            **self.settings
        )

    def _send(
        self, mobile_no="", template_name="", doctype=None, docname=None, media_link=None, doc={}
    ):
        """
        https://docs.360dialog.com/whatsapp-api/whatsapp-api/sandbox#send-template-message
        payload = '''
            {
                "to": "49YOURNUMBER",
                "type": "text",
                "text": {
                    "body": "Any message you want..."
                }
            }
        '''

        headers = {
            'D360-Api-Key': "YOUR_API_KEY",
            'Content-Type': "application/json",
        }
        """

        headers = self.get_headers()

        message =   self.get_message(
                template_name, mobile_no, doctype, docname, media_link=None, doc = doc
            )

        # print("**\n" * 10, message)

        response = requests.request("POST", self.messages_endpoint, headers=headers, data=message)

        print('**\n'*10,response.json())

        if response.ok:
            messages = response.json().get("messages",[])
            if not messages or not messages[0].get('id'):
                logger.debug(response.text)
                frappe.log_error(
                    message=response.text, title=_("Whatsapp Business Message Error")
                )
        else:
            logger.debug(response.text)
            frappe.log_error(
                response.text, title=_("Whatsapp Business Message Error")
            )

    def get_headers(self):
        headers = {
            "D360-Api-Key": self.settings.api_key,
            "Content-Type": "application/json",
        }

        return headers

    def get_message(
        self, template_name, mobile_no, doctype=None, docname=None, media_link=None, doc ={}
    ):

        template =frappe.get_doc("Whatsapp Business Template", template_name)
        doc = frappe.get_doc(doctype, docname).as_dict()

        mobile_no = cstr(mobile_no)
        if self.settings.default_country_code and not mobile_no.startswith(self.settings.default_country_code):
            mobile_no = self.settings.default_country_code + mobile_no

        doc["to"] = mobile_no

        doc["media_link"] = media_link

        return frappe.render_template(template.message, { "doc" : doc })

    
    def get_template_names(self):
        templates = self.get_templates()
        return ["{name} ({language})".format(**d) for d in templates if d.get("status") == "approved"]

    def get_templates(self):
        waba_templates = frappe.cache().get_value('waba_templates')
        if not waba_templates:
            headers = self.get_headers()
            response = requests.request("GET", self.templates_endpoint, headers=headers,)
            print('**\n'*10,response.json())
            waba_templates =  response.json().get("waba_templates")
            frappe.cache().set_value('waba_templates', waba_templates, expires_in_sec=60*60)

        return waba_templates 

    
@frappe.whitelist()
def get_templates():   
    return WABA().get_templates() 

@frappe.whitelist()
def get_template_names():
    return WABA().get_template_names()

@frappe.whitelist()
def get_template(waba_template_name="",language=""):   
    templates =  WABA().get_templates()     
    return [ d for d in templates if d.get("name") == waba_template_name and d.get("language")==language]
        