import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address } = await req.json();

    if (!address) {
      throw new Error("Address is required");
    }

    const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error("Google Maps API key not configured");
    }

    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${GOOGLE_MAPS_API_KEY}&region=br&language=pt-BR`;

    const response = await fetch(geocodeUrl);
    const data = await response.json();

    if (data.status !== "OK" || !data.results?.length) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Endereço não encontrado",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = data.results[0];
    const location = result.geometry.location;

    // Extract address components
    const components: Record<string, string> = {};
    for (const component of result.address_components) {
      for (const type of component.types) {
        components[type] = component.long_name;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        lat: location.lat,
        lng: location.lng,
        formattedAddress: result.formatted_address,
        components: {
          street: components.route || "",
          number: components.street_number || "",
          neighborhood: components.sublocality_level_1 || components.sublocality || components.neighborhood || "",
          city: components.administrative_area_level_2 || components.locality || "",
          state: components.administrative_area_level_1 || "",
          postalCode: components.postal_code || "",
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Geocode error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro ao geocodificar endereço";
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
