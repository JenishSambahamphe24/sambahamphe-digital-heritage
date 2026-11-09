import { describe, expect, it } from "vitest";

import { EmailTemplateHelper } from "./email-template.helper.js";

describe("EmailTemplateHelper", () => {
  it("fills placeholders and includes the action link in text and HTML", () => {
    const email = EmailTemplateHelper.render("verify_email", {
      displayName: "Ram",
      link: "http://localhost:3000/verify-email#token=abc",
    });

    expect(email.subject).toBe("Confirm your email address");
    expect(email.text).toContain("Namaste Ram,");
    expect(email.text).toContain("http://localhost:3000/verify-email#token=abc");
    expect(email.html).toContain('href="http://localhost:3000/verify-email#token=abc"');
  });

  it("escapes user-supplied values in HTML", () => {
    const email = EmailTemplateHelper.render("account_exists", {
      displayName: '<img src=x onerror="alert(1)">',
    });

    expect(email.html).not.toContain("<img");
    expect(email.html).toContain("&lt;img");
  });

  it("renders templates without an action", () => {
    const email = EmailTemplateHelper.render("account_exists", { displayName: "Sita" });

    expect(email.html).not.toContain("<a ");
  });
});
