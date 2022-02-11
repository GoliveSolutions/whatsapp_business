# Copyright (c) 2022, Greycube and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from whatsapp_business.controllers.waba import WABA

class WhatsappBusinessTemplate(Document):
	@frappe.whitelist()
	def send_test_message(self):

		if not self.message:
			frappe.throw("Message cannot be blank")

			
		WABA()._send(doc=self.as_dict())