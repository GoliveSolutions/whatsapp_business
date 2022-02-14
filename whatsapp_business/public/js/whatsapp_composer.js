
const exclude_fields = ['option_toggle_button', 'recipients', 'subject', 'send_me_a_copy', 'send_read_receipt']

frappe.views.WhatsappComposer = class WhatsappComposer extends (
  frappe.views.CommunicationComposer
) {

  get_recipients() {
    let recipients = [];
    for (let o of Object.values(this.frm.fields_dict)) {
      if (o.df && o.df.options == "Phone") {
        recipients.push(o.value);
        break;
      };
    }
    return recipients.join(",");
  }

  get_custom_fields() {

    let _fields = [
      {
        label: __("To Mobile"),
        fieldtype: "Data",
        reqd: 1,
        fieldname: "waba_recipients",
        default: this.get_recipients(),
      },
      { fieldtype: "Column Break" },
      {
        fieldtype: "Link",
        label: "Whatsapp Business Template",
        fieldname: "whatsapp_business_template",
        options: "Whatsapp Business Template",
        reqd: 1,
        get_query: () => {
          return {
            filters: { linked_doctype: this.frm.doc.doctype },
          };
        },
        onchange: this.onchange_whatsapp_business_template.bind(this)
      },
      { fieldtype: "Section Break" },
    ].concat(this.get_fields());

    for (const f of _fields) {
      if (exclude_fields.includes(f.fieldname)) {
        f.hidden = 1;
        f.reqd = 0;
      }
      else if (f.fieldname == "content") {
        f.read_only = 1;
      }
    }

    return _fields;

  }

  onchange_whatsapp_business_template() {
    let me = this;
    console.log('changed template');

    let templ = me.dialog.fields_dict["whatsapp_business_template"].value;
    if (templ) {
      frappe.model.with_doc("Whatsapp Business Template", templ, function () {
        let template_doc = frappe.model.get_doc("Whatsapp Business Template", templ);
        let message = frappe.render_template(template_doc.message, { doc: cur_frm.doc })
        me.dialog.set_value("content", message);
        frappe.timeout(0.6).then(() => {
          // hide attachment fields if template is not a document template
          if (cur_dialog) {
            me.toggle_attach_fields(template_doc.message_type)
            me.dialog.refresh();
          }
        });
        // 
      });
    }
    // end onchange_whatsapp_business_template
  }

  toggle_attach_fields(message_type) {
    let is_hidden = message_type !== 'template'
    this.dialog.$body.find("div.form-page .row.form-section:gt(3)").toggle(!is_hidden)
  }

  make() {
    const me = this;

    this.dialog = new frappe.ui.Dialog({
      title: (this.title || this.subject || __("New WhatsApp Messsage")),
      no_submit_on_enter: true,
      fields: this.get_custom_fields(),
      primary_action_label: __("Send"),
      primary_action() {
        me.send_action();
      },
      secondary_action_label: __("Discard"),
      secondary_action() {
        me.dialog.hide();
        me.clear_cache();
      },
      size: 'large',
      minimizable: true
    });

    $(this.dialog.$wrapper.find(".form-section").get(0)).addClass('to_section');

    this.prepare();
    this.dialog.show();

    if (this.frm) {
      $(document).trigger('form-typing', [this.frm]);
    }
  }


  prepare() {
    this.setup_print_language();
    this.setup_print();
    this.setup_attach();
  }


  send_email(btn, form_values, selected_attachments, print_html, print_format) {
    var me = this;
    me.dialog.hide();

    if (form_values.attach_document_print == 1 && selected_attachments && selected_attachments.length) {
      frappe.msgprint("Please select <strong>either</strong> 'Attach Document Print' or a single attachment.")
    }
    else if (selected_attachments.length > 1) {
      frappe.msgprint("Please select a <strong>single</strong> attachment only, to be sent on Whatsapp.")
    }

    if (!form_values.waba_recipients) {
      frappe.msgprint(__("Enter Whatsapp Recipient(s)"));
      return;
    }

    if (!form_values.attach_document_print) {
      print_html = null;
      print_format = null;
    }

    if (cur_frm && !frappe.model.can_email(me.doc.doctype, cur_frm)) {
      frappe.msgprint(
        __("You are not allowed to send messages related to this document")
      );
      return;
    }

    let args = {
      recipients: form_values.waba_recipients,
      cc: form_values.cc,
      bcc: form_values.bcc,
      subject: form_values.subject || `${me.doc.doctype}-${me.doc.name}`,
      content: form_values.content,
      doctype: me.doc.doctype,
      name: me.doc.name,
      // do not send email. Send Whatsapp instead
      send_email: 0,
      print_html: print_html,
      send_me_a_copy: form_values.send_me_a_copy,
      print_format: print_format,
      sender: form_values.sender,
      sender_full_name: form_values.sender
        ? frappe.user.full_name()
        : undefined,
      email_template: form_values.email_template,
      attachments: selected_attachments,
      _lang: me.lang_code,
      read_receipt: form_values.send_read_receipt,
      print_letterhead: me.is_print_letterhead_checked(),
      whatsapp_business_template: form_values.whatsapp_business_template,
    };

    // console.log(args)

    return frappe.call({
      method: "whatsapp_business.controllers.whatsapp_notification.make_communication",
      args: args,
      btn: btn,
      callback: function (r) {
        if (!r.exc) {
          frappe.utils.play_sound("email");

          if ((frappe.last_edited_communication[me.doc] || {})[me.key]) {
            delete frappe.last_edited_communication[me.doc][me.key];
          }

          if (cur_frm) {
            cur_frm.reload_doc();
          }

          // try the success callback if it exists
          if (me.success) {
            try {
              me.success(r);
            } catch (e) {
              console.log(e);
            }
          }
        } else {
          frappe.msgprint(
            __("There were errors while sending Whatsapp. Please try again.")
          );

          // try the error callback if it exists
          if (me.error) {
            try {
              me.error(r);
            } catch (e) {
              console.log(e);
            }
          }
        }
      },
    });
  }

};
