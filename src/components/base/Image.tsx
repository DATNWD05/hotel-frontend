import { Box } from '@mui/material';
import type { SxProps } from '@mui/material';

import type { ImgHTMLAttributes } from 'react';


interface ImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  sx?: SxProps;
}

const Image = ({ sx, ...rest }: ImageProps) => {
  return <Box component="img" sx={sx} {...rest} />;
};

export default Image;
