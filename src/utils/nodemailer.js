import nodemailer from 'nodemailer';

export async function sendEmail(to, subject, text) {
    let transporter = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
            user: process.env.EMAIL_USER, 
            pass: process.env.EMAIL_PASS, 
        },
    });

    await transporter.sendMail({
        from: '"Coder Ecommerce" process.env.EMAIL_USER', 
        to, 
        subject, 
        text, 
    }); 
}
export const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  