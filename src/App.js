import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import logo from './assets/logo.png';

// Import html2pdf.js and the new Report component
import html2pdf from 'html2pdf.js/dist/html2pdf.min.js';
import Report from './Report.js';


// --- IMPORTATION DES DONNÉES ---
import {
    main_rotor_K_lookup,
    main_rotor_Phi_lookup,
    tail_rotor_K_lookup,
    tail_rotor_Phi_lookup
} from './data/lookupTables.js';

const lookupTables = {
    main: { K: main_rotor_K_lookup, Phi: main_rotor_Phi_lookup },
    tail: { K: tail_rotor_K_lookup, Phi: tail_rotor_Phi_lookup },
};

// --- INTERNATIONALIZATION (i18n) ---
const translations = {
    en: {
        home: {
            title: 'G-Tune',
            subtitle: 'Cabri G2 Rotor Balancing Assistant',
            mainRotor: 'Main Rotor',
            tailRotor: 'Tail Rotor',
            language: 'Language',
        },
        mainRotor: {
            backToHome: 'Back to Home',
            title: 'Main Rotor',
            step: 'Step',
            rotorIsBalanced: 'Rotor is Balanced!',
            vibrationBelowThreshold: 'Vibration amplitude ({amplitude} IPS) is below the 0.2 IPS threshold.',
            calculationMethod: 'Calculation Method',
            lookupTable: 'Decision Trees',
            constant1: 'Constant 1 (K=15, Φ=298)',
            constant2: 'Constant 2 (K=22, Φ=270)',
            vibrationMeasurement: 'Vibration Measurement',
            amplitudeLabel: 'Amplitude (IPS)',
            phaseLabelHHMM: 'Phase (hh:mm)',
            phaseLabelDegrees: 'Phase (degrees)',
            currentlyInstalledWeights: 'Currently Installed Weights',
            fromPreviousStep: 'From previous step.',
            yellowBlade: 'Yellow Blade',
            greenBlade: 'Green Blade',
            redBlade: 'Red Blade',
            recommendationAction: 'Recommendation & Action',
            addToCurrentlyInstalled: 'Add to currently installed',
            recommended: 'Recommended',
            yourAction: 'Your Action',
            totalWeight: 'Total Weight',
            goToNextStep: 'Next Step',
            goToPreviousStep: 'Previous Step',
            generateReport: 'Generate PDF Report',
            interpolatedValues: 'K={kValue}, Phi={phiValue}°',
            plotTitle: 'Balancing Plot',
            calculationBlend: 'Calculation Blend: {blendRatio}% Direct / {inverseBlendRatio}% Method',
            method: 'Method',
            direct: 'Direct',
            directCalculated: 'Directly Calculated: K={kValue}, Phi={phiValue}°'
        },
        tailRotor: {
            backToHome: 'Back to Home',
            title: 'Tail Rotor',
            step: 'Step',
            rotorIsBalanced: 'Rotor is Balanced!',
            vibrationBelowThreshold: 'Vibration amplitude ({amplitude} IPS) is below the 0.2 IPS threshold.',
            calculationMethod: 'Calculation Method',
            lookupTable: 'Decision Trees',
            constant1: 'Constant 1 (K=2, Φ=310)',
            constant2: 'Constant 2 (K=2.8, Φ=302)',
            vibrationMeasurement: 'Vibration Measurement',
            amplitudeLabel: 'Amplitude (IPS)',
            phaseLabelHHMM: 'Phase (hh:mm)',
            phaseLabelDegrees: 'Phase (degrés)',
            installedWeights: 'Installed Weights',
            enterWashers: 'Enter washers currently on rotor.',
            fromPreviousStep: '(From previous step)',
            small: 'Small',
            large: 'Large',
            recommendation: 'Recommendation',
            recommendationFinalSetup: 'Recommendation & Final Setup',
            recommendedFinalWashers: 'Recommended Final Washers',
            yourFinalWasherSetup: 'Your Final Washer Setup',
            goToNextStep: 'Next Step',
            goToPreviousStep: 'Previous Step',
            generateReport: 'Generate PDF Report',
            interpolatedValues: 'K={kValue}, Phi={phiValue}°',
            plotTitle: 'Balancing Plot',
            calculationBlend: 'Calculation Blend: {blendRatio}% Direct / {inverseBlendRatio}% Method',
            method: 'Method',
            direct: 'Direct',
            directCalculated: 'Directly Calculated: K={kValue}, Phi={phiValue}°'
        }
    },
    fr: {
        home: {
            title: 'G-Tune',
            subtitle: 'Assistant d\'équilibrage des rotors du Cabri G2',
            mainRotor: 'Rotor Principal',
            tailRotor: 'Rotor Arrière',
            language: 'Langue',
        },
        mainRotor: {
            backToHome: 'Retour à l\'accueil',
            title: 'Rotor Principal',
            step: 'Étape',
            rotorIsBalanced: 'Le rotor est équilibré !',
            vibrationBelowThreshold: 'L\'amplitude des vibrations ({amplitude} IPS) est inférieure au seuil de 0.2 IPS.',
            calculationMethod: 'Méthode de Calcul',
            lookupTable: 'Arbres de decision',
            constant1: 'Constante 1 (K=15, Φ=298)',
            constant2: 'Constante 2 (K=22, Φ=270)',
            vibrationMeasurement: 'Mesure des Vibrations',
            amplitudeLabel: 'Amplitude (IPS)',
            phaseLabelHHMM: 'Phase (hh:mm)',
            phaseLabelDegrees: 'Phase (degrés)',
            currentlyInstalledWeights: 'Masselottes Actuellement Installés',
            fromPreviousStep: 'De l\'étape précédente.',
            yellowBlade: 'Pale Jaune',
            greenBlade: 'Pale Verte',
            redBlade: 'Pale Rouge',
            recommendationAction: 'Recommandation & Action',
            addToCurrentlyInstalled: 'Ajouter aux masselottes actuelles',
            recommended: 'Recommandé',
            yourAction: 'Votre Action',
            totalWeight: 'Masse Totale',
            goToNextStep: 'Suivant',
            goToPreviousStep: 'Précédent',
            generateReport: 'Générer un Rapport PDF',
            interpolatedValues: 'K={kValue}, Phi={phiValue}°',
            plotTitle: 'Graphique d\'équilibrage',
            calculationBlend: 'Mélange de Calcul : {blendRatio}% Direct / {inverseBlendRatio}% Méthode',
            method: 'Méthode',
            direct: 'Direct',
            directCalculated: 'Calcul Direct : K={kValue}, Phi={phiValue}°'
        },
        tailRotor: {
            backToHome: 'Retour à l\'accueil',
            title: 'Rotor Arrière',
            step: 'Étape',
            rotorIsBalanced: 'Le rotor est équilibré !',
            vibrationBelowThreshold: 'L\'amplitude des vibrations ({amplitude} IPS) est inférieure au seuil de 0.2 IPS.',
            calculationMethod: 'Méthode de Calcul',
            lookupTable: 'Arbres de decision',
            constant1: 'Constante 1 (K=2, Φ=310)',
            constant2: 'Constante 2 (K=2.8, Φ=302)',
            vibrationMeasurement: 'Mesure des Vibrations',
            amplitudeLabel: 'Amplitude (IPS)',
            phaseLabelHHMM: 'Phase (hh:mm)',
            phaseLabelDegrees: 'Phase (degrés)',
            installedWeights: 'Masselottes Installés',
            enterWashers: 'Entrez les rondelles actuellement sur le rotor.',
            fromPreviousStep: '(De l\'étape précédente)',
            small: 'Petite',
            large: 'Grande',
            recommendation: 'Recommandation',
            recommendationFinalSetup: 'Recommandation & Configuration Finale',
            recommendedFinalWashers: 'Rondelles Recommandées (total)',
            yourFinalWasherSetup: 'Votre Configuration Rondelles (total)',
            goToNextStep: 'Suivant',
            goToPreviousStep: 'Précédent',
            generateReport: 'Générer un Rapport PDF',
            interpolatedValues: 'K={kValue}, Phi={phiValue}°',
            plotTitle: 'Graphique d\'équilibrage',
            calculationBlend: 'Mélange de Calcul : {blendRatio}% Direct / {inverseBlendRatio}% Méthode',
            method: 'Méthode',
            direct: 'Direct',
            directCalculated: 'Calcul Direct : K={kValue}, Phi={phiValue}°'
        }
    }
};

