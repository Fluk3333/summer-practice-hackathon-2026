interface MapEmbedProps {
  venueName: string;
}

export function MapEmbed({ venueName }: MapEmbedProps) {
  // Clean the coordinate query (strip out any helper parentheses)
  const cleanVenue = venueName.replace(/\(Auto-Generated.*\)/g, '').trim();
  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(cleanVenue)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="w-full h-[180px] rounded-lg overflow-hidden border border-gray-700/60 shadow-inner mt-3">
      <iframe
        title="Venue Location Map"
        width="100%"
        height="100%"
        style={{ 
          border: 0, 
          // 💡 High-end Hackathon trick: Apply dark-mode inverter styles to a standard Google Map iframe!
          filter: 'invert(90%) hue-rotate(180deg) contrast(120%)' 
        }} 
        loading="lazy"
        src={mapUrl}
      />
    </div>
  );
}