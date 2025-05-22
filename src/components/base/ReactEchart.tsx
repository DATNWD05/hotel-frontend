import { forwardRef } from 'react';
import { Box } from '@mui/material';
import type { BoxProps } from '@mui/material';

import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

export interface ReactEchartProps extends BoxProps {
  option: EChartsOption;
}

const ReactEchart = forwardRef<HTMLDivElement, ReactEchartProps>(({ option, ...rest }, ref) => {
  return (
    <Box component={ReactECharts} ref={ref} option={{
      ...option,
      tooltip: {
        ...option.tooltip,
        confine: true,
      },
    }} {...rest} />
  );
});

export default ReactEchart;
