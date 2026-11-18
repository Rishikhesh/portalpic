import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

// Apps Script has no modules: load lib.js the way Apps Script does, as plain global functions.
type Lib = {
  buildIssue: (answers: Record<string, string | string[]>, row: number) => { title: string; body: string; labels: string[] };
  rowFromBody: (body: string) => number | null;
  liveUrl: (comments: string[]) => string | null;
  notifyText: (stateReason: string, url: string | null, form: string) => { subject: string; body: string };
};
const lib = {} as Lib;
runInNewContext(readFileSync(new URL("./lib.js", import.meta.url), "utf8") + "\nObject.assign(out, { buildIssue, rowFromBody, liveUrl, notifyText });", { out: lib });

const answers = {
  Timestamp: ["11/18/2026 10:00:00"],
  Country: ["UK"],
  "Exam, visa or form": ["UK visa"],
  "What do you need to upload?": ["Photo, Signature"],
  "Link to the official notification or upload page": ["https://www.gov.uk/x"],
  "Email (optional)": ["a@b.com"],
};

test("buildIssue omits email", () => {
  const { body, labels } = lib.buildIssue(answers, 7);
  expect(body).not.toContain("a@b.com");
  expect(body).not.toMatch(/email/i);
  expect(body).toContain("Sheet row: 7");
  expect(body).toContain("https://www.gov.uk/x");
  expect(labels).toEqual(["preset", "from-form"]);
});

test("buildIssue title", () => {
  expect(lib.buildIssue(answers, 7).title).toBe("Preset request: UK · UK visa");
  expect(lib.buildIssue({}, 3).title).toBe("Preset request: (from the form)");
});

test("rowFromBody", () => {
  expect(lib.rowFromBody("stuff\nSheet row: 12")).toBe(12);
  expect(lib.rowFromBody("no row here")).toBeNull();
});

test("liveUrl", () => {
  expect(lib.liveUrl(["working…", "🚀 Live at https://portalpic.com/uk-visa-online (shipped in #9)."])).toBe("https://portalpic.com/uk-visa-online");
  expect(lib.liveUrl(["nothing"])).toBeNull();
});

test("notifyText for completed and not_planned", () => {
  const ok = lib.notifyText("completed", "https://portalpic.com/uk-visa-online", "UK visa");
  expect(ok.body).toContain("https://portalpic.com/uk-visa-online");
  const no = lib.notifyText("not_planned", null, "UK visa");
  expect(no.subject).toMatch(/couldn't/i);
  expect(no.body).not.toContain("https://portalpic.com/");
});
