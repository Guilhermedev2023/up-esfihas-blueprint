import { supabase } from '@/integrations/supabase/client';

/**
 * Meta Pixel + Conversions API (CAPI) helpers.
 *
 * Every tracked event is sent twice with the SAME event_id:
 *  1. In the browser via fbq (Pixel)
 *  2. From the server via the `meta-capi` edge function (Conversions API)
 * Meta deduplicates both copies using event_name + event_id.
 *
 * The Pixel base code (init + first PageView) lives in index.html. SPA route changes are
 * tracked as PageView by the Pixel itself (history API), so there is no manual PageView here.
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export const CURRENCY = 'BRL';

export interface TrackableItem {
  id: string;
  nome: string;
  preco: number;
  categoria?: string | null;
  quantidade?: number;
}

export interface MetaContent {
  id: string;
  quantity: number;
  item_price: number;
  title?: string;
  category?: string;
  delivery_category?: 'home_delivery';
}

export interface MetaTrackingContext {
  fbp: string | null;
  fbc: string | null;
  event_source_url: string;
  user_agent: string;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export const newEventId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
};

const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[.$?*|{}()[\]\\/+^]/g, '\\$&')}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

const FBC_STORAGE_KEY = 'meta_fbc';

/** Saves fbclid from the landing URL so it survives the SPA redirects. */
export const captureFbclid = () => {
  try {
    const fbclid = new URLSearchParams(window.location.search).get('fbclid');
    if (fbclid) localStorage.setItem(FBC_STORAGE_KEY, `fb.1.${Date.now()}.${fbclid}`);
  } catch {
    /* storage unavailable */
  }
};

export const getFbc = (): string | null => {
  const cookie = getCookie('_fbc');
  if (cookie) return cookie;
  try {
    return localStorage.getItem(FBC_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const getTrackingContext = (): MetaTrackingContext => ({
  fbp: getCookie('_fbp'),
  fbc: getFbc(),
  event_source_url: typeof window !== 'undefined' ? window.location.href : '',
  user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
});

export const toContents = (items: TrackableItem[]): MetaContent[] =>
  items.map((item) => ({
    id: item.id,
    quantity: item.quantidade ?? 1,
    item_price: round2(Number(item.preco)),
    title: item.nome?.trim(),
    category: item.categoria ?? undefined,
    delivery_category: 'home_delivery',
  }));

/** Standard custom_data for any product-based event. */
export const buildProductParams = (items: TrackableItem[], value?: number) => {
  const contents = toContents(items);
  const computedValue = contents.reduce((sum, c) => sum + c.item_price * c.quantity, 0);
  return {
    currency: CURRENCY,
    value: round2(value ?? computedValue),
    content_type: 'product',
    content_ids: contents.map((c) => c.id),
    content_name: contents.map((c) => c.title).filter(Boolean).join(' + '),
    content_category: Array.from(new Set(contents.map((c) => c.category).filter(Boolean))).join(', ') || undefined,
    contents,
    num_items: contents.reduce((sum, c) => sum + c.quantity, 0),
  };
};

const sendToServer = (eventName: string, eventId: string, customData: Record<string, unknown>) => {
  // Fire-and-forget: tracking must never block or break the checkout.
  supabase.functions
    .invoke('meta-capi', {
      body: {
        action: 'event',
        event_name: eventName,
        event_id: eventId,
        custom_data: customData,
        ...getTrackingContext(),
      },
    })
    .catch(() => undefined);
};

/** Browser + server event with automatic deduplication. Returns the event_id used. */
export const trackMetaEvent = (
  eventName: 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'AddPaymentInfo',
  customData: Record<string, unknown>,
): string => {
  const eventId = newEventId();
  try {
    window.fbq?.('track', eventName, customData, { eventID: eventId });
  } catch {
    /* pixel blocked */
  }
  sendToServer(eventName, eventId, customData);
  return eventId;
};

/**
 * Purchase: browser event uses the order id as event_id.
 * The server copy is built from the order stored in the database (trusted values),
 * sent by `meta-capi` (pay on delivery) or by `stripe-webhook` (card online).
 */
export const trackPurchaseBrowser = (
  pedido: { id: string; numero: number; total: number },
  items: TrackableItem[],
) => {
  const params = { ...buildProductParams(items, pedido.total), order_id: String(pedido.numero) };
  try {
    window.fbq?.('track', 'Purchase', params, { eventID: pedido.id });
  } catch {
    /* pixel blocked */
  }
};

/** Asks the server to send the Purchase for an order that is already confirmed (pay on delivery). */
export const sendPurchaseToServer = (pedidoId: string) => {
  supabase.functions
    .invoke('meta-capi', {
      body: { action: 'purchase', pedido_id: pedidoId, ...getTrackingContext() },
    })
    .catch(() => undefined);
};
