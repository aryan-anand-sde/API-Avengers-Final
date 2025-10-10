import Twilio from "twilio";

const accountSid = 'AC948cb3fa1bb3b3f70a9286489c83cba9';
const authToken = '540c751d6f3d84fe5350f71692dc500c';
// Create the Twilio client
let client = Twilio(accountSid, authToken);


export const sendWhatsApp = async (phone, message) => {
    try {
        await client.messages.create({
            from: "whatsapp:+14155238886", // Twilio sandbox number
            to: `whatsapp:${phone}`,
            body: message,
        });
        console.log(`WhatsApp sent to ${phone}`);
    } catch (error) {
        console.error("WhatsApp send error:", error);
    }
};



// client.messages
//     .create({
//                 from: 'whatsapp:+14155238886',
//         contentSid: 'HXb5b62575e6e4ff6129ad7c8efe1f983e',
//         contentVariables: '{"1":"12/1","2":"3pm"}',
//         to: 'whatsapp:+919359285461'
//     })
//     .then(message => console.log(message.sid))
//     .done();