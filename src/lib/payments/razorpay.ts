import Razorpay from 'razorpay';
import crypto from 'crypto';

export const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
});

/**
 * Creates a Razorpay order
 */
export async function createOrder(amountInRupees: number, receiptId: string) {
  try {
    const options = {
      amount: amountInRupees * 100, // paise
      currency: 'INR',
      receipt: receiptId,
      payment_capture: 1 // Auto-capture true
    };
    
    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error('Razorpay Create Order Error:', error);
    throw new Error('Failed to create payment order');
  }
}

/**
 * Verifies Razorpay signature coming from checkout flow
 */
export function verifySignature(order_id: string, payment_id: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder';
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(order_id + '|' + payment_id)
    .digest('hex');
    
  return expectedSignature === signature;
}

/**
 * Verifies webhook signature
 */
export function verifyWebhookSignature(webhookBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'webhook_secret_placeholder';

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(webhookBody)
    .digest('hex');
    
  return expectedSignature === signature;
}
