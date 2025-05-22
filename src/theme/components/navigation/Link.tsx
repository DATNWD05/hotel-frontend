import type { Components, Theme } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';
import type { LinkProps as RouterLinkProps } from 'react-router-dom';
import { forwardRef } from 'react';

const LinkBehavior = forwardRef<
  HTMLAnchorElement,
  Omit<RouterLinkProps, 'to'> & { href: RouterLinkProps['to'] }
>((props, ref) => {
  const { href, ...other } = props;
  return <RouterLink ref={ref} to={href} {...other} />;
});

const Link: Components<Omit<Theme, 'components'>>['MuiLink'] = {
  defaultProps: {
    underline: 'none',
    component: LinkBehavior,
  },
};

export default Link;