// --- FONCTIONS UTILITAIRES ---

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

    // 1. Calculate Vibration Change Vector (Delta V)
    const v1 = toCartesian(initialState.amplitude, initialState.phaseDeg);
    const v2 = toCartesian(currentState.amplitude, currentState.phaseDeg);
    const deltaV = toPolar(v2.x - v1.x, v2.y - v1.y);

    if (deltaV.mag < 0.01) return { isCalculable: false };

    // 2. Calculate Total Weight Change Vector (Delta W)
    let totalDeltaWx = 0;
    let totalDeltaWy = 0;

    if (rotorType === 'main') {
        const bladeConfig = { Yellow: 0, Green: 240, Red: 120 };
        // The total weight change is the difference between the weights that produced
        // the current vibration and the weights that produced the initial vibration.
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

    // 3. Calculate K and Phi
    const K = deltaW.mag / deltaV.mag;
    const Phi = (deltaW.deg - deltaV.deg + 360) % 360;

    return { K, Phi, isCalculable: true };
};


// New rounding function for main rotor weights
const roundToHalf = (num) => Math.round(num * 2) / 2;

function bilinearInterpolate(table, x, y) {
    const X_STEP = 0.2;
    const Y_STEP = 5.0;
    const X_MIN = 0.2;
    const x_table_size = table[0].length;
    const y_table_size = table.length;
    const X_MAX = X_MIN + (x_table_size - 1) * X_STEP;
    x = Math.max(X_MIN, Math.min(x, X_MAX));
    y = ((y % 360) + 360) % 360;
    const x1_idx = Math.floor((x - X_MIN) / X_STEP);
    const x2_idx = Math.min(x1_idx + 1, x_table_size - 1);
    const y1_idx = Math.floor(y / Y_STEP);
    const y2_idx = (y1_idx + 1) % y_table_size;
    const row1 = table[y1_idx];
    const row2 = table[y2_idx];
    if (!row1 || !row2) return 0;
    const q11 = row1[x1_idx];
    const q12 = row2[x1_idx];
    const q21 = row1[x2_idx];
    const q22 = row2[x2_idx];
    const x1 = x1_idx * X_STEP + X_MIN;
    const x2 = x2_idx * X_STEP + X_MIN;
    const y1 = y1_idx * Y_STEP;
    const y2 = y1_idx * Y_STEP + Y_STEP;
    if (x1 === x2) {
        if (y1 === y2) return q11;
        const t = (y - y1) / (y2 - y1);
        if (isNaN(t)) return q11;
        return q11 * (1 - t) + q12 * t;
    }
    const r1 = ((x2 - x) / (x2 - x1)) * q11 + ((x - x1) / (x2 - x1)) * q21;
    const r2 = ((x2 - x) / (x2 - x1)) * q12 + ((x - x1) / (x2 - x1)) * q22;
    if (y1 === y2) return r1;
    const t = (y - y1) / (y2 - y1);
    if (isNaN(t)) return r1;
    return r1 * (1 - t) + r2 * t;
}

const getCoefficientsFromLookup = (rotorType, amplitude, phase) => {
    const tables = lookupTables[rotorType];
    if (!tables || !tables.K || !tables.Phi || !tables.K.length || !tables.K[0].length) {
        return { K: 0, Phi: 0 };
    }
    const K = bilinearInterpolate(tables.K, amplitude, phase);
    const Phi = bilinearInterpolate(tables.Phi, amplitude, phase);
    return { K, Phi };
};

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

// --- COMPOSANTS UI ---
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


const BladeWeightInput = ({ color, label, weight, onWeightChange, step }) => {
    const bladeColors = { Yellow: 'bg-yellow-400', Red: 'bg-red-500', Green: 'bg-green-500' };
    return (
        <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
            <div className="flex items-center"><div className={`w-6 h-6 rounded-full mr-3 ${bladeColors[color]}`}></div><span className="font-bold text-white">{label}</span></div>
            <div className="flex items-center">
                 <DecimalInput value={weight} onChange={(val) => onWeightChange(color, val)} disabled={step > 0}
                    className="w-24 p-1 text-right text-white bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-700 disabled:border-gray-700" />
                <span className="ml-2 text-gray-400">g</span>
            </div>
        </div>
    );
};

const TailRotorInputHeader = ({ t }) => (
    <div className="flex items-center justify-end pr-3 pb-1">
         <div className="flex items-center space-x-2">
             <div className="w-14 text-center"><span className="text-xs font-bold text-gray-400">{t.small}</span></div>
             <div className="w-14 text-center"><span className="text-xs font-bold text-gray-400">{t.large}</span></div>
         </div>
    </div>
);

