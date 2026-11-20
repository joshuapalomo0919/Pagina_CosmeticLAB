import { useState } from 'react';

interface ImagenProductoProps {
  src: string;
  alt: string;
}

const ImagenProducto = ({ src, alt }: ImagenProductoProps) => {
  const [fallida, setFallida] = useState(false);
  if (!src || fallida) {
    return <div className="product-image-placeholder" role="img" aria-label={alt}>CosmeticLAB</div>;
  }
  return <img src={src} alt={alt} onError={() => setFallida(true)} />;
};

export default ImagenProducto;
