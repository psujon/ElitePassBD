import { api } from './api';

// Dynamically initialize the Meta Pixel in browser
export const initPixel = () => {
  const pixelId = import.meta.env.VITE_FB_PIXEL_ID;
  if (!pixelId) {
    console.warn("Meta Pixel ID is missing from environment (VITE_FB_PIXEL_ID). Browser tracking disabled.");
    return;
  }

  if (window.fbq) return; // already initialized

  // Standard Meta Pixel snippet
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

  window.fbq("init", pixelId);
  window.fbq("track", "PageView");
};

/**
 * Fires duplicate Meta tracking events (Browser + Server-side Conversions API)
 * with matching event_ids for automatic deduplication.
 */
export const trackEvent = async (eventName, customData = {}, userData = {}, overrideEventId = null, skipServer = false) => {
  const pixelId = import.meta.env.VITE_FB_PIXEL_ID;
  if (!pixelId) return;

  // Generate a unique event ID for Meta deduplication
  const eventId = overrideEventId || `${eventName.toLowerCase()}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

  // 1. Client-Side Browser Tracking
  if (window.fbq) {
    try {
      window.fbq("track", eventName, customData, { eventID: eventId });
      console.log(`[Meta Pixel] Fired Browser Event: "${eventName}"`, customData, `Event ID: ${eventId}`);
    } catch (err) {
      console.error(`[Meta Pixel] Browser event firing failed:`, err);
    }
  }

  // 2. Server-Side Conversions API (CAPI) Tracking
  if (!skipServer) {
    try {
      const payload = {
        eventName,
        eventId,
        userData: {
          ...userData,
          event_source_url: window.location.href
        },
        customData
      };

      // Call the server track endpoint
      await api.post('/pixel/track', payload);
    } catch (err) {
      console.error(`[Meta Pixel] Server CAPI tracking failed:`, err);
    }
  }
};
