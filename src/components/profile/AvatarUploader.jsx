
import { useRef, useState } from "react";
import supabase from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";

export default function AvatarUploader({ onUpload }) {
  const { user } = useAuth();
  const fileInputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;
    setError('');
    setSuccess('');

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    setUploading(true);

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      setError("Feil ved opplasting: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: filePath })
      .eq("id", user.id);

    if (updateError) {
      setError("Feil ved lagring av URL: " + updateError.message);
      setUploading(false);
      return;
    }

    onUpload?.(filePath);
    setSuccess("Profilbildet er oppdatert.");
    setUploading(false);
  };

  return (
    <>
      <input
        className="avatar-uploader__input avatar-uploader__file-input"
        type="file"
        aria-label="Velg profilbilde"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        disabled={uploading}
      />
      <button
        className="avatar-uploader__button"
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? "Opplaster..." : "Velg profilbilde"}
      </button>
      {error && <p className="avatar-uploader__error" role="alert">{error}</p>}
      {success && <p className="avatar-uploader__success" role="status">{success}</p>}
    </>
  );
}
