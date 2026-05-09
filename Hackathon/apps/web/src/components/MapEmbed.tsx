import styles from './MapEmbed.module.css';

interface MapEmbedProps {
  venueName: string;
}

export function MapEmbed({ venueName }: MapEmbedProps) {
  const cleanVenue = venueName.replace(/\(Auto-Generated.*\)/g, '').trim();
  
  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(cleanVenue)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className={styles.mapWrapper}>
      <iframe
        title="Venue Location Map"
        className={styles.mapIframe}
        loading="lazy"
        src={mapUrl}
      />
    </div>
  );
}