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
    console.log("Test OTP simulated:", message.sid);
  } catch (error: any) {
    console.error("Test sending error:", error.message);
  }
}

