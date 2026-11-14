import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../useAuth';

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
}

export default function WishDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api(`/bucketlists/${id}`)
      .then((data) => { if (active) setItem(data.bucketlist); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  async function deleteWish() {
    if (!window.confirm('이 소원을 정말 삭제할까요?')) return;
    try {
      await api(`/bucketlists/${id}`, { method: 'DELETE' });
      navigate('/my');
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <div className="wo-page-loading" role="status">소원 이야기를 펼치고 있어요…</div>;
  if (error || !item) {
    return (
      <section className="wo-detail-wrap">
        <div className="wo-empty-state wo-detail-error"><span className="wo-empty-symbol">♡</span><strong>{error || '소원을 찾을 수 없어요.'}</strong><Link to="/" className="wo-button">모두의 소원으로</Link></div>
      </section>
    );
  }

  const isMine = Boolean(user && Number(user.user_id) === Number(item.user_id));
  const completed = Number(item.is_completed) === 1;

  return (
    <section className="wo-detail-wrap">
      <Link to="/#wishes" className="wo-back-link"><span aria-hidden="true">←</span> 모두의 소원으로</Link>
      <article className="wo-detail-card">
        <div className="wo-detail-topline">
          <span className="wo-category-pill">{item.category}</span>
          <div className="wo-card-badges">
            {Number(item.is_shared) !== 1 && <span className="wo-visibility-pill">비공개</span>}
            <span className={`wo-status-pill ${completed ? 'is-done' : ''}`}>{completed ? '✧ 이루었어요' : '♡ 도전 중'}</span>
          </div>
        </div>
        <span className="wo-detail-star" aria-hidden="true">✦</span>
        <span className="wo-eyebrow">A LITTLE WISH STORY</span>
        <h1>{item.title}</h1>
        <div className="wo-detail-author">
          <span className="wo-author-avatar" aria-hidden="true">{(item.author_nickname || 'W')[0]}</span>
          <span><strong>{item.author_nickname || '익명의 소원'}</strong><small>{formatDate(item.created_at)}에 남긴 소원</small></span>
        </div>
        <div className="wo-detail-divider" />
        <p className="wo-detail-description">{item.description || '이 소원에는 아직 자세한 이야기가 적히지 않았어요.'}</p>
        <div className="wo-detail-footer">
          <p>이 소원이 꼭 이루어지기를, Wish On이 응원할게요. <span aria-hidden="true">♡</span></p>
          {isMine && (
            <div className="wo-detail-actions">
              <Link to={`/edit/${id}`} className="wo-outline-button">소원 수정하기</Link>
              <button type="button" className="wo-text-button wo-danger-button" onClick={deleteWish}>삭제하기</button>
            </div>
          )}
        </div>
      </article>
    </section>
  );
}
