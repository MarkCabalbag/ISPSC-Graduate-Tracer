/**
 * Email helper for the Graduate Tracer module.
 *
 * @remarks
 * Sends an email through Gmail (nodemailer) using a Handlebars template. The
 * ISPSC logo is attached to every email and can be shown in a template with
 * `<img src="cid:ispscLogo@ispscTracer.ee">`.
 *
 * **Environment variables**
 *
 * - `EMAIL_FROM`: the Gmail address that sends the emails.
 * - `EMAIL_PASS`: the app password of that account.
 *
 * **This helper never throws**
 *
 * `sendGraduateTracerEmail` catches every error itself and returns an
 * `EmailResult`. Callers must check `result.success`; a `try/catch` around the
 * call will not see a failed email. Details of a failure are written to the
 * server log under `[email]`.
 *
 * **Where the files must be**
 *
 * - Templates: `utils/templates/{layouts,partials,emails}`, found from the
 *   folder the server is started in (the project root).
 * - Logo: `assets/ispsc.png`, also found from the project root.
 *
 * Both paths are relative to the folder the server is started in, so start it
 * from the project root (the `backend` folder). They keep working when the
 * TypeScript is compiled into a `dist` folder, because the templates and the
 * logo are read from the project root and not from `dist`.
 *
 * **Types**
 *
 * Install `@types/nodemailer` and `@types/nodemailer-express-handlebars` as
 * dev dependencies. The second one adds `template` and `context` to the
 * nodemailer mail options.
 *
 * @packageDocumentation
 */

import path from "path";
import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer/index.js";
import hbs from "nodemailer-express-handlebars";

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

/**
 * Path of the logo attached to every email.
 *
 * @remarks
 * Found from the folder the server is started in (the project root), like the
 * templates, so it does not depend on where this file is compiled to.
 */
const LOGO_PATH = path.resolve("assets/ispsc.png");

/** Content id of the logo, used in templates as `cid:ispscLogo@ispscTracer.ee`. */
const LOGO_CID = "ispscLogo@ispscTracer.ee";

/** Name shown as the sender of every email. */
const SENDER_NAME = "ISPSC No Reply";

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

/**
 * Values passed to the Handlebars template.
 *
 * @example
 * ```ts
 * { fullName: "ANA CRUZ", date: 2026 }
 * ```
 */
export type EmailContext = Record<string, unknown>;

/** Result of `sendGraduateTracerEmail`. */
export type EmailResult = {
  /** `true` when the email was accepted by the mail server. */
  success: boolean;
  /** A short message that is safe to show or log. */
  message: string;
};

/* -------------------------------------------------------------------------- */
/*                                  Transporter                               */
/* -------------------------------------------------------------------------- */

const emailUser = process.env.EMAIL_FROM;
const emailPass = process.env.EMAIL_PASS;

if (!emailUser || !emailPass) {
  console.error(
    "[email] EMAIL_FROM or EMAIL_PASS is not set. Emails will not be sent.",
  );
}

/** Shared mail transporter. */
const transporter = nodemailer.createTransport({
  port: 465,
  secure: true,
  service: "gmail",
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});

transporter.use(
  "compile",
  hbs({
    viewEngine: {
      extname: ".hbs",
      layoutsDir: path.resolve("utils/templates/layouts"),
      defaultLayout: "main",
      partialsDir: path.resolve("utils/templates/partials"),
    },
    viewPath: path.resolve("utils/templates/emails"),
    extName: ".hbs",
  }),
);

/* -------------------------------------------------------------------------- */
/*                                   Sender                                   */
/* -------------------------------------------------------------------------- */

/**
 * Sends an email built from a Handlebars template.
 *
 * @remarks
 * Never throws: failures are logged and returned as `{ success: false }`.
 *
 * @param recipientEmail - The address that receives the email.
 * @param context - Values used by the template.
 * @param subject - The subject line.
 * @param template - Template file name without the `.hbs` extension, for
 * example `"student-completed-form"`.
 * @returns `{ success: true }` when the mail server accepted the email,
 * otherwise `{ success: false }` with a short message.
 *
 * @example
 * ```ts
 * const result = await sendGraduateTracerEmail(
 *   "ana@mail.com",
 *   { fullName: "ANA CRUZ", date: 2026 },
 *   "Thank you for being part of the tracer survey",
 *   "student-completed-form",
 * );
 * if (!result.success) console.error(result.message);
 * ```
 */
export const sendGraduateTracerEmail = async (
  recipientEmail: string,
  context: EmailContext,
  subject: string,
  template: string,
): Promise<EmailResult> => {
  if (!emailUser || !emailPass) {
    return { success: false, message: "Email is not configured." };
  }

  try {
    // `template` and `context` are added by nodemailer-express-handlebars.
    // Declaring them here keeps this file compiling even if the type package
    // that adds them is missing.
    const mailOptions: Mail.Options & {
      template: string;
      context: EmailContext;
    } = {
      from: `"${SENDER_NAME}" <${emailUser}>`,
      to: recipientEmail,
      subject,
      attachments: [
        {
          filename: "ispsc.png",
          path: LOGO_PATH,
          cid: LOGO_CID,
        },
      ],
      template,
      context,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("[email] Sent successfully:", info.response);
    return { success: true, message: "Email sent successfully!" };
  } catch (error) {
    console.error("[email] Failed to send email:", error);
    return { success: false, message: "Failed to send email." };
  }
};