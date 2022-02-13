function setup_whatsapp_business(frm) {
  frm.page.add_menu_item(__("Send Whatsapp"), (e) => {
    // debugger;
    whatsapp_dialog.call(frm);
  });
}

function whatsapp_dialog() {
  new frappe.views.WhatsappComposer({
    doc: this.doc,
    frm: this,
    content: __(this.meta.name) + ": " + this.docname,
    recipients: this.doc.email || this.doc.email_id || this.doc.contact_email,
    attach_document_print: true,
  });
}


// for each doctype add a block
frappe.ui.form.on("Sales Order", {
  refresh: function (frm) {
    setup_whatsapp_business(frm);
  },
});

frappe.ui.form.on("Delivery Note", {
  refresh: function (frm) {
    setup_whatsapp_business(frm);
  },
});

frappe.ui.form.on("Sales Invoice", {
  refresh: function (frm) {
    setup_whatsapp_business(frm);
  },
});

frappe.ui.form.on("Payment Entry", {
  refresh: function (frm) {
    setup_whatsapp_business(frm);
  },
});

frappe.ui.form.on("Quotation", {
  refresh: function (frm) {
    setup_whatsapp_business(frm);
  },
});

frappe.ui.form.on("Purchase Order", {
  refresh: function (frm) {
    setup_whatsapp_business(frm);
  },
});

frappe.ui.form.on("Purchase Receipt", {
  refresh: function (frm) {
    setup_whatsapp_business(frm);
  },
});

frappe.ui.form.on("Issue", {
  refresh: function (frm) {
    setup_whatsapp_business(frm);
  },
});

frappe.ui.form.on("Lead", {
  refresh: function (frm) {
    setup_whatsapp_business(frm);
  },
});

frappe.ui.form.on("Opportuntiy", {
  refresh: function (frm) {
    setup_whatsapp_business(frm);
  },
});

frappe.ui.form.on("Customer", {
  refresh: function (frm) {
    setup_whatsapp_business(frm);
  },
});


frappe.ui.form.on("Supplier", {
  refresh: function (frm) {
    setup_whatsapp_business(frm);
  },
});


frappe.ui.form.on("Purchase Invoice", {
  refresh: function (frm) {
    setup_whatsapp_business(frm);
  },
});


frappe.ui.form.on("Purchase Invoice", {
  refresh: function (frm) {
    setup_whatsapp_business(frm);
  },
});



frappe.ui.form.on("Project", {
  refresh: function (frm) {
    setup_whatsapp_business(frm);
  },
});


frappe.ui.form.on("Task", {
  refresh: function (frm) {
    setup_whatsapp_business(frm);
  },
});


frappe.ui.form.on("Employee", {
  refresh: function (frm) {
    setup_whatsapp_business(frm);
  },
});


frappe.ui.form.on("Expense Claim", {
  refresh: function (frm) {
    setup_whatsapp_business(frm);
  },
});


frappe.ui.form.on("Employee Advance", {
  refresh: function (frm) {
    setup_whatsapp_business(frm);
  },
});




// for testing
frappe.ui.form.on("ToDo", {
  refresh: function (frm) {
    setup_whatsapp_business(frm);
  },
});