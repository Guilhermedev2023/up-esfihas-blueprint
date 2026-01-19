import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
}

interface DistanceResult {
  distanceKm: number;
  durationSeconds: number;
}

interface DeliveryFeeResult {
  success: boolean;
  distanceKm?: number;
  durationSeconds?: number;
  estimatedMinutes?: number;
  deliveryFee?: number;
  withinZone?: boolean;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address, lat, lng } = await req.json();

    const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error("Google Maps API key not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get restaurant location
    const { data: restaurantConfig, error: configError } = await supabase
      .from("configuracao_restaurante")
      .select("*")
      .single();

    if (configError || !restaurantConfig) {
      throw new Error("Restaurant configuration not found");
    }

    const restaurantLat = restaurantConfig.latitude;
    const restaurantLng = restaurantConfig.longitude;

    if (!restaurantLat || !restaurantLng) {
      throw new Error("Restaurant coordinates not configured");
    }

    // Get delivery zones
    const { data: zones } = await supabase
      .from("zonas_entrega")
      .select("*")
      .eq("ativo", true);

    // Get delivery fee tiers
    const { data: faixas, error: faixasError } = await supabase
      .from("faixas_entrega")
      .select("*")
      .eq("ativo", true)
      .order("distancia_min_km", { ascending: true });

    if (faixasError) {
      throw new Error("Failed to fetch delivery tiers");
    }

    let destinationLat = lat;
    let destinationLng = lng;
    let addressToCache = address || `${lat},${lng}`;

    // If coordinates not provided, geocode the address
    if (!destinationLat || !destinationLng) {
      if (!address) {
        throw new Error("Address or coordinates required");
      }

      // Check cache first
      const { data: cachedResult } = await supabase
        .from("cache_distancias")
        .select("*")
        .eq("endereco_destino", address)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (cachedResult) {
        // Find matching tier from cache
        const tier = faixas?.find(
          (f) =>
            cachedResult.distancia_km >= f.distancia_min_km &&
            cachedResult.distancia_km < f.distancia_max_km
        );

        if (!tier) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Desculpe, este endereço está fora da nossa área de entrega.",
              distanceKm: cachedResult.distancia_km,
            } as DeliveryFeeResult),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            distanceKm: cachedResult.distancia_km,
            durationSeconds: cachedResult.duracao_segundos,
            estimatedMinutes: tier.tempo_estimado_min,
            deliveryFee: parseFloat(tier.taxa_entrega),
            withinZone: true,
          } as DeliveryFeeResult),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Geocode the address
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${GOOGLE_MAPS_API_KEY}&region=br&language=pt-BR`;

      const geocodeResponse = await fetch(geocodeUrl);
      const geocodeData = await geocodeResponse.json();

      if (geocodeData.status !== "OK" || !geocodeData.results?.length) {
        throw new Error("Não foi possível encontrar o endereço informado.");
      }

      const location = geocodeData.results[0].geometry.location;
      destinationLat = location.lat;
      destinationLng = location.lng;
      addressToCache = geocodeData.results[0].formatted_address;
    }

    // Check if point is within delivery zone (if zones are configured)
    if (zones && zones.length > 0) {
      let withinAnyZone = false;
      
      for (const zone of zones) {
        if (zone.poligono && Array.isArray(zone.poligono) && zone.poligono.length > 2) {
          withinAnyZone = isPointInPolygon(
            destinationLat,
            destinationLng,
            zone.poligono
          );
          if (withinAnyZone) break;
        }
      }

      // Only enforce zone check if zones are actually configured
      const hasConfiguredZones = zones.some(
        (z) => z.poligono && Array.isArray(z.poligono) && z.poligono.length > 2
      );

      if (hasConfiguredZones && !withinAnyZone) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Desculpe, este endereço está fora da nossa área de entrega.",
            withinZone: false,
          } as DeliveryFeeResult),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Calculate distance using Distance Matrix API
    const distanceUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${restaurantLat},${restaurantLng}&destinations=${destinationLat},${destinationLng}&mode=driving&key=${GOOGLE_MAPS_API_KEY}&region=br&language=pt-BR`;

    const distanceResponse = await fetch(distanceUrl);
    const distanceData = await distanceResponse.json();

    if (
      distanceData.status !== "OK" ||
      !distanceData.rows?.[0]?.elements?.[0] ||
      distanceData.rows[0].elements[0].status !== "OK"
    ) {
      throw new Error("Não foi possível calcular a distância.");
    }

    const element = distanceData.rows[0].elements[0];
    const distanceKm = element.distance.value / 1000; // Convert meters to km
    const durationSeconds = element.duration.value;

    // Find matching tier
    const tier = faixas?.find(
      (f) => distanceKm >= f.distancia_min_km && distanceKm < f.distancia_max_km
    );

    if (!tier) {
      // Check if distance exceeds all tiers
      const maxDistance = Math.max(...(faixas?.map((f) => f.distancia_max_km) || [0]));
      
      return new Response(
        JSON.stringify({
          success: false,
          error: `Desculpe, este endereço está fora da nossa área de entrega (${distanceKm.toFixed(1)} km). Entregamos até ${maxDistance} km.`,
          distanceKm,
          withinZone: false,
        } as DeliveryFeeResult),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cache the result
    await supabase.from("cache_distancias").upsert(
      {
        endereco_destino: addressToCache,
        latitude: destinationLat,
        longitude: destinationLng,
        distancia_km: distanceKm,
        duracao_segundos: durationSeconds,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      { onConflict: "endereco_destino" }
    );

    return new Response(
      JSON.stringify({
        success: true,
        distanceKm,
        durationSeconds,
        estimatedMinutes: tier.tempo_estimado_min,
        deliveryFee: parseFloat(tier.taxa_entrega),
        withinZone: true,
      } as DeliveryFeeResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error calculating delivery:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro ao calcular taxa de entrega";
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      } as DeliveryFeeResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

// Ray-casting algorithm to check if point is inside polygon
function isPointInPolygon(
  lat: number,
  lng: number,
  polygon: Array<{ lat: number; lng: number }>
): boolean {
  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].lat;
    const yi = polygon[i].lng;
    const xj = polygon[j].lat;
    const yj = polygon[j].lng;

    const intersect =
      yi > lng !== yj > lng && lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}
