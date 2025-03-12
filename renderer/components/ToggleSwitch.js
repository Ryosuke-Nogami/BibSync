import React from 'react';
import '../styles/toggleSwitch.css';

const ToggleSwitch = ({ id, checked, onChange, label }) => {
  return (
    <div className="toggle-switch-container">
      <label className="toggle-switch">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={onChange}
        />
        <span className="slider"></span>
      </label>
      <label htmlFor={id} className="toggle-label">{label}</label>
    </div>
  );
};

export default ToggleSwitch; 