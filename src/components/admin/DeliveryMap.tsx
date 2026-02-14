import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin } from 'lucide-react';
import { FaixaEntrega, ConfiguracaoRestaurante } from '@/hooks/useDeliveryConfig';

interface DeliveryMapProps {
  config: ConfiguracaoRestaurante | undefined;
  faixas: FaixaEntrega[] | undefined;
}

// Colors for different tiers (from closest to farthest)
const TIER_COLORS = [
  { fill: 'rgba(34, 197, 94, 0.3)', stroke: '#22c55e' },   // Green - 0-1km
  { fill: 'rgba(132, 204, 22, 0.25)', stroke: '#84cc16' }, // Lime - 1-2km
  { fill: 'rgba(234, 179, 8, 0.2)', stroke: '#eab308' },   // Yellow - 2-3km
  { fill: 'rgba(249, 115, 22, 0.15)', stroke: '#f97316' }, // Orange - 3-5km
  { fill: 'rgba(239, 68, 68, 0.1)', stroke: '#ef4444' },   // Red - 5km+
];

declare global {
  interface Window {
    google: any;
    initDeliveryMap: () => void;
  }
}

export const DeliveryMap = ({ config, faixas }: DeliveryMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const circlesRef = useRef<any[]>([]);

  // Load Google Maps script
  useEffect(() => {
    if (window.google?.maps) {
      initMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAIGrAwT7IVVksCaB9tr7m_rjXbUYQ17Uw&callback=initDeliveryMap`;
    script.async = true;
    script.defer = true;

    window.initDeliveryMap = () => {
      initMap();
    };

    document.head.appendChild(script);

    return () => {
      window.initDeliveryMap = () => {};
    };
  }, []);

  const initMap = () => {
    if (!mapRef.current || !config?.latitude || !config?.longitude) {
      setIsLoading(false);
      return;
    }

    const restaurantLocation = {
      lat: config.latitude,
      lng: config.longitude,
    };

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: restaurantLocation,
      zoom: 12,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
    });

    // Add restaurant marker
    new window.google.maps.Marker({
      position: restaurantLocation,
      map: mapInstance,
      title: 'UP Esfihas Artesanais',
      icon: {
        url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
        scaledSize: new window.google.maps.Size(40, 40),
      },
    });

    setMap(mapInstance);
    setIsLoading(false);
  };

  // Draw circles when map or faixas change
  useEffect(() => {
    if (!map || !config?.latitude || !config?.longitude || !faixas) return;

    // Clear existing circles
    circlesRef.current.forEach((circle) => circle.setMap(null));
    circlesRef.current = [];

    const restaurantLocation = {
      lat: config.latitude,
      lng: config.longitude,
    };

    // Sort faixas by max distance (draw largest first so smaller ones appear on top)
    const sortedFaixas = [...faixas]
      .filter((f) => f.ativo)
      .sort((a, b) => b.distancia_max_km - a.distancia_max_km);

    sortedFaixas.forEach((faixa, index) => {
      const colorIndex = Math.min(sortedFaixas.length - 1 - index, TIER_COLORS.length - 1);
      const colors = TIER_COLORS[colorIndex];

      const circle = new window.google.maps.Circle({
        strokeColor: colors.stroke,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: colors.fill,
        fillOpacity: 1,
        map,
        center: restaurantLocation,
        radius: faixa.distancia_max_km * 1000, // Convert km to meters
      });

      circlesRef.current.push(circle);
    });

    // Fit bounds to show all circles
    if (sortedFaixas.length > 0) {
      const maxDistance = Math.max(...sortedFaixas.map((f) => f.distancia_max_km));
      const bounds = new window.google.maps.LatLngBounds();
      
      // Calculate bounds based on max distance
      const earthRadius = 6371; // km
      const latOffset = (maxDistance / earthRadius) * (180 / Math.PI);
      const lngOffset = latOffset / Math.cos(config.latitude * (Math.PI / 180));

      bounds.extend({ lat: config.latitude + latOffset, lng: config.longitude + lngOffset });
      bounds.extend({ lat: config.latitude - latOffset, lng: config.longitude - lngOffset });
      
      map.fitBounds(bounds);
    }
  }, [map, faixas, config]);

  const activeFaixas = faixas?.filter((f) => f.ativo) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Mapa de Área de Entrega
        </CardTitle>
        <CardDescription>
          Visualização das faixas de entrega configuradas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!config?.latitude || !config?.longitude ? (
          <div className="h-[400px] flex items-center justify-center bg-muted rounded-lg">
            <p className="text-muted-foreground">Configure as coordenadas do restaurante para visualizar o mapa</p>
          </div>
        ) : isLoading ? (
          <div className="h-[400px] flex items-center justify-center bg-muted rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div ref={mapRef} className="h-[400px] w-full rounded-lg" />
            
            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-2">
              {activeFaixas
                .sort((a, b) => a.distancia_min_km - b.distancia_min_km)
                .map((faixa, index) => {
                  const colorIndex = Math.min(index, TIER_COLORS.length - 1);
                  return (
                    <Badge
                      key={faixa.id}
                      variant="outline"
                      className="flex items-center gap-2"
                      style={{ borderColor: TIER_COLORS[colorIndex].stroke }}
                    >
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: TIER_COLORS[colorIndex].stroke }}
                      />
                      {faixa.distancia_min_km}-{faixa.distancia_max_km} km: R$ {Number(faixa.taxa_entrega).toFixed(2)}
                    </Badge>
                  );
                })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
