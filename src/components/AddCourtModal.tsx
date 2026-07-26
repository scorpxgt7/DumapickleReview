/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Court, UserProfile } from '../types';
import { X, MapPin, Building, Sun, Zap, Check, ShieldAlert, Sparkles, Image as ImageIcon, Info, Camera, FlipHorizontal, RefreshCw, Eye } from 'lucide-react';

interface AddCourtModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onCourtSubmitted: (newCourt: Court) => void;
}

const CITY_COORDINATES: Record<"Dumaguete" | "Cebu City" | "Metro Manila", { lat: number; lng: number }> = {
  "Dumaguete": { lat: 9.3090, lng: 123.2933 },
  "Cebu City": { lat: 10.3157, lng: 123.8854 },
  "Metro Manila": { lat: 14.5547, lng: 121.0244 }
};

const PRESET_COURT_IMAGES = [
  { label: 'Outdoor Multi-court', url: 'https://upload.wikimedia.org/wikipedia/commons/3/39/Outdoor_pickleball_courts.jpg' },
  { label: 'Community Court Lines', url: 'https://upload.wikimedia.org/wikipedia/commons/7/71/Pickleball_court_in_La_Crosse%2C_Wisconsin_01.jpg' },
  { label: 'Park Recreational Facility', url: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Parc_des_Moissons%2C_terrains_de_pickleball.jpg' },
  { label: 'Indoor Arena Complex', url: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/20251212_pickleball_pitch_poliforum_playa_del_carmen.jpg' },
];

const AVAILABLE_AMENITIES = [
  "Parking", "Showers", "Pro Shop", "Equipment Rental",
  "Restrooms", "Canteen", "Coaching Staff", "Spectator Benches", "Food Vendors Nearby"
];

// Utility to compress image to base64 JPEG data URL
function compressImage(file: File, maxWidth = 900, maxHeight = 900, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

export default function AddCourtModal({ isOpen, onClose, currentUser, onCourtSubmitted }: AddCourtModalProps) {
  const [name, setName] = useState("");
  const [city, setCity] = useState<"Dumaguete" | "Cebu City" | "Metro Manila">("Dumaguete");
  const [address, setAddress] = useState("");
  const [indoor, setIndoor] = useState(false);
  const [fee, setFee] = useState<"Free" | "Paid">("Free");
  const [lighting, setLighting] = useState(true);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(["Parking", "Restrooms"]);
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState(PRESET_COURT_IMAGES[0].url);
  const [isCameraPhoto, setIsCameraPhoto] = useState(false);
  const [lat, setLat] = useState<number>(CITY_COORDINATES["Dumaguete"].lat);
  const [lng, setLng] = useState<number>(CITY_COORDINATES["Dumaguete"].lng);

  const [submitting, setSubmitting] = useState(false);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Live Camera Viewfinder Modal States
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleCityChange = (newCity: "Dumaguete" | "Cebu City" | "Metro Manila") => {
    setCity(newCity);
    setLat(CITY_COORDINATES[newCity].lat);
    setLng(CITY_COORDINATES[newCity].lng);
  };

  const toggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  // Live camera stream management
  const startCameraStream = async (mode: 'environment' | 'user') => {
    setCameraError("");
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Camera stream initialization error:", err);
      setCameraError("Could not access live camera. You can still use the native device camera picker.");
    }
  };

  useEffect(() => {
    if (showCameraModal) {
      startCameraStream(facingMode);
    } else {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        setCameraStream(null);
      }
    }
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [showCameraModal, facingMode]);

  const capturePhotoFromLiveStream = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight) return;

    const canvas = document.createElement('canvas');
    canvas.width = Math.min(video.videoWidth, 900);
    canvas.height = Math.min(
      video.videoHeight,
      Math.round((video.videoHeight * 900) / video.videoWidth)
    );

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setImageUrl(dataUrl);
      setIsCameraPhoto(true);
      setShowCameraModal(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setProcessingPhoto(true);
    try {
      const compressed = await compressImage(files[0]);
      setImageUrl(compressed);
      setIsCameraPhoto(true);
    } catch (err) {
      console.error("Error processing court photo:", err);
      setErrorMsg("Failed to process photo. Please try again.");
    } finally {
      setProcessingPhoto(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Court name is required.");
      return;
    }
    if (!address.trim()) {
      setErrorMsg("Court address is required.");
      return;
    }

    setErrorMsg("");
    setSubmitting(true);

    const newCourtRecord: Omit<Court, 'id'> = {
      name: name.trim(),
      city,
      address: address.trim(),
      coordinates: { lat: Number(lat) || CITY_COORDINATES[city].lat, lng: Number(lng) || CITY_COORDINATES[city].lng },
      indoor,
      fee,
      lighting,
      amenities: selectedAmenities,
      description: description.trim() || `Newly submitted open-source pickleball court located in ${address.trim()}.`,
      image: imageUrl.trim() || PRESET_COURT_IMAGES[0].url,
      rating: 0,
      reviewCount: 0,
      status: 'pending',
      submittedBy: currentUser?.displayName || "Community Player",
      submittedByUid: currentUser?.uid || "guest-submission",
      createdAt: new Date().toISOString()
    };

    try {
      // Add to Firestore collection "courts"
      const docRef = await addDoc(collection(db, "courts"), newCourtRecord);
      const createdCourt: Court = {
        id: docRef.id,
        ...newCourtRecord
      };

      // Store in local storage fallback
      const localKey = "mock_submitted_courts";
      const existing = localStorage.getItem(localKey);
      const courtList: Court[] = existing ? JSON.parse(existing) : [];
      courtList.push(createdCourt);
      localStorage.setItem(localKey, JSON.stringify(courtList));

      setSuccessMsg("Court submitted! It is now saved and pending admin approval.");
      onCourtSubmitted(createdCourt);
      
      setTimeout(() => {
        setSubmitting(false);
        setSuccessMsg("");
        onClose();
      }, 1200);

    } catch (err) {
      console.warn("Firestore court write error, writing locally: ", err);
      const createdCourt: Court = {
        id: `local_court_${Date.now()}`,
        ...newCourtRecord
      };

      const localKey = "mock_submitted_courts";
      const existing = localStorage.getItem(localKey);
      const courtList: Court[] = existing ? JSON.parse(existing) : [];
      courtList.push(createdCourt);
      localStorage.setItem(localKey, JSON.stringify(courtList));

      setSuccessMsg("Court submitted! It is now pending admin approval.");
      onCourtSubmitted(createdCourt);

      setTimeout(() => {
        setSubmitting(false);
        setSuccessMsg("");
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Open Source Mapping
              </span>
            </div>
            <h3 className="text-xl font-display font-bold text-slate-900 dark:text-slate-100">
              Submit a Pickleball Court
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Anyone can contribute new courts. Submissions go live after admin approval.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden inputs for camera capture & file upload */}
        <input
          type="file"
          ref={cameraInputRef}
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs text-rose-700">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-700">
              <Sparkles className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Court Name */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Court Name <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Valencia Community Courts"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            {/* City */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">City / District</label>
              <select
                value={city}
                onChange={(e) => handleCityChange(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Dumaguete">Dumaguete (Negros Oriental)</option>
                <option value="Cebu City">Cebu City</option>
                <option value="Metro Manila">Metro Manila</option>
              </select>
            </div>

            {/* Fee */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Access Fee</label>
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => setFee("Free")}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                    fee === "Free" 
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                  }`}
                >
                  Free / Public
                </button>
                <button
                  type="button"
                  onClick={() => setFee("Paid")}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                    fee === "Paid" 
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                  }`}
                >
                  Paid / Rental
                </button>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Street Address / Location <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Rizal Street, near Silliman Campus, Dumaguete City"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Indoor/Outdoor & Lighting Toggles */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Court Setting</label>
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => setIndoor(false)}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                    !indoor 
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                  }`}
                >
                  Outdoor
                </button>
                <button
                  type="button"
                  onClick={() => setIndoor(true)}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                    indoor 
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                  }`}
                >
                  Indoor
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Night Lighting</label>
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => setLighting(true)}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                    lighting 
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                  }`}
                >
                  Floodlights Available
                </button>
                <button
                  type="button"
                  onClick={() => setLighting(false)}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                    !lighting 
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                  }`}
                >
                  No Lights
                </button>
              </div>
            </div>

            {/* Latitude & Longitude Coordinates */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Latitude</label>
              <input 
                type="number" 
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Longitude</label>
              <input 
                type="number" 
                step="0.0001"
                value={lng}
                onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Amenities Checkboxes */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Court Amenities</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                {AVAILABLE_AMENITIES.map((amenity) => {
                  const isChecked = selectedAmenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`flex items-center gap-2 p-2 rounded-xl text-xs text-left transition-all ${
                        isChecked 
                          ? "bg-emerald-100/70 text-emerald-900 font-bold dark:bg-emerald-900/40 dark:text-emerald-200"
                          : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                        isChecked ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-300 dark:border-slate-600"
                      }`}>
                        {isChecked && <Check className="w-3 h-3" />}
                      </div>
                      <span>{amenity}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Description & Playing Schedule</label>
              <textarea 
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Share details like open hours, court surface, local pickleball club info..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Court Photo Selection & Camera Capture */}
            <div className="space-y-3 md:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-emerald-500" />
                  Court Photo & Camera Capture
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                        setShowCameraModal(true);
                      } else {
                        cameraInputRef.current?.click();
                      }
                    }}
                    className="py-1.5 px-3 rounded-xl text-xs font-bold bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-1.5 transition-all"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Snap Camera Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="py-1.5 px-3 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-all"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>Upload Photo</span>
                  </button>
                </div>
              </div>

              {processingPhoto && (
                <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2 py-1">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Compressing photo for quick loading...
                </div>
              )}

              {/* Selected/Captured Photo Preview Card */}
              {imageUrl && (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-[16/9] max-h-48 group bg-slate-900">
                  <img 
                    src={imageUrl} 
                    alt="Court photo preview" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PRESET_COURT_IMAGES[0].url;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 p-3 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      {isCameraPhoto ? (
                        <span className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                          <Camera className="w-3 h-3" /> Camera Photo Attached
                        </span>
                      ) : (
                        <span className="bg-slate-900/80 text-slate-200 text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
                          Stock / URL Photo
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Manual URL input fallback */}
              <div className="space-y-1.5">
                <input 
                  type="url" 
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setIsCameraPhoto(false);
                  }}
                  placeholder="Or paste an Image URL..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="flex flex-wrap gap-2 pt-0.5">
                  <span className="text-[10px] text-slate-400 self-center">Stock Presets:</span>
                  {PRESET_COURT_IMAGES.map((img) => (
                    <button
                      key={img.label}
                      type="button"
                      onClick={() => {
                        setImageUrl(img.url);
                        setIsCameraPhoto(false);
                      }}
                      className={`text-[10px] px-2 py-1 rounded-lg border transition-colors ${
                        imageUrl === img.url 
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800 font-bold"
                          : "bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {img.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || processingPhoto}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Submit Court for Approval</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* LIVE CAMERA VIEWFINDER MODAL */}
        {showCameraModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col">
              {/* Camera Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-emerald-400 animate-pulse" />
                  <h3 className="font-bold text-sm">Capture Court Photo</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCameraModal(false)}
                  className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Viewfinder Canvas / Video Feed */}
              <div className="relative bg-black aspect-[4/3] w-full flex items-center justify-center overflow-hidden">
                {cameraError ? (
                  <div className="p-6 text-center text-rose-400 space-y-3">
                    <ShieldAlert className="w-8 h-8 mx-auto" />
                    <p className="text-xs">{cameraError}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCameraModal(false);
                        cameraInputRef.current?.click();
                      }}
                      className="bg-emerald-600 text-white text-xs font-bold py-2 px-4 rounded-xl hover:bg-emerald-500"
                    >
                      Use Native Camera Picker
                    </button>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Camera Controls Footer */}
              <div className="p-5 bg-slate-900 flex items-center justify-around gap-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() =>
                    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
                  }
                  className="p-3 rounded-full bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
                  title="Switch Camera"
                >
                  <FlipHorizontal className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={capturePhotoFromLiveStream}
                  disabled={Boolean(cameraError)}
                  className="w-16 h-16 rounded-full bg-white text-slate-900 flex items-center justify-center border-4 border-emerald-500 hover:scale-105 active:scale-95 transition-all shadow-lg font-bold disabled:opacity-50"
                  title="Take Photo"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                    <Camera className="w-6 h-6" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCameraModal(false)}
                  className="py-2 px-4 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
