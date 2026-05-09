import React from 'react';

interface AddUserFormProps {
  name: string;
  setName: (name: string) => void;
  email: string;
  setEmail: (email: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AddUserForm({ name, setName, email, setEmail, onSubmit }: AddUserFormProps) {
  return (
    <form onSubmit={onSubmit} className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-8 shadow-lg">
      <div className="mb-4">
        <input
          className="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-white focus:outline-none focus:border-blue-500 transition-colors"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="mb-4">
        <input
          className="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-white focus:outline-none focus:border-blue-500 transition-colors"
          placeholder="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded font-bold transition-all shadow-md shadow-blue-900/20">
        Add to AWS Vault
      </button>
    </form>
  );
}