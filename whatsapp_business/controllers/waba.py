# -*- coding: utf-8 -*-
# Copyright (c) 2020, GreyCube Technologies and Contributors
# See license.txt
from __future__ import unicode_literals

import frappe
from frappe.utils import cstr, cint
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
        self, mobile_no="", template_name="", doctype=None, docname=None, media_link=None, template_doc={}
    ):
        """
        https://docs.360dialog.com/whatsapp-api/whatsapp-api/sandbox#send-template-message
        """

        headers = self.get_headers()

        message = self.build_message(
            template_name, mobile_no, doctype, docname, template_doc=template_doc
        )

        response = requests.request(
            "POST", self.messages_endpoint, headers=headers, data=message)

        print('**\n'*10, message, response.json())

        if response.ok:
            messages = response.json().get("messages", [])
            if not messages or not messages[0].get('id'):
                logger.debug(response.text)
                frappe.log_error(
                    message=response.text, title=_(
                        "Whatsapp Business Message Error")
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

    def build_message(
        self, template_name, mobile_no, doctype=None, docname=None, template_doc={}
    ):

        doc, template_doc = {}, frappe._dict(template_doc)

        if doctype and docname:
            doc = frappe.get_doc(doctype, docname).as_dict()

        if not template_doc and template_name:
            template_doc = frappe.get_doc(
                "Whatsapp Business Template", template_name).as_dict()

        mobile_no = cstr(mobile_no)
        if self.settings.default_country_code and not mobile_no.startswith(self.settings.default_country_code):
            mobile_no = self.settings.default_country_code + mobile_no

        mobile_no = self.settings.test_wa_id or mobile_no

        if template_doc.message_type == "template":
            components = []
            for d in template_doc.message_parameters:
                if cint(d.header):
                    comp = {
                        "type": "header",
                        "parameters": [
                            {
                                "type": "document",
                                "document": {
                                    "link": d.value
                                },
                            },
                        ],
                    }
                    components.append(comp)

            parameters = [{"type": "text", "text": d.value}
                          for d in template_doc.message_parameters if d.value and not cint(d.header)]
            if parameters:
                comp = {
                    "type": "body",
                    "parameters": parameters
                }
                components.append(comp)

            return frappe.render_template(TEMPLATED_MESSAGE, {"doc": doc, "template_doc": template_doc, "components": json.dumps(components), "mobile_no": mobile_no})
        else:
            print(doc, template_doc)
            from bs4 import BeautifulSoup as soup
            message = {
                "recipient_type": "individual",
                "to": mobile_no,
                "type": "text",
                "text": {
                        "body": soup(frappe.render_template(template_doc.message, {"doc": doc})).get_text(),
                }
            }
            return json.dumps(message)

    def get_template_names(self):
        templates = self.get_templates()
        return ["{name} ({language})".format(**d) for d in templates if d.get("status") == "approved"]

    def get_templates(self):
        waba_templates = frappe.cache().get_value('waba_templates')
        if not waba_templates:
            headers = self.get_headers()
            response = requests.request(
                "GET", self.templates_endpoint, headers=headers,)
            print('**\n'*10, response.json())
            waba_templates = response.json().get("waba_templates")
            frappe.cache().set_value('waba_templates', waba_templates, expires_in_sec=60*60)

        return waba_templates


@frappe.whitelist()
def get_templates():
    return WABA().get_templates()


@frappe.whitelist()
def get_template_names():
    return WABA().get_template_names()


@frappe.whitelist()
def get_template(waba_template_name="", language=""):
    templates = WABA().get_templates()
    return [d for d in templates if d.get("name") == waba_template_name and d.get("language") == language]


TEMPLATED_MESSAGE = """
 {
   "to": "{{mobile_no}}",
   "type": "template",
   "template": {
     "namespace": "{{template_doc.namespace}}",
     "language": {
       "policy": "deterministic",
       "code": "{{template_doc.language}}"
     },
     "name": "{{template_doc.waba_template_name}}",
     "components": {{components}}
   }
 }
"""

TEXT_MESSAGE = """
{
    "recipient_type": "individual",
    "to": "{{mobile_no}}",
    "type": "text",
    "text": {
        "body": "{{template_doc.message | replace("\\n","\\\\n") | tojson(indent=2)}}"
    }
}
"""
SAMPLE_TEXT_MESSAGE = """
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
