import type { IRenderedEmail, TEmailTemplate } from "./email.types.js";

interface ITemplateCopy {
  subject: string;
  lines: string[];
  action?: { label: string; urlParam: string };
}

// English only for now; Nepali copy needs review by the organization before
// it is added here (requirements Q-3).
const TEMPLATES: Record<TEmailTemplate, ITemplateCopy> = {
  verify_email: {
    subject: "Confirm your email address",
    lines: [
      "Namaste {displayName},",
      "Please confirm your email address to finish creating your Sambahamphe Utthan Sangh account.",
      "This link expires in 24 hours. If you did not sign up, you can ignore this email.",
    ],
    action: { label: "Confirm email", urlParam: "link" },
  },
  password_reset: {
    subject: "Reset your password",
    lines: [
      "Namaste {displayName},",
      "We received a request to reset your password. The link below expires in 1 hour.",
      "If you did not ask for this, ignore this email; your password stays the same.",
    ],
    action: { label: "Reset password", urlParam: "link" },
  },
  account_exists: {
    subject: "Someone tried to sign up with your email",
    lines: [
      "Namaste {displayName},",
      "Someone tried to create a new account with this email address, but you already have one.",
      "If this was you, sign in or reset your password instead. If not, no action is needed.",
    ],
  },
};

const PLACEHOLDER = /\{(\w+)\}/g;

export class EmailTemplateHelper {
  static render(template: TEmailTemplate, params: Record<string, string>): IRenderedEmail {
    const copy = TEMPLATES[template];
    const lines = copy.lines.map((line) => EmailTemplateHelper.fill(line, params));
    const actionUrl = copy.action ? (params[copy.action.urlParam] ?? null) : null;

    const text = [...lines, ...(actionUrl ? ["", `${copy.action?.label}: ${actionUrl}`] : [])].join(
      "\n\n",
    );
    const html = [
      ...lines.map((line) => `<p>${EmailTemplateHelper.escape(line)}</p>`),
      ...(actionUrl
        ? [
            `<p><a href="${EmailTemplateHelper.escape(actionUrl)}">${EmailTemplateHelper.escape(copy.action?.label ?? "")}</a></p>`,
          ]
        : []),
    ].join("\n");

    return { subject: copy.subject, text, html };
  }

  static escape(value: string): string {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  private static fill(line: string, params: Record<string, string>): string {
    return line.replace(PLACEHOLDER, (match, key: string) => params[key] ?? match);
  }
}
