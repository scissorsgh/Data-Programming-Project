import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();
const COOKIE_NAME = 'bucketlist_token';
const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

function setLoginCookie(res, userId) {
  const token = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ONE_WEEK,
    path: '/'
  });
}

function clearLoginCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });
}

function publicUser(row) {
  return {
    user_id: row.user_id,
    email: row.email,
    nickname: row.nickname,
    created_at: row.created_at
  };
}

// 회원가입
router.post('/signup', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const nickname = String(req.body.nickname || '').trim();
  const password = String(req.body.password || '');

  if (!email || !nickname || !password) {
    return res.status(400).json({ message: '이메일, 닉네임, 비밀번호를 모두 입력해 주세요.' });
  }
  if (email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: '올바른 이메일 주소를 입력해 주세요.' });
  }
  if (nickname.length > 30) {
    return res.status(400).json({ message: '닉네임은 30자 이하로 입력해 주세요.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: '비밀번호는 8자 이상으로 입력해 주세요.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      'INSERT INTO users (email, password_hash, nickname) VALUES (?, ?, ?)',
      [email, passwordHash, nickname]
    );

    setLoginCookie(res, result.insertId);

    return res.status(201).json({
      message: '회원가입이 완료되었습니다.',
      user: { user_id: result.insertId, email, nickname }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: '이미 가입된 이메일입니다.' });
    }
    console.error('회원가입 오류:', error);
    return res.status(500).json({ message: '회원가입 중 서버 오류가 발생했습니다.' });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!email || !password) {
    return res.status(400).json({ message: '이메일과 비밀번호를 입력해 주세요.' });
  }

  try {
    const [rows] = await db.execute(
      'SELECT user_id, email, password_hash, nickname, created_at FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: '이메일 또는 비밀번호를 확인해 주세요.' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: '이메일 또는 비밀번호를 확인해 주세요.' });
    }

    setLoginCookie(res, user.user_id);
    return res.json({
      message: '로그인되었습니다.',
      user: publicUser(user)
    });
  } catch (error) {
    console.error('로그인 오류:', error);
    return res.status(500).json({ message: '로그인 중 서버 오류가 발생했습니다.' });
  }
});

// 로그아웃
router.post('/logout', (req, res) => {
  clearLoginCookie(res);
  return res.json({ message: '로그아웃되었습니다.' });
});

// 내 정보 조회
router.get('/me', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT user_id, email, nickname, created_at FROM users WHERE user_id = ?',
      [req.user.userId]
    );

    if (rows.length === 0) {
      clearLoginCookie(res);
      return res.status(404).json({ message: '회원 정보를 찾을 수 없습니다.' });
    }

    return res.json({ user: publicUser(rows[0]) });
  } catch (error) {
    console.error('내 정보 조회 오류:', error);
    return res.status(500).json({ message: '회원 정보를 불러오지 못했습니다.' });
  }
});

// 내 정보 수정 (닉네임)
router.put('/me', requireAuth, async (req, res) => {
  const nickname = String(req.body.nickname || '').trim();

  if (!nickname) {
    return res.status(400).json({ message: '닉네임을 입력해 주세요.' });
  }
  if (nickname.length > 30) {
    return res.status(400).json({ message: '닉네임은 30자 이하로 입력해 주세요.' });
  }

  try {
    await db.execute(
      'UPDATE users SET nickname = ? WHERE user_id = ?',
      [nickname, req.user.userId]
    );

    const [rows] = await db.execute(
      'SELECT user_id, email, nickname, created_at FROM users WHERE user_id = ?',
      [req.user.userId]
    );

    return res.json({
      message: '닉네임이 수정되었습니다.',
      user: publicUser(rows[0])
    });
  } catch (error) {
    console.error('내 정보 수정 오류:', error);
    return res.status(500).json({ message: '회원 정보 수정 중 서버 오류가 발생했습니다.' });
  }
});

// 회원 탈퇴
router.delete('/me', requireAuth, async (req, res) => {
  const password = String(req.body.password || '');

  if (!password) {
    return res.status(400).json({ message: '탈퇴를 확인하기 위해 비밀번호를 입력해 주세요.' });
  }

  try {
    const [rows] = await db.execute(
      'SELECT password_hash FROM users WHERE user_id = ?',
      [req.user.userId]
    );

    if (rows.length === 0) {
      clearLoginCookie(res);
      return res.status(404).json({ message: '회원 정보를 찾을 수 없습니다.' });
    }

    const isMatch = await bcrypt.compare(password, rows[0].password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
    }

    // bucketlists.user_id의 ON DELETE CASCADE 설정으로 해당 회원의 글도 함께 삭제됩니다.
    await db.execute('DELETE FROM users WHERE user_id = ?', [req.user.userId]);
    clearLoginCookie(res);

    return res.json({ message: '회원 탈퇴가 완료되었습니다.' });
  } catch (error) {
    console.error('회원 탈퇴 오류:', error);
    return res.status(500).json({ message: '회원 탈퇴 중 서버 오류가 발생했습니다.' });
  }
});

export default router;
