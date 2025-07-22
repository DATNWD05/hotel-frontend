import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogTitle, DialogContent, DialogActions, Slider, Button, Box, Typography } from '@mui/material';

type Props = {
  open: boolean;
  imageSrc: string;
  onClose: () => void;
  onDone: (blob: Blob) => void;
};

type Area = { x: number; y: number; width: number; height: number };

async function getCroppedImg(imageSrc: string, crop: Area, rotation = 0): Promise<Blob> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((r) => (image.onload = r));

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const radians = rotation * Math.PI / 180;

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;
  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate(radians);
  ctx.translate(-safeArea / 2, -safeArea / 2);
  ctx.drawImage(image, (safeArea - image.width) / 2, (safeArea - image.height) / 2);

  const data = ctx.getImageData(0, 0, safeArea, safeArea);
  canvas.width = crop.width;
  canvas.height = crop.height;
  ctx.putImageData(
    data,
    Math.round(-safeArea / 2 + image.width / 2 - crop.x),
    Math.round(-safeArea / 2 + image.height / 2 - crop.y)
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob as Blob), 'image/jpeg', 0.9);
  });
}

const CropperDialog: React.FC<Props> = ({ open, imageSrc, onClose, onDone }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleDone = async () => {
    if (!croppedAreaPixels) return;
    const blob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
    onDone(blob);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Cắt & chỉnh ảnh</DialogTitle>
      <DialogContent sx={{ position: 'relative', height: 400, background: '#333' }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={1}
          onCropChange={setCrop}
          onRotationChange={setRotation}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </DialogContent>
      <Box px={3} py={2}>
        <Typography variant="caption">Zoom</Typography>
        <Slider value={zoom} min={1} max={3} step={0.1} onChange={(_, v) => setZoom(v as number)} />
        <Typography variant="caption">Rotation</Typography>
        <Slider value={rotation} min={0} max={360} step={1} onChange={(_, v) => setRotation(v as number)} />
      </Box>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button onClick={handleDone} variant="contained">Xong</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CropperDialog;
