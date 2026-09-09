package core

import (
	"fmt"

	"github.com/jackc/pgx/v5/pgtype"
)

func PgTextToString(pgText pgtype.Text) (string, error) {
	if !pgText.Valid {
		return "", fmt.Errorf("pg text is not valid")
	}
	return pgText.String, nil
}

func StringToPgText(inputStr string) pgtype.Text {
	return pgtype.Text{
		String: inputStr,
		Valid: inputStr != "",
	}
}