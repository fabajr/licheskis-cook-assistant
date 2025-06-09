// src/components/profile/ProfileAvatar.jsx
import React, { useRef, useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { uploadUserAvatar } from '../../services/api/storage';

export default function ProfileAvatar({ displayName, photoUrl }) {
  const [avatarUrl, setAvatarUrl] = useState(photoUrl);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { show } = useToast();

  useEffect(() => {
    setAvatarUrl(photoUrl);
  }, [photoUrl]);

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

  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!/^image\/(jpe?g|png|gif)$/.test(file.type)) {
      show('Only image files are allowed');
      return;
    }
    try {
      setUploading(true);
      const url = await uploadUserAvatar(file);
      setAvatarUrl(url);
      show('Profile photo updated');
    } catch (err) {
      console.error('Avatar upload error:', err);
      show('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="profile-avatar text-center">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/png,image/jpeg,image/jpg,image/gif"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={displayName || 'User'}
          className="rounded-circle img-thumbnail"
          style={{ width: '150px', height: '150px', objectFit: 'cover', cursor: 'pointer' }}
          onClick={handleSelectFile}
        />
      ) : (
        <div
          className="rounded-circle d-flex justify-content-center align-items-center bg-primary text-white"
          style={{ width: '150px', height: '150px', fontSize: '3rem', margin: '0 auto', cursor: 'pointer' }}
          onClick={handleSelectFile}
        >
          {getInitials(displayName)}
        </div>
      )}

      <div className="mt-3">
        <button className="btn btn-outline-secondary" onClick={handleSelectFile} disabled={uploading}>
          {uploading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Uploading...
            </>
          ) : (
            <>
              <i className="bi bi-camera me-2"></i>
              Upload Photo
            </>
          )}
        </button>
        <div className="form-text mt-2">
          Recommended: Square image, at least 200x200px
        </div>
      </div>
    </div>
  );
}
