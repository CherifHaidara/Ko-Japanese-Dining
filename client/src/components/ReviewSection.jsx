import { useEffect, useState } from 'react';

export default function ReviewSection({ itemId }) {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetch(`/api/reviews/${itemId}`)
      .then(res => res.json())
      .then(setReviews);
  }, [itemId]);

  const submitReview = async () => {
    await fetch('/api/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: localStorage.getItem('token')
      },
      body: JSON.stringify({
        item_id: itemId,
        rating,
        comment
      })
    });

    setComment('');

    const updated = await fetch(`/api/reviews/${itemId}`).then(r => r.json());
    setReviews(updated);
  };

  return (
    <div className="review-section">
      <h4>Reviews</h4>

      {/* Form */}
      <div className="review-form">
        <select value={rating} onChange={e => setRating(e.target.value)}>
          {[5,4,3,2,1].map(n => (
            <option key={n} value={n}>{n} ★</option>
          ))}
        </select>

        <textarea
          placeholder="Write your review..."
          value={comment}
          onChange={e => setComment(e.target.value)}
        />

        <button onClick={submitReview}>
          Submit Review
        </button>
      </div>

      {/* List */}
      <div className="review-list">
        {reviews.map(r => (
          <div key={r.review_id} className="review-card">
            <strong>{r.first_name || 'Guest'}</strong>
            <div>{'★'.repeat(r.rating)}</div>
            <p>{r.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}