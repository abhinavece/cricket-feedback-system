import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { name, email, phone, type, timestamp } = body;
    
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create email content
    const emailContent = `
New Auction Waitlist Registration:

Name: ${name}
Email: ${email}
Phone: ${phone}
Type: ${type || 'auction_waitlist'}
Timestamp: ${timestamp || new Date().toISOString()}

This user is interested in the cricket auction platform and should be notified when it launches.

---
Sent from CricSmart Website
    `.trim();

    // Send email to support@cricsmart.in
    const emailData = {
      to: 'support@cricsmart.in',
      subject: `🏏 New Auction Waitlist: ${name}`,
      text: emailContent,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #f59e0b; margin: 0;">🏏 New Auction Waitlist Registration</h1>
            <p style="color: #94a3b8; margin: 10px 0;">Someone is interested in your cricket auction platform!</p>
          </div>
          
          <div style="background-color: #1e293b; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h2 style="color: #f59e0b; margin-top: 0;">User Details:</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #94a3b8; font-weight: bold;">Name:</td>
                <td style="padding: 8px 0; color: #ffffff;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #94a3b8; font-weight: bold;">Email:</td>
                <td style="padding: 8px 0; color: #ffffff;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #94a3b8; font-weight: bold;">Phone:</td>
                <td style="padding: 8px 0; color: #ffffff;">${phone}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #94a3b8; font-weight: bold;">Type:</td>
                <td style="padding: 8px 0; color: #ffffff;">${type || 'auction_waitlist'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #94a3b8; font-weight: bold;">Timestamp:</td>
                <td style="padding: 8px 0; color: #ffffff;">${timestamp || new Date().toISOString()}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #0f172a; padding: 20px; border-radius: 12px; border: 1px solid #f59e0b/20;">
            <p style="margin: 0; color: #94a3b8; text-align: center;">
              This user is interested in the cricket auction platform and should be notified when it launches.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #334155;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">
              Sent from CricSmart Website • ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      `,
    };

    // Send email to support@cricsmart.in
    const emailSent = await emailService.sendEmail(emailData);
    
    // If email fails, log it for debugging
    if (!emailSent) {
      console.log('Email failed, logging instead:');
      await emailService.logEmail(emailData);
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Successfully added to waitlist' 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error processing auction waitlist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
