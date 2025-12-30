import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

// ⚠️ In Resend 'Testing' mode, this MUST be the email you used to sign up.
const ADMIN_EMAIL = 'shivrajjagtap22093@gmail.com'; 

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, orderDetails, customerEmail } = body;

    if (type === 'NEW_ORDER') {
      
      // 1. Email to OWNER (Admin Alert) - Always Active
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
                `<li><strong>${i.name}</strong> x ${i.qty} - ₹${i.price * i.qty}</li>`
              ).join('')}
            </ul>
            <h3 style="color: #4B3621;">Total: ₹${orderDetails.total}</h3>
            <p>Payment: ${orderDetails.payment}</p>
          </div>
        `,
      });


      /* --- UNCOMMENT BELOW WHEN DOMAIN IS VERIFIED --- 
      
      if (customerEmail) {
        await resend.emails.send({
          // NOTE: You must change 'onboarding@resend.dev' to 'orders@yourdomain.com'
          from: 'Whiskd <onboarding@resend.dev>', 
          to: [customerEmail],
          subject: `Order Confirmation #${orderDetails.id}`,
          html: `
            <div style="font-family: sans-serif; color: #333; padding: 20px;">
              <h1 style="color: #C5A059;">Thank you for your order!</h1>
              <p>Hi ${orderDetails.name}, we have received your order.</p>
              <p><strong>Order ID:</strong> ${orderDetails.id}</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <h3>Items:</h3>
              <ul>
                ${orderDetails.items.map((i: any) => `<li>${i.name} x ${i.qty}</li>`).join('')}
              </ul>
              <h3>Total: ₹${orderDetails.total}</h3>
              <p>We will notify you once your order is being prepared!</p>
            </div>
          `,
        });
      }
      
      -------------------------------------------------- */
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email Error:', error);
    return NextResponse.json({ error }, { status: 500 });
  }
}