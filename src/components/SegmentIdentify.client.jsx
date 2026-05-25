import {useEffect} from 'react';
import {identifyUser, shopifyIdToUserId} from '../lib/segment.client';

/**
 * Fires Segment identify() when account data is available.
 * Mounted by the server-side Account page after fetching customer data.
 * This is the richest identity call — contains full Shopify profile.
 */
export default function SegmentIdentify({customer}) {
  useEffect(() => {
    if (!customer?.email) return;

    const userId = shopifyIdToUserId(customer.id);

    identifyUser(userId, {
      // Core identity
      email:      customer.email,
      first_name: customer.firstName || undefined,
      last_name:  customer.lastName  || undefined,
      name:       [customer.firstName, customer.lastName].filter(Boolean).join(' ') || undefined,
      phone:      customer.phone     || undefined,

      // Commerce traits
      orders_count:    customer.ordersCount || 0,
      total_spent:     customer.totalSpent  || 0,
      shopify_id:      userId,
      customer_since:  customer.createdAt   || undefined,

      // Meta
      source:    'apply-demo-store',
      plan:      'shopify-customer',
    });
  }, [customer?.id]);

  return null;
}
