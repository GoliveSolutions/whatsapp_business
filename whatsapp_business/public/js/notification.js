frappe.ui.form.on("Notification", {
  onload: function (frm) {
    frm.set_query("whatsapp_business_template_cf", function () {
      return {
        filters: {
          linked_doctype: frm.doc.document_type,
        },
      };
    });
  },


  refresh: function (frm) {
    frm.set_df_property("message", "read_only", frm.doc.channel == "Whatsapp Business" ? 1 : 0);
    frm.set_df_property("whatsapp_business_template_cf", "mandatory_depends_on", "eval:doc.channel=='Whatsapp Business'");
  },

  channel: function (frm) {
    frm.set_df_property("message", "read_only", frm.doc.channel == "Whatsapp Business" ? 1 : 0);
  },

  whatsapp_business_template_cf: function (frm) {

    // set fields with Phone option (like for SMS and Whatsapp channels)
    // frappe/frappe/email/doctype/notification/notification.js
    if (!frm.doc.document_type || !frm.doc.channel == "Whatsapp Business") {
      return;
    }

    if (frm.doc.whatsapp_business_template_cf) {
      frappe.db.get_value('Whatsapp Business Template', { name: frm.doc.whatsapp_business_template_cf }, 'message_type', (r) => {
        frm.set_value('attach_print', r.message_type == 'template');
      });
    }


    frappe.model.with_doctype(frm.doc.document_type, function () {
      let get_select_options = function (df, parent_field) {
        // Append parent_field name along with fieldname for child table fields
        let select_value = parent_field ? df.fieldname + ',' + parent_field : df.fieldname;

        return {
          value: select_value,
          label: df.fieldname + ' (' + __(df.label) + ')'
        };
      };
      let receiver_fields = [];
      let fields = frappe.get_doc('DocType', frm.doc.document_type).fields;
      receiver_fields = $.map(fields, function (d) {
        return d.options == 'Phone' ? get_select_options(d) : null;
      });

      frm.fields_dict.recipients.grid.update_docfield_property(
        'receiver_by_document_field',
        'options',
        [''].concat(receiver_fields)
      );
    });
  }
});


