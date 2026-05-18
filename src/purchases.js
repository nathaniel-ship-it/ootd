import { Capacitor } from "@capacitor/core";
import { Purchases, LOG_LEVEL } from "@revenuecat/purchases-capacitor";

// ─────────────────────────────────────────────────────────────────────────────
// TODO (before App Store submission):
//   1. Create a free account at dashboard.revenuecat.com
//   2. Add your iOS app and set REACT_APP_RC_API_KEY in .env.local
//   3. Create an "OOTD Pro Monthly" product in App Store Connect ($7.99/month)
//      with product ID: com.ootd.app.pro.monthly
//   4. Add that product to a RevenueCat Offering and create an entitlement
//      named exactly "pro"
// ─────────────────────────────────────────────────────────────────────────────
const RC_API_KEY_IOS = process.env.REACT_APP_RC_API_KEY || "";
const ENTITLEMENT_ID = "pro";

export const isNative = () => Capacitor.isNativePlatform();

export async function initPurchases(userId) {
  if (!isNative()) return;
  await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
  await Purchases.configure({ apiKey: RC_API_KEY_IOS, appUserID: userId });
}

export async function purchasePro() {
  if (!isNative()) {
    throw new Error("Subscriptions are only available in the iOS app. Download OOTD from the App Store to subscribe.");
  }
  const { current } = await Purchases.getOfferings();
  if (!current) throw new Error("No offerings available. Check RevenueCat dashboard.");
  const pkg = current.monthly ?? current.availablePackages[0];
  if (!pkg) throw new Error("No monthly package found in current offering.");
  const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
  return isEntitlementActive(customerInfo);
}

export async function checkProStatus() {
  if (!isNative()) return false;
  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return isEntitlementActive(customerInfo);
  } catch {
    return false;
  }
}

export async function restorePurchases() {
  if (!isNative()) return false;
  const { customerInfo } = await Purchases.restorePurchases();
  return isEntitlementActive(customerInfo);
}

export async function manageSubscription() {
  if (!isNative()) {
    // Web/testing fallback — caller should treat return true as "cancelled locally"
    return true;
  }
  // Opens Apple's subscription management sheet via RevenueCat
  await Purchases.showManageSubscriptions();
  return false; // native: access stays until period ends, checkProStatus handles revocation
}

function isEntitlementActive(customerInfo) {
  return ENTITLEMENT_ID in (customerInfo?.entitlements?.active ?? {});
}
