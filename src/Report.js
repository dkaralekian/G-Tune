import React from 'react';
import logo from './assets/blue_logo.jpg';


/**
 * ReportPlot Sub-Component
 * Renders an SVG plot of the entire balancing history.
 * For the main rotor, it also renders the blade axes.
 */
const ReportPlot = ({ history, rotorType, lastStep }) => {
    // Check if we can render the blades, which depends on the final calculated coefficients.
    const canRenderEnhancedPlot = rotorType === 'main' && lastStep && lastStep.calculatedCoeffs && typeof lastStep.calculatedCoeffs.K === 'number' && lastStep.calculatedCoeffs.K > 0;

    const size = 500;
    const center = size / 2;
    const validSteps = history.filter(step => step.userInput && typeof step.amplitude === 'number');

    const maxIPS = Math.max(0.4, ...validSteps.map(step => step.amplitude)) * 1.2;
    const plotRadius = center - 40;

    const ipsToPx = (ips) => (ips / maxIPS) * plotRadius;

    const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
        const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
        return {
            x: centerX + radius * Math.cos(angleInRadians),
            y: centerY + radius * Math.sin(angleInRadians),
        };
    };

    const gridRings = [0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4, 2.6, 2.8, 3.0];
    const grid = {
        circles: gridRings.filter(r => r < maxIPS),
        lines: Array.from({ length: 12 }, (_, i) => i * 30),
    };

    const points = validSteps.map(step => polarToCartesian(center, center, ipsToPx(step.amplitude), step.phaseDeg));
    const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

    const renderGrid = () => (
        <>
            <g id="grid" stroke="#cccccc" strokeWidth="0.5">
                {grid.circles.map(r => (
                    <g key={`r-${r}`}>
                        <circle cx={center} cy={center} r={ipsToPx(r)} fill="none" />
                        <text x={center + 5} y={center - ipsToPx(r) - 2} fontSize="8" fill="#888">{r.toFixed(1)} IPS</text>
                    </g>
                ))}
                {grid.lines.map(angle => {
                    const { x, y } = polarToCartesian(center, center, plotRadius, angle);
                    return <line key={`l-${angle}`} x1={center} y1={center} x2={x} y2={y} />;
                })}
            </g>
            <g id="grid-labels" fill="#666666" fontSize="10">
                 {grid.lines.map((angle, i) => {
                    const { x, y } = polarToCartesian(center, center, plotRadius + 10, angle);
                    return <text key={`gl-${i}`} x={x} y={y} textAnchor="middle" alignmentBaseline="middle">{i === 0 ? 12 : i}h</text>;
                })}
            </g>
        </>
    );
    
    const renderHistory = () => (
        <>
            <polyline points={polylinePoints} fill="none" stroke="#007bff" strokeWidth="1.5" strokeOpacity="0.8" />
            {points.map((point, index) => (
                <g key={`p-${index}`}>
                    <circle cx={point.x} cy={point.y} r="4" fill="#dc3545" stroke="white" strokeWidth="1"/>
                    <text x={point.x + 5} y={point.y - 5} fontSize="12" fontWeight="bold" fill="#343a40">{index + 1}</text>
                </g>
            ))}
        </>
    );

    const renderEnhancedMainRotorPlot = () => {
        const { Phi } = lastStep.calculatedCoeffs;
        
        const blades = [
            { name: 'Yellow', color: '#f59e0b', origAngle: 0 },
            { name: 'Red', color: '#ef4444', origAngle: 120 },
            { name: 'Green', color: '#22c55e', origAngle: 240 },
        ];

        const plotBlades = blades.map(b => ({
            ...b,
            plotAngle: (b.origAngle + Phi - 180 + 360) % 360,
        }));

        return (
             <g id="blades">
                {plotBlades.map(blade => {
                    const endPoint = polarToCartesian(center, center, plotRadius, blade.plotAngle);
                    const labelPoint = polarToCartesian(center, center, plotRadius + 22, blade.plotAngle);
                    return (
                        <g key={blade.name}>
                            <line x1={center} y1={center} x2={endPoint.x} y2={endPoint.y} stroke={blade.color} strokeWidth="3" opacity="0.6" />
                            <text x={labelPoint.x} y={labelPoint.y} fill={blade.color} textAnchor="middle" alignmentBaseline="middle" fontWeight="bold" fontSize="14" opacity="0.8">{blade.name.charAt(0)}</text>
                        </g>
                    );
                })}
             </g>
        );
    };

    return (
        <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', height: 'auto', background: '#f8f9fa', border: '1px solid #ddd' }}>
            {renderGrid()}
            {canRenderEnhancedPlot && renderEnhancedMainRotorPlot()}
            {renderHistory()}
        </svg>
    );
};


/**
 * Report Component
 * This component generates a structured HTML report suitable for PDF conversion.
 */
