import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../useAuth';

export default function SignupPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [form, setForm] = useState({ email: '', nickname: '', password: '', passwordConfirm: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (form.password.length < 8) {
      setError('비밀번호는 8자 이상으로 입력해 주세요.');
      return;
    }
    if (form.password !== form.passwordConfirm) {
      setError('비밀번호 확인이 일치하지 않아요.');
      return;
    }

    setSubmitting(true);
    try {
      const signupData = { email: form.email, nickname: form.nickname, password: form.password };
      await api('/users/signup', { method: 'POST', body: JSON.stringify(signupData) });
      await refreshUser();
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="wo-auth-layout wo-signup-layout">
      <aside className="wo-auth-aside wo-signup-aside">
        <span className="wo-auth-orbit" aria-hidden="true">♡</span>
        <span className="wo-auth-aside-label">A NEW PAGE FOR YOU</span>
        <p>마음에 품은 꿈을<br /><em>여기서 시작해요.</em></p>
        <small>one wish at a time</small>
      </aside>
      <div className="wo-form-panel">
        <span className="wo-eyebrow">JOIN WISH ON</span>
        <h1>우리, 함께 적어 볼까요?</h1>
        <p className="wo-form-intro">간단한 정보만 입력하면 나만의 소원 노트가 생겨요.</p>
        <form onSubmit={handleSubmit} className="wo-form-stack">
          <label className="wo-field">
            <span>이메일</span>
            <input name="email" type="email" autoComplete="email" maxLength="100" value={form.email} onChange={update} placeholder="hello@example.com" required />
          </label>
          <label className="wo-field">
            <span>닉네임</span>
            <input name="nickname" type="text" autoComplete="nickname" maxLength="30" value={form.nickname} onChange={update} placeholder="불리고 싶은 이름" required />
          </label>
          <label className="wo-field">
            <span>비밀번호 <small>8자 이상</small></span>
            <input name="password" type="password" autoComplete="new-password" value={form.password} onChange={update} placeholder="비밀번호를 입력해 주세요" required />
          </label>
          <label className="wo-field">
            <span>비밀번호 확인</span>
            <input name="passwordConfirm" type="password" autoComplete="new-password" value={form.passwordConfirm} onChange={update} placeholder="한 번 더 입력해 주세요" required />
          </label>
          {error && <p className="wo-form-message is-error" role="alert">{error}</p>}
          <button className="wo-button wo-button-wide" type="submit" disabled={submitting}>
            {submitting ? '가입 중이에요…' : 'Wish On과 함께하기'} <span aria-hidden="true">↗</span>
          </button>
        </form>
        <p className="wo-form-bottom">이미 계정이 있나요? <Link to="/login">로그인하기</Link></p>
      </div>
    </section>
  );
}
