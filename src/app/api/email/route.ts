import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

// ⚠️ In Resend 'Testing' mode, this MUST be the email you used to sign up.
const ADMIN_EMAIL = 'shivrajjagtap22093@gmail.com'; 

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, orderDetails } = body;

    // --- SCENARIO 1: NEW ORDER PLACED ---
    if (type === 'NEW_ORDER') {
      
      // B. Email to OWNER (Admin Alert)
      await resend.emails.send({
        from: 'Whiskd Orders <onboarding@resend.dev>',
        to: [ADMIN_EMAIL],
        subject: `🔔 NEW ORDER: ₹${orderDetails.total} from ${orderDetails.name}`,
        html: `
          <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4B3621;">New Order Received! 🎂</h1>
            
            <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="margin: 0; color: #C5A059;">Order #${orderDetails.id || 'N/A'}</h2>
            </div>

            <h3>Customer Details</h3>
            <p>
              <strong>Name:</strong> ${orderDetails.name}<br>
              <strong>Phone:</strong> <a href="tel:${orderDetails.phone}">${orderDetails.phone}</a><br>
              <strong>Address:</strong> ${orderDetails.address || 'N/A'}<br>
              <strong>Note:</strong> ${orderDetails.note || 'None'}
            </p>

            <h3>Order Summary</h3>
            <ul>
              ${orderDetails.items.map((i: any) => 
                `<li style="margin-bottom: 5px;">
                  <strong>${i.name}</strong> x ${i.qty} - ₹${i.price * i.qty}
                 </li>`
              ).join('')}
            </ul>
            
            <h3 style="color: #4B3621;">Total Value: ₹${orderDetails.total}</h3>
            <p><strong>Payment Method:</strong> ${orderDetails.payment}</p>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email Error:', error);
    return NextResponse.json({ error }, { status: 500 });
  }
}