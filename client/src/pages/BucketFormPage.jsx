import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../useAuth';

const categories = ['여행', '배움', '도전', '일상', '관계', '취미', '기타'];

export default function BucketFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '일상',
    is_completed: false,
    is_shared: false,
    is_anonymous: false
  });
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return undefined;
    let active = true;

    async function loadItem() {
      try {
        const data = await api(`/bucketlists/${id}`);
        if (!data.bucketlist) throw new Error('소원을 찾을 수 없습니다.');
        if (Number(data.bucketlist.user_id) !== Number(user?.user_id)) {
          throw new Error('본인이 작성한 소원만 수정할 수 있어요.');
        }
        if (active) {
          setForm({
            title: data.bucketlist.title,
            description: data.bucketlist.description || '',
            category: data.bucketlist.category,
            is_completed: Boolean(Number(data.bucketlist.is_completed)),
            is_shared: Boolean(Number(data.bucketlist.is_shared)),
            is_anonymous: Boolean(Number(data.bucketlist.is_anonymous))
          });
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadItem();
    return () => { active = false; };
  }, [id, isEdit, user?.user_id]);

  function update(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'is_shared' && !checked ? { is_anonymous: false } : {})
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const path = isEdit ? `/bucketlists/${id}` : '/bucketlists';
      await api(path, { method: isEdit ? 'PUT' : 'POST', body: JSON.stringify(form) });
      navigate('/my');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="wo-page-loading" role="status">소원 노트를 펼치는 중이에요…</div>;
  if (error && isEdit && !form.title) {
    return <div className="wo-empty-state wo-editor-error"><span className="wo-empty-symbol">♡</span><strong>{error}</strong><Link to={isEdit ? `/wish/${id}` : '/my'} className="wo-button">이전 화면으로</Link></div>;
  }

  return (
    <section className="wo-editor-wrap">
      <div className="wo-editor-heading">
        <span className="wo-eyebrow">{isEdit ? 'A WISH TO REFINE' : 'A WISH TO REMEMBER'}</span>
        <h1>{isEdit ? '소원을 다시 다듬어 볼까요?' : '마음속 소원을 적어 봐요.'}</h1>
        <p>꼭 거창하지 않아도 괜찮아요. 당신에게 소중한 일이라면 충분해요.</p>
      </div>

      <form className="wo-editor-card wo-form-stack" onSubmit={handleSubmit}>
        <div className="wo-editor-card-top"><span>MY WISH NOTE</span><span aria-hidden="true">✦</span></div>
        <label className="wo-field">
          <span>소원 제목 <b>*</b></span>
          <input name="title" type="text" maxLength="100" value={form.title} onChange={update} placeholder="예: 혼자 제주도 여행 떠나기" required />
        </label>
        <label className="wo-field wo-textarea-field">
          <span>어떤 소원인가요?</span>
          <textarea name="description" rows="6" maxLength="2000" value={form.description} onChange={update} placeholder="이 소원을 이루고 싶은 이유나 작은 계획을 적어 보세요." />
          <small className="wo-character-count">{form.description.length.toLocaleString('ko-KR')} / 2,000</small>
        </label>
        <label className="wo-field">
          <span>카테고리</span>
          <select name="category" value={form.category} onChange={update}>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
        <label className="wo-checkbox-field">
          <input name="is_shared" type="checkbox" checked={form.is_shared} onChange={update} />
          <span className="wo-custom-check" aria-hidden="true">✓</span>
          <span>이 소원을 다른 사람과 공유할래요 <small>선택하지 않으면 나만 볼 수 있어요.</small></span>
        </label>
        {form.is_shared && (
          <label className="wo-checkbox-field">
            <input name="is_anonymous" type="checkbox" checked={form.is_anonymous} onChange={update} />
            <span className="wo-custom-check" aria-hidden="true">✓</span>
            <span>익명으로 공유할래요 <small>공개 화면에서 닉네임 대신 '익명의 소원'으로 표시돼요.</small></span>
          </label>
        )}
        <label className="wo-checkbox-field">
          <input name="is_completed" type="checkbox" checked={form.is_completed} onChange={update} />
          <span className="wo-custom-check" aria-hidden="true">✓</span>
          <span>이 소원을 이루었어요 <small>이룬 순간도 소중한 기록으로 남겨요.</small></span>
        </label>
        {error && <p className="wo-form-message is-error" role="alert">{error}</p>}
        <div className="wo-editor-actions">
          <Link to={isEdit ? `/wish/${id}` : '/my'} className="wo-cancel-link">취소</Link>
          <button type="submit" className="wo-button" disabled={submitting}>
            {submitting ? '저장 중이에요…' : isEdit ? '수정 내용 저장하기' : '소원 남기기'} <span aria-hidden="true">↗</span>
          </button>
        </div>
      </form>
    </section>
  );
}
