import { Link } from 'react-router-dom';

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

export default function BucketCard({ item, isMine = false, onDelete }) {
  const completed = Number(item.is_completed) === 1;

  return (
    <article className={`wo-wish-card ${completed ? 'is-completed' : ''}`}>
      <div className="wo-wish-card-top">
        <span className="wo-category-pill">{item.category}</span>
        <div className="wo-card-badges">
          {Number(item.is_shared) !== 1 && <span className="wo-visibility-pill">비공개</span>}
          <span className={`wo-status-pill ${completed ? 'is-done' : ''}`}>
            <span aria-hidden="true">{completed ? '✧' : '♡'}</span>{completed ? '이루었어요' : '도전 중'}
          </span>
        </div>
      </div>

      <h3 className="wo-wish-card-title"><Link to={`/wish/${item.bucketlist_id}`}>{item.title}</Link></h3>
      <p className="wo-wish-card-description">
        {item.description || '아직 이야기가 적히지 않았어요. 이 소원을 품게 된 마음을 천천히 채워 보세요.'}
      </p>

      <div className="wo-wish-card-bottom">
        <div className="wo-author">
          <span className="wo-author-avatar" aria-hidden="true">{(item.author_nickname || 'W')[0]}</span>
          <span className="wo-author-copy">
            <strong>{item.author_nickname || '익명의 소원'}</strong>
            <small>{formatDate(item.created_at)}</small>
          </span>
        </div>
        <Link to={`/wish/${item.bucketlist_id}`} className="wo-card-detail-link" aria-label={`${item.title} 자세히 보기`}>자세히 보기 <span aria-hidden="true">↗</span></Link>
      </div>

      {isMine && (
        <div className="wo-card-actions">
          <Link to={`/edit/${item.bucketlist_id}`} className="wo-mini-action">수정</Link>
          <button type="button" className="wo-mini-action is-danger" onClick={() => onDelete(item.bucketlist_id)}>삭제</button>
        </div>
      )}
      <span className="wo-card-star" aria-hidden="true">✦</span>
    </article>
  );
}
