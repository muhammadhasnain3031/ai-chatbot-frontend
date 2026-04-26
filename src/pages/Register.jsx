import React, { useState } from 'react';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { setCredentials } from '../store/authSlice';

const API = process.env.REACT_APP_API_URL || 'https://ai-chatbot-backend-sand-beta.vercel.app';


export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm]   = useState({ name:'', email:'', password:'' });
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    try {
      const { data } = await axios.post(`${API}/api/auth/register`, form);
      dispatch(setCredentials(data));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Error');
    }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0d0d0d' }}>
      <div style={{ background:'#1a1a1a', padding:'40px', borderRadius:'16px', width:'100%', maxWidth:'380px', border:'1px solid #333' }}>
        <div style={{ textAlign:'center', marginBottom:'28px' }}>
          <p style={{ fontSize:'32px', marginBottom:'8px' }}>🤖</p>
          <h2 style={{ color:'#fff', fontSize:'22px' }}>Create Account</h2>
        </div>

        {error && <div style={{ background:'#2a1515', color:'#ff6b6b', padding:'10px', borderRadius:'8px', marginBottom:'16px', fontSize:'13px' }}>{error}</div>}

        {['name','email','password'].map(f => (
          <input key={f} type={f==='password'?'password':f==='email'?'email':'text'}
            placeholder={f.charAt(0).toUpperCase()+f.slice(1)}
            value={form[f]} onChange={e => setForm({...form, [f]: e.target.value})}
            style={{ width:'100%', padding:'12px 14px', marginBottom:'12px', background:'#222', border:'1px solid #333', borderRadius:'8px', color:'#fff', fontSize:'14px', boxSizing:'border-box', outline:'none' }}
          />
        ))}

        <button onClick={handleSubmit}
          style={{ width:'100%', padding:'12px', background:'#10a37f', color:'#fff', border:'none', borderRadius:'8px', fontSize:'15px', fontWeight:'600', cursor:'pointer' }}>
          Sign Up
        </button>
        <p style={{ textAlign:'center', marginTop:'20px', fontSize:'13px', color:'#666' }}>
          Have account? <Link to="/login" style={{ color:'#10a37f', fontWeight:'500' }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}