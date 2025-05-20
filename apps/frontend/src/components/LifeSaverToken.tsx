"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LifeSaverToken = LifeSaverToken;
exports.LifeSaverTokenContainer = LifeSaverTokenContainer;
import react_1 from 'react';
import framer_motion_1 from 'framer-motion';
function LifeSaverToken({ position, onTransfer, color = '#FF6B6B' }) {
    const [isHovered, setIsHovered] = react_1.default.useState(false);
    const [isClicked, setIsClicked] = react_1.default.useState(false);
    const [showSuccess, setShowSuccess] = react_1.default.useState(false);
    const handleClick = () => {
        setIsClicked(true);
        onTransfer();
        setTimeout(() => {
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                setIsClicked(false);
            }, 1500);
        }, 500);
    };
    return (<div className="relative">
      <framer_motion_1.motion.div className="lifesaver-token" style={{
            left: `${10 + (position * 40)}px`,
        }} initial={{ scale: 1, rotate: 0 }} animate={{
            scale: isClicked ? [1.1, 0.8, 0] : isHovered ? 1.1 : 1,
            rotate: isClicked ? [15, -15, 360] : isHovered ? 15 : 0,
        }} transition={{
            duration: isClicked ? 0.5 : 0.2,
            ease: "easeInOut"
        }} onHoverStart={() => setIsHovered(true)} onHoverEnd={() => setIsHovered(false)} onClick={handleClick}>
        <div className="relative w-8 h-8 group"> 
          <div className="absolute inset-0 rounded-full shadow-lg transition-shadow duration-200 group-hover:shadow-xl" style={{ backgroundColor: color }}/>
          <div className="absolute inset-2 bg-white rounded-full shadow-inner"> 
            <div className="absolute inset-1 rounded-full" style={{ backgroundColor: color }}/>
          </div>
          
          <framer_motion_1.motion.div className="absolute inset-0 rounded-full" initial={{ opacity: 0 }} animate={{ opacity: isHovered ? 0.5 : 0 }} style={{
            background: `radial-gradient(circle, ${color}33 0%, transparent 70%)`
        }}/>

          <framer_motion_1.AnimatePresence>
            {isHovered && (<framer_motion_1.motion.div className="absolute inset-0 rounded-full" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1.2, opacity: 0.3 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, repeat: Infinity }} style={{ backgroundColor: color }}/>)}
          </framer_motion_1.AnimatePresence>
        </div>
      </framer_motion_1.motion.div>

      <framer_motion_1.AnimatePresence>
        {showSuccess && (<framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="absolute right-10 top-1/2 transform -translate-y-1/2 bg-green-500 text-white px-2 py-0.5 rounded-full text-xs whitespace-nowrap shadow-lg">
            Token transferred!
          </framer_motion_1.motion.div>)}
      </framer_motion_1.AnimatePresence>
    </div>);
}
function LifeSaverTokenContainer({ tokens, onTransfer }) {
    const colors = [
        '#FF6B6B',
        '#4ECDC4',
        '#FFE66D',
        '#95E1D3',
        '#FF8B94',
        '#A8E6CF',
        '#DCD6F7',
        '#F7D794',
        '#B8E9C0',
        '#F6C6EA'
    ];
    return (<div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t py-2 px-4 flex justify-center">
      <div className="token-container relative h-8"> 
        <framer_motion_1.AnimatePresence>
          {Array.from({ length: tokens }).map((_, index) => (<framer_motion_1.motion.div key={index} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} transition={{ delay: index * 0.1 }}>
              <LifeSaverToken position={index} onTransfer={() => onTransfer(index)} color={colors[index % colors.length]}/>
            </framer_motion_1.motion.div>))}
        </framer_motion_1.AnimatePresence>
      </div>
    </div>);
}
export {};
//# sourceMappingURL=LifeSaverToken.js.map