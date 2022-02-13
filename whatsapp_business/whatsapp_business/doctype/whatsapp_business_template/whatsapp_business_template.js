// Copyright (c) 2022, Greycube and contributors
// For license information, please see license.txt

frappe.ui.form.on("Whatsapp Business Template", {
  refresh: function (frm) {
    frm.page.add_inner_button("Get Templates", function () {
      frm.trigger("load_template_names");
    });

    // end refresh
  },

  select_template: function (frm) {
    return frappe.call({
      method: "whatsapp_business.controllers.waba.get_template_names",
      callback: (r) => {
        console.log(r.message);

        let dialog = new frappe.ui.Dialog({
          title: __("Select Message Template"),
          fields: [
            {
              label: "Template Name",
              fieldname: "template_name",
              fieldtype: "Select",
              options: r.message,
              reqd: 1,
            },
          ],
          primary_action: function (data) {
            frm.set_value(
              "waba_template_name",
              data.template_name.split(" (")[0]
            );
            frm.set_value('language', data.template_name.split(' ').slice(-1)[0].replace(/\W/g, ''));
            frm.refresh_field("waba_template_name");
            dialog.hide();
          },
          primary_action_label: __("Select"),
        });

        dialog.show();
      },
    });
  },

  waba_template_name: function (frm) {
    return frappe.call({
      method: "whatsapp_business.controllers.waba.get_template",
      args: {
        waba_template_name: frm.doc.waba_template_name,
        language: frm.doc.language,
      },
      callback: (r) => {
        console.log(r.message);
        let templates = r.message,
          params = [[]],
          message = "",
          idx = 0;
        frm.set_value(
          "template_json",
          templates.length && JSON.stringify(templates[0], undefined, 4)
        );
        frm.doc.message_parameters = [];
        for (const d of templates) {
          for (const comp of d.components) {
            if (comp.type == "BODY") {
              message = comp.text;
              params = (comp.example && comp.example.body_text) || [[]];
              for (const param of params[0]) {
                frm.add_child("message_parameters", {
                  parameter: ++idx,
                  value: param,
                  header: 0,
                });
                message = message.replace("{{" + idx + "}}", param);
              }
            } else if (comp.type == "HEADER" && comp.format == "DOCUMENT") {
              frm.add_child("message_parameters", {
                parameter: "document link",
                value: comp.example.header_handle[0],
                header: 1,
              });
            }
          }
        }
        frm.set_value("message", message);
        frm.set_value("category", templates[0].category);
        frm.set_value("language", templates[0].language);
        frm.set_value("namespace", templates[0].namespace);
        frm.set_value("rejected_reason", templates[0].rejected_reason);
        frm.set_value("status", templates[0].status);
        frm.refresh_fields();
      },
    });
  },

  load_template_names: function (frm) {
    return frappe.call({
      method: "whatsapp_business.controllers.waba.get_template_names",
      callback: (r) => {
        frm.set_df_property("waba_template_name", "options", r.message);
        frm.refresh_field("waba_template_name");
        console.log(r.message);
      },
    });
  },

  send_test_message: function (frm) {
    return frappe.call({
      method: "send_test_message",
      doc: frm.doc,
      args: { mobile_no: frm.doc.mobile_no },
      callback: () => {
        frappe.msgprint("Your message has been sent.");
      },
    });
  },

  preview_message: function (frm) {

    let template = {},
      message = "";

    template = JSON.parse(frm.doc.template_json);
    if (
      !$.isEmptyObject(template) &&
      template.components &&
      template.components.length
    ) {
      let body = template.components.filter((x) => x.type == "BODY");
      if (body && body.length) {
        message = body[0].text || "";
        for (const d of frm.doc.message_parameters) {
          message = message.replace("{{" + d.parameter + "}}", d.value);
        }
        frm.set_value("message", message);
      }
    }
  },

  //   end on
});

// const sample_text = {
//   recipient_type: "individual",
//   to: "{{doc.mobile_no}}",
//   type: "text",
//   text: {
//     body: "Dear {{doc.customer_name}}, your shipment is ready for delivery.",
//   },
// };

// const template_message_sample = {
//   to: "{{doc.mobile_no}}",
//   type: "template",
//   template: {
//     namespace: "c8ae5f90_307a_ca4c_b8f6_d1e2a2573574",
//     language: {
//       policy: "deterministic",
//       code: "en",
//     },
//     name: "sales_order_template_4",
//     components: [
//       {
//         type: "header",
//         parameters: [
//           {
//             type: "document",
//             document: {
//               link: "https://erpnext.armor.com/sales_invoice_20220101.jpg",
//             },
//           },
//         ],
//       },
//       {
//         type: "body",
//         parameters: [
//           {
//             type: "text",
//             text: "{{doc.customer_name}}",
//           },
//           {
//             type: "text",
//             text: "{{doc.shipping_address}}",
//           },
//         ],
//       },
//     ],
//   },
// };

// // copy_text_message: function (frm) {
// //   frm.set_value(
// //     "message_body",
// //     frm.fields_dict["text_message_sample"].$input.val()
// //   );
// // },

// // copy_template_message: function (frm) {
// //   frm.set_value(
// //     "message_body",
// //     frm.fields_dict["template_message_sample"].$input.val()
// //   );
// // },

// // frm.set_value(
// //   "text_message_sample",
// //   JSON.stringify(sample_text, undefined, 4)
// // );
// // frm.set_value(
// //   "template_message_sample",
// //   JSON.stringify(template_message_sample, undefined, 4)
// // );
// // frm.fields_dict["text_message_sample"].$input.attr("readonly", "readonly");
// // frm.fields_dict["template_message_sample"].$input.attr(
// //   "readonly",
// //   "readonly"
// // );

const templates = [
  {
    category: "AUTO_REPLY",
    components: [
      {
        example: {
          body_text: [["Ahmed Saleem", "25 Oct 2022"]],
        },
        text: "Dear {{1}},\nPlease find the invoice attached for your purchase dated : {{2}}.\nTeam,\nArmor ",
        type: "BODY",
      },
      {
        example: {
          header_handle: [
            "https://armor.flexsofts.com/files/Armor_ACC-SINV-2022-00192.pdf",
          ],
        },
        format: "DOCUMENT",
        type: "HEADER",
      },
    ],
    language: "en",
    name: "test_template",
    namespace: "ecaf1060_d303_4a3f_8872_65bf49b65a38",
    rejected_reason: "NONE",
    status: "approved",
  },
];
