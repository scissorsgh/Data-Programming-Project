import express from 'express';
import db from '../db.js';
import { optionalAuth, requireAuth } from '../middlewares/auth.js';

const router = express.Router();
const CATEGORIES = ['여행', '배움', '도전', '일상', '관계', '취미', '기타'];

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function validateBucketlist({ title, description, category }) {
  if (!title || !String(title).trim()) {
    return '버킷리스트 제목을 입력해 주세요.';
  }
  if (String(title).trim().length > 100) {
    return '제목은 100자 이하로 입력해 주세요.';
  }
  if (description && String(description).length > 2000) {
    return '설명은 2,000자 이하로 입력해 주세요.';
  }
  if (!CATEGORIES.includes(category)) {
    return '목록에서 카테고리를 선택해 주세요.';
  }
  return null;
}

// 전체 목록 조회: users와 bucketlists를 JOIN하여 작성자 닉네임까지 함께 가져옵니다.
router.get('/', optionalAuth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT
          b.bucketlist_id,
          CASE WHEN b.user_id = ? THEN b.user_id ELSE NULL END AS user_id,
          b.title,
          b.description,
          b.category,
          b.is_completed,
          b.is_shared,
          b.is_anonymous,
          b.created_at,
          b.updated_at,
          CASE WHEN b.is_anonymous = 1 AND b.user_id <> ? THEN '익명의 소원' ELSE u.nickname END AS author_nickname
       FROM bucketlists AS b
       INNER JOIN users AS u ON b.user_id = u.user_id
       WHERE b.is_shared = 1
       ORDER BY b.created_at DESC, b.bucketlist_id DESC`,
      [req.user?.userId || 0, req.user?.userId || 0]
    );

    return res.json({ bucketlists: rows });
  } catch (error) {
    console.error('전체 버킷리스트 조회 오류:', error);
    return res.status(500).json({ message: '버킷리스트 목록을 불러오지 못했습니다.' });
  }
});

// 내가 작성한 목록
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT
          b.bucketlist_id,
          b.user_id,
          b.title,
          b.description,
          b.category,
          b.is_completed,
          b.is_shared,
          b.is_anonymous,
          b.created_at,
          b.updated_at,
          u.nickname AS author_nickname
       FROM bucketlists AS b
       INNER JOIN users AS u ON b.user_id = u.user_id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC, b.bucketlist_id DESC`,
      [req.user.userId]
    );

    return res.json({ bucketlists: rows });
  } catch (error) {
    console.error('내 버킷리스트 조회 오류:', error);
    return res.status(500).json({ message: '내 버킷리스트를 불러오지 못했습니다.' });
  }
});

// 상세 조회
router.get('/:id', optionalAuth, async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ message: '올바르지 않은 게시글 번호입니다.' });
  }

  try {
    const [rows] = await db.execute(
      `SELECT
          b.bucketlist_id,
          b.title,
          b.description,
          b.category,
          b.is_completed,
          b.is_shared,
          b.is_anonymous,
          b.created_at,
          b.updated_at,
          CASE WHEN b.user_id = ? THEN b.user_id ELSE NULL END AS user_id,
          CASE WHEN b.is_anonymous = 1 AND b.user_id <> ? THEN '익명의 소원' ELSE u.nickname END AS author_nickname
       FROM bucketlists AS b
       INNER JOIN users AS u ON b.user_id = u.user_id
       WHERE b.bucketlist_id = ?
         AND (b.is_shared = 1 OR b.user_id = ?)`,
      [req.user?.userId || 0, req.user?.userId || 0, id, req.user?.userId || 0]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: '버킷리스트를 찾을 수 없습니다.' });
    }
    return res.json({ bucketlist: rows[0] });
  } catch (error) {
    console.error('버킷리스트 상세 조회 오류:', error);
    return res.status(500).json({ message: '버킷리스트를 불러오지 못했습니다.' });
  }
});

