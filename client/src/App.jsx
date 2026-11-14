import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import AuthProvider from './AuthProvider';
import { useAuth } from './useAuth';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import BucketFormPage from './pages/BucketFormPage';
import WishDetailPage from './pages/WishDetailPage';
import MyPage from './pages/MyPage';
import './App.css';

function ProtectedRoute({ children }) {
  const { user, authLoading } = useAuth();

  if (authLoading) {
    return <div className="wo-page-loading" role="status">오늘의 소원을 불러오고 있어요<span className="wo-loading-dot">.</span></div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Layout() {
  return (
    <div className="wo-app-shell">
      <Header />
      <main className="wo-main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/wish/:id" element={<WishDetailPage />} />
          <Route path="/write" element={<ProtectedRoute><BucketFormPage /></ProtectedRoute>} />
          <Route path="/edit/:id" element={<ProtectedRoute><BucketFormPage /></ProtectedRoute>} />
          <Route path="/my" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
          <Route path="*" element={(
            <div className="wo-not-found">
              <span aria-hidden="true">✧</span>
              <h1>앗, 페이지를 찾지 못했어요.</h1>
              <p>주소를 다시 확인하거나 Wish On 첫 화면으로 돌아가 주세요.</p>
              <Link to="/" className="wo-button">홈으로 돌아가기</Link>
            </div>
          )} />
        </Routes>
      </main>
      <footer className="wo-site-footer">
        <Link to="/" className="wo-footer-brand">Wish On <span>✦</span></Link>
        <p>마음속 소원을 기록하고, 서로의 꿈을 응원하는 곳</p>
        <small>오늘의 작은 바람이 내일의 다정한 추억이 되기를.</small>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout />
      </AuthProvider>
    </BrowserRouter>
  );
}
