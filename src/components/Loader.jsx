import React from 'react';
import { ClipLoader } from 'react-spinners';

export default function Loader({size=30}) {
  return <div className="flex items-center justify-center"><ClipLoader size={size} /></div>;
}
