import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../useAuth';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);


  async function handleLogout() {
    await logout();
    setMenuOpen(false);
    navigate('/');
  }

  return (
    <header className="wo-site-header">
      <div className="wo-header-inner">
        <Link to="/" className="wo-brand" aria-label="Wish On 홈으로 이동" onClick={() => setMenuOpen(false)}>
          <span className="wo-brand-mark" aria-hidden="true">✦</span>
          <span className="wo-brand-copy">
            <strong>Wish On</strong>
            <small>your little wish journal</small>
          </span>
        </Link>

        <button
          type="button"
          className={`wo-menu-toggle ${menuOpen ? 'is-open' : ''}`}
          aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
          aria-expanded={menuOpen}
          aria-controls="wish-on-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span /><span /><span />
        </button>

        <div id="wish-on-navigation" className={`wo-header-content ${menuOpen ? 'is-open' : ''}`}>
          <nav className="wo-main-nav" aria-label="주요 메뉴">
            <NavLink to="/" end onClick={() => setMenuOpen(false)}>홈</NavLink>
            <a href="/#wishes" onClick={() => setMenuOpen(false)}>소원 둘러보기</a>
            {user && <NavLink to="/my" onClick={() => setMenuOpen(false)}>마이페이지</NavLink>}
          </nav>
          <div className="wo-header-actions">
            {user ? (
              <>
                <span className="wo-welcome-user">안녕하세요, <strong>{user.nickname}</strong>님</span>
                <Link to="/write" className="wo-button wo-button-small" onClick={() => setMenuOpen(false)}>소원 작성하기 <span aria-hidden="true">↗</span></Link>
                <button type="button" className="wo-text-button" onClick={handleLogout}>로그아웃</button>
              </>
            ) : (
              <>
                <Link to="/login" className="wo-text-button" onClick={() => setMenuOpen(false)}>로그인</Link>
                <Link to="/signup" className="wo-button wo-button-small" onClick={() => setMenuOpen(false)}>함께 시작하기 <span aria-hidden="true">↗</span></Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
