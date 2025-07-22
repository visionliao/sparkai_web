import { useState } from 'react';

export default function Login({ onLogin }: { onLogin: (user: { name: string; identity: string }) => void }) {
  const [name, setName] = useState('');
  const [identity, setIdentity] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && identity) {
      onLogin({ name, identity });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-xs mx-auto mt-32">
      <h2 className="text-xl font-bold">登录</h2>
      <input
        className="border p-2 rounded"
        placeholder="请输入姓名"
        value={name}
        onChange={e => setName(e.target.value)}
        required
      />
      <input
        className="border p-2 rounded"
        placeholder="请输入身份标识"
        value={identity}
        onChange={e => setIdentity(e.target.value)}
        required
      />
      <button type="submit" className="bg-blue-600 text-white p-2 rounded">进入</button>
    </form>
  );
} 