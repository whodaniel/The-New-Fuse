"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppStack_LifeSaverToken = AppStack_LifeSaverToken;
exports.AppStack_LifeSaverTokenContainer = AppStack_LifeSaverTokenContainer;
import react_1 from 'react';
import react_spring_1 from 'react-spring';
function AppStack_LifeSaverToken({ position, onTransfer, color = '#FF6B6B' }) {
    const [isHovered, setIsHovered] = (0, react_1.useState)(false);
    const [isClicked, setIsClicked] = (0, react_1.useState)(false);
    const [showSuccess, setShowSuccess] = (0, react_1.useState)(false);
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
    const animationProps = (0, react_spring_1.useSpring)({
        config: { duration: isClicked ? 500 : 200, easing: 'easeInOut' },
        scale: isClicked ? [1.1, 0.8, 1] : isHovered ? 1.1 : 1,
        rotate: isClicked ? [15, -15, 0] : isHovered ? 15 : 0,
    });
    return (<div className="relative">
      <react_spring_1.animated.div className="lifesaver-token" style={{
            left: `${10 + (position * 40)}px`,
            transform: animationProps.transform.interpolate((scale, rotate) => `scale(${scale}) rotate(${rotate}deg)`),
        }} onPointerEnter={() => setIsHovered(true)} onPointerLeave={() => setIsHovered(false)} onClick={handleClick}>
        <div className="relative w-8 h-8 group">
          <div className="absolute inset-0 rounded-full shadow-lg transition-shadow duration-200 group-hover:shadow-xl" style={{ backgroundColor: color }}/>
          <div className="absolute inset-2 bg-white rounded-full shadow-inner">
            <div className="absolute inset-1 rounded-full" style={{ backgroundColor: color }}/>
          </div>
          
          <react_spring_1.animated.div className="absolute inset-0 rounded-full" style={{
            opacity: animationProps.opacity.interpolate(opacity => opacity),
            background: `radial-gradient(circle, ${color}33 0%, transparent 70%)`
        }}/>

          {isHovered && (<react_spring_1.animated.div className="absolute inset-0 rounded-full" style={{
                transform: animationProps.transform.interpolate((scale) => `scale(${scale})`),
                opacity: animationProps.opacity.interpolate(opacity => opacity * 0.3),
                backgroundColor: color
            }}/>)}
        </div>
      </react_spring_1.animated.div>

      {showSuccess && (<div className="absolute right-10 top-1/2 transform -translate-y-1/2 bg-green-500 text-white px-2 py-0.5 rounded-full text-xs whitespace-nowrap shadow-lg">
          Token transferred!
        </div>)}
    </div>);
}
function AppStack_LifeSaverTokenContainer({ tokens, onTransfer }) {
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
        {Array.from({ length: tokens }).map((_, index) => (<AppStack_LifeSaverToken key={index} position={index} onTransfer={() => onTransfer(index)} color={colors[index % colors.length]}/>))}
      </div>
    </div>);
}
export {};
//# sourceMappingURL=AppStack_LifeSaverToken.js.map