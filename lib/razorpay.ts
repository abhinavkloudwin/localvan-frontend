/**
 * Razorpay payment integration utility
 */

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

/**
 * Load Razorpay script dynamically
 * @returns Promise that resolves to true if loaded successfully
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // Check if already loaded
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Initialize and open Razorpay payment modal
 * @param options Razorpay configuration options
 * @returns Promise that resolves when payment is initiated
 */
export const initiatePayment = async (
  options: RazorpayOptions
): Promise<void> => {
  const loaded = await loadRazorpayScript();

  if (!loaded) {
    throw new Error("Failed to load Razorpay SDK");
  }

  return new Promise((resolve, reject) => {
    const razorpayOptions = {
      ...options,
      handler: (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        options.handler(response);
        resolve();
      },
      modal: {
        ...options.modal,
        ondismiss: () => {
          if (options.modal?.ondismiss) {
            options.modal.ondismiss();
          }
          reject(new Error("Payment cancelled by user"));
        },
      },
    };

    const razorpay = new window.Razorpay(razorpayOptions);
    razorpay.open();
  });
};

/**
 * Helper function to initiate payment with predefined settings
 */
export const openRazorpayCheckout = async (
  orderId: string,
  amount: number,
  onSuccess: (paymentData: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void,
  onCancel?: () => void,
  userDetails?: { name?: string; email?: string; phone?: string }
): Promise<void> => {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

  if (!keyId) {
    throw new Error("Razorpay key not configured");
  }

  await initiatePayment({
    key: keyId,
    amount: amount,
    currency: "INR",
    name: "LocalVan",
    description: "Vehicle Booking Payment",
    order_id: orderId,
    handler: onSuccess,
    prefill: {
      name: userDetails?.name,
      email: userDetails?.email,
      contact: userDetails?.phone,
    },
    theme: {
      color: "#8B5CF6", // Purple theme
    },
    modal: {
      ondismiss: onCancel,
    },
  });
};
