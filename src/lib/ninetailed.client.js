/**
 * Apply Demo Store — Ninetailed / Contentful Personalization client
 *
 * Singleton that wraps the Ninetailed React SDK instance so we can
 * call ninetailed.identify() / ninetailed.track() from anywhere,
 * mirroring what Segment sends so audiences match in real-time.
 */

let _instance = null;

/** Called by NinetailedBridge once the SDK is ready */
export function setNinetailedInstance(instance) {
  _instance = instance;
}

/** Forward Segment identify() to Ninetailed */
export function ntIdentify(userId, traits = {}) {
  if (!_instance) return;
  try {
    _instance.identify(userId || '', traits);
  } catch (e) {
    console.warn('[Ninetailed] identify failed:', e.message);
  }
}

/** Forward Segment track() to Ninetailed */
export function ntTrack(event, properties = {}) {
  if (!_instance) return;
  try {
    _instance.track({ event, properties });
  } catch (e) {
    console.warn('[Ninetailed] track failed:', e.message);
  }
}

/** Forward Segment page() to Ninetailed */
export function ntPage(name, properties = {}) {
  if (!_instance) return;
  try {
    _instance.page({ name, properties });
  } catch (e) {
    console.warn('[Ninetailed] page failed:', e.message);
  }
}
