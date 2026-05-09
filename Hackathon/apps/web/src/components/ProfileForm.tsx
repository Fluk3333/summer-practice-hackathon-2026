import React from 'react';
import styles from './ProfileForm.module.css';

interface ProfileFormProps {
  location: string;
  setLocation: (loc: string) => void;
  description: string;
  setDescription: (desc: string) => void;
  skillLevel: string;
  setSkillLevel: (skill: string) => void;
  selectedSports: string[];
  toggleSport: (sport: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const AVAILABLE_SPORTS = ['Basketball', 'Tennis', 'Soccer', 'Running', 'Volleyball', 'Badminton'];
const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

export function ProfileForm({ 
  location, 
  setLocation, 
  description, 
  setDescription, 
  skillLevel,
  setSkillLevel,
  selectedSports, 
  toggleSport, 
  onSubmit 
}: ProfileFormProps) {
  return (
    <form onSubmit={onSubmit} className={styles.formContainer}>
      <h2 className={styles.title}>Complete Your Match Profile</h2>
      
      <div className={styles.inputGroup}>
        <label className={styles.label}>Short Bio</label>
        <input
          className={styles.inputField}
          placeholder="e.g., Spontaneous soccer player. Looking to play weekends!"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div className={styles.inputGroup}>
        <label className={styles.label}>My Skill Level</label>
        <div className={styles.skillGrid}>
          {SKILL_LEVELS.map((level) => {
            const isSelected = skillLevel === level;
            return (
              <button
                type="button"
                key={level}
                onClick={() => setSkillLevel(level)}
                className={`${styles.skillButton} ${isSelected ? styles.skillButtonActive : ''}`}
              >
                {level}
              </button>
            );
          })}
        </div>
      </div>


      <div className={styles.inputGroup}>
        <label className={styles.label}>My Location</label>
        <input
          className={styles.inputField}
          placeholder="e.g., Timisoara"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
        />
      </div>

      <div className={styles.inputGroup}>
        <label className={styles.label}>Favorite Sports</label>
        <div className={styles.sportsFlex}>
          {AVAILABLE_SPORTS.map((sport) => {
            const isSelected = selectedSports.includes(sport);
            return (
              <button
                type="button"
                key={sport}
                onClick={() => toggleSport(sport)}
                className={`${styles.sportPill} ${isSelected ? styles.sportPillActive : ''}`}
              >
                {sport}
              </button>
            );
          })}
        </div>
      </div>

      <button type="submit" className={styles.submitButton}>
        Update Preferences
      </button>
    </form>
  );
}