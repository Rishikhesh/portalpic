// Pure helpers for the PortalPic request form script. No Apps Script services here, so bun can test them.

var SITE = "https://portalpic.com";

function first_(v) {
  return Array.isArray(v) ? v.join(", ") : v == null ? "" : String(v);
}

function pick_(answers, re) {
  for (var k in answers) if (re.test(k) && first_(answers[k]).trim()) return first_(answers[k]).trim();
  return "";
}

// Form answers → GitHub issue. Emails never go into the issue: only the Sheet row number does.
function buildIssue(answers, row) {
  var country = pick_(answers, /country/i);
  var form = pick_(answers, /exam|visa|form/i);
  var title = "Preset request: " + ([country, form].filter(Boolean).join(" · ") || "(from the form)");
  var lines = [];
  for (var k in answers) {
    if (/email|timestamp/i.test(k)) continue;
    var v = first_(answers[k]).trim();
    if (v) lines.push("**" + k + "**\n" + v);
  }
  lines.push("_Submitted through the Google Form._\n\nSheet row: " + row);
  return { title: title, body: lines.join("\n\n"), labels: ["preset", "from-form"] };
}

function rowFromBody(body) {
  var m = /^Sheet row: (\d+)\s*$/m.exec(body || "");
  return m ? Number(m[1]) : null;
}

// The newest "Live at" link the shipped workflow commented.
function liveUrl(comments) {
  var url = null;
  var re = new RegExp(SITE.replace(/[.]/g, "\\.") + "/[a-z0-9-]+", "g");
  for (var i = 0; i < comments.length; i++) {
    var all = String(comments[i]).match(re);
    if (all) url = all[all.length - 1];
  }
  return url;
}

function notifyText(stateReason, url, form) {
  var name = form || "your form";
  if (stateReason === "completed" && url) {
    return {
      subject: "PortalPic now supports " + name,
      body: "Hi,\n\nThe preset you asked for is live: " + url + "\n\nIt resizes your photo or signature to the official size and file limit, right in your browser. Nothing is uploaded.\n\nThanks for the request,\nPortalPic",
    };
  }
  return {
    subject: "We couldn't add " + name + " yet",
    body: "Hi,\n\nThanks for your request. We couldn't find official rules for " + name + " that we could rely on, so we haven't added a preset yet. If you have a link to the official notification, reply with it and we'll take another look.\n\nMeanwhile, you can use the Custom size option at " + SITE + "\n\nPortalPic",
  };
}
