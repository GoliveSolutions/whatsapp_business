# Copyright (c) 2022, Greycube and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from whatsapp_business.controllers.waba import WABA


class WhatsappBusinessTemplate(Document):
    @frappe.whitelist()
    def send_test_message(self, mobile_no=""):

        if not self.message:
            frappe.throw("Message cannot be blank")

        if not mobile_no:
            frappe.throw("Mobile Number cannot be blank")

        WABA()._send(mobile_no=mobile_no, template_doc=self.as_dict())
