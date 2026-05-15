interface EnviarCorreoParams {
  to: string;
  subject: string;
  html: string;
}

const tenantId = process.env.GRAPH_TENANT_ID;
const clientId = process.env.GRAPH_CLIENT_ID;
const clientSecret = process.env.GRAPH_CLIENT_SECRET;
const sender = process.env.GRAPH_SENDER || "administrador@grupocolchagua.cl";

const obtenerAccessToken = async (): Promise<string> => {
  if (!tenantId || !clientId || !clientSecret) {
    throw new Error("Faltan variables GRAPH_TENANT_ID, GRAPH_CLIENT_ID o GRAPH_CLIENT_SECRET.");
  }

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("client_secret", clientSecret);
  params.append("scope", "https://graph.microsoft.com/.default");
  params.append("grant_type", "client_credentials");

  const response = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Error obteniendo token Graph: ${data?.error_description || data?.error || "Error desconocido"}`
    );
  }

  return data.access_token;
};

export const enviarCorreo = async ({ to, subject, html }: EnviarCorreoParams) => {
  const accessToken = await obtenerAccessToken();

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          subject,
          body: {
            contentType: "HTML",
            content: html,
          },
          toRecipients: [
            {
              emailAddress: {
                address: to,
              },
            },
          ],
        },
        saveToSentItems: true,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Error enviando correo Graph: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  return {
    messageId: null,
    accepted: [to],
    rejected: [],
    response: "Correo aceptado por Microsoft Graph",
  };
};