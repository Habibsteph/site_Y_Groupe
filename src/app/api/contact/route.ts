import { NextResponse } from "next/server";
import { Resend } from "resend";


function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(req: Request) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    const contactToEmail = process.env.CONTACT_TO_EMAIL;

    if (!resendApiKey) {
      console.error("RESEND_API_KEY est manquante.");

      return NextResponse.json(
        {
          error: "Le service de contact est temporairement indisponible.",
        },
        { status: 500 }
      );
    }

    if (!contactToEmail) {
      console.error("CONTACT_TO_EMAIL est manquant.");

      return NextResponse.json(
        {
          error: "Le service de contact est temporairement indisponible.",
        },
        { status: 500 }
      );
    }

    const body = await req.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const company =
      typeof body.company === "string" && body.company.trim()
        ? body.company.trim()
        : "Non renseignée";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const message =
      typeof body.message === "string" ? body.message.trim() : "";

    if (!name || !email || !message) {
      return NextResponse.json(
        {
          error: "Merci de remplir les champs obligatoires.",
        },
        { status: 400 }
      );
    }

    if (
      name.length > 100 ||
      company.length > 150 ||
      email.length > 254 ||
      message.length > 5000
    ) {
      return NextResponse.json(
        {
          error: "Un ou plusieurs champs dépassent la longueur autorisée.",
        },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          error: "Adresse email invalide.",
        },
        { status: 400 }
      );
    }

    const safeName = escapeHtml(name);
    const safeCompany = escapeHtml(company);
    const safeEmail = escapeHtml(email);
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");

    const resend = new Resend(resendApiKey);

    const { data, error } = await resend.emails.send({
      from: "Y Groupe <contact@ygroupecaptiver.com>",
      to: [contactToEmail],
      replyTo: email,
      subject: `Nouveau message depuis le site Y Groupe — ${name}`,
      text: [
        "Nouveau message depuis le site Y Groupe",
        "",
        `Nom : ${name}`,
        `Entreprise : ${company}`,
        `Email : ${email}`,
        "",
        "Message :",
        message,
      ].join("\n"),
      html: `
        <div
          style="
            margin: 0;
            padding: 24px;
            background: #f4f4f4;
            font-family: Arial, sans-serif;
            color: #111111;
          "
        >
          <div
            style="
              max-width: 640px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 12px;
              padding: 32px;
            "
          >
            <h2 style="margin: 0 0 24px;">
              Nouveau message depuis le site Y Groupe
            </h2>

            <p>
              <strong>Nom :</strong>
              ${safeName}
            </p>

            <p>
              <strong>Entreprise :</strong>
              ${safeCompany}
            </p>

            <p>
              <strong>Email :</strong>
              <a href="mailto:${safeEmail}">
                ${safeEmail}
              </a>
            </p>

            <div
              style="
                margin-top: 24px;
                padding: 20px;
                background: #f7f7f7;
                border-radius: 8px;
              "
            >
              <strong>Message :</strong>

              <p style="margin-bottom: 0;">
                ${safeMessage}
              </p>
            </div>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Erreur Resend :", error);

      return NextResponse.json(
        {
          error: "Impossible d’envoyer le message pour le moment.",
        },
        { status: 500 }
      );
    }

    console.log("Message envoyé avec succès :", data?.id);

    return NextResponse.json(
      {
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur API Contact :", error);

    return NextResponse.json(
      {
        error: "Une erreur est survenue.",
      },
      { status: 500 }
    );
  }
}