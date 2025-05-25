import { useState, useEffect } from 'react';
import { settingsService } from '../services/firebaseService';

export const useSettings = () => {
  const [settings, setSettings] = useState({
    dailyDownloadLimit: 10,
    maxFileSize: 500,
    fshareEmail: '',
    fsharePassword: '',
    googleDriveApiKey: '',
    enableFshareVip: false,
    enableGoogleDrive: false,
    // Platform settings
    enableYoutube: true,
    enableTiktok: true,
    enableInstagram: true,
    enableFacebook: true,
    enableTwitter: true,
    enableFshare: true,
    // Fshare bandwidth tracking
    fshareDailyBandwidthLimit: 150,
    fshareUsedBandwidthToday: 0,
    fshareLastResetDate: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const result = await settingsService.getSettings();
      if (result.success) {
        setSettings(prevSettings => ({
          ...prevSettings,
          ...result.data
        }));
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSetting = (key) => {
    return settings[key];
  };

  const isFeatureEnabled = (feature) => {
    switch (feature) {
      case 'fshare':
        return settings.enableFshareVip && settings.fshareEmail && settings.fsharePassword;
      case 'googleDrive':
        return settings.enableGoogleDrive && settings.googleDriveApiKey;
      // Platform checks
      case 'youtube':
        return settings.enableYoutube;
      case 'tiktok':
        return settings.enableTiktok;
      case 'instagram':
        return settings.enableInstagram;
      case 'facebook':
        return settings.enableFacebook;
      case 'twitter':
        return settings.enableTwitter;
      default:
        return false;
    }
  };

  const checkDownloadLimit = (userDownloads) => {
    return userDownloads < settings.dailyDownloadLimit;
  };

  const checkFileSize = (fileSizeInMB) => {
    return fileSizeInMB <= settings.maxFileSize;
  };

  return {
    settings,
    loading,
    error,
    getSetting,
    isFeatureEnabled,
    checkDownloadLimit,
    checkFileSize,
    refetch: fetchSettings
  };
};

export default useSettings;
