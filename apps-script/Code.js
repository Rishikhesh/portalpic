// PortalPic request form → GitHub issues, and an email to the requester when their issue closes.
// Bound to the form's response Sheet. Setup: see README.md in this folder.
/* global buildIssue, findRow, liveUrl, notifyText, decideNotify, SpreadsheetApp, ScriptApp, PropertiesService, UrlFetchApp, MailApp, Logger */

var REPO = "Rishikhesh/portalpic";

function github_(method, path, payload) {
  var token = PropertiesService.getScriptProperties().getProperty("GITHUB_TOKEN");
  if (!token) throw new Error("Set the GITHUB_TOKEN script property first.");
  var res = UrlFetchApp.fetch("https://api.github.com" + path, {
    method: method,
    contentType: "application/json",
    payload: payload ? JSON.stringify(payload) : undefined,
    headers: { Authorization: "Bearer " + token, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
    muteHttpExceptions: true,
  });
  var code = res.getResponseCode();
  if (code >= 300) throw new Error("GitHub " + method + " " + path + " → " + code + ": " + res.getContentText().slice(0, 300));
  return JSON.parse(res.getContentText());
}

function responses_() {
  var ss = SpreadsheetApp.getActive();
  return ss.getSheets().filter(function (s) { return /^Form Responses/i.test(s.getName()); })[0] || ss.getSheets()[0];
}

// Column index (1-based) for a header, created at the end if missing.
function column_(sheet, re, create) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  for (var i = 0; i < headers.length; i++) if (re.test(String(headers[i]))) return i + 1;
  if (!create) return 0;
  sheet.getRange(1, headers.length + 1).setValue(create);
  return headers.length + 1;
}

function onFormSubmit(e) {
  var row = e.range.getRow();
  var issue = github_("post", "/repos/" + REPO + "/issues", buildIssue(e.namedValues, row));
  var sheet = e.range.getSheet();
  sheet.getRange(row, column_(sheet, /^Issue$/, "Issue")).setValue(issue.html_url);
}

function checkClosed() {
  var props = PropertiesService.getScriptProperties();
  var since = props.getProperty("LAST_CHECK") || new Date(Date.now() - 86400000).toISOString();
  var now = Date.now();
  var nextSince = new Date(now).toISOString();
  var sheet = responses_();
  var emailCol = column_(sheet, /email/i);
  var issueCol = column_(sheet, /^Issue$/, "Issue");
  var notifiedCol = column_(sheet, /^Notified$/, "Notified");
  if (!emailCol) return;
  var issueLinks = sheet.getRange(1, issueCol, sheet.getLastRow(), 1).getValues().map(function (r) { return r[0]; });

  for (var page = 1; page <= 10; page++) {
    var issues = github_("get", "/repos/" + REPO + "/issues?state=closed&labels=from-form&sort=updated&direction=asc&per_page=100&page=" + page + "&since=" + encodeURIComponent(since));
    issues.forEach(function (issue) {
      try {
        if (issue.pull_request) return;
        var row = findRow(issueLinks, issue.html_url);
        if (!row) return;
        var email = String(sheet.getRange(row, emailCol).getValue()).trim();
        var notified = sheet.getRange(row, notifiedCol);
        if (notified.getValue() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return;

        var comments = github_("get", "/repos/" + REPO + "/issues/" + issue.number + "/comments?per_page=100").map(function (c) { return c.body; });
        var url = liveUrl(comments);
        var decision = decideNotify(issue.state_reason, url, Date.parse(issue.closed_at), now);
        if (decision === "wait") { // look at this issue again next run
          if (issue.closed_at < nextSince) nextSince = issue.closed_at;
          return;
        }
        var msg = notifyText(decision === "couldnt" ? "not_planned" : "completed", decision === "live" ? url : null, issue.title.replace(/^Preset request:\s*/, ""));
        MailApp.sendEmail(email, msg.subject, msg.body);
        notified.setValue(new Date());
      } catch (err) {
        Logger.log("Issue #" + issue.number + ": " + err); // retried on a later run only if it changes again
      }
    });
    if (issues.length < 100) break;
  }
  props.setProperty("LAST_CHECK", nextSince);
}

// Run once from the editor: creates the two triggers (safe to re-run).
function install() {
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger("onFormSubmit").forSpreadsheet(SpreadsheetApp.getActive()).onFormSubmit().create();
  ScriptApp.newTrigger("checkClosed").timeBased().everyMinutes(15).create();
  Logger.log("Triggers installed.");
}
