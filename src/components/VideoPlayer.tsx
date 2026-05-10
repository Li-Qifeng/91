type Props = {
  src: string;
  poster: string;
  title: string;
};

export function VideoPlayer({ src, poster, title }: Props) {
  return (
    <div className="video-player">
      <video
        src={src}
        poster={poster}
        controls
        preload="metadata"
        playsInline
        aria-label={title}
      />
    </div>
  );
}
