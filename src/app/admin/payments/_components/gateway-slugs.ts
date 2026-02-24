// Plain data (no JSX) — safe to import in server components / generateStaticParams
export const GATEWAY_SLUGS: { slug: string; name: string }[] = [
    { slug: "stripe",      name: "Stripe" },
    { slug: "paypal",      name: "PayPal" },
    { slug: "razorpay",    name: "Razorpay" },
    { slug: "paystack",    name: "Paystack" },
    { slug: "mollie",      name: "Mollie" },
    { slug: "flutterwave", name: "Flutterwave" },
];
