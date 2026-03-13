import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Error codes for specific error handling
const ERROR_CODES = {
  ENDERECO_INVALIDO: "ENDERECO_INVALIDO",
  FORA_AREA_ENTREGA: "FORA_AREA_ENTREGA",
  FAIXA_NAO_ENCONTRADA: "FAIXA_NAO_ENCONTRADA",
  GOOGLE_API_ERROR: "GOOGLE_API_ERROR",
  CONFIG_ERROR: "CONFIG_ERROR",
};

const ERROR_MESSAGES: Record<string, string> = {
  ENDERECO_INVALIDO: "Não foi possível encontrar o endereço informado. Verifique e tente novamente.",
  FORA_AREA_ENTREGA: "Desculpe, este endereço está fora da nossa área de entrega.",
  FAIXA_NAO_ENCONTRADA: "Não conseguimos calcular a taxa para esta distância.",
  GOOGLE_API_ERROR: "Erro ao consultar serviço de mapas. Tente novamente.",
  CONFIG_ERROR: "Erro de configuração do sistema.",
};

interface DeliveryFeeResult {
  success: boolean;
  distanceKm?: number;
  durationSeconds?: number;
  estimatedMinutes?: number;
  deliveryFee?: number;
  withinZone?: boolean;
  error?: string;
  errorCode?: string;
}

