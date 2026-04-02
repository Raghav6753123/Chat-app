/* eslint-disable @next/next/no-img-element */
export default function AppImage({ src, alt, className, width, height, ...props }) {
  return (
    <img
      src={src}
      alt={alt ?? ''}
      className={className}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
}
