export const isStoreOpen = (): boolean => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours * 60 + minutes;
  
  // Store is open from 18:00 (1080 minutes) to 23:59 (1439 minutes)
  const openTime = 18 * 60; // 18:00
  const closeTime = 23 * 60 + 59; // 23:59
  
  return currentTime >= openTime && currentTime <= closeTime;
};

export const getStoreStatusText = (): string => {
  return isStoreOpen() ? 'Aberto' : 'Fechado';
};

export const getStoreHoursText = (): string => {
  return 'Seg a Dom, 18h às 00h';
};
