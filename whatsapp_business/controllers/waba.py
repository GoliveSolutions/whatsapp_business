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
        self.settings = frappe.get_doc("Whatsapp Business Settings")
        self.messages_endpoint = "https://{api_endpoint}/v1/messages".format(
            self.settings.as_dict()
        )

    def _send(
        self, mobile_no, template_name, doctype=None, docname=None, media_link=None
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

        message = self.get_message(
            template_name, mobile_no, doctype, docname, media_link=None
        )

        print("**\n" * 10, message)

        # response = requests.request("POST", self.messages_endpoint, headers=headers, data=message)

        # if response.ok:
        #     result = response.json().get("result")
        #     if not response.json().get("result"):
        #         logger.debug(response.text)
        #         frappe.log_error(
        #             message=response.text, title=_("Whatsapp Business Message Error")
        #         )
        # else:
        #     logger.debug(response.text)
        #     frappe.log_error(
        #         msg=response.text, title=_("Whatsapp Business Message Error")
        #     )

    def get_headers(self):
        headers = {
            "D360-Api-Key": self.settings.api_key,
            "Content-Type": "application/json",
        }

        return headers

    def get_message(
        self, template_name, mobile_no, doctype=None, docname=None, media_link=None
    ):

        template = frappe.get_doc("Whatsapp Business Template", template_name)
        doc = frappe.get_doc(doctype, docname).as_dict()

        mobile_no = cstr(mobile_no)
        if not mobile_no.startswith(self.settings.default_country_code):
            mobile_no = self.settings.default_country_code + mobile_no
        doc["to"] = mobile_no

        doc["media_link"] = media_link

        return frappe.render_template(template, doc)

    # def sync_templates(self):
    #     headers = self.get_headers()
    #     api_endpoint = frappe.db.get_singles_value(
    #         "Whatsapp Business Settings", "api_endpoint"
    #     )

    #     url = "https://{0}/api/v1/getMessageTemplates".format(api_endpoint)

    #     response = requests.request("GET", url, headers=headers)
    #     if response.ok:
    #         if not response.json().get("result") == "success":
    #             logger.debug(response.text)
    #             frappe.log_error(
    #                 message=response.text,
    #                 title=_("Whatsapp Business Sync Template Error"),
    #             )
    #         self.make_templates(response.json())
    #     else:
    #         logger.debug(response.text)
    #         frappe.log_error(
    #             msg=response.text, title=_("Whatsapp Business Sync Template Error")
    #         )

    # def make_templates(self, args):
    #     for temp in args.get("messageTemplates"):
    #         try:
    #             doc = frappe.new_doc("Whatsapp Business Template")
    #             doc.template_name = temp.get("elementName")
    #             doc.category = temp.get("category")
    #             doc.status = temp.get("status")
    #             doc.is_document_template = frappe.utils.cint(
    #                 (temp.get("header", {}) or {}).get("typeString", "") == "document"
    #             )
    #             doc.body = temp.get("bodyOriginal")
    #             for d in temp.get("customParams"):
    #                 doc.append(
    #                     "parameters",
    #                     {
    #                         "parameter_name": d.get("paramName"),
    #                         "parameter_value": d.get("paramValue"),
    #                     },
    #                 )
    #             doc.insert(ignore_permissions=True)
    #         except frappe.DuplicateEntryError:
    #             pass

    #     frappe.db.commit()
