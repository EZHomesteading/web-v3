import "stripe";

declare module "stripe" {
  namespace Stripe {
    interface StripeConfig {
      /**
       * Override for default Stripe API version to use a custom one
       */
      apiVersion?: "2025-02-24.acacia" | "2025-04-30.basil" | string;
    }
  }
}
