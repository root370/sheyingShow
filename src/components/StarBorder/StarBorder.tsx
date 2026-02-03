import styles from './StarBorder.module.css';
import { ElementType, ReactNode, CSSProperties } from 'react';

interface StarBorderProps {
  as?: ElementType;
  className?: string;
  color?: string;
  speed?: string;
  thickness?: number;
  children?: ReactNode;
  style?: CSSProperties;
  [key: string]: any;
}

const StarBorder = ({
  as: Component = 'button',
  className = '',
  color = 'white',
  speed = '6s',
  thickness = 1,
  children,
  style,
  ...rest
}: StarBorderProps) => {
  return (
    <Component
      className={`${styles['star-border-container']} ${className}`}
      style={{
        padding: `${thickness}px 0`,
        ...style
      }}
      {...rest}
    >
      <div
        className={styles['border-gradient-bottom']}
        style={{
          background: `radial-gradient(circle, ${color} 10%, transparent 60%)`,
          animationDuration: speed
        }}
      ></div>
      <div
        className={styles['border-gradient-top']}
        style={{
          background: `radial-gradient(circle, ${color} 10%, transparent 60%)`,
          animationDuration: speed
        }}
      ></div>
      <div className={styles['inner-content']}>{children}</div>
    </Component>
  );
};

export default StarBorder;