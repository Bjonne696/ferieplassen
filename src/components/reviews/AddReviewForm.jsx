import { useId, useState } from "react";
import supabase from "../../lib/supabaseClient";

export default function AddReviewForm({ cabinId, userId, onReviewSubmitted, className }) {
  const id = useId();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ratingError, setRatingError] = useState(false);
  const formClassName = [...new Set(["add-review-form", className]
    .filter(Boolean)
    .flatMap((value) => value.split(/\s+/))
    .filter(Boolean))].join(" ");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setError("Du må velge en vurdering.");
      setRatingError(true);
      return;
    }

    setLoading(true);
    setError("");
    setRatingError(false);

    const { error: insertError } = await supabase.from("reviews").insert([
      {
        cabin_id: cabinId,
        user_id: userId,
        rating,
        comment,
      },
    ]);

    setLoading(false);

    if (insertError) {
      console.error(insertError.message);
      setError("Noe gikk galt ved innsending.");
    } else {
      setComment("");
      setRating(0);
      onReviewSubmitted?.(); // f.eks. for å refreshe UI
    }
  };

  return (
    <div className={formClassName}>
      <form className="add-review-form__fields" onSubmit={handleSubmit}>
        <span className="add-review-form__label add-review-form__rating-label" id={`${id}-rating-label`}>Stjerner:</span>
        <div
          className="add-review-form__rating"
          role="radiogroup"
          aria-labelledby={`${id}-rating-label`}
          aria-describedby={ratingError ? `${id}-rating-error` : undefined}
          aria-invalid={ratingError || undefined}
        >
          {[1, 2, 3, 4, 5].map((num) => (
            <label className="add-review-form__star-option" key={num} htmlFor={`${id}-rating-${num}`}>
              <input className="add-review-form__rating-input" id={`${id}-rating-${num}`} type="radio" name={`${id}-rating`}
                value={num} checked={rating === num} aria-label={`${num} ${num === 1 ? "stjerne" : "stjerner"}`}
                onChange={() => {
                  setRating(num);
                  setRatingError(false);
                  setError("");
                }} />
              <span
                className={`add-review-form__star ${rating >= num ? "active" : ""} ${rating === num ? "selected" : ""}`.trim()}
                aria-hidden="true"
              >
                ★
              </span>
            </label>
          ))}
        </div>

        <label className="add-review-form__label add-review-form__comment-label" htmlFor={`${id}-comment`}>Kommentar (valgfritt):</label>
        <textarea
          className="add-review-form__comment"
          id={`${id}-comment`}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Fortell om oppholdet..."
        />

        {error && (
          <p className="add-review-form__error" id={`${id}-rating-error`} role="alert" aria-live="assertive">
            {error}
          </p>
        )}

        <button className="add-review-form__submit" type="submit" disabled={loading}>
          {loading ? "Sender inn..." : "Send vurdering"}
        </button>
      </form>
    </div>
  );
}