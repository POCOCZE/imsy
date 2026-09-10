package main

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"log"

	"github.com/pococze/imsy/backend/core"
)

// encrypts string data to b64 encoded AES-GCM string
func (p *PostgresStore) EncryptToGCM(data string) string {
	// create nonce - unique
	nonce := make([]byte, p.GCM.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		// the probability of this failing is very small
		log.Fatalf("[CallbackHandler] failed to generate nonce: %s", err)
	}

	encrypted := p.GCM.Seal(nonce, nonce, []byte(data), nil)
	encryptedB64 := base64.StdEncoding.EncodeToString(encrypted)
	return encryptedB64
}

func (p *PostgresStore) DecryptFromGCM(encryptedB64 string) (string, error) {
	// decode base64 encoded string
	encrypted, err := base64.StdEncoding.DecodeString(encryptedB64)
	if err != nil {
		return "", fmt.Errorf("[DecryptFromGCM] failed to decode base64 encoded string: %s", err)
	}
	nonce := encrypted[:p.GCM.NonceSize()]
	ciphertext := encrypted[p.GCM.NonceSize():]
	
	plaintext, err := p.GCM.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", fmt.Errorf("[DecryptFromGCM] failed to decrypt data: %s", err)
	}
	return string(plaintext), nil
}

// Using hashing because the encrypted output can be effortlessly sorted, compared to AES-GCM encryption
func (p *PostgresStore) EncryptToHMAC(plaintext string, hmacKeyB64 string) string {
	// decode the B64 hmacKey first
	hmacKey, err := base64.StdEncoding.DecodeString(hmacKeyB64)
	if err != nil {
		log.Fatalf("[EncryptToHMAC] failed to base64 decode string value with env var key %q: %s", EnvHMACEncryptKey, err)
	}

	h := hmac.New(sha256.New, hmacKey)
	h.Write([]byte(plaintext))

	// base64 encode the string
	hashB64 := base64.StdEncoding.EncodeToString(h.Sum(nil))
	return hashB64
}

// encrypt important columns in one place
func (p *PostgresStore) EncryptIncidentCols(enc *core.EncIncidentCols) *core.EncIncidentCols {
	var encIncidentCols core.EncIncidentCols
	encIncidentCols.Name = p.EncryptToGCM(enc.Name)
	encIncidentCols.Title = p.EncryptToGCM(enc.Title)
	encIncidentCols.ServiceName = p.EncryptToGCM(enc.ServiceName)
	return &encIncidentCols
}

// decrypt important columns in one place
func (p *PostgresStore) DecIncidentCols(enc *core.EncIncidentCols) (*core.EncIncidentCols, error) {
	var err error
	if enc.Name, err = p.DecryptFromGCM(enc.Name); err != nil {
		p.Logger.Error("failed to decrypt encrypted string", "error", err, "func", "DecIncidentCols")
		return nil, fmt.Errorf("[DecIncidentCols] failed to decrypt encrypted string: %s", err)
	}
	if enc.Title, err = p.DecryptFromGCM(enc.Title); err != nil {
		p.Logger.Error("failed to decrypt encrypted string", "error", err, "func", "DecIncidentCols")
		return nil, fmt.Errorf("[DecIncidentCols] failed to decrypt encrypted string: %s", err)
	}
	if enc.ServiceName, err = p.DecryptFromGCM(enc.ServiceName); err != nil {
		p.Logger.Error("failed to decrypt encrypted string", "error", err, "func", "DecIncidentCols")
		return nil, fmt.Errorf("[DecIncidentCols] failed to decrypt encrypted string: %s", err)
	}
	return enc, nil
}
