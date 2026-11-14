-- 기존에 공개되던 소원은 공개 상태를 유지합니다.
-- 이 마이그레이션은 기존 데이터베이스에서 한 번만 실행하세요.
USE bucketlist_20603;

ALTER TABLE bucketlists
    ADD COLUMN is_shared TINYINT(1) NOT NULL DEFAULT 1 AFTER is_completed,
    ADD COLUMN is_anonymous TINYINT(1) NOT NULL DEFAULT 0 AFTER is_shared;