const TailScrewWeightInput = ({ number, washers, onWasherChange, isEditable }) => {
    const hasNoWeight = washers.small === 0 && washers.large === 0;
    const rowClasses = hasNoWeight ? 'opacity-50' : '';
    return (
        <div className={`flex items-center justify-between p-3 bg-gray-700 rounded-lg transition-opacity duration-300 ${rowClasses}`}>
            <div className="flex items-center">
                <div className="relative w-8 h-8 mr-3">
                    <svg viewBox="0 0 24 24" className="w-full h-full text-gray-500 fill-current"><path d="M17.656,3.656 L12,2 L6.344,3.656 L2,8.344 L3.656,14 L2,19.656 L6.344,21.344 L12,23 L17.656,21.344 L22,19.656 L20.344,14 L22,8.344 L17.656,3.656 Z"></path></svg>
                    <span className="absolute inset-0 flex items-center justify-center font-bold text-white">{number}</span>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                {[ 'small', 'large' ].map(type => {
                    const textColor = washers[type] > 0 ? 'text-cyan-400 font-black text-lg' : 'text-white';
                    return (
                        <div key={type} className="relative">
                            <input type="number" min="0" step="1" value={washers[type]} onChange={(e) => onWasherChange(number, type, parseInt(e.target.value) || 0)} disabled={!isEditable}
                                className={`w-14 p-1 pr-6 text-right bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-700 disabled:border-gray-700 transition-colors duration-300 ${textColor}`} />
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

// --- MAIN ROTOR PLOT ADDED BACK ---
const MainRotorPlot = React.memo(({ plotAmplitude, phaseDeg, K, Phi }) => {
    const size = 500;
    const center = size / 2;
    const maxIPS = Math.max(0.4, plotAmplitude * 1.5);
    const plotRadius = center - 50;

    const ipsToPx = (ips) => (ips / maxIPS) * plotRadius;

    const blades = [
        { name: 'Yellow', color: '#f59e0b', origAngle: 0 },
        { name: 'Red', color: '#ef4444', origAngle: 120 },
        { name: 'Green', color: '#22c55e', origAngle: 240 },
    ];

    const plotBlades = blades.map(b => ({
        ...b,
        plotAngle: (b.origAngle + Phi - 180 + 360) % 360,
    }));

    const weightGrads = [3, 6, 9, 12, 15, 18, 21];
    const gridRings = [0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0];
    const grid = {
        circles: gridRings.filter(r => r <= maxIPS),
        lines: Array.from({ length: 12 }, (_, i) => i * 30),
    };

    const unbalancePoint = polarToCartesianPlot(center, center, ipsToPx(plotAmplitude), phaseDeg);

    const getRayEndPoint = (startPoint, angle, length) => {
        const angleInRadians = ((angle - 90) * Math.PI) / 180.0;
        return {
            x: startPoint.x + length * Math.cos(angleInRadians),
            y: startPoint.y + length * Math.sin(angleInRadians),
        };
    };

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto bg-gray-800 rounded-lg">
            <g id="grid" stroke="#4a5568">
                {grid.circles.map(r => <circle key={r} cx={center} cy={center} r={ipsToPx(r)} fill="none" strokeWidth="1" />)}
                {grid.lines.map(angle => {
                    const { x, y } = polarToCartesianPlot(center, center, plotRadius, angle);
                    return <line key={angle} x1={center} y1={center} x2={x} y2={y} strokeWidth="1" />;
                })}
            </g>
            <g id="grid-labels" fill="#9ca3af" fontSize="12">
                {grid.lines.map((angle, i) => {
                    const { x, y } = polarToCartesianPlot(center, center, plotRadius + 15, angle);
                    return <text key={i} x={x} y={y} textAnchor="middle" alignmentBaseline="middle">{i === 0 ? 12 : i}h</text>;
                })}
                 {grid.circles.map(r => {
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

                        const rayLength = plotRadius / 1;
                        const ray1End = getRayEndPoint(gradPoint, neighbor1.plotAngle, rayLength);
                        const ray2End = getRayEndPoint(gradPoint, neighbor2.plotAngle, rayLength);
                        
                        return (
                            <g key={`${blade.name}-${weight}`}>
                                <line x1={gradPoint.x} y1={gradPoint.y} x2={ray1End.x} y2={ray1End.y} stroke={neighbor1.color} strokeOpacity="0.5" strokeWidth="1.5"/>
                                <line x1={gradPoint.x} y1={gradPoint.y} x2={ray2End.x} y2={ray2End.y} stroke={neighbor2.color} strokeOpacity="0.5" strokeWidth="1.5"/>
                            </g>
                        );
                    });
                })}
            </g>

            <g id="blades">
                {plotBlades.map(blade => {
                    const endPoint = polarToCartesianPlot(center, center, plotRadius, blade.plotAngle);
                    const labelPoint = polarToCartesianPlot(center, center, plotRadius + 25, blade.plotAngle);
                    return (
                        <g key={blade.name}>
                            <line x1={center} y1={center} x2={endPoint.x} y2={endPoint.y} stroke={blade.color} strokeWidth="4" />
                            <text x={labelPoint.x} y={labelPoint.y} fill={blade.color} textAnchor="middle" alignmentBaseline="middle" fontWeight="bold" fontSize="16">{blade.name.charAt(0)}</text>
                            {weightGrads.map(weight => {
                                const ips = weight / K;
                                if (ips > maxIPS) return null;
                                const gradPoint = polarToCartesianPlot(center, center, ipsToPx(ips), blade.plotAngle);
                                const textAngle = blade.plotAngle < 180 ? blade.plotAngle + 90 : blade.plotAngle - 90;
                                const textPoint = polarToCartesianPlot(gradPoint.x, gradPoint.y, 10, textAngle);
                                return (
                                   <g key={`${blade.name}-grad-${weight}`}>
                                        <circle cx={gradPoint.x} cy={gradPoint.y} r="2" fill={blade.color} />
                                        <text x={textPoint.x} y={textPoint.y} fill="white" fontSize="10" textAnchor="middle" alignmentBaseline="middle">{weight}g</text>
                                   </g>
                                )
                            })}
                        </g>
                    );
                })}
            </g>
            
            <g id="unbalance-point">
                <circle cx={unbalancePoint.x} cy={unbalancePoint.y} r="5" fill="none" stroke="#f0f" strokeWidth="2" />
                <circle cx={unbalancePoint.x} cy={unbalancePoint.y} r="2" fill="#f0f" />
            </g>
        </svg>
    );
});

const TailRotorPlot = React.memo(({ amplitude, phaseDeg, K, Phi }) => {
    const size = 500;
    const center = size / 2;

    const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
        const angleInRadians = ((-angleInDegrees - 90) * Math.PI) / 180.0;
        return {
            x: centerX + radius * Math.cos(angleInRadians),
            y: centerY + radius * Math.sin(angleInRadians),
        };
    };
    
    const getRayEndPoint = (startPoint, angle, length) => {
        const angleInRadians = ((-angle - 90) * Math.PI) / 180.0;
        return {
            x: startPoint.x + length * Math.cos(angleInRadians),
            y: startPoint.y + length * Math.sin(angleInRadians),
        };
    };

    const maxIPS = Math.max(0.4, amplitude * 1.5);
    const plotRadius = center - 50;

    const ipsToPx = (ips) => (ips / maxIPS) * plotRadius;

    const screwCount = 7;
    const screws = Array.from({length: screwCount}, (_, i) => ({
        name: `${i + 1}`,
        color: '#22d3ee',
        origAngle: (360 / screwCount) * i + (360 / (2 * screwCount))
    }));

    const plotScrews = screws.map(s => ({
        ...s,
        plotAngle: (s.origAngle - Phi - 180 + 360) % 360,
    }));

    const weightGrads = [
        { weight: 0.7, label: '1S' },
        { weight: 1.4, label: '2S' },
        { weight: 2.0, label: '1L' },
        { weight: 2.1, label: '3S' },
        { weight: 2.7, label: '1L+1S' },
        { weight: 3.4, label: '1L+2S' },
        { weight: 4.0, label: '2L' },
    ];
    const gradColors = ['#a78bfa', '#ec4899'];

    const gridRings = [0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0];
    const grid = {
        circles: gridRings.filter(r => r <= maxIPS),
        lines: Array.from({ length: 12 }, (_, i) => i * 30),
    };

    const unbalancePoint = polarToCartesian(center, center, ipsToPx(amplitude), phaseDeg);
    
    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto bg-gray-800 rounded-lg">
            <g id="grid" stroke="#4a5568">
                {grid.circles.map(r => <circle key={r} cx={center} cy={center} r={ipsToPx(r)} fill="none" strokeWidth="1" />)}
                {grid.lines.map(angle => {
                    const { x, y } = polarToCartesian(center, center, plotRadius, angle);
                    return <line key={angle} x1={center} y1={center} x2={x} y2={y} strokeWidth="1" />;
                })}
            </g>
             <g id="grid-labels" fill="#9ca3af" fontSize="12">
                {grid.lines.map((angle, i) => {
                    const { x, y } = polarToCartesian(center, center, plotRadius + 15, angle);
                    return <text key={i} x={x} y={y} textAnchor="middle" alignmentBaseline="middle">{i === 0 ? 12 : i}h</text>;
                })}
                 {grid.circles.map(r => {
                    const { x, y } = polarToCartesian(center, center, ipsToPx(r), 270);
                    return <text key={r} x={x-5} y={y} textAnchor="end" alignmentBaseline="middle">{r.toFixed(1)}</text>;
                })}
            </g>

            <g id="projection-lines">
                {plotScrews.map((screw, screwIdx) => {
                    const neighbor1 = plotScrews[(screwIdx + 1) % screwCount];
                    const neighbor2 = plotScrews[(screwIdx + screwCount - 1) % screwCount];
                    
                    return weightGrads.map(grad => {
                        const ips = grad.weight / K;
                        if (ips > maxIPS) return null;
                        const gradPoint = polarToCartesian(center, center, ipsToPx(ips), screw.plotAngle);

                        const rayLength = plotRadius / 1;
                        const ray1End = getRayEndPoint(gradPoint, neighbor1.plotAngle, rayLength);
                        const ray2End = getRayEndPoint(gradPoint, neighbor2.plotAngle, rayLength);
                        const label1Point = getRayEndPoint(ray1End, neighbor1.plotAngle, 10);
                        const label2Point = getRayEndPoint(ray2End, neighbor2.plotAngle, 10);

                        return (
                            <g key={`${screw.name}-${grad.weight}`}>
                                <line x1={gradPoint.x} y1={gradPoint.y} x2={ray1End.x} y2={ray1End.y} stroke={gradColors[0]} strokeOpacity="0.6" strokeWidth="1.5"/>
                                <text x={label1Point.x} y={label1Point.y} fill={gradColors[0]} fontSize="9" textAnchor="middle" alignmentBaseline="middle">{grad.label}</text>

                                <line x1={gradPoint.x} y1={gradPoint.y} x2={ray2End.x} y2={ray2End.y} stroke={gradColors[1]} strokeOpacity="0.6" strokeWidth="1.5"/>
                                <text x={label2Point.x} y={label2Point.y} fill={gradColors[1]} fontSize="9" textAnchor="middle" alignmentBaseline="middle">{grad.label}</text>
                            </g>
                        );
                    });
                })}
            </g>

            <g id="screws">
                {plotScrews.map(screw => {
                    const endPoint = polarToCartesian(center, center, plotRadius, screw.plotAngle);
                    return (
                        <g key={screw.name}>
                            <line x1={center} y1={center} x2={endPoint.x} y2={endPoint.y} stroke={screw.color} strokeWidth="4" />
                            <circle cx={endPoint.x} cy={endPoint.y} r="10" fill={screw.color}/>
                            <text x={endPoint.x} y={endPoint.y} fill="black" textAnchor="middle" alignmentBaseline="middle" fontWeight="bold">{screw.name}</text>
                            {weightGrads.map(grad => {
                                const ips = grad.weight / K;
                                if (ips > maxIPS) return null;
                                const gradPoint = polarToCartesian(center, center, ipsToPx(ips), screw.plotAngle);
                                return <circle key={`${screw.name}-grad-${grad.weight}`} cx={gradPoint.x} cy={gradPoint.y} r="2" fill={screw.color} />;
                            })}
                        </g>
                    );
                })}
            </g>

            <g id="unbalance-point">
                <circle cx={unbalancePoint.x} cy={unbalancePoint.y} r="5" fill="none" stroke="#f0f" strokeWidth="2" />
                <circle cx={unbalancePoint.x} cy={unbalancePoint.y} r="2" fill="#f0f" />
            </g>
        </svg>
    );
});


// --- PAGE COMPONENTS ---

const HomePage = ({ setPage, lang, setLang, t }) => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white bg-gray-900">
        <img src={logo} alt="Guimbal" className="w-48 mb-4" />
        <h1 className="text-4xl font-bold text-cyan-400 mb-2 font-eurostile">{t.home.title}</h1>
        <p className="mb-8 text-gray-400">{t.home.subtitle}</p>
        <div className="w-full max-w-sm space-y-4">
            <button onClick={() => setPage('main')} className="w-full p-4 font-bold font-eurostile text-white transition bg-gray-800 rounded-lg shadow-lg hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50">{t.home.mainRotor}</button>
            <button onClick={() => setPage('tail')} className="w-full p-4 font-bold font-eurostile text-white transition bg-gray-800 rounded-lg shadow-lg hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50">{t.home.tailRotor}</button>
        </div>
        <div className="mt-8 flex items-center">
            <span className="mr-2 text-sm text-gray-400">{t.home.language}:</span>
            <button 
                onClick={() => setLang(lang === 'en' ? 'fr' : 'en')} 
                className="px-4 py-2 text-sm font-bold text-white bg-gray-700 rounded-md hover:bg-cyan-700"
            >
                {lang.toUpperCase()}
            </button>
        </div>
    </div>
);

