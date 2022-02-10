# -*- coding: utf-8 -*-
# Copyright (c) 2020, GreyCube Technologies and Contributors
# See license.txt
from __future__ import unicode_literals

import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields
from frappe.custom.doctype.property_setter.property_setter import make_property_setter


custom_fields = {
    "Notification": [
        dict(
            fieldname="whatsapp_business_template_cf",
            label="Whatsapp Business Template",
            fieldtype="Link",
            options="Whatsapp Business Template",
            depends_on="eval:doc.channel=='Whatsapp Business'",
            insert_after="channel",
            no_copy=1,
            print_hide=1,
            read_only=0,
        )
    ]
}


def after_install():
    create_custom_fields(custom_fields)

    # add Channel option
    channels = frappe.get_meta("Notification").get_options("channel").split("\n")
    if not "Whatsapp Business" in channels:
        channels.append("Whatsapp Business")
        make_property_setter(
            "Notification", "channel", "options", "\n".join(channels), ""
        )
