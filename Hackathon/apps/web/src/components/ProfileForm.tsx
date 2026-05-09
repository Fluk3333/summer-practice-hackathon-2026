import React from 'react';

interface ProfileFormProps {
  location: string;
  setLocation: (loc: string) => void;
  description: string;
  setDescription: (desc: string) => void;
  skillLevel: string;                        // 👈 Added skillLevel prop
  setSkillLevel: (skill: string) => void;    // 👈 Added skillLevel setter
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
    <form onSubmit={onSubmit} className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-8 shadow-lg">
      <h2 className="text-lg font-bold mb-4 text-blue-400">Complete Your Match Profile</h2>
      
      {/* Description / Bio Input */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Short Bio</label>
        <input
          className="w-full bg-gray-900 border border-gray-700 p-2.5 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
          placeholder="e.g., Spontaneous soccer player. Looking to play weekends!"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      {/* Skill Level Button Toggles */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">My Skill Level</label>
        <div className="grid grid-cols-3 gap-2">
          {SKILL_LEVELS.map((level) => {
            const isSelected = skillLevel === level;
            return (
              <button
                type="button"
                key={level}
                onClick={() => setSkillLevel(level)}
                className={`py-2 rounded-lg text-xs font-bold transition-all border ${
                  isSelected
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                {level}
              </button>
            );
          })}
        </div>
      </div>

      {/* Location Input */}
      <div className="mb-5">
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">My Location</label>
        <input
          className="w-full bg-gray-900 border border-gray-700 p-2.5 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
          placeholder="e.g., Timisoara"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
        />
      </div>

      {/* Sport Preferences Pill Select */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Favorite Sports</label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_SPORTS.map((sport) => {
            const isSelected = selectedSports.includes(sport);
            return (
              <button
                type="button"
                key={sport}
                onClick={() => toggleSport(sport)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  isSelected
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                {sport}
              </button>
            );
          })}
        </div>
      </div>

      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded-lg font-bold transition-all shadow-md shadow-blue-900/20">
        Update Preferences
      </button>
    </form>
  );
}