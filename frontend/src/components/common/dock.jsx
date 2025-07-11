import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import {
  Children,
  cloneElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

function DockItem({
  children,
  className = "",
  onClick,
  mouseX,
  spring,
  distance,
  magnification,
  baseItemSize,
  isActive = false,
}) {
  const ref = useRef(null);
  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mouseX, (val) => {
    const rect = ref.current?.getBoundingClientRect() ?? {
      x: 0,
      width: baseItemSize,
    };
    return val - rect.x - baseItemSize / 2;
  });

  const targetSize = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [baseItemSize, magnification, baseItemSize]
  );
  const size = useSpring(targetSize, spring);

  return (
    <motion.div
      ref={ref}
      style={{
        width: size,
        height: size,
      }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={onClick}
      className={`
        relative inline-flex items-center justify-center rounded-2xl shadow-lg cursor-pointer
        transition-colors duration-200 border-2
        ${isActive 
          ? 'bg-blue-600 border-blue-400 text-white' 
          : 'bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600'
        }
        ${className}
      `}
      tabIndex={0}
      role="button"
      aria-label="Navigation item"
    >
      {Children.map(children, (child) =>
        cloneElement(child, { isHovered, isActive })
      )}
    </motion.div>
  );
}

function DockLabel({ children, className = "", ...rest }) {
  const { isHovered } = rest;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = isHovered.on("change", (latest) => {
      setIsVisible(latest === 1);
    });
    return () => unsubscribe();
  }, [isHovered]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 0, scale: 0.8 }}
          animate={{ opacity: 1, y: -15, scale: 1 }}
          exit={{ opacity: 0, y: 0, scale: 0.8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={`
            ${className} 
            absolute -top-12 left-1/2 w-fit whitespace-nowrap
            rounded-lg border border-gray-600 bg-gray-800 backdrop-blur-sm
            px-3 py-1 text-sm text-white font-medium shadow-xl
            pointer-events-none z-50
          `}
          style={{ x: "-50%" }}
          role="tooltip"
        >
          {children}
          {/* Flecha del tooltip */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DockIcon({ children, className = "", isActive = false }) {
  return (
    <div className={`flex items-center justify-center transition-transform duration-200 ${isActive ? 'scale-110' : ''} ${className}`}>
      {children}
    </div>
  );
}

export default function Dock({
  items,
  className = "",
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 70,
  distance = 200,
  panelHeight = 68,
  dockHeight = 256,
  baseItemSize = 50,
}) {
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  const maxHeight = useMemo(
    () => Math.max(dockHeight, magnification + magnification / 2 + 4),
    [magnification, dockHeight]
  );
  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <motion.div
        style={{ height, scrollbarWidth: "none" }}
        className="mx-auto flex max-w-full items-end justify-center pb-4 pointer-events-none"
      >
        <motion.div
          onMouseMove={({ pageX }) => {
            isHovered.set(1);
            mouseX.set(pageX);
          }}
          onMouseLeave={() => {
            isHovered.set(0);
            mouseX.set(Infinity);
          }}
          className={`
            ${className} 
            flex items-center w-fit gap-3 rounded-2xl 
            bg-gray-900/80 backdrop-blur-md border-2 border-gray-700/50
            shadow-2xl p-3 pointer-events-auto
          `}
          style={{ minHeight: panelHeight }}
          role="toolbar"
          aria-label="Application dock"
        >
          {items.map((item, index) => (
            <DockItem
              key={item.key || index}
              onClick={item.onClick}
              className={item.className}
              mouseX={mouseX}
              spring={spring}
              distance={distance}
              magnification={magnification}
              baseItemSize={baseItemSize}
              isActive={item.isActive}
            >
              <DockIcon isActive={item.isActive}>{item.icon}</DockIcon>
              <DockLabel>{item.label}</DockLabel>
            </DockItem>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}