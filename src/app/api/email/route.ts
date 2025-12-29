import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

// ⚠️ CRITICAL: In Resend 'Testing' mode, this MUST be the email you used to sign up.
const ADMIN_EMAIL = '@gmail.com'; 

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, orderDetails } = body;

    // --- SCENARIO 1: NEW ORDER PLACED ---
    if (type === 'NEW_ORDER') {
      
      // A. Email to CUSTOMER 
      // ❌ DISABLED: Cannot send to unverified customers in Resend Free/Test mode.
      // Once you buy a domain, you can uncomment this section.

      // B. Email to OWNER (Admin Alert)
      // ✅ This works because it sends TO the account owner
      await resend.emails.send({
        from: 'Whiskd Orders <onboarding@resend.dev>',
        to: [ADMIN_EMAIL],
        subject: `🔔 NEW ORDER: ₹${orderDetails.total} from ${orderDetails.name}`,
        html: `
          <div style="font-family: sans-serif; color: #333;">
            <h2 style="color: #4B3621;">New Order Received! 🎂</h2>
            <p><strong>Order ID:</strong> ${orderDetails.id || 'N/A'}</p>
            <hr style="border: 1px solid #eee;" />
            
            <h3>Customer Details</h3>
            <p>
              <strong>Name:</strong> ${orderDetails.name}<br>
              <strong>Phone:</strong> <a href="tel:${orderDetails.phone}">${orderDetails.phone}</a><br>
              <strong>Address:</strong> ${orderDetails.address}<br>
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
            
            <h3 style="color: #C5A059;">Total Value: ₹${orderDetails.total}</h3>
            <p><strong>Payment Method:</strong> ${orderDetails.payment}</p>
          </div>
        `,
      });
    }

    // --- SCENARIO 2: ORDER STATUS UPDATE ---
    // ❌ DISABLED: This is meant for the customer. 
    // Since we can't email the customer in test mode, we skip this to prevent errors.

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email Error:', error);
    return NextResponse.json({ error }, { status: 500 });
  }
}