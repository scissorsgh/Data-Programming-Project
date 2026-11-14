import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../useAuth';
import BucketCard from '../components/BucketCard';

const categories = ['전체', '여행', '배움', '도전', '일상', '관계', '취미', '기타'];

export default function HomePage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState('전체');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadItems() {
    setLoading(true);
    setError('');
    try {
      const data = await api('/bucketlists');
      setItems(data.bucketlists || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    api('/bucketlists')
      .then((data) => {
        if (active) setItems(data.bucketlists || []);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const filteredItems = useMemo(
    () => category === '전체' ? items : items.filter((item) => item.category === category),
    [items, category]
  );

  async function deleteItem(id) {
    if (!window.confirm('이 소원을 목록에서 삭제할까요?')) return;
    try {
      await api(`/bucketlists/${id}`, { method: 'DELETE' });
      await loadItems();
    } catch (err) {
      window.alert(err.message);
    }
  }

  return (
    <div className="wo-home-page">
      <section className="wo-hero">
        <div className="wo-hero-inner">
          <div className="wo-hero-copy">
            <span className="wo-eyebrow"><span className="wo-eyebrow-star" aria-hidden="true">✦</span> A LITTLE SPACE FOR YOUR DREAMS</span>
            <h1>당신의 마음속<br />작은 <em>소원</em>을 꺼내 보세요.</h1>
            <p>언젠가 이루고 싶은 꿈부터 사소하지만 소중한 바람까지,<br className="wo-desktop-only" /> Wish On에서 기록하고 함께 나눠 보세요.</p>
            <div className="wo-hero-actions">
              <Link to={user ? '/write' : '/signup'} className="wo-button">소원 작성하기 <span aria-hidden="true">↗</span></Link>
              <a href="#wishes" className="wo-secondary-link">다른 사람의 소원 구경하기 <span aria-hidden="true">↓</span></a>
            </div>
            <div className="wo-hero-caption"><span className="wo-caption-line" /> 작은 기록이 모여 나만의 이야기가 돼요.</div>
          </div>

          <div className="wo-hero-art" aria-hidden="true">
            <div className="wo-art-orbit wo-art-orbit-one" />
            <div className="wo-art-orbit wo-art-orbit-two" />
            <span className="wo-art-spark wo-art-spark-one">✦</span>
            <span className="wo-art-spark wo-art-spark-two">✧</span>
            <span className="wo-art-spark wo-art-spark-three">·</span>
            <div className="wo-wish-paper">
              <div className="wo-paper-top"><span>WISH NOTE</span><span>NO. 001</span></div>
              <span className="wo-paper-symbol">✧</span>
              <p>dear future me,</p>
              <strong>Make a little<br /><em>magic</em> happen.</strong>
              <span className="wo-paper-divider" />
              <small>one wish at a time</small>
              <span className="wo-paper-heart">♡</span>
            </div>
            <span className="wo-art-side-note">a note to your future self</span>
          </div>
        </div>
        <div className="wo-hero-bottom"><span>WISH ON</span><span>오늘의 소원을 내일의 용기로</span><span aria-hidden="true">✧</span></div>
      </section>

      <section id="wishes" className="wo-wishes-section">
        <div className="wo-section-heading">
          <div>
            <span className="wo-eyebrow">FROM ONE HEART TO ANOTHER</span>
            <h2>모두의 소원 <span aria-hidden="true">♡</span></h2>
            <p>누군가의 꿈을 응원하다 보면, 나의 내일도 조금 더 반짝일 거예요.</p>
          </div>
          <div className="wo-wish-count"><strong>{items.length}</strong><span>개의 소원이<br />모여 있어요</span></div>
        </div>

        <div className="wo-category-tabs" aria-label="소원 카테고리 필터">
          {categories.map((name) => (
            <button
              type="button"
              key={name}
              className={category === name ? 'is-active' : ''}
              aria-pressed={category === name}
              onClick={() => setCategory(name)}
            >{name}</button>
          ))}
        </div>

        {loading ? (
          <div className="wo-empty-state" role="status"><span className="wo-empty-symbol">✧</span>소원들을 하나씩 모으고 있어요…</div>
        ) : error ? (
          <div className="wo-empty-state wo-error-state">
            <span className="wo-empty-symbol">♡</span><p>{error}</p>
            <button type="button" className="wo-outline-button" onClick={loadItems}>다시 불러오기</button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="wo-empty-state">
            <span className="wo-empty-symbol">✧</span>
            <strong>{items.length === 0 ? '아직 첫 소원을 기다리고 있어요.' : '이곳에는 아직 소원이 없어요.'}</strong>
            <p>{items.length === 0 ? '당신의 작은 바람을 첫 번째 이야기로 남겨 주세요.' : '다른 카테고리도 둘러보세요.'}</p>
            {user && <Link to="/write" className="wo-text-link">첫 소원 적으러 가기 ↗</Link>}
          </div>
        ) : (
          <div className="wo-wish-grid">
            {filteredItems.map((item) => (
              <BucketCard
                key={item.bucketlist_id}
                item={item}
                isMine={Boolean(user && Number(user.user_id) === Number(item.user_id))}
                onDelete={deleteItem}
              />
            ))}
          </div>
        )}
      </section>

      <section className="wo-closing-note">
        <span className="wo-closing-star" aria-hidden="true">✦</span>
        <p>소원은 마음에 담아 둘 때보다<br /><em>함께 나눌 때 더 따뜻해져요.</em></p>
        <span className="wo-closing-caption">A LITTLE WISH CAN BRIGHTEN A DAY.</span>
      </section>
    </div>
  );
}
