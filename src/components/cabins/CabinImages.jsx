import { useId, useState } from "react";
import useModalFocus from "../../hooks/useModalFocus";

function ImageDialog({ imageUrl, index, onClose }) {
  const titleId = useId();
  const dialogRef = useModalFocus(onClose);
  return (
    <div className="cabin-image-dialog-backdrop" onClick={onClose}>
      <div className="cabin-image-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} onClick={(event) => event.stopPropagation()}>
        <button className="button-base button cabin-image-dialog__close-button" type="button" onClick={onClose} aria-label="Lukk bildevisning">&times;</button>
        <span className="visually-hidden" id={titleId}>Bilde {index + 1} i stor visning</span>
        <img className="cabin-image-dialog__image" src={imageUrl} alt={`Bilde ${index + 1} i stor visning`} />
      </div>
    </div>
  );
}

export default function CabinImages({ imageUrls, className }) {
  const [selectedImage, setSelectedImage] = useState(null);

  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    return <p className={["cabin-images__empty", className].filter(Boolean).join(" ")}>Ingen bilder tilgjengelig</p>;
  }

  return (
    <>
      <div className={["cabin-images", className].filter(Boolean).join(" ")}>
        {imageUrls.map((url, idx) => (
          <button className="cabin-images__thumbnail-button" key={idx} type="button" aria-label={`Vis bilde ${idx + 1} i stor visning`} onClick={() => setSelectedImage(idx)}>
            <img className="cabin-images__thumbnail" src={url} alt={`Bilde ${idx + 1}`} />
          </button>
        ))}
      </div>

      {selectedImage !== null && <ImageDialog imageUrl={imageUrls[selectedImage]} index={selectedImage} onClose={() => setSelectedImage(null)} />}
    </>
  );
}