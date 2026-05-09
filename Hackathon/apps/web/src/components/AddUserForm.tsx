import React from 'react';
import styles from './AddUserForm.module.css';

interface AddUserFormProps {
  name: string;
  setName: (name: string) => void;
  email: string;
  setEmail: (email: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AddUserForm({ name, setName, email, setEmail, onSubmit }: AddUserFormProps) {
  return (
    <form onSubmit={onSubmit} className={styles.formContainer}>
      <div className={styles.inputGroup}>
        <input
          className={styles.inputField}
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className={styles.inputGroup}>
        <input
          className={styles.inputField}
          placeholder="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <button type="submit" className={styles.submitButton}>
        Add to AWS Vault
      </button>
    </form>
  );
}