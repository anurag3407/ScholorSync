import nodemailer from 'nodemailer';
import "dotenv/config"

const getEmailConfig = () => {
    const host = process.env.EMAIL_HOST;
    const port = process.env.EMAIL_PORT;
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    console.log('[Email Config] HOST:', host, 'PORT:', port, 'USER:', user ? `${user.substring(0, 5)}...` : 'undefined');

    if (!host || !user || !pass) {
        throw new Error(
            `Missing email configuration. Please check your .env file:\n` +
            `EMAIL_HOST: ${host ? '✓' : '✗ MISSING'}\n` +
            `EMAIL_PORT: ${port || '587 (default)'}\n` +
            `EMAIL_USER: ${user ? '✓' : '✗ MISSING'}\n` +
            `EMAIL_PASS: ${pass ? '✓' : '✗ MISSING'}`
        );
    }

    return {
        host,
        port: parseInt(port || '587', 10),
        secure: port === '465',
        user,
        pass,
    };
};

const createTransporter = () => {
    const config = getEmailConfig();

    return nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
            user: config.user,
            pass: config.pass,
        },
        tls: {
            rejectUnauthorized: false,
        },
    });
};

interface VerificationEmailParams {
    email: string;
    userId: string;
    role: 'student' | 'corporate';
    verificationToken: string;
}

export const sendVerificationEmail = async ({
    email,
    userId,
    role,
    verificationToken,
}: VerificationEmailParams): Promise<{ success: boolean; message: string }> => {
    try {
        const transporter = createTransporter();

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const verificationUrl = `${baseUrl}/api/email/verify?token=${verificationToken}&userId=${userId}`;

        const roleLabel = role === 'student' ? 'Student' : 'Corporate Partner';

        const mailOptions = {
            from: `"ScholarSync" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Verify your ${roleLabel} account on ScholarSync`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Email Verification</title>
                </head>
                <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                        <tr>
                            <td>
                                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 16px 16px 0 0; padding: 40px; text-align: center;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                                        🎓 ScholarSync
                                    </h1>
                                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
                                        Fellowships Platform
                                    </p>
                                </div>
                                
                                <div style="background: #ffffff; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                                    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                                        Verify Your Email
                                    </h2>
                                    
                                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                        Welcome to ScholarSync Fellowships! You've registered as a <strong style="color: ${role === 'student' ? '#10b981' : '#3b82f6'};">${roleLabel}</strong>.
                                    </p>
                                    
                                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                        Please click the button below to verify your email address and complete your registration.
                                    </p>
                                    
                                    <div style="text-align: center; margin: 30px 0;">
                                        <a href="${verificationUrl}" 
                                           style="display: inline-block; background: linear-gradient(135deg, ${role === 'student' ? '#10b981, #059669' : '#3b82f6, #2563eb'}); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(0,0,0,0.15);">
                                            Verify Email Address
                                        </a>
                                    </div>
                                    
                                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                                        If the button doesn't work, copy and paste this link into your browser:
                                    </p>
                                    <p style="color: #3b82f6; font-size: 12px; word-break: break-all; margin: 10px 0 0 0;">
                                        ${verificationUrl}
                                    </p>
                                    
                                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                                    
                                    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                                        This link will expire in 24 hours. If you didn't create an account on ScholarSync, you can safely ignore this email.
                                    </p>
                                </div>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `,
            text: `
                Welcome to ScholarSync Fellowships!
                
                You've registered as a ${roleLabel}.
                
                Please verify your email by clicking this link:
                ${verificationUrl}
                
                This link will expire in 24 hours.
                
                If you didn't create an account on ScholarSync, you can safely ignore this email.
            `,
        };

        await transporter.sendMail(mailOptions);

        return {
            success: true,
            message: 'Verification email sent successfully',
        };
    } catch (error) {
        console.error('Error sending verification email:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to send verification email',
        };
    }
};

export default createTransporter;
