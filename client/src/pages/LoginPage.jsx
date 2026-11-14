import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api('/users/login', { method: 'POST', body: JSON.stringify(form) });
      await refreshUser();
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="wo-auth-layout">
      <aside className="wo-auth-aside wo-login-aside">
        <span className="wo-auth-orbit" aria-hidden="true">✦</span>
        <span className="wo-auth-aside-label">A PLACE TO BEGIN AGAIN</span>
        <p>잊고 있던 소원을<br /><em>다시 꺼내 보는 시간.</em></p>
        <small>your next chapter starts with a wish</small>
      </aside>
      <div className="wo-form-panel">
        <span className="wo-eyebrow">WELCOME BACK</span>
        <h1>다시 만나 반가워요.</h1>
        <p className="wo-form-intro">로그인하고 마음에 담아 둔 소원을 이어 적어 보세요.</p>
        <form onSubmit={handleSubmit} className="wo-form-stack">
          <label className="wo-field">
            <span>이메일</span>
            <input name="email" type="email" autoComplete="email" value={form.email} onChange={update} placeholder="hello@example.com" required />
          </label>
          <label className="wo-field">
            <span>비밀번호</span>
            <input name="password" type="password" autoComplete="current-password" value={form.password} onChange={update} placeholder="비밀번호를 입력해 주세요" required />
          </label>
          {error && <p className="wo-form-message is-error" role="alert">{error}</p>}
          <button className="wo-button wo-button-wide" type="submit" disabled={submitting}>
            {submitting ? '로그인 중이에요…' : '로그인하기'} <span aria-hidden="true">↗</span>
          </button>
        </form>
        <p className="wo-form-bottom">아직 계정이 없나요? <Link to="/signup">Wish On 시작하기</Link></p>
      </div>
    </section>
  );
}
