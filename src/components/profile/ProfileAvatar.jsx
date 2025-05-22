// src/components/profile/ProfileAvatar.jsx
import React from 'react';

export default function ProfileAvatar({ displayName, photoUrl }) {
  // Generate initials from display name
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="profile-avatar">
      {photoUrl ? (
        <img 
          src={photoUrl} 
          alt={displayName || 'User'} 
          className="rounded-circle img-thumbnail" 
          style={{ width: '150px', height: '150px', objectFit: 'cover' }}
        />
      ) : (
        <div 
          className="rounded-circle d-flex justify-content-center align-items-center bg-primary text-white"
          style={{ width: '150px', height: '150px', fontSize: '3rem', margin: '0 auto' }}
        >
          {getInitials(displayName)}
        </div>
      )}
      
      <div className="mt-3">
        <button className="btn btn-outline-secondary">
          <i className="bi bi-camera me-2"></i>
          Upload Photo
        </button>
        <div className="form-text mt-2">
          Recommended: Square image, at least 200x200px
        </div>
      </div>
    </div>
  );
}
