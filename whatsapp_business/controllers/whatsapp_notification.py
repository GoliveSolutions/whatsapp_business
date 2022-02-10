# -*- coding: utf-8 -*-
# Copyright (c) 2020, GreyCube Technologies and Contributors
# See license.txt
from __future__ import unicode_literals
from six import string_types

import frappe
from frappe import _
from frappe.email.doctype.notification.notification import (
    Notification,
    get_context,
)
from frappe.model.document import Document
import requests
from six import string_types
import json
from frappe.core.doctype.communication.email import make
from whatsapp_business.controllers.waba import WABA
from frappe.core.doctype.file.file import MaxFileSizeReachedError, get_random_filename

logger = frappe.logger("whatsapp_business", allow_site=frappe.local.site)


def get_default_print_format(doctype):
    return (
        frappe.db.get_value(
            "Property Setter",
            dict(property="default_print_format", doc_type=doctype),
            "value",
        )
        or "Standard"
    )


class WABANotification(Notification):
    def send(self, doc):

        context = get_context(doc)
        context = {"doc": doc, "alert": self, "comments": None}
        if doc.get("_comments"):
            context["comments"] = json.loads(doc.get("_comments"))

        if self.is_standard:
            self.load_standard_properties(context)

        try:
            if self.channel == "Whatsapp Business":
                args = {
                    "receiver_list": self.get_receiver_list(doc, context),
                    "template_name": self.whatsapp_business_template_cf,
                    "doctype": doc.doctype,
                    "docname": doc.name,
                }
                media_link = ""
                if self.attach_print:
                    print_format = self.print_format
                    if not print_format:
                        print_format = get_default_print_format(doc.doctype)

                    media_link = attach_print(
                        doc=doc,
                        print_format=print_format,
                        attached_to_doctype=doc.doctype,
                        attached_to_doc_name=doc.name,
                    )

                if media_link:
                    args["media_link"] = "{}{}".format(
                        frappe.utils.get_url(), media_link
                    )

                WABA.send_message(**args)

        except:
            error = frappe.get_traceback()
            frappe.log_error(title="Failed to send notification", message=error)
            logger.debug(error)

        super(WABANotification, self).send(doc)


@frappe.whitelist()
# fmt: off
def make_communication(
    doctype=None, name=None, content=None, subject=None, sent_or_received="Sent", sender=None, sender_full_name=None, 
    recipients=None, communication_medium="Other", send_email=False, print_html=None, print_format=None, 
    attachments="[]", send_me_a_copy=False, cc=None, bcc=None, flags=None, read_receipt=None, 
    print_letterhead=True, email_template=None, communication_type=None, 
    ignore_permissions=False, whatsapp_business_template=None,
):
# fmt: on
    """Make a new communication and send a Whatsapp message"""

    doc = frappe.get_doc(doctype, name)

    if content:
        content = frappe.render_template(content, doc.as_dict())
# fmt: off
    communication = make(
        doctype, name, content, subject, sent_or_received, sender, sender_full_name, recipients, 
        communication_medium, send_email, print_html, print_format, attachments, send_me_a_copy, 
        cc, bcc, flags, read_receipt, print_letterhead, email_template, 
        communication_type, ignore_permissions,
    )
# fmt: on

    file_url = None
    # attach print to Communication if a print_format is set
    if print_format:
        file_url = attach_print(
            doc,
            print_format=print_format,
            print_letterhead=print_letterhead,
            attached_to_doc_name=communication["name"],
            attached_to_doctype="Communication",
        )
    elif attachments:
        if isinstance(attachments, string_types):
            attachments = json.loads(attachments)
        for a in attachments:
            if isinstance(a, string_types):
                attach = frappe.db.get_value(
                    "File",
                    {"name": a},
                    ["file_name", "file_url", "is_private"],
                    as_dict=1,
                )
                file_url = attach.file_url

    if file_url:
        file_url = "{}{}".format(frappe.utils.get_url(), file_url)

    WABA.send_message(
        receiver_list=recipients,
        template_name=whatsapp_business_template,
        doctype=doctype,
        docname=name,
        media_link=file_url,
    )


def attach_print(
    doc,
    file_name=None,
    print_format=None,
    style=None,
    html=None,
    lang=None,
    print_letterhead=True,
    password=None,
    attached_to_doctype=None,
    attached_to_doc_name=None,
):
    """Save print as an attachment in given document."""
    out = frappe.attach_print(
        doc.doctype,
        doc.name,
        file_name,
        print_format,
        style,
        html,
        doc,
        lang,
        print_letterhead,
        password,
    )

    try:
        if attached_to_doctype and attached_to_doc_name:
            _file = frappe.get_doc(
                {
                    "doctype": "File",
                    "file_name": out["fname"],
                    "attached_to_doctype": attached_to_doctype,
                    "attached_to_name": attached_to_doc_name,
                    "is_private": 0,
                    "content": out["fcontent"],
                }
            )
            _file.save(ignore_permissions=True)
            frappe.db.commit()
            return _file.file_url

    except MaxFileSizeReachedError:
        # WARNING: bypass max file size exception
        pass
    except frappe.FileAlreadyAttachedException:
        pass
    except frappe.DuplicateEntryError:
        # same file attached twice??
        pass
