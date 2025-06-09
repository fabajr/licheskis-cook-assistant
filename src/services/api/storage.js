import { storage, db, auth } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';

/**
 * Uploads the given file as the user's avatar and updates the Firestore profile.
 * @param {File} file - Image file to upload.
 * @returns {Promise<string>} The download URL of the uploaded image.
 */
export const uploadUserAvatar = async (file) => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');

  const ext = file.name.split('.').pop();
  const storageRef = ref(storage, `avatars/${userId}.${ext}`);

  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  await updateDoc(doc(db, 'users', userId), { photo_url: url });
  return url;
};
