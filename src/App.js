import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import logo from './assets/logo.png';
import logoBlue from './assets/logo_blue.png'; // Import the new logo for light mode

// Import html2pdf.js and the new Report component
import html2pdf from 'html2pdf.js/dist/html2pdf.min.js';
import Report from './Report.js';

// Import translations from the new dedicated file
import { translations, langNames } from './translations.js';


// --- UTILITY FUNCTIONS ---

// Vector math helpers
const toCartesian = (mag, deg) => {
    const rad = deg * Math.PI / 180;
    return { x: mag * Math.cos(rad), y: mag * Math.sin(rad) };
};

const toPolar = (x, y) => {
    const mag = Math.sqrt(x * x + y * y);
    if (mag < 1e-9) return { mag: 0, deg: 0 };
    return {
        mag: mag,
        deg: (Math.atan2(y, x) * 180 / Math.PI + 360) % 360,
    };
};


const calculateDirectCoefficients = (history, rotorType) => {
    const currentStepIndex = history.length - 1;
    if (currentStepIndex < 1) return { isCalculable: false };

    const initialState = history[0];
    const currentState = history[currentStepIndex];

    if (!currentState.userInput || !initialState.userInput) return { isCalculable: false };

    const v1 = toCartesian(initialState.amplitude, initialState.phaseDeg);
    const v2 = toCartesian(currentState.amplitude, currentState.phaseDeg);
    const deltaV = toPolar(v2.x - v1.x, v2.y - v1.y);

    if (deltaV.mag < 0.01) return { isCalculable: false };

    let totalDeltaWx = 0;
    let totalDeltaWy = 0;

    if (rotorType === 'main') {
        const bladeConfig = { Yellow: 0, Green: 240, Red: 120 };
        const initialWeights = initialState.currentWeights;
        const currentWeights = currentState.currentWeights;
        
        Object.keys(bladeConfig).forEach(color => {
            const deltaWeight = currentWeights[color] - initialWeights[color];
            if (deltaWeight !== 0) {
                 const w_vec = toCartesian(deltaWeight, bladeConfig[color]);
                 totalDeltaWx += w_vec.x;
                 totalDeltaWy += w_vec.y;
            }
        });

    } else { // rotorType === 'tail'
        const screwCount = 7;
        const screwAngles = Array.from({length: screwCount}, (_, i) => (360 / screwCount) * i + (360 / (2 * screwCount)));
        const smallWasherWeight = 0.7;
        const largeWasherWeight = 2.0;
        const initialWashers = initialState.currentWashers;
        const currentWashers = currentState.currentWashers;

        for (let i = 0; i < screwCount; i++) {
            const initialWeight = (initialWashers[i].small * smallWasherWeight) + (initialWashers[i].large * largeWasherWeight);
            const currentWeight = (currentWashers[i].small * smallWasherWeight) + (currentWashers[i].large * largeWasherWeight);
            const deltaWeight = currentWeight - initialWeight;
            
            if (deltaWeight !== 0) {
                const w_vec = toCartesian(deltaWeight, screwAngles[i]);
                totalDeltaWx += w_vec.x;
                totalDeltaWy += w_vec.y;
            }
        }
    }
    
    const deltaW = toPolar(totalDeltaWx, totalDeltaWy);
    
    if (deltaW.mag < 0.01) return { isCalculable: false };

    const K = deltaW.mag / deltaV.mag;
    const Phi = (deltaV.deg - deltaW.deg + 360) % 360;

    return { K, Phi, isCalculable: true };
};

const calculateNiceSteps = (maxValue, numTicks) => {
    if (maxValue <= 0) return [];

    const roughStep = maxValue / numTicks;
    const niceMultipliers = [1, 2, 2.5, 5, 10];
    
    const powerOf10 = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const normalizedStep = roughStep / powerOf10;

    const niceNormalizedStep = niceMultipliers.find(m => m >= normalizedStep) || 10;
    const step = niceNormalizedStep * powerOf10;

    const steps = [];
    for (let i = step; i <= maxValue; i += step) {
        const roundedStep = parseFloat(i.toPrecision(10));
        steps.push(roundedStep);
    }
    return steps;
};


const roundToHalf = (num) => Math.round(num * 2) / 2;

const parseNumber = (str) => {
    if (typeof str === 'number') return str;
    if (typeof str !== 'string') return 0;
    return parseFloat(str.replace(',', '.')) || 0;
};

const timeToDegrees = (timeStr) => {
    if (!timeStr || !timeStr.includes(':')) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours * 30 + minutes * 0.5);
};

const degreesToTime = (degrees) => {
    const d = parseFloat(degrees) || 0;
    const totalMinutes = (d % 360) / 360 * 12 * 60;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    return `${formattedHours}:${formattedMinutes}`;
};

// --- UI COMPONENTS ---
const ClearButton = ({ onClear, show }) => {
    if (!show) return null;
    return (
        <button
            type="button"
            onClick={onClear}
            className="absolute right-0 top-0 bottom-0 flex items-center pr-3 text-gray-500 hover:text-red-500"
            aria-label="Clear input"
        >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
        </button>
    );
};

const DecimalInput = ({ value, onChange, ...props }) => {
    const [displayValue, setDisplayValue] = useState(String(value));
    useEffect(() => { setDisplayValue(String(value)); }, [value]);

    const handleChange = (e) => {
        setDisplayValue(e.target.value);
        onChange(parseNumber(e.target.value));
    };

    const handleClear = () => {
        setDisplayValue('0');
        onChange(0);
    };

    return (
        <div className="relative">
            <input
                type="text"
                inputMode="decimal"
                value={displayValue}
                onChange={handleChange}
                {...props}
                className={`pr-8 ${props.className || ''}`}
             />
             <ClearButton
                onClear={handleClear}
                show={parseNumber(displayValue) !== 0 && !props.disabled}
            />
        </div>
    );
};

const TailRotorInputHeader = ({ t }) => (
    <div className="flex items-center justify-end pr-3 pb-1">
         <div className="flex items-center space-x-2">
             <div className="w-14 text-center"><span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t.small}</span></div>
             <div className="w-14 text-center"><span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t.large}</span></div>
         </div>
    </div>
);