const Report = ({ history, rotorType, t, id }) => {
    const reportTranslations = rotorType === 'main' ? t.mainRotor : t.tailRotor;
    const validSteps = history.filter(step => step.userInput);
    const lastValidStep = validSteps.length > 0 ? validSteps[validSteps.length - 1] : null;
    const generationTime = new Date().toLocaleString();


    const MainRotorStep = ({ step, index }) => {
        const totalFinalWeights = {};
        Object.keys(step.currentWeights).forEach(color => {
            totalFinalWeights[color] = (step.currentWeights[color] + (step.actualChange[color] || 0)).toFixed(1);
        });

        return (
            <div className="step">
                <h4>{reportTranslations.step} {index + 1}: {step.amplitude.toFixed(2)} IPS @ {step.phaseDeg.toFixed(1)}°</h4>
                <table className="report-table">
                    <thead>
                        <tr>
                            <th>Blade</th>
                            <th>Initial Weight</th>
                            <th>Recommended Change</th>
                            <th>Your Action (Change)</th>
                            <th>Total Weight</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.keys(step.currentWeights).map(color => (
                            <tr key={color}>
                                <td>{t.mainRotor[color.toLowerCase() + 'Blade']}</td>
                                <td>{step.currentWeights[color].toFixed(1)}g</td>
                                <td>{step.recommendedChange[color] >= 0 ? '+' : ''}{step.recommendedChange[color].toFixed(1)}g</td>
                                <td>{step.actualChange[color] >= 0 ? '+' : ''}{step.actualChange[color].toFixed(1)}g</td>
                                <td>{totalFinalWeights[color]}g</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };
    
    const TailRotorStep = ({ step, index }) => {
        const recWashers = step.recommendedWashers.map((w, i) => ({...w, i: i + 1})).filter(w => w.small > 0 || w.large > 0);
        const finalWashers = step.actualWashers.map((w, i) => ({...w, i: i + 1})).filter(w => w.small > 0 || w.large > 0);

        return (
            <div className="step">
                <h4>{reportTranslations.step} {index + 1}: {step.amplitude.toFixed(2)} IPS @ {step.phaseDeg.toFixed(1)}°</h4>
                
                <h5>{reportTranslations.recommendation}</h5>
                {recWashers.length > 0 ? (
                    <table className="report-table">
                        <thead><tr><th>Screw #</th><th>Small Washers (0.7g)</th><th>Large Washers (2.0g)</th></tr></thead>
                        <tbody>
                            {recWashers.map(w => <tr key={w.i}><td>{w.i}</td><td>{w.small}</td><td>{w.large}</td></tr>)}
                        </tbody>
                    </table>
                ) : <p className="no-data">No change was recommended for this step.</p>}

                <h5 style={{marginTop: '15px'}}>{reportTranslations.yourFinalWasherSetup}</h5>
                {finalWashers.length > 0 ? (
                    <table className="report-table">
                        <thead><tr><th>Screw #</th><th>Small Washers (0.7g)</th><th>Large Washers (2.0g)</th></tr></thead>
                        <tbody>
                            {finalWashers.map(w => <tr key={w.i}><td>{w.i}</td><td>{w.small}</td><td>{w.large}</td></tr>)}
                        </tbody>
                    </table>
                ) : <p className="no-data">No washers were installed for this step.</p>}
            </div>
        );
    };

    return (
        <div id={id} style={{ width: '100%', backgroundColor: 'white', color: 'black', fontFamily: 'Arial, sans-serif' }}>
            <style>
                {`
                #${id}, #${id} * {
                    box-sizing: border-box;
                }
                #${id} .report-header,
                #${id} .step {
                    width: 90%;
                    margin-left: auto;
                    margin-right: auto;
                }
                
                #${id} .report-header { 
                    margin-bottom: 20px; 
                    border-bottom: 2px solid #333; 
                    padding-bottom: 10px;
                    text-align: center;
                }
                #${id} .report-table { 
                    width: 100%; 
                    border-collapse: collapse; 
                }
                #${id} .report-header img { width: 120px; margin-bottom: 10px; }
                #${id} .report-header h1 { font-size: 28px; margin: 0; color: #111; }
                #${id} .report-header h2 { font-size: 20px; margin: 0; font-weight: normal; color: #444; }
                #${id} .report-date { font-size: 10px; color: #555; margin-top: 8px; }
                #${id} .step { border-top: 1px solid #ccc; padding-top: 15px; margin-top: 15px; }
                #${id} h4 { font-size: 18px; margin-top: 0; margin-bottom: 15px; color: #111; }
                #${id} h5 { font-size: 14px; margin-bottom: 8px; font-weight: bold; }
                #${id} .report-table th, #${id} .report-table td { border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 11px; }
                #${id} .report-table th { background-color: #f2f2f2; font-weight: bold; }
                #${id} .report-table td:first-child { text-align: left; }
                #${id} .no-data { font-size: 11px; font-style: italic; color: #666; padding: 8px; }
                `}
            </style>
            <div className="report-header">
                <img src={logo} alt="Guimbal Logo" />
                <h1>{t.home.title} Balancing Report</h1>
                <h2>{reportTranslations.title}</h2>
                <h2 className="report-date">Generated : {generationTime}</h2>
            </div>

            {validSteps.map((step, index) => (
                rotorType === 'main' 
                    ? <MainRotorStep key={index} step={step} index={index} />
                    : <TailRotorStep key={index} step={step} index={index} />
            ))}

            {validSteps.length > 0 && (
                 <div style={{ pageBreakBefore: 'always' }}>
                     <div className="step">
                        <h4>Balancing Progression Plot</h4>
                        <p style={{fontSize: '11px', textAlign: 'center', color: '#666', marginTop: '-10px', marginBottom: '10px'}}>
                            This plot shows the progression of unbalance points through each step.
                        </p>
                        <ReportPlot history={history} rotorType={rotorType} lastStep={lastValidStep} />
                    </div>
                 </div>
            )}
        </div>
    );
};

export default Report;