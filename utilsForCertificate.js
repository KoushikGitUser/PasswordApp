import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CERT_INFO_KEY = 'CERTIFICATE_INFO';
export const CERT_IMAGE_KEY = 'CERTIFICATE_IMAGE';

export const saveCertificate = async (infoObject, imagePath) => {
  try {
    const existingInfos = await SecureStore.getItemAsync(CERT_INFO_KEY);
    const infoArray = existingInfos ? JSON.parse(existingInfos) : [];
    infoArray.push(infoObject);
    await SecureStore.setItemAsync(CERT_INFO_KEY, JSON.stringify(infoArray));

    const existingImages = await AsyncStorage.getItem(CERT_IMAGE_KEY);
    const imageArray = existingImages ? JSON.parse(existingImages) : [];
    imageArray.push(imagePath);
    await AsyncStorage.setItem(CERT_IMAGE_KEY, JSON.stringify(imageArray));

    return true;

  } catch (error) {
    console.error('Error saving certificate:', error);
    return false;
  }
};

export const fetchCertificates = async () => {
  try {
    const infos = await SecureStore.getItemAsync(CERT_INFO_KEY);
    const images = await AsyncStorage.getItem(CERT_IMAGE_KEY);

    const infoArray = infos ? JSON.parse(infos) : [];
    const imageArray = images ? JSON.parse(images) : [];

    // Combine info and image paths by index
    const combined = infoArray.map((info, index) => ({
      ...info,
      imageUri: imageArray[index] || null,
    }));

    return combined;

  } catch (error) {
    console.error('Error fetching certificates:', error);
    return [];
  }
};


export const deleteCertificateByIndex = async (index) => {
  try {
    const infos = await SecureStore.getItemAsync(CERT_INFO_KEY);
    const images = await AsyncStorage.getItem(CERT_IMAGE_KEY);

    let infoArray = infos ? JSON.parse(infos) : [];
    let imageArray = images ? JSON.parse(images) : [];

    if (index < 0 || index >= infoArray.length) {
      console.warn('Invalid index for deletion.');
      return false;
    }

    // Remove the item at the given index
    infoArray.splice(index, 1);
    imageArray.splice(index, 1);

    await SecureStore.setItemAsync(CERT_INFO_KEY, JSON.stringify(infoArray));
    await AsyncStorage.setItem(CERT_IMAGE_KEY, JSON.stringify(imageArray));

    return true;

  } catch (error) {
    console.error('Error deleting certificate:', error);
    return false;
  }
};


export const editCertificateByIndex = async (index, newInfo, newImagePath = null) => {
  try {
    const infos = await SecureStore.getItemAsync(CERT_INFO_KEY);
    const images = await AsyncStorage.getItem(CERT_IMAGE_KEY);

    let infoArray = infos ? JSON.parse(infos) : [];
    let imageArray = images ? JSON.parse(images) : [];

    if (index < 0 || index >= infoArray.length) {
      console.warn('Invalid index for editing.');
      return false;
    }

    // Update info
    infoArray[index] = newInfo;

    // Update image path only if new image is provided
    if (newImagePath) {
      imageArray[index] = newImagePath;
    }

    await SecureStore.setItemAsync(CERT_INFO_KEY, JSON.stringify(infoArray));
    await AsyncStorage.setItem(CERT_IMAGE_KEY, JSON.stringify(imageArray));

    return true;

  } catch (error) {
    console.error('Error editing certificate:', error);
    return false;
  }
};

export const deleteAllCertificates = async () => {
  try {
    // Clear SecureStore (certificate infos)
    await SecureStore.deleteItemAsync(CERT_INFO_KEY);

    // Clear AsyncStorage (image paths)
    await AsyncStorage.removeItem(CERT_IMAGE_KEY);

    return true;

  } catch (error) {
    console.error('Error deleting all certificates:', error);
    return false;
  }
};
