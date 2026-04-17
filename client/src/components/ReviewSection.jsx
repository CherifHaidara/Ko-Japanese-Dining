import { useEffect, useState } from 'react';

function ReviewSection({ itemId }) {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  // ✅ FUNCTION (no hooks inside it)
  const fetchReviews = () => {
    fetch(`/api/reviews/${itemId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setReviews(data);
        } else {
          setReviews([]);
        }
      })
      .catch(() => setReviews([]));
  };

  // ✅ HOOK (top-level only)
  useEffect(() => {
    fetchReviews();
  }, [itemId]);

  const submitReview = async () => {
    await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_id: itemId,
        rating,
        comment
      })
    });

    setComment('');
    setRating(5);
    fetchReviews();
  };

  return (
    <div>
      <h3>Reviews</h3>

      {reviews.length === 0 ? (
        <p>No reviews yet.</p>
      ) : (
        reviews.map(r => (
          <div key={r.review_id}>
            <strong>{r.user_name}</strong>
            <p>{r.rating} ⭐</p>
            <p>{r.comment}</p>
          </div>
        ))
      )}

      <div>
        <h4>Leave a Review</h4>

        <select value={rating} onChange={e => setRating(e.target.value)}>
          {[1,2,3,4,5].map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
        />

        <button onClick={submitReview}>Submit</button>
      </div>
    </div>
  );
}

export default ReviewSection;