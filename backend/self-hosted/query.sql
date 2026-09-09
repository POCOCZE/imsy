-- name: Add :exec
INSERT INTO incidents (
        id, org_id, name, name_blind_idx, title, severity, service_name, started_at, resolved_at, created_by, created_at, updated_at
        ) 
    VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        );

-- name: Edit :exec
UPDATE incidents
    SET id = $1,
    org_id = $2,
    name = $3,
    name_blind_idx = $4,
    title = $5,
    severity = $6,
    service_name = $7,
    started_at = $8,
    resolved_at = $9,
    created_by = $10,
    created_at = $11,
    updated_at = $12
WHERE id = $13
RETURNING *;

-- name: GetAll :many
SELECT * FROM incidents;

-- name: GetByID :one
SELECT * FROM incidents
WHERE id = $1;

-- name: GetByName :one
SELECT * FROM incidents
WHERE name_blind_idx = $1;

-- name: DeleteByID :exec
DELETE FROM incidents
WHERE id = $1;

-- name: DeleteAll :exec
DELETE FROM incidents;