interface FaixaEntrega {
  distancia_min_km: number;
  distancia_max_km: number;
  taxa_entrega: number;
  tempo_estimado_min: number;
  ativo: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return errorResponse("UNAUTHORIZED", "Unauthorized");
    }
    const authClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return errorResponse("UNAUTHORIZED", "Unauthorized");
    }

    const { address, lat, lng } = await req.json();

    const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!GOOGLE_MAPS_API_KEY) {
      console.error("Google Maps API key not configured");
      return errorResponse(ERROR_CODES.CONFIG_ERROR, "Chave da API Google Maps não configurada");
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
      console.error("Restaurant configuration error:", configError);
      return errorResponse(ERROR_CODES.CONFIG_ERROR, "Configuração do restaurante não encontrada");
    }

    const restaurantLat = restaurantConfig.latitude;
    const restaurantLng = restaurantConfig.longitude;

    if (!restaurantLat || !restaurantLng) {
      console.error("Restaurant coordinates not configured");
      return errorResponse(ERROR_CODES.CONFIG_ERROR, "Coordenadas do restaurante não configuradas");
    }

    // Get delivery zones
    const { data: zones } = await supabase
      .from("zonas_entrega")
      .select("*")
      .eq("ativo", true);

    // Get delivery fee tiers - IMPORTANT: filter active and sort by min distance
    const { data: faixas, error: faixasError } = await supabase
      .from("faixas_entrega")
      .select("*")
      .eq("ativo", true)
      .order("distancia_min_km", { ascending: true });

    if (faixasError || !faixas || faixas.length === 0) {
      console.error("Delivery tiers error:", faixasError);
      return errorResponse(ERROR_CODES.CONFIG_ERROR, "Faixas de entrega não configuradas");
    }

    let destinationLat = lat;
    let destinationLng = lng;
    let addressToCache = address || `${lat},${lng}`;

    // Validate provided coordinates
    if (lat && lng) {
      if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
        return errorResponse(ERROR_CODES.ENDERECO_INVALIDO, "Coordenadas inválidas fornecidas");
      }
    }

    // If coordinates not provided, geocode the address
    if (!destinationLat || !destinationLng) {
      if (!address || typeof address !== 'string' || address.trim().length < 5) {
        return errorResponse(ERROR_CODES.ENDERECO_INVALIDO, "Endereço inválido ou muito curto");
      }

      // Normalize address for better geocoding results
      const normalizedAddress = address.trim();
      
      // Check cache first
      const { data: cachedResult } = await supabase
        .from("cache_distancias")
        .select("*")
        .eq("endereco_destino", normalizedAddress)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (cachedResult) {
        console.log("Using cached result for:", normalizedAddress, "Distance:", cachedResult.distancia_km);
        
        // Find matching tier from cache using correct comparison
        const tier = findMatchingTier(faixas as FaixaEntrega[], cachedResult.distancia_km);

        if (!tier) {
          const maxDistance = getMaxDistance(faixas as FaixaEntrega[]);
          return errorResponse(
            ERROR_CODES.FORA_AREA_ENTREGA,
            `Desculpe, este endereço está fora da nossa área de entrega (${cachedResult.distancia_km.toFixed(1)} km). Entregamos até ${maxDistance} km.`,
            { distanceKm: cachedResult.distancia_km }
          );
        }

        return successResponse({
          distanceKm: cachedResult.distancia_km,
          durationSeconds: cachedResult.duracao_segundos,
          estimatedMinutes: tier.tempo_estimado_min,
          deliveryFee: Number(tier.taxa_entrega),
          withinZone: true,
        });
      }

      // Geocode the address with improved query
      // Add more context for Brazilian addresses
      const searchAddress = `${normalizedAddress}, Brasil`;
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        searchAddress
      )}&key=${GOOGLE_MAPS_API_KEY}&region=br&language=pt-BR&components=country:BR`;

      console.log("Geocoding address:", searchAddress);

      const geocodeResponse = await fetch(geocodeUrl);
      const geocodeData = await geocodeResponse.json();

      console.log("Geocode response status:", geocodeData.status);

      if (geocodeData.status === "ZERO_RESULTS") {
        return errorResponse(ERROR_CODES.ENDERECO_INVALIDO, ERROR_MESSAGES.ENDERECO_INVALIDO);
      }

      if (geocodeData.status !== "OK" || !geocodeData.results?.length) {
        console.error("Geocoding error:", geocodeData.status, geocodeData.error_message);
        if (geocodeData.status === "REQUEST_DENIED") {
          return errorResponse(ERROR_CODES.GOOGLE_API_ERROR, "Erro de autenticação com serviço de mapas");
        }
        if (geocodeData.status === "OVER_QUERY_LIMIT") {
          return errorResponse(ERROR_CODES.GOOGLE_API_ERROR, "Limite de consultas atingido. Tente novamente em alguns minutos.");
        }
        return errorResponse(ERROR_CODES.GOOGLE_API_ERROR, ERROR_MESSAGES.GOOGLE_API_ERROR);
      }

      const location = geocodeData.results[0].geometry.location;
      destinationLat = location.lat;
      destinationLng = location.lng;
      addressToCache = geocodeData.results[0].formatted_address;
      
      console.log("Geocoded location:", destinationLat, destinationLng, addressToCache);
    }

    // Validate geocoded coordinates
    if (!destinationLat || !destinationLng || isNaN(destinationLat) || isNaN(destinationLng)) {
      return errorResponse(ERROR_CODES.ENDERECO_INVALIDO, "Não foi possível determinar a localização do endereço");
    }

    // Check if point is within delivery zone (if zones are configured)
    if (zones && zones.length > 0) {
      let withinAnyZone = false;
      
      for (const zone of zones) {
        if (zone.poligono && Array.isArray(zone.poligono) && zone.poligono.length > 2) {
          withinAnyZone = isPointInPolygon(
            destinationLat,
            destinationLng,
            zone.poligono as Array<{ lat: number; lng: number }>
          );
          if (withinAnyZone) break;
        }
      }

      // Only enforce zone check if zones are actually configured with valid polygons
      const hasConfiguredZones = zones.some(
        (z) => z.poligono && Array.isArray(z.poligono) && (z.poligono as Array<{ lat: number; lng: number }>).length > 2
      );

      if (hasConfiguredZones && !withinAnyZone) {
        return errorResponse(ERROR_CODES.FORA_AREA_ENTREGA, ERROR_MESSAGES.FORA_AREA_ENTREGA, { withinZone: false });
      }
    }

    // Calculate distance using Distance Matrix API
    const distanceUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${restaurantLat},${restaurantLng}&destinations=${destinationLat},${destinationLng}&mode=driving&key=${GOOGLE_MAPS_API_KEY}&region=br&language=pt-BR`;

    console.log("Calculating distance from restaurant to:", destinationLat, destinationLng);

    const distanceResponse = await fetch(distanceUrl);
    const distanceData = await distanceResponse.json();

    console.log("Distance Matrix response status:", distanceData.status);

    if (distanceData.status !== "OK") {
      console.error("Distance Matrix API error:", distanceData.status, distanceData.error_message);
      return errorResponse(ERROR_CODES.GOOGLE_API_ERROR, ERROR_MESSAGES.GOOGLE_API_ERROR);
    }

    const element = distanceData.rows?.[0]?.elements?.[0];
    
    if (!element || element.status !== "OK") {
      console.error("Distance element error:", element?.status);
      if (element?.status === "ZERO_RESULTS") {
        return errorResponse(ERROR_CODES.FORA_AREA_ENTREGA, "Não foi possível calcular uma rota até este endereço.");
      }
      return errorResponse(ERROR_CODES.GOOGLE_API_ERROR, "Não foi possível calcular a distância.");
    }

    // CRITICAL: Convert meters to kilometers
    const distanceMeters = element.distance.value;
    const distanceKm = distanceMeters / 1000; // Convert meters to km
    const durationSeconds = element.duration.value;

    console.log("Distance calculated:", distanceMeters, "meters =", distanceKm.toFixed(2), "km");

    // Find matching tier using correct comparison: >= min AND < max
    const tier = findMatchingTier(faixas as FaixaEntrega[], distanceKm);

    if (!tier) {
      const maxDistance = getMaxDistance(faixas as FaixaEntrega[]);
      console.log("No tier found for distance:", distanceKm, "km. Max configured:", maxDistance, "km");
      
      return errorResponse(
        ERROR_CODES.FORA_AREA_ENTREGA,
        `Desculpe, este endereço está fora da nossa área de entrega (${distanceKm.toFixed(1)} km). Entregamos até ${maxDistance} km.`,
        { distanceKm, withinZone: false }
      );
    }

    console.log("Matched tier:", tier.distancia_min_km, "-", tier.distancia_max_km, "km, fee:", tier.taxa_entrega);

    // Cache the result
    try {
      await supabase.from("cache_distancias").upsert(
        {
          endereco_destino: addressToCache,
          latitude: destinationLat,
          longitude: destinationLng,
          distancia_km: Math.round(distanceKm * 100) / 100, // Round to 2 decimal places
          duracao_segundos: durationSeconds,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        { onConflict: "endereco_destino" }
      );
    } catch (cacheError) {
      console.error("Cache error (non-fatal):", cacheError);
    }

    return successResponse({
      distanceKm: Math.round(distanceKm * 100) / 100,
      durationSeconds,
      estimatedMinutes: tier.tempo_estimado_min,
      deliveryFee: Number(tier.taxa_entrega),
      withinZone: true,
    });

  } catch (error: unknown) {
    console.error("Unexpected error calculating delivery:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro inesperado ao calcular taxa de entrega";
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        errorCode: "UNEXPECTED_ERROR",
      } as DeliveryFeeResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

/**
 * Find matching tier using correct comparison: distanceKm >= min AND distanceKm < max
 * This ensures no gaps between tiers
 */
function findMatchingTier(faixas: FaixaEntrega[], distanceKm: number): FaixaEntrega | undefined {
  // Filter active tiers and sort by min distance
  const activeTiers = faixas
    .filter((f) => f.ativo)
    .sort((a, b) => a.distancia_min_km - b.distancia_min_km);

  // Find matching tier: >= min AND < max (no gaps, no overlaps)
  return activeTiers.find(
    (f) => distanceKm >= f.distancia_min_km && distanceKm < f.distancia_max_km
  );
}

/**
 * Get maximum delivery distance from all active tiers
 */
function getMaxDistance(faixas: FaixaEntrega[]): number {
  const activeTiers = faixas.filter((f) => f.ativo);
  if (activeTiers.length === 0) return 0;
  return Math.max(...activeTiers.map((f) => f.distancia_max_km));
}

/**
 * Create error response with proper structure
 */
function errorResponse(
  errorCode: string,
  message: string,
  extra: Partial<DeliveryFeeResult> = {}
): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
      errorCode,
      ...extra,
    } as DeliveryFeeResult),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

/**
 * Create success response
 */
function successResponse(data: Omit<DeliveryFeeResult, "success">): Response {
  return new Response(
    JSON.stringify({
      success: true,
      ...data,
    } as DeliveryFeeResult),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

/**
 * Ray-casting algorithm to check if point is inside polygon
 */
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
