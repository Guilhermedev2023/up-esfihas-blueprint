import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin } from 'lucide-react';
import { ConfiguracaoRestaurante, FaixaEntrega } from '@/hooks/useDeliveryConfig';
import { useBairros } from '@/hooks/useBairros';

interface DeliveryMapProps {
  config: ConfiguracaoRestaurante | undefined;
  faixas?: FaixaEntrega[] | undefined;
}

declare global {
  interface Window {
    google: any;
    initDeliveryMap: () => void;
  }
}

// Simple in-memory cache for geocoded bairros across renders
const geocodeCache = new Map<string, { lat: number; lng: number }>();

export const DeliveryMap = ({ config }: DeliveryMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const markersRef = useRef<any[]>([]);
  const { data: bairros } = useBairros(false);

  // Load Google Maps script once
  useEffect(() => {
    if (window.google?.maps) {
      setScriptLoaded(true);
      return;
    }

    const existing = document.querySelector('script[data-google-maps]');
    if (existing) {
      const check = setInterval(() => {
        if (window.google?.maps) {
          setScriptLoaded(true);
          clearInterval(check);
        }
      }, 200);
      return () => clearInterval(check);
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAIGrAwT7IVVksCaB9tr7m_rjXbUYQ17Uw&callback=initDeliveryMap`;
    script.async = true;
    script.defer = true;
    script.setAttribute('data-google-maps', 'true');

    window.initDeliveryMap = () => setScriptLoaded(true);
    document.head.appendChild(script);

    return () => {
      window.initDeliveryMap = () => {};
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!scriptLoaded || !window.google?.maps) return;
    if (!mapRef.current || !config?.latitude || !config?.longitude) return;
    if (map) return;

    const restaurantLocation = { lat: config.latitude, lng: config.longitude };

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: restaurantLocation,
      zoom: 12,
      styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }],
    });

    new window.google.maps.Marker({
      position: restaurantLocation,
      map: mapInstance,
      title: 'UP Esfihas Artesanais',
      icon: {
        url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
        scaledSize: new window.google.maps.Size(40, 40),
      },
      zIndex: 999,
    });

    setMap(mapInstance);
    setIsLoading(false);
  }, [scriptLoaded, config, map]);

  // Place markers for each active bairro (geocoded)
  useEffect(() => {
    if (!map || !window.google?.maps || !bairros) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const ativos = bairros.filter((b) => b.ativo);
    const geocoder = new window.google.maps.Geocoder();
    const bounds = new window.google.maps.LatLngBounds();
    if (config?.latitude && config?.longitude) {
      bounds.extend({ lat: config.latitude, lng: config.longitude });
    }

    let pending = ativos.length;
    const fitIfDone = () => {
      pending -= 1;
      if (pending <= 0 && !bounds.isEmpty()) {
        map.fitBounds(bounds);
      }
    };

    ativos.forEach((bairro) => {
      const key = bairro.nome.trim().toLowerCase();
      const placeMarker = (pos: { lat: number; lng: number }) => {
        const marker = new window.google.maps.Marker({
          position: pos,
          map,
          title: bairro.nome,
          label: {
            text: bairro.nome,
            className: 'bairro-marker-label',
            color: '#1f2937',
            fontSize: '12px',
            fontWeight: '600',
          },
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
            scaledSize: new window.google.maps.Size(32, 32),
            labelOrigin: new window.google.maps.Point(16, 38),
          },
        });
        markersRef.current.push(marker);
        bounds.extend(pos);
        fitIfDone();
      };

      const cached = geocodeCache.get(key);
      if (cached) {
        placeMarker(cached);
        return;
      }

      geocoder.geocode(
        { address: `${bairro.nome}, Florianópolis, SC, Brasil` },
        (results: any, status: string) => {
          if (status === 'OK' && results?.[0]) {
            const loc = results[0].geometry.location;
            const pos = { lat: loc.lat(), lng: loc.lng() };
            geocodeCache.set(key, pos);
            placeMarker(pos);
          } else {
            fitIfDone();
          }
        }
      );
    });

    if (ativos.length === 0 && config?.latitude && config?.longitude) {
      map.setCenter({ lat: config.latitude, lng: config.longitude });
    }
  }, [map, bairros, config]);

  const ativos = bairros?.filter((b) => b.ativo) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Mapa de Bairros Atendidos
        </CardTitle>
        <CardDescription>
          Visualização dos bairros onde realizamos entregas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!config?.latitude || !config?.longitude ? (
          <div className="h-[400px] flex items-center justify-center bg-muted rounded-lg">
            <p className="text-muted-foreground">Configure as coordenadas do restaurante para visualizar o mapa</p>
          </div>
        ) : (
          <>
            <div className="relative">
              <div ref={mapRef} className="h-[400px] w-full rounded-lg" />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {ativos.map((b) => (
                <Badge key={b.id} variant="outline" className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  {b.nome}
                </Badge>
              ))}
              {ativos.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum bairro ativo cadastrado.</p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
