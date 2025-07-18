import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        alert('Account created!');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        alert('Signed in successfully!');
      }
    } catch (error) {
      alert(error.message);
    } finally {
      navigate('/'); // Redirect to home after sign up/sign in
    }
  };

  return (
    <div className='signupContainer'>
      <h2>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
      <form className='signupForm' onSubmit={handleAuth}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        /><br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        /><br />
        <button type="submit">{isSignUp ? 'Sign Up' : 'Sign In'}</button>
      </form>
      <button style={{backgroundColor: '#00bfff', borderRadius: '8px'}}onClick={() => setIsSignUp(!isSignUp)}>
        Switch to {isSignUp ? 'Sign In' : 'Sign Up'}
      </button>
    </div>
  );
}