// 새 버킷리스트 작성: user_id는 로그인 토큰에서 가져옵니다.
router.post('/', requireAuth, async (req, res) => {
  const title = String(req.body.title || '').trim();
  const description = String(req.body.description || '').trim();
  const category = String(req.body.category || '일상');
  const isCompleted = req.body.is_completed === true || req.body.is_completed === 1 ? 1 : 0;
  const isShared = req.body.is_shared === true ? 1 : 0;
  const isAnonymous = isShared && req.body.is_anonymous === true ? 1 : 0;

  const validationError = validateBucketlist({ title, description, category });
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO bucketlists (user_id, title, description, category, is_completed, is_shared, is_anonymous)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.userId, title, description || null, category, isCompleted, isShared, isAnonymous]
    );

    return res.status(201).json({
      message: '새로운 버킷리스트를 등록했습니다.',
      bucketlist_id: result.insertId
    });
  } catch (error) {
    console.error('버킷리스트 작성 오류:', error);
    return res.status(500).json({ message: '버킷리스트 등록 중 서버 오류가 발생했습니다.' });
  }
});

// 버킷리스트 수정: SQL 조건에 작성자 ID를 함께 넣어 본인 글만 수정되도록 합니다.
router.put('/:id', requireAuth, async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ message: '올바르지 않은 게시글 번호입니다.' });
  }

  const title = String(req.body.title || '').trim();
  const description = String(req.body.description || '').trim();
  const category = String(req.body.category || '일상');
  const isCompleted = req.body.is_completed === true || req.body.is_completed === 1 ? 1 : 0;
  const isShared = req.body.is_shared === true ? 1 : 0;
  const isAnonymous = isShared && req.body.is_anonymous === true ? 1 : 0;

  const validationError = validateBucketlist({ title, description, category });
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const [ownedRows] = await db.execute(
      'SELECT bucketlist_id FROM bucketlists WHERE bucketlist_id = ? AND user_id = ?',
      [id, req.user.userId]
    );

    if (ownedRows.length === 0) {
      const [rows] = await db.execute(
        'SELECT bucketlist_id FROM bucketlists WHERE bucketlist_id = ?',
        [id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ message: '버킷리스트를 찾을 수 없습니다.' });
      }
      return res.status(403).json({ message: '본인이 작성한 버킷리스트만 수정할 수 있습니다.' });
    }

    await db.execute(
      `UPDATE bucketlists
       SET title = ?, description = ?, category = ?, is_completed = ?, is_shared = ?, is_anonymous = ?
       WHERE bucketlist_id = ? AND user_id = ?`,
      [title, description || null, category, isCompleted, isShared, isAnonymous, id, req.user.userId]
    );

    return res.json({ message: '버킷리스트를 수정했습니다.' });
  } catch (error) {
    console.error('버킷리스트 수정 오류:', error);
    return res.status(500).json({ message: '버킷리스트 수정 중 서버 오류가 발생했습니다.' });
  }
});

// 버킷리스트 삭제: 본인 글인지 확인하는 조건을 DELETE문에 포함합니다.
router.delete('/:id', requireAuth, async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ message: '올바르지 않은 게시글 번호입니다.' });
  }

  try {
    const [result] = await db.execute(
      'DELETE FROM bucketlists WHERE bucketlist_id = ? AND user_id = ?',
      [id, req.user.userId]
    );

    if (result.affectedRows === 0) {
      const [rows] = await db.execute(
        'SELECT bucketlist_id FROM bucketlists WHERE bucketlist_id = ?',
        [id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ message: '버킷리스트를 찾을 수 없습니다.' });
      }
      return res.status(403).json({ message: '본인이 작성한 버킷리스트만 삭제할 수 있습니다.' });
    }

    return res.json({ message: '버킷리스트를 삭제했습니다.' });
  } catch (error) {
    console.error('버킷리스트 삭제 오류:', error);
    return res.status(500).json({ message: '버킷리스트 삭제 중 서버 오류가 발생했습니다.' });
  }
});

export default router;
