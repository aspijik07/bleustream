import { StreamingServer } from '../types';

export const STREAMING_SERVERS: StreamingServer[] = [
  {
    id: 'vidsrc_pm_primary',
    name: 'Server 1: VidSrc Prime (Ultra HD • Fast CDN)',
    badge: 'SERVER 1',
    quality: '1080p / 4K UHD',
    speed: 'Instant CDN • 0% Buffering',
    isReliable: true,
    getUrl: (type, id, season = 1, episode = 1) => {
      return type === 'movie'
        ? `https://vidsrc.pm/embed/movie/${id}`
        : `https://vidsrc.pm/embed/tv/${id}/${season}/${episode}`;
    },
  },
  {
    id: 'vidsrc_pm_mirror2',
    name: 'Server 2: VidSrc Cloud (High Speed • Instant Play)',
    badge: 'SERVER 2',
    quality: '1080p Full HD',
    speed: 'High-Speed Cloud • Instant Play',
    isReliable: true,
    getUrl: (type, id, season = 1, episode = 1) => {
      return type === 'movie'
        ? `https://vidsrc.pm/embed/movie/${id}?ds_lang=en`
        : `https://vidsrc.pm/embed/tv/${id}/${season}/${episode}?ds_lang=en`;
    },
  },
  {
    id: 'vidsrc_to_vip',
    name: 'Server 3: VidSrc VIP (Global Node • Multi-Language)',
    badge: 'SERVER 3',
    quality: '1080p Full HD',
    speed: 'Direct Node • 0% Buffering',
    isReliable: true,
    getUrl: (type, id, season = 1, episode = 1) => {
      return type === 'movie'
        ? `https://vidsrc.to/embed/movie/${id}`
        : `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`;
    },
  },
];
