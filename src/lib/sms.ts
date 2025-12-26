import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

let client: ReturnType<typeof twilio> | null = null;

if (accountSid && authToken && twilioPhone) {
  client = twilio(accountSid, authToken);
}

export async function sendSMS(phoneNumber: string, message: string): Promise<void> {
  if (!client || !twilioPhone) {
    console.warn(" Twilio non configuré. SMS non envoyé.");
    console.log(`SMS simulé pour ${phoneNumber}: ${message}`);
    return;
  }

  try {
    const result = await client.messages.create({
      body: message,
      from: twilioPhone,
      to: phoneNumber,
    });

    console.log(` SMS envoyé avec succès. SID: ${result.sid}`);
  } catch (error) {
    console.error(" Erreur lors de l'envoi du SMS:", error);
    throw new Error("Impossible d'envoyer le SMS");
  }
}