const bladeConfig = { Yellow: 0, Green: 240, Red: 120}; // Now defined once, outside the component.
const mainRotorConstants = {
    constant1: { K: 15, Phi: 298 },
    constant2: { K: 22, Phi: 270 },
};
const MainRotorPage = ({ setPage, t }) => {
    const topRef = useRef(null);
    const bladeTextColors = { Yellow: 'text-yellow-400', Red: 'text-red-500', Green: 'text-green-500' };
    
    const [calculationMode, setCalculationMode] = useState('lookup'); 
    
    const [blendRatio, setBlendRatio] = useState(100);

    const initialStepState = {
        amplitude: 0,
        phaseDeg: 0,
        userInput: false,
        currentWeights: { Yellow: 0, Green: 0, Red: 0 },
        recommendedChange: { Yellow: 0, Green: 0, Red: 0 },
        actualChange: { Yellow: 0, Green: 0, Red: 0 },
        calculatedCoeffs: { K: null, Phi: null },
        actionManuallySet: false,
    };

    // --- REFACTORED ATOMIC STATE ---
    const [rotorState, setRotorState] = useState({
        history: [initialStepState],
        currentStepIndex: 0,
    });
    const { history, currentStepIndex } = rotorState;
    
    const currentStepData = history[currentStepIndex];
    const { 
        amplitude, phaseDeg, userInput, currentWeights, 
        recommendedChange, actualChange, calculatedCoeffs, actionManuallySet 
    } = currentStepData;

    const updateCurrentStep = useCallback((newData) => {
        setRotorState(prevState => {
            const newHistory = [...prevState.history];
            newHistory[prevState.currentStepIndex] = { ...newHistory[prevState.currentStepIndex], ...newData };
            return { ...prevState, history: newHistory };
        });
    }, []);
    // --- END REFACTORED STATE ---

    const isBalanced = useMemo(() => amplitude < 0.2 && userInput, [amplitude, userInput]);

    const directCoeffs = useMemo(() => {
        return calculateDirectCoefficients(history, 'main');
    }, [history]);

    const methodCoeffs = useMemo(() => {
        if (calculationMode === 'lookup') {
            return getCoefficientsFromLookup('main', amplitude, phaseDeg);
        } else {
            return mainRotorConstants[calculationMode];
        }
    }, [calculationMode, amplitude, phaseDeg]);

    const finalCoeffs = useMemo(() => {
        const ratio = blendRatio / 100;
        if (!userInput || !methodCoeffs) return { K: null, Phi: null };

        if (!directCoeffs.isCalculable || ratio === 0) {
            return methodCoeffs;
        }
        if (ratio === 1) {
            return { K: directCoeffs.K, Phi: directCoeffs.Phi };
        }

        const K_final = directCoeffs.K * ratio + methodCoeffs.K * (1 - ratio);
        
        const phi_d_rad = directCoeffs.Phi * Math.PI / 180;
        const phi_m_rad = methodCoeffs.Phi * Math.PI / 180;
        const v_d = { x: Math.cos(phi_d_rad), y: Math.sin(phi_d_rad) };
        const v_m = { x: Math.cos(phi_m_rad), y: Math.sin(phi_m_rad) };
        const v_final_x = v_d.x * ratio + v_m.x * (1 - ratio);
        const v_final_y = v_d.y * ratio + v_m.y * (1 - ratio);
        const v_mag = Math.sqrt(v_final_x**2 + v_final_y**2);

        if (v_mag < 1e-9) {
            return { K: K_final, Phi: methodCoeffs.Phi };
        }
        
        const Phi_final = (Math.atan2(v_final_y, v_final_x) * 180 / Math.PI + 360) % 360;
        
        return { K: K_final, Phi: Phi_final };
    }, [blendRatio, directCoeffs, methodCoeffs, userInput]);

    const calculateRecommendation = useCallback((K, Phi) => {
        if (K === null || K === 0 || !userInput) {
            updateCurrentStep({ 
                calculatedCoeffs: { K, Phi },
                recommendedChange: { Yellow: 0, Green: 0, Red: 0 },
                actualChange: { Yellow: 0, Green: 0, Red: 0 } 
            });
            return;
        } 
        
        const correctionAngle = (phaseDeg + 180 + Phi) % 360;
        const correctionWeight = amplitude * K;
        const rec = {};
        Object.keys(bladeConfig).forEach(color => {
            const angleRad = (correctionAngle - bladeConfig[color]) * Math.PI / 180;
            const weightComponent = correctionWeight * Math.cos(angleRad) * (2/3);
            rec[color] = Math.max(0, weightComponent);
        });
        const changeInWeight = {};
        Object.keys(rec).forEach(color => {
            const needed = rec[color] - currentWeights[color];
            const finalWeight = currentWeights[color] + needed;
            if (finalWeight > 60) {
              changeInWeight[color] = 60 - currentWeights[color];
            } else {
              changeInWeight[color] = roundToHalf(needed);
            }
        });

        const newChanges = { 
            calculatedCoeffs: { K, Phi },
            recommendedChange: changeInWeight 
        };

        if (!actionManuallySet) {
            newChanges.actualChange = changeInWeight;
        }

        updateCurrentStep(newChanges);

    }, [amplitude, phaseDeg, currentWeights, bladeConfig, actionManuallySet, userInput, updateCurrentStep]);

    useEffect(() => {
        if (userInput && finalCoeffs.K !== null) {
            calculateRecommendation(finalCoeffs.K, finalCoeffs.Phi);
        }
    }, [userInput, finalCoeffs, calculateRecommendation]);


    const totalFinalWeights = useMemo(() => {
        const total = {};
        Object.keys(currentWeights).forEach(color => {
            const sum = currentWeights[color] + (actualChange[color] || 0);
            const final = roundToHalf(Math.max(0, sum));
            total[color] = Math.min(60, final);
        });
        return total;
    }, [currentWeights, actualChange]);

    const handleNextStep = () => {
        const nextStep = {
            ...initialStepState,
            currentWeights: totalFinalWeights,
        };
        setBlendRatio(100);
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
    
    const bladeLabels = { Yellow: t.mainRotor.yellowBlade, Green: t.mainRotor.greenBlade, Red: t.mainRotor.redBlade };

    const getCalcMethodButtonClass = (mode) => {
        return calculationMode === mode
            ? 'bg-cyan-600 text-white'
            : 'bg-gray-700 hover:bg-gray-600 text-gray-300';
    };

    return (
        <div ref={topRef} className="min-h-screen p-4 text-white bg-gray-900">
            <div style={{ position: 'absolute', left: '-9999px', top: 'auto' }}>
                <Report id="main-rotor-report-content" history={history} rotorType="main" t={t} />
            </div>

            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-1">{t.mainRotor.title}</h1>
                <p className="text-gray-400">{t.mainRotor.step} {currentStepIndex + 1}</p>
                <button onClick={() => setPage('home')} className="mt-2 mb-6 text-sm text-cyan-400">&larr; {t.mainRotor.backToHome}</button>

                {isBalanced && <div className="p-4 mb-6 text-center text-green-200 bg-green-800 border border-green-600 rounded-lg"><p className="font-bold">{t.mainRotor.rotorIsBalanced}</p><p className="text-sm">{t.mainRotor.vibrationBelowThreshold.replace('{amplitude}', amplitude.toFixed(2))}</p></div>}
                
                <div className="p-4 mb-6 bg-gray-800 rounded-lg">
                    <h2 className="mb-3 text-xl font-semibold text-cyan-400">{t.mainRotor.calculationMethod}</h2>
                    <div className="flex flex-col sm:flex-row rounded-md overflow-hidden">
                        <button onClick={() => setCalculationMode('lookup')} className={`flex-1 p-2 text-sm font-bold transition ${getCalcMethodButtonClass('lookup')}`}>{t.mainRotor.lookupTable}</button>
                        <button onClick={() => setCalculationMode('constant1')} className={`flex-1 p-2 text-sm font-bold transition ${getCalcMethodButtonClass('constant1')}`}>{t.mainRotor.constant1}</button>
                        <button onClick={() => setCalculationMode('constant2')} className={`flex-1 p-2 text-sm font-bold transition ${getCalcMethodButtonClass('constant2')}`}>{t.mainRotor.constant2}</button>
                    </div>
                     {directCoeffs.isCalculable && (
                        <div className="pt-4 mt-4 border-t border-gray-700">
                            <label htmlFor="blendRatio" className="block mb-2 text-sm font-medium text-gray-300">
                                {t.mainRotor.calculationBlend.replace('{blendRatio}', blendRatio).replace('{inverseBlendRatio}', 100 - blendRatio)}
                            </label>
                            <div className="flex items-center space-x-4">
                                <span className="text-xs font-semibold text-cyan-400">{t.mainRotor.method}</span>
                                <input id="blendRatio" type="range" min="0" max="100" step="5" value={blendRatio} onChange={(e) => setBlendRatio(parseInt(e.target.value, 10))}
                                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-thumb"/>
                                <span className="text-xs font-semibold text-green-400">{t.mainRotor.direct}</span>
                            </div>
                             <p className="mt-2 text-xs text-center text-gray-400">
                                {t.mainRotor.directCalculated.replace('{kValue}', directCoeffs.K.toFixed(2)).replace('{phiValue}', directCoeffs.Phi.toFixed(2))}
                            </p>
                        </div>
                    )}
                </div>

                <div className="p-4 mb-6 bg-gray-800 rounded-lg">
                    <h2 className="mb-3 text-xl font-semibold text-cyan-400">{t.mainRotor.vibrationMeasurement}</h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div><label className="block mb-1 text-sm font-medium text-gray-300">{t.mainRotor.amplitudeLabel}</label><DecimalInput value={amplitude} onChange={val => updateCurrentStep({ amplitude: val, userInput: true })} className="w-full p-2 text-white bg-gray-700 border border-gray-600 rounded-md"/></div>
                        <div><label className="block mb-1 text-sm font-medium text-gray-300">{t.mainRotor.phaseLabelHHMM}</label><input type="time" value={degreesToTime(phaseDeg)} onChange={e => updateCurrentStep({ phaseDeg: timeToDegrees(e.target.value), userInput: true })} className="w-full p-2 text-white bg-gray-700 border border-gray-600 rounded-md"/></div>
                        <div className="md:col-span-2"><label className="block mb-1 text-sm font-medium text-gray-300">{t.mainRotor.phaseLabelDegrees}</label><DecimalInput value={phaseDeg} onChange={val => updateCurrentStep({ phaseDeg: val, userInput: true })} className="w-full p-2 text-white bg-gray-700 border border-gray-600 rounded-md"/></div>
                    </div>
                </div>

                <div className="p-4 mb-6 bg-gray-800 rounded-lg">
                    <h2 className="mb-3 text-xl font-semibold text-cyan-400">{t.mainRotor.currentlyInstalledWeights}</h2>
                    {currentStepIndex > 0 && <p className="text-xs text-gray-500 mb-2">{t.mainRotor.fromPreviousStep}</p>}
                    <div className="space-y-2">
                        {Object.keys(bladeConfig).map(color => (
                            <BladeWeightInput key={color} color={color} label={bladeLabels[color]} 
                                weight={currentWeights[color]} 
                                onWeightChange={(c, w) => updateCurrentStep({ currentWeights: {...currentWeights, [c]:w}, userInput: true })} 
                                step={currentStepIndex} 
                            />
                        ))}
                    </div>
                </div>

                <div className="p-4 mb-6 bg-gray-800 rounded-lg">
                    <h2 className="mb-3 text-xl font-semibold text-cyan-400">{t.mainRotor.recommendationAction}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 p-3 border border-gray-600 rounded-lg">
                            <h3 className="mb-3 text-center font-bold text-gray-400">{t.mainRotor.addToCurrentlyInstalled}</h3>
                            <div className="grid grid-cols-2 gap-2 sm:gap-4">
                                <div>
                                    <h3 className="mb-2 text-sm font-bold text-center text-gray-400">{t.mainRotor.recommended}</h3>
                                    {Object.keys(bladeConfig).map(color => (<div key={color} className="p-2 mb-2 text-center bg-gray-700 rounded-md whitespace-nowrap"><span className={`font-bold ${bladeTextColors[color]}`}>{color.charAt(0)}</span>: <span>{recommendedChange[color] >= 0 ? '+' : ''}{recommendedChange[color].toFixed(1)}g</span></div>))}
                                </div>
                                <div>
                                    <h3 className="mb-2 text-sm font-bold text-center text-gray-400">{t.mainRotor.yourAction}</h3>
                                    {Object.keys(bladeConfig).map(color => (<DecimalInput 
                                        key={color} 
                                        value={actualChange[color]} 
                                        onChange={val => updateCurrentStep({ actualChange: {...actualChange, [color]: val}, actionManuallySet: true })} 
                                        className="w-full p-2 mb-2 text-center text-white bg-gray-900 border border-gray-600 rounded-md" />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="md:col-span-1">
                             <div className="invisible mb-3"><h3 className="text-center font-bold text-gray-400">{t.mainRotor.addToCurrentlyInstalled}</h3></div>
                             <h3 className="mb-2 text-sm font-bold text-center text-gray-400">{t.mainRotor.totalWeight}</h3>
                             {Object.keys(bladeConfig).map(color => (<div key={color} className="p-2 mb-2 text-center bg-gray-700 rounded-md whitespace-nowrap"><span className={`font-bold ${bladeTextColors[color]}`}>{color.charAt(0)}</span>: <span>{totalFinalWeights[color].toFixed(1)}g</span></div>))}
                        </div>
                    </div>
                </div>

                {userInput && calculatedCoeffs.K && (
                    <div className="p-4 mb-6 bg-gray-800 rounded-lg">
                        <h2 className="mb-3 text-xl font-semibold text-cyan-400">{t.mainRotor.plotTitle}</h2>
                        <MainRotorPlot plotAmplitude={amplitude * (2/3)} phaseDeg={phaseDeg} K={calculatedCoeffs.K} Phi={calculatedCoeffs.Phi}/>
                    </div>
                )}
                
                <div className="flex flex-col md:flex-row gap-4">
                    <button onClick={handlePreviousStep} disabled={currentStepIndex === 0} className="w-full p-4 font-bold text-white transition bg-gray-600 rounded-lg hover:bg-gray-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed">{t.mainRotor.goToPreviousStep}</button>
                    <button onClick={handleNextStep} className="w-full p-4 text-xl font-bold text-white transition bg-cyan-600 rounded-lg hover:bg-cyan-500">{t.mainRotor.goToNextStep}</button>
                </div>
                <div className="mt-4">
                     <button onClick={handleGenerateReport} className="w-full p-3 font-bold text-white transition bg-green-600 rounded-lg hover:bg-green-500">{t.mainRotor.generateReport}</button>
                </div>
                
                {calculatedCoeffs.K !== null && (<div className="my-4 text-xs text-center text-gray-500"><p>{t.mainRotor.interpolatedValues.replace('{kValue}', calculatedCoeffs.K.toFixed(2)).replace('{phiValue}', calculatedCoeffs.Phi.toFixed(2))}</p></div>)}
            </div>
        </div>
    );
};

const tailRotorConstants = {
    constant1: { K: 2, Phi: 310 },
    constant2: { K: 2.8, Phi: 302 },
};

const TailRotorPage = ({ setPage, t }) => {
    const topRef = useRef(null);
    const screwCount = 7;
    const smallWasherWeight = 0.7;
    const largeWasherWeight = 2.0;

    const [calculationMode, setCalculationMode] = useState('lookup'); 
    
    const [blendRatio, setBlendRatio] = useState(100);

    const initialStepState = {
        amplitude: 0,
        phaseDeg: 0,
        userInput: false,
        isInstalledOpen: false,
        isFinalSetupOpen: false,
        currentWashers: Array(screwCount).fill({ small: 0, large: 0 }),
        recommendedWashers: Array(screwCount).fill({ small: 0, large: 0 }),
        actualWashers: Array(screwCount).fill({ small: 0, large: 0 }),
        calculatedCoeffs: { K: null, Phi: null },
    };

    // --- REFACTORED ATOMIC STATE ---
    const [rotorState, setRotorState] = useState({
        history: [initialStepState],
        currentStepIndex: 0,
    });
    const { history, currentStepIndex } = rotorState;

    const currentStepData = history[currentStepIndex];
    const { amplitude, phaseDeg, userInput, isInstalledOpen, isFinalSetupOpen, currentWashers, recommendedWashers, actualWashers, calculatedCoeffs } = currentStepData;

    const updateCurrentStep = useCallback((newData) => {
        setRotorState(prevState => {
            const newHistory = [...prevState.history];
            newHistory[prevState.currentStepIndex] = { ...newHistory[prevState.currentStepIndex], ...newData };
            return { ...prevState, history: newHistory };
        });
    }, []);
    // --- END REFACTORED STATE ---

    const screwAngles = useMemo(() => Array.from({length: screwCount}, (_, i) => (360 / screwCount) * i + (360 / (2 * screwCount))), [screwCount]);
    const isBalanced = useMemo(() => amplitude < 0.2 && userInput, [amplitude, userInput]);

    const directCoeffs = useMemo(() => {
        return calculateDirectCoefficients(history, 'tail');
    }, [history]);

    const methodCoeffs = useMemo(() => {
        if (calculationMode === 'lookup') {
            return getCoefficientsFromLookup('tail', amplitude, phaseDeg);
        } else {
            return tailRotorConstants[calculationMode];
        }
    }, [calculationMode, amplitude, phaseDeg]);

    const finalCoeffs = useMemo(() => {
        const ratio = blendRatio / 100;
        if (!userInput || !methodCoeffs) return { K: null, Phi: null };

        if (!directCoeffs.isCalculable || ratio === 0) {
            return methodCoeffs;
        }
        if (ratio === 1) {
            return { K: directCoeffs.K, Phi: directCoeffs.Phi };
        }

        const K_final = directCoeffs.K * ratio + methodCoeffs.K * (1 - ratio);
        
        const phi_d_rad = directCoeffs.Phi * Math.PI / 180;
        const phi_m_rad = methodCoeffs.Phi * Math.PI / 180;
        const v_d = { x: Math.cos(phi_d_rad), y: Math.sin(phi_d_rad) };
        const v_m = { x: Math.cos(phi_m_rad), y: Math.sin(phi_m_rad) };
        const v_final_x = v_d.x * ratio + v_m.x * (1 - ratio);
        const v_final_y = v_d.y * ratio + v_m.y * (1 - ratio);
        const v_mag = Math.sqrt(v_final_x**2 + v_final_y**2);

        if (v_mag < 1e-9) {
            return { K: K_final, Phi: methodCoeffs.Phi };
        }
        
        const Phi_final = (Math.atan2(v_final_y, v_final_x) * 180 / Math.PI + 360) % 360;
        
        return { K: K_final, Phi: Phi_final };
    }, [blendRatio, directCoeffs, methodCoeffs, userInput]);

    const calculateMultiScrewRecommendation = useCallback((K, Phi) => {
        if (K === null || K === 0 || !userInput) {
            updateCurrentStep({
                calculatedCoeffs: { K, Phi },
                recommendedWashers: Array(screwCount).fill({ small: 0, large: 0 }),
                actualWashers: Array(screwCount).fill({ small: 0, large: 0 }),
            });
            return;
        }

        const CUMBERSOME_THRESHOLD = 5;
        const REASONABLE_SLOPE = 0.05;
        const CUMBERSOME_SLOPE = 0.50;

        const correctionAngle = (phaseDeg + 180 + Phi) % 360;
        const correctionWeight = amplitude * K;
        const targetVector = { x: correctionWeight * Math.cos(correctionAngle * Math.PI / 180), y: correctionWeight * Math.sin(correctionAngle * Math.PI / 180) };
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

    }, [amplitude, phaseDeg, screwAngles, userInput, updateCurrentStep]);

    useEffect(() => {
        if(userInput && finalCoeffs.K !== null) {
            calculateMultiScrewRecommendation(finalCoeffs.K, finalCoeffs.Phi);
        }
    }, [userInput, finalCoeffs, calculateMultiScrewRecommendation]);

    const handleNextStep = () => {
        const nextStep = {
            ...initialStepState,
            currentWashers: actualWashers,
        };
        setBlendRatio(100);
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

    const getCalcMethodButtonClass = (mode) => {
        return calculationMode === mode
            ? 'bg-cyan-600 text-white'
            : 'bg-gray-700 hover:bg-gray-600 text-gray-300';
    };

    return (
        <div ref={topRef} className="min-h-screen p-4 text-white bg-gray-900">
            <div style={{ position: 'absolute', left: '-9999px', top: 'auto' }}>
                <Report id="tail-rotor-report-content" history={history} rotorType="tail" t={t} />
            </div>
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-1">{t.tailRotor.title}</h1>
                <p className="text-gray-400">{t.tailRotor.step} {currentStepIndex + 1}</p>
                <button onClick={() => setPage('home')} className="mt-2 mb-6 text-sm text-cyan-400">&larr; {t.tailRotor.backToHome}</button>
                
                {isBalanced && <div className="p-4 mb-6 text-center text-green-200 bg-green-800 border border-green-600 rounded-lg"><p className="font-bold">{t.tailRotor.rotorIsBalanced}</p><p className="text-sm">{t.tailRotor.vibrationBelowThreshold.replace('{amplitude}', amplitude.toFixed(2))}</p></div>}
                
                <div className="p-4 mb-6 bg-gray-800 rounded-lg">
                    <h2 className="mb-3 text-xl font-semibold text-cyan-400">{t.tailRotor.calculationMethod}</h2>
                    <div className="flex flex-col sm:flex-row rounded-md overflow-hidden">
                        <button onClick={() => setCalculationMode('lookup')} className={`flex-1 p-2 text-sm font-bold transition ${getCalcMethodButtonClass('lookup')}`}>{t.tailRotor.lookupTable}</button>
                        <button onClick={() => setCalculationMode('constant1')} className={`flex-1 p-2 text-sm font-bold transition ${getCalcMethodButtonClass('constant1')}`}>{t.tailRotor.constant1}</button>
                        <button onClick={() => setCalculationMode('constant2')} className={`flex-1 p-2 text-sm font-bold transition ${getCalcMethodButtonClass('constant2')}`}>{t.tailRotor.constant2}</button>
                    </div>
                     {directCoeffs.isCalculable && (
                        <div className="pt-4 mt-4 border-t border-gray-700">
                            <label htmlFor="blendRatio" className="block mb-2 text-sm font-medium text-gray-300">
                                {t.tailRotor.calculationBlend.replace('{blendRatio}', blendRatio).replace('{inverseBlendRatio}', 100 - blendRatio)}
                            </label>
                            <div className="flex items-center space-x-4">
                                <span className="text-xs font-semibold text-cyan-400">{t.tailRotor.method}</span>
                                <input id="blendRatio" type="range" min="0" max="100" step="5" value={blendRatio} onChange={(e) => setBlendRatio(parseInt(e.target.value, 10))}
                                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-thumb"/>
                                <span className="text-xs font-semibold text-green-400">{t.tailRotor.direct}</span>
                            </div>
                             <p className="mt-2 text-xs text-center text-gray-400">
                                {t.tailRotor.directCalculated.replace('{kValue}', directCoeffs.K.toFixed(2)).replace('{phiValue}', directCoeffs.Phi.toFixed(2))}
                            </p>
                        </div>
                    )}
                </div>

                <div className="p-4 mb-6 bg-gray-800 rounded-lg">
                    <h2 className="mb-3 text-xl font-semibold text-cyan-400">{t.tailRotor.vibrationMeasurement}</h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div><label className="block mb-1 text-sm font-medium text-gray-300">{t.tailRotor.amplitudeLabel}</label><DecimalInput value={amplitude} onChange={val => updateCurrentStep({ amplitude: val, userInput: true })} className="w-full p-2 text-white bg-gray-700 border border-gray-600 rounded-md"/></div>
                        <div><label className="block mb-1 text-sm font-medium text-gray-300">{t.tailRotor.phaseLabelHHMM}</label><input type="time" value={degreesToTime(phaseDeg)} onChange={e => updateCurrentStep({ phaseDeg: timeToDegrees(e.target.value), userInput: true })} className="w-full p-2 text-white bg-gray-700 border border-gray-600 rounded-md"/></div>
                        <div className="md:col-span-2"><label className="block mb-1 text-sm font-medium text-gray-300">{t.tailRotor.phaseLabelDegrees}</label><DecimalInput value={phaseDeg} onChange={val => updateCurrentStep({ phaseDeg: val, userInput: true })} className="w-full p-2 text-white bg-gray-700 border border-gray-600 rounded-md"/></div>
                    </div>
                </div>
                
                <div className="p-4 mb-6 bg-gray-800 rounded-lg">
                    <button onClick={() => updateCurrentStep({ isInstalledOpen: !isInstalledOpen, isFinalSetupOpen: false })} className="flex justify-between items-center w-full">
                        <h2 className="text-xl font-semibold text-cyan-400">{t.tailRotor.installedWeights}</h2>
                        <svg className={`w-6 h-6 text-cyan-400 transform transition-transform duration-200 ${isInstalledOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {isInstalledOpen && (<div className="mt-3"><p className="mb-2 text-sm text-gray-400">{t.tailRotor.enterWashers} {currentStepIndex > 0 ? t.tailRotor.fromPreviousStep : ''}</p><TailRotorInputHeader t={t.tailRotor}/><div className="space-y-2">{Array.from({length: screwCount}, (_, i) => (<TailScrewWeightInput key={i} number={i+1} washers={currentWashers[i]} onWasherChange={(num, type, val) => { const newW = [...currentWashers]; newW[num-1] = {...newW[num-1], [type]: val}; updateCurrentStep({ currentWashers: newW, userInput: true }); }} isEditable={currentStepIndex === 0} />))}</div></div>)}
                </div>

                <div className="p-4 mb-6 bg-gray-800 rounded-lg">
                     <h2 className="mb-3 text-xl font-semibold text-cyan-400">{t.tailRotor.recommendation}</h2>
                    <div>
                        <h3 className="mb-2 font-bold text-gray-400">{t.tailRotor.recommendedFinalWashers}</h3>
                        <div className="p-2 rounded-lg bg-gray-900/50">
                            <TailRotorInputHeader t={t.tailRotor}/>
                            <div className="space-y-2">
                                {Array.from({length: screwCount}, (_, i) => (
                                    <TailScrewWeightInput key={i} number={i+1} washers={recommendedWashers[i]} onWasherChange={() => {}} isEditable={false} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 mb-6 bg-gray-800 rounded-lg">
                    <button onClick={() => updateCurrentStep({ isFinalSetupOpen: !isFinalSetupOpen, isInstalledOpen: false })} className="flex justify-between items-center w-full">
                        <h2 className="text-xl font-semibold text-cyan-400">{t.tailRotor.yourFinalWasherSetup}</h2>
                        <svg className={`w-6 h-6 text-cyan-400 transform transition-transform duration-200 ${isFinalSetupOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {isFinalSetupOpen && (
                        <div className="mt-3">
                            <TailRotorInputHeader t={t.tailRotor}/>
                            <div className="space-y-2">
                                {Array.from({length: screwCount}, (_, i) => (
                                    <TailScrewWeightInput key={i} number={i+1} washers={actualWashers[i]} onWasherChange={(num, type, val) => { const newW = [...actualWashers]; newW[num-1] = {...newW[num-1], [type]: val}; updateCurrentStep({ actualWashers: newW }); }} isEditable={true}/>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {userInput && calculatedCoeffs.K && (
                    <div className="p-4 mb-6 bg-gray-800 rounded-lg">
                        <h2 className="mb-3 text-xl font-semibold text-cyan-400">{t.tailRotor.plotTitle}</h2>
                        <TailRotorPlot amplitude={amplitude} phaseDeg={phaseDeg} K={calculatedCoeffs.K} Phi={calculatedCoeffs.Phi}/>
                    </div>
                )}

                <div className="flex flex-col md:flex-row gap-4">
                    <button onClick={handlePreviousStep} disabled={currentStepIndex === 0} className="w-full p-4 font-bold text-white transition bg-gray-600 rounded-lg hover:bg-gray-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed">{t.tailRotor.goToPreviousStep}</button>
                    <button onClick={handleNextStep} className="w-full p-4 text-xl font-bold text-white transition bg-cyan-600 rounded-lg hover:bg-cyan-500">{t.tailRotor.goToNextStep}</button>
                </div>
                <div className="mt-4">
                     <button onClick={handleGenerateReport} className="w-full p-3 font-bold text-white transition bg-green-600 rounded-lg hover:bg-green-500">{t.tailRotor.generateReport}</button>
                </div>
                
                {calculatedCoeffs.K !== null && (<div className="my-4 text-xs text-center text-gray-500"><p>{t.tailRotor.interpolatedValues.replace('{kValue}', calculatedCoeffs.K.toFixed(2)).replace('{phiValue}', calculatedCoeffs.Phi.toFixed(2))}</p></div>)}
            </div>
        </div>
    );
};

export default function App() {
    const [page, setPage] = useState('home');
    const [lang, setLang] = useState('en'); 
    const t = translations[lang];
    switch (page) {
        case 'main': return <MainRotorPage setPage={setPage} t={t} />;
        case 'tail': return <TailRotorPage setPage={setPage} t={t} />;
        default: return <HomePage setPage={setPage} lang={lang} setLang={setLang} t={t} />;
    }
}