
import React, { useEffect } from 'react';
import { fixLeafletIconPaths } from '@/utils/leafletUtils';

const FixLeafletIcon = () => {
  useEffect(() => {
    fixLeafletIconPaths();
  }, []);
  
  return null;
};

export default FixLeafletIcon;
