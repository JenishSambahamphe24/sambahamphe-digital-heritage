export type TEmailTemplate = "verify_email" | "password_reset" | "account_exists";

export interface IEmailJob {
  template: TEmailTemplate;
  to: string;
  locale: string;
  params: Record<string, string>;
}

export interface IRenderedEmail {
  subject: string;
  text: string;
  html: string;
}
