import jwt from 'jsonwebtoken';

export function optionalAuth(req, res, next) {
  const token = req.cookies?.bucketlist_token;

  if (!token || !process.env.JWT_SECRET) {
    return next();
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: Number(payload.userId) };
  } catch {
    // Public endpoints remain available when an optional login has expired.
  }

  return next();
}

export function requireAuth(req, res, next) {
  const token = req.cookies?.bucketlist_token;

  if (!token) {
    return res.status(401).json({ message: '로그인이 필요한 기능입니다.' });
  }

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET 환경 변수가 설정되지 않았습니다.');
    return res.status(500).json({ message: '서버 인증 설정을 확인해 주세요.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: Number(payload.userId) };
    return next();
  } catch {
    return res.status(401).json({ message: '로그인 시간이 만료되었습니다. 다시 로그인해 주세요.' });
  }
}
