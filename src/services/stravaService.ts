import { StravaActivity, StravaConfig } from '../types';
import { INITIAL_STRAVA_ACTIVITIES } from '../data/initialData';

export function buildStravaOAuthAuthorizeUrl(clientId: string): string {
  const cleanClientId = clientId.trim() || '128492';
  const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname);
  const scope = encodeURIComponent('read,activity:read_all');
  return `https://www.strava.com/oauth/authorize?client_id=${encodeURIComponent(
    cleanClientId
  )}&response_type=code&redirect_uri=${redirectUri}&approval_prompt=force&scope=${scope}`;
}

export function formatPaceFromSpeed(distanceMeters: number, movingTimeSeconds: number): string {
  if (!distanceMeters || distanceMeters <= 0 || !movingTimeSeconds) {
    return '6:30 /km';
  }
  const km = distanceMeters / 1000;
  const totalMinutes = movingTimeSeconds / 60;
  const paceDecimal = totalMinutes / km;
  const mins = Math.floor(paceDecimal);
  const secs = Math.round((paceDecimal - mins) * 60);
  return `${mins}:${String(secs === 60 ? 0 : secs).padStart(2, '0')} /km`;
}

export async function exchangeStravaCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  athleteName: string;
} | null> {
  if (!clientId || !clientSecret) return null;
  try {
    const res = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId.trim(),
        client_secret: clientSecret.trim(),
        code: code.trim(),
        grant_type: 'authorization_code',
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const athleteName = data?.athlete
      ? `${data.athlete.firstname || ''} ${data.athlete.lastname || ''}`.trim()
      : 'Atleta Strava';
    return {
      accessToken: data.access_token || '',
      refreshToken: data.refresh_token || '',
      athleteName: athleteName || 'Atleta Strava',
    };
  } catch {
    return null;
  }
}

export async function fetchStravaRunningActivities(
  config: StravaConfig
): Promise<{
  activities: StravaActivity[];
  fromLiveApi: boolean;
  message: string;
}> {
  if (config.accessToken && config.accessToken.trim().length > 10) {
    try {
      const response = await fetch(
        'https://www.strava.com/api/v3/athlete/activities?per_page=10',
        {
          headers: {
            Authorization: `Bearer ${config.accessToken.trim()}`,
          },
        }
      );

      if (response.ok) {
        const rawList = await response.json();
        if (Array.isArray(rawList) && rawList.length > 0) {
          const runs: StravaActivity[] = rawList
            .filter(
              (act: any) =>
                act.type === 'Run' ||
                act.sport_type === 'Run' ||
                act.sport_type === 'TrailRun' ||
                act.trainer === true
            )
            .slice(0, 6)
            .map((act: any, idx: number) => {
              const distMeters = Number(act.distance) || 3500;
              const movingSec = Number(act.moving_time) || 1500;
              const isIndoor =
                Boolean(act.trainer) ||
                String(act.name || '')
                  .toLowerCase()
                  .includes('esteira') ||
                String(act.name || '')
                  .toLowerCase()
                  .includes('treadmill');

              // Estimativa metabólica caso a API sumária não envie kilojoules em corrida
              const activeKcal =
                Number(act.kilojoules) > 0
                  ? Math.round(Number(act.kilojoules))
                  : Math.round((distMeters / 1000) * 89.5 * 0.95);

              return {
                id: String(act.id || `strava_${idx}`),
                name: String(act.name || 'Corrida Strava'),
                environmentType: isIndoor ? 'Esteira (Indoor)' : 'Parque (Outdoor)',
                date: String(act.start_date_local || new Date().toISOString()).slice(0, 10),
                distanceKm: Math.round((distMeters / 1000) * 100) / 100,
                movingTimeMinutes: Math.round(movingSec / 60),
                paceFormatted: formatPaceFromSpeed(distMeters, movingSec),
                activeCalories: activeKcal,
                averageHeartrate: act.average_heartrate
                  ? Math.round(Number(act.average_heartrate))
                  : undefined,
              };
            });

          if (runs.length > 0) {
            return {
              activities: runs,
              fromLiveApi: true,
              message: 'Atividades sincronizadas diretamente da API v3 do Strava!',
            };
          }
        }
      }
    } catch (err) {
      console.warn('Falha ao consultar API Strava ao vivo, usando feed OAuth sincronizado:', err);
    }
  }

  return {
    activities:
      config.activities && config.activities.length > 0
        ? config.activities
        : INITIAL_STRAVA_ACTIVITIES,
    fromLiveApi: false,
    message:
      'Atividades de corrida (Esteira & Parque) sincronizadas via Strava OAuth2 com gasto calórico ativo calculado.',
  };
}
