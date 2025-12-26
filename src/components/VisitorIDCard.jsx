import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';

const VisitorIDCard = ({ name, email, phone, visitorId }) => {
  const printRef = useRef();
  const [photo, setPhoto] = useState(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const webcamRef = useRef();

  const capturePhoto = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setPhoto(imageSrc);
    setShowWebcam(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result);
      reader.readAsDataURL(file);
    }
  };  
            
  const handlePrint = () => {
    const printContent = printRef.current;
    const win = window.open('', '', 'width=800,height=600');
    win.document.write(`
      <html>
        <head>
          <title>Print ID Card</title>
          <style>
            body { font-family: 'Poppins', sans-serif; margin: 0; padding: 20px; }
            .card { width: 360px; height: 220px; border-radius: 16px; border: 1px solid #ccc; box-shadow: 0 0 10px rgba(0,0,0,0.1); overflow: hidden; }
            .header { background: linear-gradient(to right, #4b0082, #1e3a8a); color: white; padding: 16px; display: flex; justify-content: space-between; align-items: center; }
            .logo { font-size: 20px; font-weight: bold; color: #FFD700; }
            .photo { width: 56px; height: 56px; border-radius: 9999px; overflow: hidden; border: 2px solid white; background: white; }
            .photo img { width: 100%; height: 100%; object-fit: cover; }
            .divider { height: 5px; background: linear-gradient(to right, #1e3a8a, #06b6d4, #1e3a8a); }
            .body { padding: 16px; display: grid; grid-template-columns: repeat(2, 1fr); row-gap: 12px; font-size: 14px; }
            .label { color: #888; font-size: 10px; }
            .value { color: #1e3a8a; font-weight: 500; }
            .footer { padding-left: 16px; padding-bottom: 12px; font-size: 14px; font-weight: 600; color: #1e3a8a; }
          </style>
        </head>
        <body>${printContent.innerHTML}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* ID Card */}
      <div
        ref={printRef}
        className="relative bg-white text-black w-[360px] h-[220px] rounded-2xl shadow-lg border border-gray-200 overflow-hidden font-poppins card"
      >
        {/* Header */}
        <div className="flex justify-between items-center bg-gradient-to-r from-indigo-800 to-blue-700 p-4 text-white">
          <div className="text-xl font-bold tracking-wide text-yellow-300">PSG VPass</div>
          <div className="w-14 h-14 rounded-full border-2 border-white overflow-hidden bg-white flex items-center justify-center">
            {photo ? (
              <img src={photo} alt="Visitor" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-gray-600">Photo</span>
            )}
          </div>
        </div>
        {/* Decorative divider */}
        <div className="w-full h-[5px] bg-gradient-to-r from-blue-700 via-cyan-500 to-blue-700" />

        {/* Body */}
        <div className="p-4 grid grid-cols-2 gap-y-3 text-sm">
          <div>
            <p className="text-gray-500 text-xs">Visitor ID</p>
            <p className="font-medium text-blue-900">{visitorId || '000000000000'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Email</p>
            <p className="font-medium text-blue-900 truncate">{email || 'your@email.com'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Phone</p>
            <p className="font-medium text-blue-900">{phone || '0000 0000 000'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Issued On</p>
            <p className="font-medium text-blue-900">{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Footer - Name */}
        <div className="absolute bottom-2 left-4 text-blue-800 font-semibold text-md tracking-wide">
          {name || 'Your Name Here'}
        </div>
      </div>

      {/* Upload / Capture Buttons */}
      <div className="flex flex-col items-center space-y-3">
        <div className="flex gap-3">
          <label className="px-4 py-2 bg-gray-200 text-sm rounded cursor-pointer hover:bg-gray-300">
            Upload Photo
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={() => setShowWebcam(!showWebcam)}
            className="px-4 py-2 bg-gray-200 text-sm rounded hover:bg-gray-300"
          >
            {showWebcam ? 'Cancel Camera' : 'Take Photo'}
          </button>
        </div>

        {showWebcam && (   
          <div className="flex flex-col items-center space-y-2">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="rounded-lg border border-gray-300"
              width={220}              
              height={160}
            />         
            <button
              onClick={capturePhoto}
              className="bg-indigo-600 text-white px-4 py-1 rounded hover:bg-indigo-700"
            >
              Capture Photo
            </button>
          </div>
        )}
         
        {/* Print Button */}
        <button
          onClick={handlePrint}
          className="px-6 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition duration-200 shadow"
        >
          Print ID Card
        </button>
      </div>
    </div>
  );
};

export default VisitorIDCard;