const TailScrewWeightInput = ({ number, washers, onWasherChange, isEditable }) => {
    const hasNoWeight = washers.small === 0 && washers.large === 0;
    const rowClasses = hasNoWeight ? 'opacity-50' : '';
    return (
        <div className={`flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg transition-opacity duration-300 ${rowClasses}`}>
            <div className="flex items-center">
                <div className="relative w-8 h-8 mr-3">
                    <svg viewBox="0 0 24 24" className="w-full h-full text-gray-400 dark:text-gray-500 fill-current"><path d="M17.656,3.656 L12,2 L6.344,3.656 L2,8.344 L3.656,14 L2,19.656 L6.344,21.344 L12,23 L17.656,21.344 L22,19.656 L20.344,14 L22,8.344 L17.656,3.656 Z"></path></svg>
                    <span className="absolute inset-0 flex items-center justify-center font-bold text-gray-800 dark:text-white">{number}</span>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                {[ 'small', 'large' ].map(type => {
                    const textColor = washers[type] > 0 ? 'text-sky-600 dark:text-sky-400 font-black text-lg' : 'text-gray-900 dark:text-white';
                    return (
                        <div key={type} className="relative">
                            <input type="number" min="0" step="1" max="5" value={washers[type]} onChange={(e) => onWasherChange(number, type, parseInt(e.target.value) || 0)} disabled={!isEditable}
                                className={`w-14 p-1 pr-6 text-right bg-gray-200 dark:bg-gray-800 border border-gray-400 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:border-gray-100 dark:disabled:border-gray-700 transition-colors duration-300 ${textColor}`} />
                            <ClearButton
                                onClear={() => onWasherChange(number, type, 0)}
                                show={washers[type] > 0 && isEditable}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- PLOT COMPONENTS ---

const polarToCartesianPlot = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians),
    };
};

const MainRotorPlot = React.memo(({ t, plotAmplitude, phaseDeg, K, Phi, selectedBlade, totalFinalWeights, finalUnbalance, recommendedChange, actualChange }) => {
    const size = 500;
    const center = size / 2;
    const maxIPS = Math.max(0.4, plotAmplitude * 1.5, finalUnbalance.amplitude * 1.5);
    const plotRadius = center - 50;
    
    const ipsToPx = useCallback((ips) => (ips / maxIPS) * plotRadius, [maxIPS, plotRadius]);

    const blades = useMemo(() => [
        { name: 'Yellow', color: '#fedf00', origAngle: 0 },
        { name: 'Red', color: '#EF3340', origAngle: 120 },
        { name: 'Green', color: '#22c55e', origAngle: 240 },
    ], []);
    
    const maxWeight = maxIPS * K;
    const weightGrads = calculateNiceSteps(maxWeight, 6);

    const plotBlades = blades.map(b => ({
        ...b,
        plotAngle: (b.origAngle + Phi - 180 + 360) % 360,
    }));

    const gridRings = [0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0];
    const grid = {
        circles: gridRings.filter(r => r <= maxIPS),
        lines: Array.from({ length: 12 }, (_, i) => i * 30),
    };

    const unbalancePoint = polarToCartesianPlot(center, center, ipsToPx(plotAmplitude), phaseDeg);
    const finalUnbalancePoint = polarToCartesianPlot(center, center, ipsToPx(finalUnbalance.amplitude), finalUnbalance.phaseDeg);

    const getRayEndPoint = (startPoint, angle, length) => {
        const angleInRadians = ((angle - 90) * Math.PI) / 180.0;
        return {
            x: startPoint.x + length * Math.cos(angleInRadians),
            y: startPoint.y + length * Math.sin(angleInRadians),
        };
    };
    
    const correctiveVectors = useMemo(() => {
        const vectors = [];
        if (K > 0) {
            blades.forEach(blade => {
                const weight = totalFinalWeights[blade.name];
                if (weight > 0) {
                    const v_effect_polar = {
                        mag: weight / K,
                        deg: (blade.origAngle + Phi + 360) % 360
                    };
                    const delta_point = polarToCartesianPlot(0, 0, ipsToPx(v_effect_polar.mag), v_effect_polar.deg);
                    const endPoint = {
                        x: unbalancePoint.x + delta_point.x,
                        y: unbalancePoint.y + delta_point.y
                    };
                    vectors.push({
                        start: unbalancePoint,
                        end: endPoint,
                        color: blade.color,
                        name: blade.name,
                        weight: weight
                    });
                }
            });
        }
        return vectors;
    }, [unbalancePoint, K, Phi, totalFinalWeights, ipsToPx, blades]);

    const isFinalDifferent = Math.hypot(unbalancePoint.x - finalUnbalancePoint.x, unbalancePoint.y - finalUnbalancePoint.y) > 1;
    const showYourActionPoint = JSON.stringify(actualChange) !== JSON.stringify(recommendedChange) && isFinalDifferent;


    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto bg-gray-100 dark:bg-gray-800 rounded-lg">
            <g id="grid" className="stroke-gray-400 dark:stroke-gray-600">
                {grid.circles.map(r => <circle key={r} cx={center} cy={center} r={ipsToPx(r)} fill="none" strokeWidth="1" />)}
                {grid.lines.map(angle => {
                    const { x, y } = polarToCartesianPlot(center, center, plotRadius, angle);
                    return <line key={angle} x1={center} y1={center} x2={x} y2={y} strokeWidth="1" />;
                })}
            </g>
            <g id="grid-labels" className="fill-gray-600 dark:fill-gray-400" fontSize="12">
                {grid.lines.map((angle, i) => {
                    const { x, y } = polarToCartesianPlot(center, center, plotRadius + 15, angle);
                    return <text key={i} x={x} y={y} textAnchor="middle" alignmentBaseline="middle">{i === 0 ? 12 : i}h</text>;
                })}
                 {grid.circles.slice(0, -1).map(r => {
                    const { x, y } = polarToCartesianPlot(center, center, ipsToPx(r), 270);
                    return <text key={r} x={x-5} y={y} textAnchor="end" alignmentBaseline="middle">{r.toFixed(1)}</text>;
                })}
            </g>

            <g id="projection-lines">
                {plotBlades.map((blade, bladeIdx) => {
                    const neighbor1 = plotBlades[(bladeIdx + 1) % 3];
                    const neighbor2 = plotBlades[(bladeIdx + 2) % 3];
                    
                    return weightGrads.map(weight => {
                        const ips = weight / K;
                        if (ips > maxIPS) return null;
                        const gradPoint = polarToCartesianPlot(center, center, ipsToPx(ips), blade.plotAngle);

                        const rayLength = plotRadius * 2;
                        const ray1End = getRayEndPoint(gradPoint, neighbor1.plotAngle, rayLength);
                        const ray2End = getRayEndPoint(gradPoint, neighbor2.plotAngle, rayLength);
                        
                        return (
                            <g key={`${blade.name}-${weight}`}>
                                <line x1={gradPoint.x} y1={gradPoint.y} x2={ray1End.x} y2={ray1End.y} stroke={blade.color} strokeOpacity="0.5" strokeWidth="1.5"/>
                                <line x1={gradPoint.x} y1={gradPoint.y} x2={ray2End.x} y2={ray2End.y} stroke={blade.color} strokeOpacity="0.5" strokeWidth="1.5"/>
                            </g>
                        );
                    });
                })}
            </g>
            
            <g id="blades">
                {plotBlades.map(blade => {
                    const isSelected = blade.name === selectedBlade;
                    const endPoint = polarToCartesianPlot(center, center, plotRadius, blade.plotAngle);
                    const labelPoint = polarToCartesianPlot(center, center, plotRadius + 25, blade.plotAngle);
                    return (
                        <g key={blade.name}>
                            <line x1={center} y1={center} x2={endPoint.x} y2={endPoint.y} stroke={blade.color} strokeWidth={isSelected ? "8" : "4"} />
                            <text x={labelPoint.x} y={labelPoint.y} fill={blade.color} textAnchor="middle" alignmentBaseline="middle" fontWeight="bold" fontSize="16" style={{ opacity: isSelected ? 1 : 0.4, transition: 'opacity 0.3s' }}>{blade.name.charAt(0)}</text>
                            {weightGrads.map(weight => {
                                const ips = weight / K;
                                if (ips > maxIPS) return null;
                                const gradPoint = polarToCartesianPlot(center, center, ipsToPx(ips), blade.plotAngle);
                                const textAngle = blade.plotAngle < 180 ? blade.plotAngle + 90 : blade.plotAngle - 90;
                                const textPoint = polarToCartesianPlot(gradPoint.x, gradPoint.y, 10, textAngle);
                                return (
                                   <g key={`${blade.name}-grad-${weight}`}>
                                        <circle cx={gradPoint.x} cy={gradPoint.y} r="2" fill={blade.color} />
                                        <text x={textPoint.x} y={textPoint.y} fill={blade.color} fontSize="10" textAnchor="middle" alignmentBaseline="middle">{weight % 1 !== 0 ? weight.toFixed(1) : weight}g</text>
                                   </g>
                                )
                            })}
                        </g>
                    );
                })}
            </g>
            
            <g id="corrective-vectors">
                {correctiveVectors.map((vector, index) => {
                    const isSelected = vector.name === selectedBlade;

                    const midX = (vector.start.x + vector.end.x) / 2;
                    const midY = (vector.start.y + vector.end.y) / 2;
                    const dx = vector.end.x - vector.start.x;
                    const dy = vector.end.y - vector.start.y;
                    const len = Math.sqrt(dx * dx + dy * dy);

                    let labelX = midX;
                    let labelY = midY;

                    if (len > 1e-6) {
                        const normPerpDx = -dy / len;
                        const normPerpDy = dx / len;
                        const offset = 15;
                        labelX = midX + normPerpDx * offset;
                        labelY = midY + normPerpDy * offset;
                    }
                    
                    return (
                        <g key={`vector-${index}`}>
                            <line 
                                x1={vector.start.x} y1={vector.start.y} 
                                x2={vector.end.x} y2={vector.end.y} 
                                stroke={vector.color} 
                                strokeWidth="3"
                            />
                            {isSelected && vector.weight > 0 && (
                                <text x={labelX} y={labelY} fill={vector.color} textAnchor="middle" alignmentBaseline="middle" fontWeight="bold" fontSize="14">
                                    {`${vector.weight.toFixed(1)}g`}
                                </text>
                            )}
                        </g>
                    );
                })}
            </g>

            <g id="unbalance-points">
                <circle cx={unbalancePoint.x} cy={unbalancePoint.y} r="5" fill="none" stroke="#1079bd" strokeWidth="2" />
                <circle cx={unbalancePoint.x} cy={unbalancePoint.y} r="2" fill="#1079bd" />
                {showYourActionPoint && <>
                    <circle cx={finalUnbalancePoint.x} cy={finalUnbalancePoint.y} r="5" fill="none" stroke="#0ff" strokeWidth="2" />
                    <circle cx={finalUnbalancePoint.x} cy={finalUnbalancePoint.y} r="2" fill="#0ff" />
                </>}
            </g>
        </svg>
    );
});

const TailRotorPlot = React.memo(({ t, amplitude, phaseDeg, K, Phi, selectedScrew, totalWasherWeights, finalUnbalance }) => {
    const size = 500;
    const center = size / 2;
    const maxIPS = Math.max(0.4, amplitude * 1.5, (finalUnbalance?.amplitude || 0) * 1.5);
    const plotRadius = center - 50;
    
    const ipsToPx = useCallback((ips) => (ips / maxIPS) * plotRadius, [maxIPS, plotRadius]);

    const screwCount = 7;
    const screws = useMemo(() => Array.from({length: screwCount}, (_, i) => ({
        name: `${i + 1}`,
        color: '#22d3ee',
        origAngle: (360 / screwCount) * i + (360 / (2 * screwCount))
    })), [screwCount]);
    
    const maxWeight = maxIPS * K;
    const weightGrads = calculateNiceSteps(maxWeight, 4);

    const plotScrews = screws.map(s => ({
        ...s,
        plotAngle: (s.origAngle + Phi - 180 + 360) % 360,
    }));

    const gridRings = [0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0];
    const grid = {
        circles: gridRings.filter(r => r <= maxIPS),
        lines: Array.from({ length: 12 }, (_, i) => i * 30),
    };

    const unbalancePoint = polarToCartesianPlot(center, center, ipsToPx(amplitude), phaseDeg);

    const getRayEndPoint = (startPoint, angle, length) => {
        const angleInRadians = ((angle - 90) * Math.PI) / 180.0;
        return {
            x: startPoint.x + length * Math.cos(angleInRadians),
            y: startPoint.y + length * Math.sin(angleInRadians),
        };
    };

    const vectorChain = useMemo(() => {
        const chain = [];
        let currentPoint = { ...unbalancePoint };
        const sortedScrews = [...screws].sort((a,b) => a.origAngle - b.origAngle);

        if (K > 0) {
            sortedScrews.forEach((screw) => {
                const weight = totalWasherWeights[parseInt(screw.name) - 1];
                if (weight > 0) {
                    const v_effect_polar = {
                        mag: weight / K,
                        deg: (screw.origAngle + Phi + 360) % 360
                    };
                    const delta_point = polarToCartesianPlot(0, 0, ipsToPx(v_effect_polar.mag), v_effect_polar.deg);
                    const nextPoint = {
                        x: currentPoint.x + delta_point.x,
                        y: currentPoint.y + delta_point.y
                    };
                    chain.push({
                        start: currentPoint,
                        end: nextPoint,
                        name: screw.name,
                    });
                    currentPoint = nextPoint;
                }
            });
        }
        return chain;
    }, [unbalancePoint, K, Phi, totalWasherWeights, ipsToPx, screws]);
    
    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto bg-gray-100 dark:bg-gray-800 rounded-lg">
            <g id="grid" className="stroke-gray-400 dark:stroke-gray-600">
                {grid.circles.map(r => <circle key={r} cx={center} cy={center} r={ipsToPx(r)} fill="none" strokeWidth="1" />)}
                {grid.lines.map(angle => {
                    const { x, y } = polarToCartesianPlot(center, center, plotRadius, angle);
                    return <line key={angle} x1={center} y1={center} x2={x} y2={y} strokeWidth="1" />;
                })}
            </g>
             <g id="grid-labels" className="fill-gray-600 dark:fill-gray-400" fontSize="12">
                {grid.lines.map((angle, i) => {
                    const { x, y } = polarToCartesianPlot(center, center, plotRadius + 15, angle);
                    return <text key={i} x={x} y={y} textAnchor="middle" alignmentBaseline="middle">{i === 0 ? 12 : i}h</text>;
                })}
                 {grid.circles.slice(0, -1).map(r => {
                    const { x, y } = polarToCartesianPlot(center, center, ipsToPx(r), 270);
                    return <text key={r} x={x-5} y={y} textAnchor="end" alignmentBaseline="middle">{r.toFixed(1)}</text>;
                })}
            </g>

            <g id="projection-lines">
                {plotScrews.map((screw, screwIdx) => {
                    const neighbor1 = plotScrews[(screwIdx + 1) % screwCount];
                    const neighbor2 = plotScrews[(screwIdx + screwCount - 1) % screwCount];
                    
                    return weightGrads.map(weight => {
                        if(K <= 0) return null;
                        const ips = weight / K;
                        if (ips > maxIPS) return null;
                        const gradPoint = polarToCartesianPlot(center, center, ipsToPx(ips), screw.plotAngle);

                        const rayLength = plotRadius * 2;
                        const ray1End = getRayEndPoint(gradPoint, neighbor1.plotAngle, rayLength);
                        const ray2End = getRayEndPoint(gradPoint, neighbor2.plotAngle, rayLength);
                        
                        return (
                            <g key={`${screw.name}-${weight}`}>
                                <line x1={gradPoint.x} y1={gradPoint.y} x2={ray1End.x} y2={ray1End.y} stroke={"#22d3ee"} strokeOpacity="0.4" strokeWidth="1.5" />
                                <line x1={gradPoint.x} y1={gradPoint.y} x2={ray2End.x} y2={ray2End.y} stroke={"#22d3ee"} strokeOpacity="0.4" strokeWidth="1.5" />
                            </g>
                        );
                    });
                })}
            </g>

            <g id="screws">
                {plotScrews.map(screw => {
                    const isSelected = parseInt(screw.name) === selectedScrew;
                    const endPoint = polarToCartesianPlot(center, center, plotRadius, screw.plotAngle);
                    return (
                        <g key={screw.name}>
                            <line x1={center} y1={center} x2={endPoint.x} y2={endPoint.y} stroke={screw.color} strokeWidth={isSelected ? "8" : "4"} />
                            <circle cx={endPoint.x} cy={endPoint.y} r={isSelected ? "12" : "10"} fill={screw.color}/>
                            <text x={endPoint.x} y={endPoint.y} className="fill-black" textAnchor="middle" alignmentBaseline="middle" fontWeight="bold">{screw.name}</text>
                        </g>
                    );
                })}
            </g>
            
            <g id="vector-chain">
                {vectorChain.map((vector, index) => {
                    const isSelected = parseInt(vector.name) === selectedScrew;
                    return (
                        <line 
                            key={`vector-chain-${index}`}
                            x1={vector.start.x} y1={vector.start.y} 
                            x2={vector.end.x} y2={vector.end.y} 
                            stroke="#22c55e"
                            strokeWidth={isSelected ? "5" : "2.5"}
                        />
                    );
                })}
            </g>

            <g id="unbalance-point">
                <circle cx={unbalancePoint.x} cy={unbalancePoint.y} r="5" fill="none" stroke="#1079bd" strokeWidth="2" />
                <circle cx={unbalancePoint.x} cy={unbalancePoint.y} r="2" fill="#1079bd" />
            </g>
        </svg>
    );
});


// --- PAGE COMPONENTS ---

const HomePage = ({ setPage, lang, setLang, t, theme, toggleTheme }) => {
    const [isLangPopupOpen, setIsLangPopupOpen] = useState(false);
    const langPopupRef = useRef(null);
    const startYear = 2025;
    const currentYear = new Date().getFullYear();
    const yearString = startYear === currentYear ? startYear : `${startYear} - ${currentYear}`;

    useEffect(() => {
        function handleClickOutside(event) {
            if (langPopupRef.current && !langPopupRef.current.contains(event.target)) {
                setIsLangPopupOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [langPopupRef]);

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
            <img src={theme === 'light' ? logoBlue : logo} alt="Guimbal" className="w-40 mb-12" />
            <h1 className="text-4xl font-bold text-gray-50 dark:text-[#B4DDF8] [text-shadow:0_0_7px_#1079BD] dark:[text-shadow:0_0_4px_#4EC5F9] mb-2 font-eurostile">{t.home.title}</h1>
            <p className="mb-8 text-gray-400 dark:text-gray-500">{t.home.subtitle}</p>
            <div className="w-4/5 max-w-xs space-y-4">
                <button onClick={() => setPage('main')} className="w-full p-4 font-bold font-eurostile text-gray-900 dark:text-white transition bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-sky-100 dark:hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-50">{t.home.mainRotor}</button>
                <button onClick={() => setPage('tail')} className="w-full p-4 font-bold font-eurostile text-gray-900 dark:text-white transition bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-sky-100 dark:hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-50">{t.home.tailRotor}</button>
            </div>
            
            <div className="mt-8 flex w-7/15 max-w-sm items-stretch justify-center gap-2">
                {/* Language Selector */}
                <div className="relative flex-grow" ref={langPopupRef}>
                    {isLangPopupOpen && (
                        <div className="absolute bottom-full mb-2 w-full bg-white dark:bg-gray-700 rounded-md shadow-lg overflow-hidden z-10 max-h-60 overflow-y-auto">
                            <div className="flex flex-col">
                                {Object.keys(translations).sort((a,b) => langNames[a].localeCompare(langNames[b])).map(langCode => (
                                    <button
                                        key={langCode}
                                        onClick={() => {
                                            setLang(langCode);
                                            setIsLangPopupOpen(false);
                                        }}
                                        className={`w-full text-left p-3 text-sm font-bold ${lang === langCode ? 'bg-sky-500 text-white' : 'text-gray-800 dark:text-gray-200 hover:bg-sky-100 dark:hover:bg-sky-800'}`}
                                    >
                                        {langNames[langCode]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    <button 
                        onClick={() => setIsLangPopupOpen(!isLangPopupOpen)} 
                        className="w-full h-full p-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md hover:bg-sky-100 dark:hover:bg-sky-800 flex justify-between items-center shadow-lg"
                    >
                        <span className="font-bold">{langNames[lang]}</span>
                        <svg className={`w-4 h-4 transform transition-transform duration-200 ${isLangPopupOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                </div>

                {/* Theme Toggle Button */}
                <button onClick={toggleTheme} className="p-3 flex-shrink-0 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md hover:bg-sky-100 dark:hover:bg-sky-800 flex justify-center items-center shadow-lg">
                    {theme === 'dark' ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                    )}
                </button>
            </div>

            <footer className="absolute bottom-4 text-xs text-gray-500 dark:text-gray-600">
                &copy; {yearString} Hélicoptères Guimbal, SAS
            </footer>
        </div>
    );
};

const bladeConfig = { Yellow: 0, Green: 240, Red: 120};

const MainRotorPage = ({ setPage, t }) => {
    const topRef = useRef(null);
    const bladeTextColors = { Yellow: 'text-yellow-400', Red: 'text-red-500', Green: 'text-green-500' };
    const [isHelpPopupOpen, setIsHelpPopupOpen] = useState(false);
    
    const initialStepState = {
        amplitude: 0,
        phaseDeg: 0,
        userInput: false,
        currentWeights: { Yellow: 0, Green: 0, Red: 0 },
        recommendedChange: { Yellow: 0, Green: 0, Red: 0 },
        recommendedTotalWeights: { Yellow: 0, Green: 0, Red: 0 },
        actualChange: { Yellow: 0, Green: 0, Red: 0 },
        calculatedCoeffs: { K: null, Phi: null },
    };

    const [rotorState, setRotorState] = useState({
        history: [initialStepState],
        currentStepIndex: 0,
    });
    const { history, currentStepIndex } = rotorState;
    
    const [selectedBlade, setSelectedBlade] = useState('Yellow');
    const bladeOrder = useMemo(() => ['Yellow', 'Green', 'Red'], []);

    const handleCarouselNext = useCallback(() => {
        const currentIndex = bladeOrder.indexOf(selectedBlade);
        const nextIndex = (currentIndex + 1) % bladeOrder.length;
        setSelectedBlade(bladeOrder[nextIndex]);
    }, [selectedBlade, bladeOrder]);

    const handleCarouselPrev = useCallback(() => {
        const currentIndex = bladeOrder.indexOf(selectedBlade);
        const prevIndex = (currentIndex - 1 + bladeOrder.length) % bladeOrder.length;
        setSelectedBlade(bladeOrder[prevIndex]);
    }, [selectedBlade, bladeOrder]);
    
    const currentStepData = history[currentStepIndex];
    const { 
        amplitude, phaseDeg, userInput, currentWeights, 
        recommendedChange, recommendedTotalWeights, actualChange, calculatedCoeffs
    } = currentStepData;

    const updateCurrentStep = useCallback((newData) => {
        setRotorState(prevState => {
            const newHistory = [...prevState.history];
            newHistory[prevState.currentStepIndex] = { ...newHistory[prevState.currentStepIndex], ...newData };
            return { ...prevState, history: newHistory };
        });
    }, []);

    const isBalanced = amplitude < 0.2 && userInput;

    const directCoeffs = useMemo(() => {
        return calculateDirectCoefficients(history, 'main');
    }, [history]);

    const finalCoeffs = useMemo(() => {
        const constantCoeffs = { K: 22, Phi: 260 };
        if (!userInput) return { K: null, Phi: null };

        if (directCoeffs.isCalculable) {
            return { K: directCoeffs.K, Phi: directCoeffs.Phi };
        }
        
        return constantCoeffs;
    }, [directCoeffs, userInput]);


    const solveTwoBlade = (V_target_cart, angle1_deg, angle2_deg) => {
        const a1 = angle1_deg * Math.PI / 180;
        const a2 = angle2_deg * Math.PI / 180;
        const V_x = V_target_cart.x;
        const V_y = V_target_cart.y;
        const det = Math.cos(a1) * Math.sin(a2) - Math.sin(a1) * Math.cos(a2); 
        if (Math.abs(det) < 1e-9) { return null; }
        const w1 = (V_x * Math.sin(a2) - V_y * Math.cos(a2)) / det;
        const w2 = (V_y * Math.cos(a1) - V_x * Math.sin(a1)) / det;
        return { w1, w2 };
    };
    
    const solveOneBlade = (V_target_cart, angle1_deg) => {
        const a1 = angle1_deg * Math.PI / 180;
        const V_mag = Math.sqrt(V_target_cart.x**2 + V_target_cart.y**2);
        if (V_mag < 1e-9) return 0;
        const V_angle = Math.atan2(V_target_cart.y, V_target_cart.x);
        const w1 = V_mag * Math.cos(V_angle - a1);
        return w1;
    };


    const calculateRecommendation = useCallback((K, Phi) => {
        if (K === null || K <= 0 || !userInput) {
            updateCurrentStep({
                calculatedCoeffs: { K, Phi },
                recommendedChange: { Yellow: 0, Green: 0, Red: 0 },
                actualChange: { Yellow: 0, Green: 0, Red: 0 },
                recommendedTotalWeights: { Yellow: 0, Green: 0, Red: 0 },
            });
            return;
        }

        const W_correction_angle = (phaseDeg + 180 - Phi + 360) % 360;
        const W_correction_magnitude = amplitude * K;
        const W_correction_cart = toCartesian(W_correction_magnitude, W_correction_angle);

        let W_current_x = 0;
        let W_current_y = 0;
        Object.keys(bladeConfig).forEach(color => {
            const w_vec = toCartesian(currentWeights[color], bladeConfig[color]);
            W_current_x += w_vec.x;
            W_current_y += w_vec.y;
        });

        const W_target_total_cart = {
            x: W_current_x + W_correction_cart.x,
            y: W_current_y + W_correction_cart.y,
        };
        const W_target_total_polar = toPolar(W_target_total_cart.x, W_target_total_cart.y);
        
        const MAX_BLADE_WEIGHT = 60.0;
        const constraints = {};
        Object.keys(bladeConfig).forEach(color => {
            constraints[color] = { min: 0, max: MAX_BLADE_WEIGHT, angle: bladeConfig[color] };
        });

        const idealTotals = {};
        Object.keys(bladeConfig).forEach(color => {
            const angleDiffRad = (W_target_total_polar.deg - constraints[color].angle) * Math.PI / 180;
            const weightComponent = W_target_total_polar.mag * Math.cos(angleDiffRad);
            idealTotals[color] = weightComponent;
        });

        const firstPassTotals = {};
        const availableBlades = [];
        let W_applied_x = 0;
        let W_applied_y = 0;

        Object.keys(bladeConfig).forEach(color => {
            const ideal = idealTotals[color];
            const { min, max, angle } = constraints[color];
            let clampedTotal = Math.max(min, Math.min(ideal, max));
            firstPassTotals[color] = clampedTotal;
            
            if (clampedTotal > min + 1e-6 && clampedTotal < max - 1e-6) {
                availableBlades.push(color);
            }
            
            const w_vec = toCartesian(clampedTotal, angle);
            W_applied_x += w_vec.x;
            W_applied_y += w_vec.y;
        });

        const W_error_cart = {
            x: W_target_total_cart.x - W_applied_x,
            y: W_target_total_cart.y - W_applied_y,
        };
        const W_error_polar = toPolar(W_error_cart.x, W_error_cart.y);
                
        let finalUnoptimizedTotals = { ...firstPassTotals };

        if (W_error_polar.mag > 0.01) {
            if (availableBlades.length === 2) {
                const [b1, b2] = availableBlades;
                const { angle: a1 } = constraints[b1];
                const { angle: a2 } = constraints[b2];
                const solution = solveTwoBlade(W_error_cart, a1, a2);
                if (solution) {
                    finalUnoptimizedTotals[b1] += solution.w1;
                    finalUnoptimizedTotals[b2] += solution.w2;
                }
            } else if (availableBlades.length === 1) {
                const [b1] = availableBlades;
                const { angle: a1 } = constraints[b1];
                const solution_w1 = solveOneBlade(W_error_cart, a1);
                finalUnoptimizedTotals[b1] += solution_w1;
            }
        }

        const finalClampedTotals = {};
        Object.keys(bladeConfig).forEach(color => {
            const { min, max } = constraints[color];
            let finalTotal = Math.max(min, Math.min(finalUnoptimizedTotals[color], max));
            finalClampedTotals[color] = finalTotal;
        });
                
        const { Yellow, Green, Red } = finalClampedTotals;
        const minWeight = Math.min(Math.max(0, Yellow), Math.max(0, Green), Math.max(0, Red));

        const finalOptimizedTotal = {
            Yellow: roundToHalf(finalClampedTotals.Yellow - minWeight),
            Green: roundToHalf(finalClampedTotals.Green - minWeight),
            Red: roundToHalf(finalClampedTotals.Red - minWeight),
        };

        const finalRecommendedChange = {
            Yellow: roundToHalf(finalOptimizedTotal.Yellow - currentWeights.Yellow),
            Green: roundToHalf(finalOptimizedTotal.Green - currentWeights.Green),
            Red: roundToHalf(finalOptimizedTotal.Red - currentWeights.Red)
        };

        updateCurrentStep({
            calculatedCoeffs: { K, Phi },
            recommendedChange: finalRecommendedChange,
            recommendedTotalWeights: finalOptimizedTotal,
            actualChange: finalRecommendedChange,
        });

    }, [amplitude, phaseDeg, userInput, updateCurrentStep, currentWeights]);

    useEffect(() => {
        if (userInput && finalCoeffs.K !== null) {
            calculateRecommendation(finalCoeffs.K, finalCoeffs.Phi);
        }
    }, [userInput, finalCoeffs, calculateRecommendation, currentWeights]);

    const totalFinalWeights = useMemo(() => {
        const finalTotal = {};
        Object.keys(currentWeights).forEach(color => {
            const sum = currentWeights[color] + (actualChange[color] || 0);
            const clamped = Math.max(0, Math.min(60, sum));
            finalTotal[color] = roundToHalf(clamped);
        });
        return finalTotal;
    }, [currentWeights, actualChange]);
    
    const nextStepWeights = useMemo(() => {
        const { Yellow, Green, Red } = totalFinalWeights;
        const minWeight = Math.min(Yellow, Green, Red);
        return {
            Yellow: roundToHalf(Yellow - minWeight),
            Green: roundToHalf(Green - minWeight),
            Red: roundToHalf(Red - minWeight),
        };
    }, [totalFinalWeights]);

    const finalUnbalance = useMemo(() => {
        if (!userInput || !calculatedCoeffs.K) return { amplitude: amplitude, phaseDeg: phaseDeg };
        
        const v_initial_cart = toCartesian(amplitude, phaseDeg);
        
        let deltaWx = 0;
        let deltaWy = 0;
        Object.keys(bladeConfig).forEach(color => {
            const w_vec = toCartesian(actualChange[color], bladeConfig[color]);
            deltaWx += w_vec.x;
            deltaWy += w_vec.y;
        });
        const deltaW_polar = toPolar(deltaWx, deltaWy);
        
        if (deltaW_polar.mag < 1e-9) return { amplitude, phaseDeg };
        
        const { K, Phi } = calculatedCoeffs;
        
        const deltaV_polar = {
            mag: deltaW_polar.mag / K,
            deg: (deltaW_polar.deg + Phi + 360) % 360
        };
        const deltaV_cart = toCartesian(deltaV_polar.mag, deltaV_polar.deg);
        
        const v_final_cart = {
            x: v_initial_cart.x + deltaV_cart.x,
            y: v_initial_cart.y + deltaV_cart.y,
        };
        
        const v_final_polar = toPolar(v_final_cart.x, v_final_cart.y);
        return { amplitude: v_final_polar.mag, phaseDeg: v_final_polar.deg };
    }, [amplitude, phaseDeg, actualChange, calculatedCoeffs, userInput]);

    const handleNextStep = () => {
        const nextStep = {
            ...initialStepState,
            currentWeights: nextStepWeights,
        };
        setRotorState(prevState => {
            const newHistory = [...prevState.history.slice(0, prevState.currentStepIndex + 1), nextStep];
            return {
                history: newHistory,
                currentStepIndex: prevState.currentStepIndex + 1,
            };
        });
        topRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handlePreviousStep = () => {
        setRotorState(prevState => {
            if (prevState.currentStepIndex > 0) {
                return { ...prevState, currentStepIndex: prevState.currentStepIndex - 1 };
            }
            return prevState;
        });
    };

    const handleGenerateReport = () => {
        const reportElement = document.getElementById('main-rotor-report-content');
        const opt = {
            margin:       0.5,
            filename:     'G-Tune_Main-Rotor-Report.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        html2pdf().from(reportElement).set(opt).save();
    };
    
    return (
        <div ref={topRef} className="min-h-screen p-4 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
            {isHelpPopupOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={() => setIsHelpPopupOpen(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-sky-600 dark:text-sky-400 mb-4">Quick Guide to Rotor Balancing</h3>
                        <ul className="space-y-4 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
                           <li><strong>Before you start:</strong> Enter all weights currently on the rotor in the "Currently Installed" fields.</li>
                           <li><strong>First Run is for Calibration:</strong> The first measurement helps the app learn your rotor. Vibration may not decrease and might even increase—this is normal. A significant improvement is expected on the <em>second</em> step.</li>
                           <li><strong>After Blade Track Adjustments:</strong> Any change to pitch links or trim tabs resets the learning process. The next run will again serve as a calibration step.</li>
                           <li><strong>Deviating from the Recommendation:</strong> If you install different weights than recommended, you <strong>must update the values</strong> in the "Detailed Setup" section. This is critical for the algorithm's accuracy.</li>
                           <li><strong>Need Assistance?</strong> If you're still having issues after a few steps, please contact <a href="mailto:support@guimbal.com" className="text-sky-500 hover:underline"><strong>support@guimbal.com</strong></a>.</li>
                        </ul>
                        <div className="mt-6 text-right">
                            <button onClick={() => setIsHelpPopupOpen(false)} className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 dark:focus:ring-offset-gray-800">Close</button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ position: 'absolute', left: '-9999px', top: 'auto' }}>
                <Report id="main-rotor-report-content" history={history} rotorType="main" t={t} />
            </div>

            <div className="max-w-2xl mx-auto">
                <button onClick={currentStepIndex === 0 ? () => setPage('home') : handlePreviousStep} className="text-sm text-sky-600 dark:text-sky-400 p-2 -ml-2">
                    &larr; {currentStepIndex > 0 ? t.mainRotor.goToPreviousStep : t.mainRotor.backToHome}
                </button>
                <h1 className="text-3xl font-bold mt-1">{t.mainRotor.title}</h1>
                <p className="text-gray-500 dark:text-gray-400 text-lg mb-6 pl-2">{t.mainRotor.step} {currentStepIndex + 1}</p>
                
                {isBalanced && <div className="p-4 mb-6 text-center text-green-800 bg-green-100 dark:text-green-200 dark:bg-green-800 border border-green-300 dark:border-green-600 rounded-lg"><p className="font-bold">{t.mainRotor.rotorIsBalanced}</p><p className="text-sm">{t.mainRotor.vibrationBelowThreshold.replace('{amplitude}', amplitude.toFixed(2))}</p></div>}

                <div className="p-4 mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-xl font-semibold text-sky-600 dark:text-sky-400">{t.mainRotor.vibrationMeasurement}</h2>
                        <button onClick={() => setIsHelpPopupOpen(true)} className="text-gray-400 hover:text-sky-500 transition-colors" aria-label="Help">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: t.mainRotor.amplitudeLabel }}/>
                            <DecimalInput value={amplitude} onChange={val => updateCurrentStep({ amplitude: val, userInput: true })} className="w-full p-2 text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: t.mainRotor.phaseLabelHHMM }} />
                                <input type="time" value={degreesToTime(phaseDeg)} onChange={e => updateCurrentStep({ phaseDeg: timeToDegrees(e.target.value), userInput: true })} className="w-full p-2 text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"/>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: t.mainRotor.phaseLabelDegrees }} />
                                <DecimalInput value={phaseDeg} onChange={val => updateCurrentStep({ phaseDeg: val, userInput: true })} className="w-full p-2 text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"/>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-sky-600 dark:text-sky-400 mb-1">{t.mainRotor.weightDistribution}</h2>
                     <div className="mt-4 space-y-2">
                        <div className="grid grid-cols-3 gap-x-2 sm:gap-x-4 px-3">
                            <div></div>
                            <div className="text-center text-sm font-bold text-gray-500 dark:text-gray-400">{t.mainRotor.currentlyInstalled}</div>
                            <div className="text-center text-sm font-bold text-gray-500 dark:text-gray-400">{t.mainRotor.recommended}</div>
                        </div>
                        {Object.keys(bladeConfig).map(color => {
                            const isZero = recommendedTotalWeights[color] === 0;
                            return (
                                <div key={color} className="grid grid-cols-3 gap-x-2 sm:gap-x-4 items-center p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                    <div className="flex items-center">
                                        <span className={`font-bold ${bladeTextColors[color]}`}>{color}</span>
                                    </div>
                                    <div className="flex items-center justify-center">
                                        <DecimalInput 
                                            value={currentWeights[color]} 
                                            onChange={(val) => updateCurrentStep({ currentWeights: {...currentWeights, [color]:val} })} 
                                            disabled={currentStepIndex > 0}
                                            className="w-20 p-1 text-right text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-800 border border-gray-400 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:border-gray-100 dark:disabled:border-gray-700" 
                                        />
                                        <span className="ml-2 text-gray-500 dark:text-gray-400">g</span>
                                    </div>
                                    <div className={`text-center text-lg font-bold ${isZero ? 'text-gray-400 dark:text-gray-500' : bladeTextColors[color]}`}>
                                        {recommendedTotalWeights[color].toFixed(1)}g
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
                
                {userInput && calculatedCoeffs.K && (
                    <>
                        <div className="p-4 mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                            <h2 className="mb-3 text-xl font-semibold text-sky-600 dark:text-sky-400">{t.mainRotor.plotTitle}</h2>
                            <MainRotorPlot 
                                t={t}
                                plotAmplitude={amplitude} 
                                phaseDeg={phaseDeg} 
                                K={calculatedCoeffs.K} 
                                Phi={calculatedCoeffs.Phi}
                                selectedBlade={selectedBlade}
                                totalFinalWeights={totalFinalWeights}
                                finalUnbalance={finalUnbalance}
                                recommendedChange={recommendedChange}
                                actualChange={actualChange}
                            />
                        </div>

                        <div className="p-4 mb-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                            <h2 className="mb-4 text-xl font-semibold text-left text-sky-600 dark:text-sky-400">{t.mainRotor.detailedWeightDistribution}</h2>
                            <div className="flex items-center justify-center mb-4">
                                <button onClick={handleCarouselPrev} aria-label="Previous blade" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <h3 className={`text-2xl font-bold mx-4 ${bladeTextColors[selectedBlade]}`}>{selectedBlade}</h3>
                                <button onClick={handleCarouselNext} aria-label="Next blade" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                            <div className="flex items-center justify-between text-center w-full">
                                <div className="flex flex-col items-center justify-center p-1 flex-shrink-0 w-20">
                                    <span className="text-lg font-bold">{currentWeights[selectedBlade].toFixed(1)}g</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{t.mainRotor.current}</span>
                                </div>
                                <div className="flex-grow flex flex-col items-center justify-center p-1 mx-1">
                                    <select
                                        value={actualChange[selectedBlade] >= 0 ? 'add' : 'remove'}
                                        onChange={(e) => {
                                            const newSign = e.target.value === 'add' ? 1 : -1;
                                            const currentVal = Math.abs(actualChange[selectedBlade]);
                                            updateCurrentStep({ actualChange: {...actualChange, [selectedBlade]: newSign * currentVal}});
                                        }}
                                        className="p-1 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 mb-1"
                                    >
                                        <option value="add">{t.mainRotor.add}</option>
                                        <option value="remove">{t.mainRotor.remove}</option>
                                    </select>
                                    <div className="w-full h-1 bg-gray-400 dark:bg-gray-600 relative my-2">
                                        <div className="absolute right-0 top-1/2 -mt-1 w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-8 border-l-gray-400 dark:border-l-gray-600 -mr-2"></div>
                                    </div>
                                    <div className="flex flex-col items-center justify-center mt-1">
                                        <DecimalInput 
                                            value={Math.abs(actualChange[selectedBlade])} 
                                            onChange={val => {
                                                const sign = (actualChange[selectedBlade] < 0 || Object.is(actualChange[selectedBlade], -0)) ? -1 : 1;
                                                const finalVal = sign < 0 && val === 0 ? -0 : val;
                                                updateCurrentStep({ actualChange: {...actualChange, [selectedBlade]: sign * finalVal}});
                                            }}
                                            className="w-20 p-1 text-center text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" />
                                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.mainRotor.grams}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center justify-center p-1 flex-shrink-0 w-20">
                                    <span className="text-lg font-bold">{totalFinalWeights[selectedBlade].toFixed(1)}g</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{t.mainRotor.final}</span>
                                </div>
                            </div>
                                {totalFinalWeights[selectedBlade] > 16 && (
                                <div className="mt-4 text-center text-red-800 dark:text-red-200">
                                    <p className="font-bold">{t.mainRotor.overweightWarningTitle}</p>
                                    <p className="text-sm mt-1">{t.mainRotor.overweightWarningText}</p>
                                </div>
                            )}
                        </div>
                    </>
                )}

                <div className="flex gap-4 mt-6">
                    <button onClick={handleGenerateReport} style={{ backgroundColor: '#2A7F62' }} className="w-1/3 p-3 font-bold text-white transition rounded-lg hover:opacity-90">
                        <span className="hidden sm:inline">{t.mainRotor.generateReport}</span>
                        <span className="sm:hidden">PDF</span>
                    </button>
                    <button onClick={handleNextStep} style={{ backgroundColor: '#1079BD' }} className="w-2/3 p-4 text-xl font-bold text-white transition rounded-lg hover:opacity-90">{t.mainRotor.next}</button>
                </div>
                
                {calculatedCoeffs.K !== null && (<div className="my-4 text-xs text-center text-gray-500 dark:text-gray-500"><p>{t.mainRotor.interpolatedValues.replace('{kValue}', calculatedCoeffs.K.toFixed(2)).replace('{phiValue}', calculatedCoeffs.Phi.toFixed(2))}</p></div>)}
            </div>
        </div>
    );
};

const TailRotorPage = ({ setPage, t }) => {
    const topRef = useRef(null);
    const screwCount = 7;
    const smallWasherWeight = 0.7;
    const largeWasherWeight = 2.0;
    
    const initialStepState = {
        amplitude: 0,
        phaseDeg: 0,
        userInput: false,
        currentWashers: Array(screwCount).fill({ small: 0, large: 0 }),
        recommendedWashers: Array(screwCount).fill({ small: 0, large: 0 }),
        actualWashers: Array(screwCount).fill({ small: 0, large: 0 }),
        calculatedCoeffs: { K: null, Phi: null },
    };

    const [rotorState, setRotorState] = useState({
        history: [initialStepState],
        currentStepIndex: 0,
    });
    const { history, currentStepIndex } = rotorState;

    const [selectedScrew, setSelectedScrew] = useState(1);
    const [isHelpPopupOpen, setIsHelpPopupOpen] = useState(false);
    const [isInstalledWeightsOpen, setIsInstalledWeightsOpen] = useState(currentStepIndex === 0);

    useEffect(() => {
        setIsInstalledWeightsOpen(currentStepIndex === 0);
    }, [currentStepIndex]);


    const currentStepData = history[currentStepIndex];
    const { amplitude, phaseDeg, userInput, currentWashers, recommendedWashers, actualWashers, calculatedCoeffs } = currentStepData;

    const updateCurrentStep = useCallback((newData) => {
        setRotorState(prevState => {
            const newHistory = [...prevState.history];
            newHistory[prevState.currentStepIndex] = { ...newHistory[prevState.currentStepIndex], ...newData };
            return { ...prevState, history: newHistory };
        });
    }, []);

    const screwAngles = useMemo(() => Array.from({length: screwCount}, (_, i) => (360 / screwCount) * i + (360 / (2 * screwCount))), [screwCount]);
    
    const isBalanced = amplitude < 0.2 && userInput;

    const directCoeffs = useMemo(() => {
        return calculateDirectCoefficients(history, 'tail');
    }, [history]);

    const finalCoeffs = useMemo(() => {
        const constantCoeffs = { K: 1.8, Phi: 300 };
        if (!userInput) return { K: null, Phi: null };
    
        if (directCoeffs.isCalculable) {
            return { K: directCoeffs.K, Phi: directCoeffs.Phi };
        }
        
        return constantCoeffs;
    }, [directCoeffs, userInput]);


    useEffect(() => {
        const calculateMultiScrewRecommendation = () => {
            if (!userInput || !finalCoeffs.K || finalCoeffs.K <= 0) {
                return;
            }
            const { K, Phi } = finalCoeffs;
    
            let currentWeightX = 0;
            let currentWeightY = 0;
            currentWashers.forEach((washers, i) => {
                const weight = (washers.small * smallWasherWeight) + (washers.large * largeWasherWeight);
                if (weight > 0) {
                    const angleRad = screwAngles[i] * Math.PI / 180;
                    currentWeightX += weight * Math.cos(angleRad);
                    currentWeightY += weight * Math.sin(angleRad);
                }
            });
    
            const correctionAngle = (phaseDeg + 180 - Phi + 360) % 360;
            const correctionWeight = amplitude * K;
            const changeVector = toCartesian(correctionWeight, correctionAngle);
            
            const targetVector = {
                x: currentWeightX + changeVector.x,
                y: currentWeightY + changeVector.y,
            };
    
            const CUMBERSOME_THRESHOLD = 5;
            const REASONABLE_SLOPE = 0.05;
            const CUMBERSOME_SLOPE = 0.50;
            
            const validCombos = [];
            for (let l = 0; l <= 2; l++) {
                for (let s = 0; s <= 3; s++) {
                    const is_valid = (l === 0 && s <= 3) || (l === 1 && s <= 2) || (l === 2 && s <= 1);
                    if (is_valid) validCombos.push({ s, l, weight: s * smallWasherWeight + l * largeWasherWeight });
                }
            }
            const validCombosWithZero = [{ s: 0, l: 0, weight: 0 }, ...validCombos];
            let bestSolution = { washers: Array(screwCount).fill({ small: 0, large: 0 }), score: Infinity };
            const evaluateScrewSet = (screws, comboInProgress, depth) => {
                if (depth === screws.length) {
                    let currentVector = { x: 0, y: 0 };
                    let screwsWithWeight = 0;
                    comboInProgress.forEach(c => {
                        if (c.combo.weight > 0) {
                            screwsWithWeight++;
                            const angleRad = screwAngles[c.screwIndex] * Math.PI / 180;
                            currentVector.x += c.combo.weight * Math.cos(angleRad);
                            currentVector.y += c.combo.weight * Math.sin(angleRad);
                        }
                    });
                    if (screwsWithWeight === 0) return;
                    const error = Math.sqrt(Math.pow(targetVector.x - currentVector.x, 2) + Math.pow(targetVector.y - currentVector.y, 2));
                    let penalty = (screwsWithWeight >= CUMBERSOME_THRESHOLD) ? screwsWithWeight * CUMBERSOME_SLOPE : screwsWithWeight * REASONABLE_SLOPE;
                    const score = error + penalty;
                    if (score < bestSolution.score) {
                        const finalWashers = Array(screwCount).fill({ small: 0, large: 0 });
                        comboInProgress.forEach(c => { finalWashers[c.screwIndex] = { small: c.combo.s, large: c.combo.l }; });
                        bestSolution = { washers: finalWashers, score };
                    }
                    return;
                }
                const currentScrewIndex = screws[depth];
                for (const combo of validCombosWithZero) {
                    comboInProgress.push({ screwIndex: currentScrewIndex, combo });
                    evaluateScrewSet(screws, comboInProgress, depth + 1);
                    comboInProgress.pop();
                }
            };
            const maxScrewsInSolution = 5;
            for (let numScrews = 1; numScrews <= maxScrewsInSolution; numScrews++) {
                const screwIndexCombos = [];
                const getCombos = (start, currentCombo) => {
                    if (currentCombo.length === numScrews) {
                        screwIndexCombos.push([...currentCombo]);
                        return;
                    }
                    for (let i = start; i < screwCount; i++) {
                        currentCombo.push(i);
                        getCombos(i + 1, currentCombo);
                        currentCombo.pop();
                    }
                };
                getCombos(0, []);
                for (const screws of screwIndexCombos) {
                    evaluateScrewSet(screws, [], 0);
                }
            }
            
            updateCurrentStep({
                calculatedCoeffs: { K, Phi },
                recommendedWashers: bestSolution.washers,
                actualWashers: bestSolution.washers
            });
        };

        calculateMultiScrewRecommendation();

    }, [userInput, finalCoeffs, JSON.stringify(currentWashers), amplitude, phaseDeg, screwAngles, updateCurrentStep, screwCount]);
    
    const totalWasherWeights = useMemo(() => {
        return actualWashers.map(washers =>
            (washers.small * smallWasherWeight) + (washers.large * largeWasherWeight)
        );
    }, [actualWashers]);

    const finalUnbalance = useMemo(() => {
        if (!userInput || !calculatedCoeffs.K) return { amplitude: amplitude, phaseDeg: phaseDeg };

        const v_initial_cart = toCartesian(amplitude, phaseDeg);

        let deltaWx = 0;
        let deltaWy = 0;

        for (let i = 0; i < screwCount; i++) {
            const initialWeight = (currentWashers[i].small * smallWasherWeight) + (currentWashers[i].large * largeWasherWeight);
            const finalWeight = (actualWashers[i].small * smallWasherWeight) + (actualWashers[i].large * largeWasherWeight);
            const deltaWeight = finalWeight - initialWeight;
            
            if (Math.abs(deltaWeight) > 1e-9) {
                const w_vec = toCartesian(deltaWeight, screwAngles[i]);
                deltaWx += w_vec.x;
                deltaWy += w_vec.y;
            }
        }

        const deltaW_polar = toPolar(deltaWx, deltaWy);

        if (deltaW_polar.mag < 1e-9) return { amplitude, phaseDeg };

        const { K, Phi } = calculatedCoeffs;

        const deltaV_polar = {
            mag: deltaW_polar.mag / K,
            deg: (deltaW_polar.deg + Phi + 360) % 360
        };
        const deltaV_cart = toCartesian(deltaV_polar.mag, deltaV_polar.deg);

        const v_final_cart = {
            x: v_initial_cart.x + deltaV_cart.x,
            y: v_initial_cart.y + deltaV_cart.y,
        };

        const v_final_polar = toPolar(v_final_cart.x, v_final_cart.y);
        return { amplitude: v_final_polar.mag, phaseDeg: v_final_polar.deg };
    }, [amplitude, phaseDeg, currentWashers, actualWashers, calculatedCoeffs, userInput, screwAngles, screwCount]);


    const handleNextStep = () => {
        const nextStep = {
            ...initialStepState,
            currentWashers: actualWashers,
        };
        setRotorState(prevState => {
            const newHistory = [...prevState.history.slice(0, prevState.currentStepIndex + 1), nextStep];
            return {
                history: newHistory,
                currentStepIndex: prevState.currentStepIndex + 1,
            };
        });
        topRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handlePreviousStep = () => {
        setRotorState(prevState => {
            if (prevState.currentStepIndex > 0) {
                return { ...prevState, currentStepIndex: prevState.currentStepIndex - 1 };
            }
            return prevState;
        });
    };

    const handleNextScrew = () => setSelectedScrew(prev => (prev % screwCount) + 1);
    const handlePrevScrew = () => setSelectedScrew(prev => (prev === 1 ? screwCount : prev - 1));
    
    const handleGenerateReport = () => {
        const reportElement = document.getElementById('tail-rotor-report-content');
        const opt = {
            margin:       0.5,
            filename:     'G-Tune_Tail-Rotor-Report.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        html2pdf().from(reportElement).set(opt).save();
    };

    return (
        <div ref={topRef} className="min-h-screen p-4 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
             {isHelpPopupOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={() => setIsHelpPopupOpen(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-sky-600 dark:text-sky-400 mb-4">Quick Guide to Tail Rotor Balancing</h3>
                        <ul className="space-y-4 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
                            <li><strong>Before you start:</strong> Enter all washers currently on the rotor in the "Installed Weights" fields.</li>
                            <li><strong>First Run is for Calibration:</strong> The first measurement helps the app learn your rotor. Vibration may not decrease and might even increase—this is normal. A significant improvement is expected on the <em>second</em> step.</li>
                            <li><strong>Deviating from the Recommendation:</strong> If you install a different washer combination than recommended, you <strong>must update the values</strong> in the "Detailed Setup" section to reflect what you actually installed. This is critical for the algorithm's accuracy.</li>
                            <li><strong>Need Assistance?</strong> If you're still having issues after a few steps, please contact <a href="mailto:support@guimbal.com" className="text-sky-500 hover:underline"><strong>support@guimbal.com</strong></a>.</li>
                        </ul>
                        <div className="mt-6 text-right">
                            <button onClick={() => setIsHelpPopupOpen(false)} className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 dark:focus:ring-offset-gray-800">Close</button>
                        </div>
                    </div>
                </div>
            )}
            <div style={{ position: 'absolute', left: '-9999px', top: 'auto' }}>
                <Report id="tail-rotor-report-content" history={history} rotorType="tail" t={t} />
            </div>
            <div className="max-w-2xl mx-auto">
                <button onClick={currentStepIndex === 0 ? () => setPage('home') : handlePreviousStep} className="text-sm text-sky-600 dark:text-sky-400 p-2 -ml-2">
                    &larr; {currentStepIndex > 0 ? t.tailRotor.goToPreviousStep : t.tailRotor.backToHome}
                </button>
                <h1 className="text-3xl font-bold mt-1">{t.tailRotor.title}</h1>
                <p className="text-gray-500 dark:text-gray-400 text-lg mb-6 pl-2">{t.tailRotor.step} {currentStepIndex + 1}</p>
                
                {isBalanced && <div className="p-4 mb-6 text-center text-green-800 bg-green-100 dark:text-green-200 dark:bg-green-800 border border-green-300 dark:border-green-600 rounded-lg"><p className="font-bold">{t.tailRotor.rotorIsBalanced}</p><p className="text-sm">{t.tailRotor.vibrationBelowThreshold.replace('{amplitude}', amplitude.toFixed(2))}</p></div>}
                
                <div className="p-4 mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-xl font-semibold text-sky-600 dark:text-sky-400">{t.tailRotor.vibrationMeasurement}</h2>
                        <button onClick={() => setIsHelpPopupOpen(true)} className="text-gray-400 hover:text-sky-500 transition-colors" aria-label="Help">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: t.tailRotor.amplitudeLabel }} />
                            <DecimalInput value={amplitude} onChange={val => updateCurrentStep({ amplitude: val, userInput: true })} className="w-full p-2 text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: t.tailRotor.phaseLabelHHMM }} />
                                <input type="time" value={degreesToTime(phaseDeg)} onChange={e => updateCurrentStep({ phaseDeg: timeToDegrees(e.target.value), userInput: true })} className="w-full p-2 text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"/>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: t.tailRotor.phaseLabelDegrees }}/>
                                <DecimalInput value={phaseDeg} onChange={val => updateCurrentStep({ phaseDeg: val, userInput: true })} className="w-full p-2 text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"/>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                     {currentStepIndex > 0 ? (
                        <button onClick={() => setIsInstalledWeightsOpen(!isInstalledWeightsOpen)} className="flex justify-between items-center w-full">
                           <h2 className="text-xl font-semibold text-sky-600 dark:text-sky-400">{t.tailRotor.installedWeights}</h2>
                           <svg className={`w-6 h-6 text-sky-600 dark:text-sky-400 transform transition-transform duration-200 ${isInstalledWeightsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </button>
                     ) : (
                        <h2 className="text-xl font-semibold text-sky-600 dark:text-sky-400 mb-1">{t.tailRotor.installedWeights}</h2>
                     )}
                    {(currentStepIndex === 0 || isInstalledWeightsOpen) && (
                        <div className="mt-3">
                            <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">{t.tailRotor.enterWashers} {currentStepIndex > 0 ? t.tailRotor.fromPreviousStep : ''}</p>
                            <TailRotorInputHeader t={t.tailRotor}/>
                            <div className="space-y-2">
                                {Array.from({length: screwCount}, (_, i) => (
                                    <TailScrewWeightInput 
                                        key={i} 
                                        number={i+1} 
                                        washers={currentWashers[i]} 
                                        onWasherChange={(num, type, val) => { const newW = [...currentWashers]; newW[num-1] = {...newW[num-1], [type]: val}; updateCurrentStep({ currentWashers: newW }); }} 
                                        isEditable={currentStepIndex === 0} 
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="p-4 mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                     <h2 className="mb-3 text-xl font-semibold text-sky-600 dark:text-sky-400">{t.tailRotor.recommendation}</h2>
                    <div>
                        <h3 className="mb-2 font-bold text-gray-500 dark:text-gray-400">{t.tailRotor.recommendedFinalWashers}</h3>
                        <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                            <TailRotorInputHeader t={t.tailRotor}/>
                            <div className="space-y-2">
                                {Array.from({length: screwCount}, (_, i) => (
                                    <TailScrewWeightInput key={i} number={i+1} washers={recommendedWashers[i]} onWasherChange={() => {}} isEditable={false} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {userInput && calculatedCoeffs.K && (
                    <>
                        <div className="p-4 mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                            <h2 className="mb-3 text-xl font-semibold text-sky-600 dark:text-sky-400">{t.tailRotor.plotTitle}</h2>
                            <TailRotorPlot 
                                t={t}
                                amplitude={amplitude} 
                                phaseDeg={phaseDeg} 
                                K={calculatedCoeffs.K} 
                                Phi={calculatedCoeffs.Phi}
                                selectedScrew={selectedScrew}
                                totalWasherWeights={totalWasherWeights}
                                finalUnbalance={finalUnbalance}
                            />
                        </div>
                        <div className="p-4 mb-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                            <h2 className="mb-4 text-xl font-semibold text-left text-sky-600 dark:text-sky-400">{t.tailRotor.detailedSetup}</h2>
                            <div className="flex items-center justify-center mb-4">
                                <button onClick={handlePrevScrew} aria-label="Previous screw" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <h3 className="text-2xl font-bold mx-4 text-cyan-400">{t.tailRotor.screwLabel} {selectedScrew}</h3>
                                <button onClick={handleNextScrew} aria-label="Next screw" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">{t.tailRotor.smallWashers}</label>
                                    <input type="number" min="0" max="3" step="1"
                                           value={actualWashers[selectedScrew - 1]?.small ?? 0}
                                           onChange={(e) => {
                                               const newWashers = [...actualWashers];
                                               newWashers[selectedScrew - 1] = { ...newWashers[selectedScrew - 1], small: Math.min(3, Math.max(0, parseInt(e.target.value) || 0)) };
                                               updateCurrentStep({ actualWashers: newWashers });
                                           }}
                                           className="w-full p-2 text-lg text-center font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" />
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">{t.tailRotor.largeWashers}</label>
                                    <input type="number" min="0" max="2" step="1"
                                           value={actualWashers[selectedScrew - 1]?.large ?? 0}
                                           onChange={(e) => {
                                                const newWashers = [...actualWashers];
                                                newWashers[selectedScrew - 1] = { ...newWashers[selectedScrew - 1], large: Math.min(2, Math.max(0, parseInt(e.target.value) || 0)) };
                                                updateCurrentStep({ actualWashers: newWashers });
                                           }}
                                           className="w-full p-2 text-lg text-center font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" />
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <div className="flex gap-4 mt-6">
                    <button onClick={handleGenerateReport} style={{ backgroundColor: '#2A7F62' }} className="w-1/3 p-3 font-bold text-white transition rounded-lg hover:opacity-90">
                        <span className="hidden sm:inline">{t.tailRotor.generateReport}</span>
                        <span className="sm:hidden">PDF</span>
                    </button>
                    <button onClick={handleNextStep} style={{ backgroundColor: '#1079BD' }} className="w-2/3 p-4 text-xl font-bold text-white transition rounded-lg hover:opacity-90">{t.tailRotor.next}</button>
                </div>
                
                {calculatedCoeffs.K !== null && (<div className="my-4 text-xs text-center text-gray-500 dark:text-gray-500"><p>{t.tailRotor.interpolatedValues.replace('{kValue}', calculatedCoeffs.K.toFixed(2)).replace('{phiValue}', calculatedCoeffs.Phi.toFixed(2))}</p></div>)}
            </div>
        </div>
    );
};

export default function App() {
    const [page, setPage] = useState('home');
    const [lang, setLang] = useState('en'); 
    const [theme, setTheme] = useState(() => {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    });

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
    };

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
    }, [theme]);
    
    const t = useMemo(() => {
        const selectedLang = translations[lang] || translations.en;
        const baseLang = translations.en;

        const merge = (base, selected) => {
            const result = { ...base };
            for (const key in selected) {
                if (typeof selected[key] === 'object' && selected[key] !== null && !Array.isArray(selected[key]) && result[key]) {
                    result[key] = merge(result[key], selected[key]);
                } else {
                    result[key] = selected[key];
                }
            }
            return result;
        };

        return merge(JSON.parse(JSON.stringify(baseLang)), selectedLang);
    }, [lang]);

    const mainContent = () => {
        switch (page) {
            case 'main': return <MainRotorPage setPage={setPage} t={t} />;
            case 'tail': return <TailRotorPage setPage={setPage} t={t} />;
            default: return <HomePage setPage={setPage} lang={lang} setLang={setLang} t={t} theme={theme} toggleTheme={toggleTheme} />;
        }
    };

    return (
        <div className="transition-colors duration-300">
            {mainContent()}
        </div>
    );
}