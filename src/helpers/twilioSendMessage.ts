import twilio from "twilio";
import config from "../config";

const client = twilio(config.twilio.account_sid, config.twilio.auth_token);

export async function sendOtp(phone: string, otp: string) {
  try {
    const message = await client.messages.create({
      body: `Your OTP is ${otp}`,
      from: config.twilio.phone_number,
      to: phone,           
    });
    console.log("✅ OTP sent successfully:", message);
    return { success: true, sid: message.sid };
  } catch (error: any) {
    console.error("❌ Twilio SMS Error:", error.message);
    console.error("❌ Twilio SMS Error: ----------------------->", error);
    console.error("Error code:", error.code);
    
    // Log specific error details for debugging
    if (error.code === 21408) {
      console.error("⚠️  Permission denied for this region. For Twilio trial accounts, you can only send to verified numbers.");
    } else if (error.code === 'EAI_AGAIN' || error.message.includes('getaddrinfo')) {
      console.error("⚠️  DNS resolution failed. Check Docker DNS configuration.");
    }
    
    // Return error info instead of just logging
    return { success: false, error: error.message, code: error.code };
  }
}

