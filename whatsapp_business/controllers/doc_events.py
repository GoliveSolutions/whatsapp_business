# -*- coding: utf-8 -*-
# Copyright (c) 2020, GreyCube Technologies and Contributors
# See license.txt
from __future__ import unicode_literals

import frappe


def on_validate_notification(doc, method):
    if doc.channel == "Whatsapp Business":
        if not doc.whatsapp_business_template_cf:
            frappe.throw("Please set the Template for Whatsapp Business notification")
        doc.message = frappe.db.get_value(
            "Whatsapp Business Template",
            doc.whatsapp_business_template_cf,
            "template_body",
        )

        if doc.get("whatsapp_business_template_cf"):
            if (
                not frappe.db.get_value(
                    "Whatsapp Business Template",
                    doc.whatsapp_business_template_cf,
                    "template_type",
                )
                == "template"
            ):
                if doc.attach_print:
                    frappe.throw(
                        "Print cannot be attached for Template Type: <strong>text</strong> %s."
                        % doc.whatsapp_business_template_cf
                    )
