import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../useAuth';
import BucketCard from '../components/BucketCard';

export default function MyPage() {
  const navigate = useNavigate();
  const { user, refreshUser, setUser } = useAuth();
  const [items, setItems] = useState([]);
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [deletePassword, setDeletePassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  async function loadMine() {
    setLoading(true);
    try {
      const data = await api('/bucketlists/mine');
      setItems(data.bucketlists || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    api('/bucketlists/mine')
      .then((data) => { if (active) setItems(data.bucketlists || []); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);


  async function saveProfile(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    setSavingProfile(true);
    try {
      const data = await api('/users/me', { method: 'PUT', body: JSON.stringify({ nickname }) });
      setNickname(data.user?.nickname || nickname);
      await refreshUser();
      setMessage('닉네임을 변경했어요. 새로운 이름으로 다시 인사해요!');
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function deleteAccount() {
    if (!deletePassword) {
      setError('탈퇴를 확인하기 위해 비밀번호를 입력해 주세요.');
      return;
    }
    if (!window.confirm('정말 탈퇴할까요? 작성한 소원도 함께 삭제됩니다.')) return;

    setError('');
    try {
      await api('/users/me', { method: 'DELETE', body: JSON.stringify({ password: deletePassword }) });
      setUser(null);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteItem(id) {
    if (!window.confirm('이 소원을 목록에서 삭제할까요?')) return;
    try {
      await api(`/bucketlists/${id}`, { method: 'DELETE' });
      await loadMine();
    } catch (err) {
      setError(err.message);
    }
  }

  const completedCount = items.filter((item) => Number(item.is_completed) === 1).length;

  return (
    <div className="wo-my-page">
      <div className="wo-my-heading">
        <span className="wo-eyebrow">YOUR LITTLE UNIVERSE</span>
        <h1>{user?.nickname}님의 <em>소원 노트</em></h1>
        <p>기록해 둔 꿈을 다시 읽고, 하나씩 현실로 만들어 봐요.</p>
      </div>

      <div className="wo-my-overview">
        <div><strong>{items.length}</strong><span>나의 소원</span></div>
        <span className="wo-overview-divider" />
        <div><strong>{completedCount}</strong><span>이룬 소원</span></div>
        <span className="wo-overview-spark" aria-hidden="true">✦</span>
      </div>

      <div className="wo-my-layout">
        <aside className="wo-profile-panel">
          <div className="wo-profile-avatar" aria-hidden="true">{(user?.nickname || 'W')[0]}</div>
          <span className="wo-eyebrow">MY PROFILE</span>
          <h2>나의 정보</h2>
          <p className="wo-profile-email">{user?.email}</p>
          <form className="wo-form-stack wo-profile-form" onSubmit={saveProfile}>
            <label className="wo-field">
              <span>닉네임</span>
              <input value={nickname} maxLength="30" onChange={(event) => setNickname(event.target.value)} required />
            </label>
            <button type="submit" className="wo-button wo-button-wide" disabled={savingProfile}>{savingProfile ? '저장 중…' : '정보 수정하기'}</button>
          </form>
          <div className="wo-account-delete">
            <span>계정을 정리하고 싶다면</span>
            <input type="password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} placeholder="비밀번호 확인" aria-label="회원 탈퇴 비밀번호 확인" />
            <button type="button" className="wo-text-button wo-danger-button" onClick={deleteAccount}>회원 탈퇴</button>
          </div>
        </aside>

        <section className="wo-my-list-panel">
          <div className="wo-my-list-heading">
            <div>
              <span className="wo-eyebrow">MY WISHES</span>
              <h2>내가 적은 소원 <span aria-hidden="true">♡</span></h2>
            </div>
            <button type="button" className="wo-button wo-button-small" onClick={() => navigate('/write')}>새 소원 적기 <span aria-hidden="true">↗</span></button>
          </div>

          {message && <p className="wo-form-message is-success" role="status">{message}</p>}
          {error && <p className="wo-form-message is-error" role="alert">{error}</p>}

          {loading ? (
            <div className="wo-empty-state" role="status">소원 노트를 정리하고 있어요…</div>
          ) : items.length === 0 ? (
            <div className="wo-empty-state">
              <span className="wo-empty-symbol">✧</span>
              <strong>아직 적어 둔 소원이 없어요.</strong>
              <p>첫 번째 소원을 적고 나만의 이야기를 시작해 보세요.</p>
              <button type="button" className="wo-text-link" onClick={() => navigate('/write')}>첫 소원 적기 ↗</button>
            </div>
          ) : (
            <div className="wo-wish-grid wo-my-wish-grid">
              {items.map((item) => <BucketCard key={item.bucketlist_id} item={item} isMine onDelete={deleteItem} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
