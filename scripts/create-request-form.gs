// One-time setup: creates the "PortalPic: request a preset" Google Form in your account.
// 1. Open https://script.google.com → New project → paste this file → Run `createForm` → allow access.
// 2. Copy the "Share link" printed in the log into REQUEST_FORM_URL in src/lib/links.ts.
function createForm() {
  const form = FormApp.create("PortalPic: request a preset")
    .setDescription("Tell us which exam, visa or ID form you need. Presets are added only when an official notice states the rules, so the link matters most. No sign-in needed.")
    .setCollectEmail(false)
    .setLimitOneResponsePerUser(false)
    .setConfirmationMessage("Thanks! We'll add it once we've checked the official rules.");

  form.addTextItem().setTitle("Country").setHelpText("India, UK, Canada…").setRequired(true);
  form.addTextItem().setTitle("Exam, visa or form").setHelpText("e.g. SBI Clerk 2026, UK visa, OCI card").setRequired(true);
  form.addCheckboxItem().setTitle("What do you need to upload?")
    .setChoiceValues(["Photo", "Signature", "Thumb impression", "Handwritten declaration"]).showOtherOption(true).setRequired(true);
  form.addTextItem().setTitle("Size rules, if you know them").setHelpText("e.g. 200 × 230 px, 20–50 KB, JPG");
  form.addTextItem().setTitle("Link to the official notification or upload page")
    .setValidation(FormApp.createTextValidation().requireTextIsUrl().setHelpText("Paste a link starting with https://").build())
    .setRequired(true);
  form.addParagraphTextItem().setTitle("Anything else");
  form.addTextItem().setTitle("Email (optional)").setHelpText("Only if you'd like to hear when it's added.");

  // Collect responses in a Sheet so requests are one list.
  const sheet = SpreadsheetApp.create("PortalPic preset requests");
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());

  Logger.log("Share link: " + form.getPublishedUrl());
  Logger.log("Edit form:  " + form.getEditUrl());
  Logger.log("Responses:  " + sheet.getUrl());
}
