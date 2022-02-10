frappe.views.WhatsappComposer = class WhatsappComposer extends (
  frappe.views.CommunicationComposer
) {


  prepare() {
    this.setup_print_language();
    this.setup_print();
    this.setup_attach();
    if (this.dialog.fields_dict.sender) {
      this.dialog.fields_dict.sender.set_value(this.sender || "");
    }
  }


  make() {
    var me = this;

    this.dialog = new frappe.ui.Dialog({
      title: this.title || this.subject || __("New WhatsApp Messsage"),
      no_submit_on_enter: true,
      fields: this.get_fields(),
      primary_action_label: __("Send"),
      size: "large",
      primary_action: function () {
        me.delete_saved_draft();
        me.send_action();
      },
      minimizable: true,
    });


    // set default template
    frappe.db.get_list("Whatsapp Business Template", {
      filters: {
        linked_doctype: me.frm.doc.doctype,
        is_default_template: 1
      },
      fields: ["name", "template_type"]
    }).then((data) => {
      if (data.length) {
        me.dialog.fields_dict.whatsapp_business_template.set_value(data[0].name);
        me.toggle_document_fields(!data[0].template_type == 'template');
      }
    });

    this.dialog.sections[0].wrapper.addClass("to_section");
    this.dialog.show();
    if (this.frm) {
      $(document).trigger("form-typing", [this.frm]);
    }
    if (this.cc || this.bcc) {
      this.toggle_more_options(true);
    }

    this.prepare();

  }

  toggle_document_fields(is_hidden) {
    let me = this;
    me.dialog.fields_dict.attach_document_print.set_value(!is_hidden);
    for (let f in me.dialog.fields_dict) {
      if (!['recipients', 'business_whatsapp_template', 'content'].includes(f)) {
        me.dialog.set_df_property(f, 'hidden', is_hidden);
      }
    }
    if (this.frm) {
      const print_formats = frappe.meta.get_print_formats(this.frm.meta.name);
      me.dialog.fields_dict.select_print_format.set_value(print_formats.length ? print_formats[0] : "Standard");
    }

    $(me.dialog.fields_dict.select_print_format.wrapper).toggle(!is_hidden);

    debugger;
    me.dialog.refresh();
  }

  get_fields() {
    let me = this;
    let recipients = [];
    for (let o of Object.values(this.frm.fields_dict)) {
      if (o.df && o.df.options == "Phone") {
        recipients.push(o.value);
        break;
      };
    }

    let fields = [
      {
        label: __("To Mobile"),
        fieldtype: "Data",
        reqd: 1,
        fieldname: "recipients",
        default: recipients.join(","),
      },
      { fieldtype: "Column Break", fieldname: 'cb1' },
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
        onchange: () => {
          let templ = me.dialog.fields_dict["whatsapp_business_template"].value;
          if (templ) {
            frappe.model.with_doc("Whatsapp Business Template", templ, function () {
              let template_doc = frappe.model.get_doc("Whatsapp Business Template", templ);
              let message = frappe.render_template(template_doc.message, cur_frm.doc)

              me.dialog.set_value("content", message);

              // hide attachment fields if template is not a document template
              if (cur_dialog) {
                me.toggle_document_fields(!template_doc.template_type == 'template')
                me.dialog.refresh();
              }
              // 
            });
          }
          // 
        },
      },
      { fieldtype: "Section Break", },
      {
        label: __("Message"),
        fieldtype: "Text Editor",
        fieldname: "content",
        // onchange: frappe.utils.debounce(this.save_as_draft.bind(this), 300),
        read_only: 1,
      },
      {
        fieldtype: "Section Break",
      },
      {
        fieldtype: "HTML",
        options: `<div style="font-weight:bold">
          Please select "Attach Document Print" <stong>OR</strong> one attachment to be sent with message
            </div>`,
        fieldname: "attach_html"
      },
      { fieldtype: "Section Break" },
      {
        label: __("Attach Document Print"),
        fieldtype: "Check",
        fieldname: "attach_document_print",
      },
      {
        label: __("Select Print Format"),
        fieldtype: "Select",
        fieldname: "select_print_format",
      },
      {
        label: __("Select Languages"),
        fieldtype: "Select",
        fieldname: "language_sel",
        hidden: 1
      },

      { fieldtype: "Column Break" },
      {
        label: __("Select Attachments"),
        fieldtype: "HTML",
        fieldname: "select_attachments",
      },
      { fieldtype: "Section Break" },
    ];
    return fields;
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

    if (!form_values.recipients) {
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
      recipients: form_values.recipients,
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

    console.log(args)

    return frappe.call({
      method: "whatsapp_business.notification.make_communication",
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
