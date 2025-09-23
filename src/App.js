import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import logo from './assets/logo.png';

// Import html2pdf.js and the new Report component
import html2pdf from 'html2pdf.js/dist/html2pdf.min.js';
import Report from './Report.js';

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
            lookupTable: 'Constant 0 (K=20, Φ=280)', // CHANGED
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
            calculationBlend: 'Calculation Blend: {blendRatio}% Learning / {inverseBlendRatio}% Constant', // CHANGED
            method: 'Constant', // CHANGED
            direct: 'Learning', // CHANGED
            directCalculated: 'Directly Calculated: K={kValue}, Phi={phiValue}°'
        },
        tailRotor: {
            backToHome: 'Back to Home',
            title: 'Tail Rotor',
            step: 'Step',
            rotorIsBalanced: 'Rotor is Balanced!',
            vibrationBelowThreshold: 'Vibration amplitude ({amplitude} IPS) is below the 0.2 IPS threshold.',
            calculationMethod: 'Calculation Method',
            lookupTable: 'Constant 0 (K=2.2, Φ=305)', // CHANGED
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
            calculationBlend: 'Calculation Blend: {blendRatio}% Learning / {inverseBlendRatio}% Constant', // CHANGED
            method: 'Constant', // CHANGED
            direct: 'Learning', // CHANGED
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
            lookupTable: 'Constante 0 (K=20, Φ=280)', // CHANGED
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
            calculationBlend: 'Mélange de Calcul : {blendRatio}% Apprentissage / {inverseBlendRatio}% Constante', // CHANGED
            method: 'Constante', // CHANGED
            direct: 'Apprentissage', // CHANGED
            directCalculated: 'Calcul Direct : K={kValue}, Phi={phiValue}°'
        },
        tailRotor: {
            backToHome: 'Retour à l\'accueil',
            title: 'Rotor Arrière',
            step: 'Étape',
            rotorIsBalanced: 'Le rotor est équilibré !',
            vibrationBelowThreshold: 'L\'amplitude des vibrations ({amplitude} IPS) est inférieure au seuil de 0.2 IPS.',
            calculationMethod: 'Méthode de Calcul',
            lookupTable: 'Constante 0 (K=2.2, Φ=305)', // CHANGED
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
            calculationBlend: 'Mélange de Calcul : {blendRatio}% Apprentissage / {inverseBlendRatio}% Constante', // CHANGED
            method: 'Constante', // CHANGED
            direct: 'Apprentissage', // CHANGED
            directCalculated: 'Calcul Direct : K={kValue}, Phi={phiValue}°'
        }
    },
    es: {
        home: {
            title: 'G-Tune',
            subtitle: 'Asistente de equilibrado de rotores Cabri G2',
            mainRotor: 'Rotor Principal',
            tailRotor: 'Rotor de Cola',
            language: 'Idioma',
        },
        mainRotor: {
            backToHome: 'Volver al Inicio',
            title: 'Rotor Principal',
            step: 'Paso',
            rotorIsBalanced: '¡Rotor equilibrado!',
            vibrationBelowThreshold: 'La amplitud de la vibración ({amplitude} IPS) está por debajo del umbral de 0.2 IPS.',
            calculationMethod: 'Método de Cálculo',
            lookupTable: 'Constante 0 (K=20, Φ=280)', // CHANGED
            constant1: 'Constante 1 (K=15, Φ=298)',
            constant2: 'Constante 2 (K=22, Φ=270)',
            vibrationMeasurement: 'Medición de Vibraciones',
            amplitudeLabel: 'Amplitud (IPS)',
            phaseLabelHHMM: 'Fase (hh:mm)',
            phaseLabelDegrees: 'Fase (grados)',
            currentlyInstalledWeights: 'Pesos Actualmente Instalados',
            fromPreviousStep: 'Del paso anterior.',
            yellowBlade: 'Pala Amarilla',
            greenBlade: 'Pala Verde',
            redBlade: 'Pala Roja',
            recommendationAction: 'Recomendación y Acción',
            addToCurrentlyInstalled: 'Añadir a los pesos actuales',
            recommended: 'Recomendado',
            yourAction: 'Tu Acción',
            totalWeight: 'Peso Total',
            goToNextStep: 'Siguiente Paso',
            goToPreviousStep: 'Paso Anterior',
            generateReport: 'Generar Informe PDF',
            interpolatedValues: 'K={kValue}, Phi={phiValue}°',
            plotTitle: 'Gráfico de Equilibrado',
            calculationBlend: 'Mezcla de Cálculo: {blendRatio}% Aprendizaje / {inverseBlendRatio}% Constante', // CHANGED
            method: 'Constante', // CHANGED
            direct: 'Aprendizaje', // CHANGED
            directCalculated: 'Calculado Directamente: K={kValue}, Phi={phiValue}°'
        },
        tailRotor: {
            backToHome: 'Volver al Inicio',
            title: 'Rotor de Cola',
            step: 'Paso',
            rotorIsBalanced: '¡Rotor equilibrado!',
            vibrationBelowThreshold: 'La amplitud de la vibración ({amplitude} IPS) está por debajo del umbral de 0.2 IPS.',
            calculationMethod: 'Método de Cálculo',
            lookupTable: 'Constante 0 (K=2.2, Φ=305)', // CHANGED
            constant1: 'Constante 1 (K=2, Φ=310)',
            constant2: 'Constante 2 (K=2.8, Φ=302)',
            vibrationMeasurement: 'Medición de Vibraciones',
            amplitudeLabel: 'Amplitud (IPS)',
            phaseLabelHHMM: 'Fase (hh:mm)',
            phaseLabelDegrees: 'Fase (grados)',
            installedWeights: 'Pesos Instalados',
            enterWashers: 'Introduce las arandelas actualmente en el rotor.',
            fromPreviousStep: '(Del paso anterior)',
            small: 'Pequeña',
            large: 'Grande',
            recommendation: 'Recomendación',
            recommendationFinalSetup: 'Recomendación y Configuración Finale',
            recommendedFinalWashers: 'Arandelas Finales Recomendadas',
            yourFinalWasherSetup: 'Tu Configuración Final de Arandelas',
            goToNextStep: 'Siguiente Paso',
            goToPreviousStep: 'Paso Anterior',
            generateReport: 'Generar Informe PDF',
            interpolatedValues: 'K={kValue}, Phi={phiValue}°',
            plotTitle: 'Gráfico de Equilibrado',
            calculationBlend: 'Mezcla de Cálculo: {blendRatio}% Aprendizaje / {inverseBlendRatio}% Constante', // CHANGED
            method: 'Constante', // CHANGED
            direct: 'Aprendizaje', // CHANGED
            directCalculated: 'Calculado Directamente: K={kValue}, Phi={phiValue}°'
        }
    },
    de: {
        home: {
            title: 'G-Tune',
            subtitle: 'Cabri G2 Rotor-Auswucht-Assistent',
            mainRotor: 'Hauptrotor',
            tailRotor: 'Heckrotor',
            language: 'Sprache',
        },
        mainRotor: {
            backToHome: 'Zurück zur Startseite',
            title: 'Hauptrotor',
            step: 'Schritt',
            rotorIsBalanced: 'Rotor ist ausgewuchtet!',
            vibrationBelowThreshold: 'Vibrationsamplitude ({amplitude} IPS) liegt unter dem Schwellenwert von 0,2 IPS.',
            calculationMethod: 'Berechnungsmethode',
            lookupTable: 'Konstante 0 (K=20, Φ=280)', // CHANGED
            constant1: 'Konstante 1 (K=15, Φ=298)',
            constant2: 'Konstante 2 (K=22, Φ=270)',
            vibrationMeasurement: 'Vibrationsmessung',
            amplitudeLabel: 'Amplitude (IPS)',
            phaseLabelHHMM: 'Phase (hh:mm)',
            phaseLabelDegrees: 'Phase (Grad)',
            currentlyInstalledWeights: 'Aktuell installierte Gewichte',
            fromPreviousStep: 'Aus dem vorherigen Schritt.',
            yellowBlade: 'Gelbes Blatt',
            greenBlade: 'Grünes Blatt',
            redBlade: 'Rotes Blatt',
            recommendationAction: 'Empfehlung & Aktion',
            addToCurrentlyInstalled: 'Zu den aktuell installierten hinzufügen',
            recommended: 'Empfohlen',
            yourAction: 'Ihre Aktion',
            totalWeight: 'Gesamtgewicht',
            goToNextStep: 'Nächster Schritt',
            goToPreviousStep: 'Vorheriger Schritt',
            generateReport: 'PDF-Bericht erstellen',
            interpolatedValues: 'K={kValue}, Phi={phiValue}°',
            plotTitle: 'Auswuchtdiagramm',
            calculationBlend: 'Berechnungsmischung: {blendRatio}% Lernen / {inverseBlendRatio}% Konstante', // CHANGED
            method: 'Konstante', // CHANGED
            direct: 'Lernen', // CHANGED
            directCalculated: 'Direkt berechnet: K={kValue}, Phi={phiValue}°'
        },
        tailRotor: {
            backToHome: 'Zurück zur Startseite',
            title: 'Heckrotor',
            step: 'Schritt',
            rotorIsBalanced: 'Rotor ist ausgewuchtet!',
            vibrationBelowThreshold: 'Vibrationsamplitude ({amplitude} IPS) liegt unter dem Schwellenwert von 0,2 IPS.',
            calculationMethod: 'Berechnungsmethode',
            lookupTable: 'Konstante 0 (K=2.2, Φ=305)', // CHANGED
            constant1: 'Konstante 1 (K=2, Φ=310)',
            constant2: 'Konstante 2 (K=2.8, Φ=302)',
            vibrationMeasurement: 'Vibrationsmessung',
            amplitudeLabel: 'Amplitude (IPS)',
            phaseLabelHHMM: 'Phase (hh:mm)',
            phaseLabelDegrees: 'Phase (Grad)',
            installedWeights: 'Installierte Gewichte',
            enterWashers: 'Geben Sie die aktuell auf dem Rotor befindlichen Unterlegscheiben ein.',
            fromPreviousStep: '(Aus dem vorherigen Schritt)',
            small: 'Klein',
            large: 'Groß',
            recommendation: 'Empfehlung',
            recommendationFinalSetup: 'Empfehlung & Endgültige Einrichtung',
            recommendedFinalWashers: 'Empfohlene endgültige Unterlegscheiben',
            yourFinalWasherSetup: 'Ihre endgültige Unterlegscheiben-Einrichtung',
            goToNextStep: 'Nächster Schritt',
            goToPreviousStep: 'Vorheriger Schritt',
            generateReport: 'PDF-Bericht erstellen',
            interpolatedValues: 'K={kValue}, Phi={phiValue}°',
            plotTitle: 'Auswuchtdiagramm',
            calculationBlend: 'Berechnungsmischung: {blendRatio}% Lernen / {inverseBlendRatio}% Konstante', // CHANGED
            method: 'Konstante', // CHANGED
            direct: 'Lernen', // CHANGED
            directCalculated: 'Direkt berechnet: K={kValue}, Phi={phiValue}°'
        }
    },
    it: {
        home: {
            title: 'G-Tune',
            subtitle: 'Assistente al bilanciamento dei rotori Cabri G2',
            mainRotor: 'Rotore Principale',
            tailRotor: 'Rotore di Coda',
            language: 'Lingua',
        },
        mainRotor: {
            backToHome: 'Torna alla Home',
            title: 'Rotore Principale',
            step: 'Passo',
            rotorIsBalanced: 'Rotore bilanciato!',
            vibrationBelowThreshold: 'L\'ampiezza della vibrazione ({amplitude} IPS) è inferiore alla soglia di 0.2 IPS.',
            calculationMethod: 'Metodo di Calcolo',
            lookupTable: 'Costante 0 (K=20, Φ=280)', // CHANGED
            constant1: 'Costante 1 (K=15, Φ=298)',
            constant2: 'Costante 2 (K=22, Φ=270)',
            vibrationMeasurement: 'Misurazione Vibrazioni',
            amplitudeLabel: 'Ampiezza (IPS)',
            phaseLabelHHMM: 'Fase (hh:mm)',
            phaseLabelDegrees: 'Fase (gradi)',
            currentlyInstalledWeights: 'Pesi Attualmente Installati',
            fromPreviousStep: 'Dal passo precedente.',
            yellowBlade: 'Pala Gialla',
            greenBlade: 'Pala Verde',
            redBlade: 'Pala Rossa',
            recommendationAction: 'Raccomandazione e Azione',
            addToCurrentlyInstalled: 'Aggiungi ai pesi attuali',
            recommended: 'Raccomandato',
            yourAction: 'La Tua Azione',
            totalWeight: 'Peso Totale',
            goToNextStep: 'Passo Successivo',
            goToPreviousStep: 'Passo Precedente',
            generateReport: 'Genera Report PDF',
            interpolatedValues: 'K={kValue}, Phi={phiValue}°',
            plotTitle: 'Grafico di Bilanciamento',
            calculationBlend: 'Misto di Calcolo: {blendRatio}% Apprendimento / {inverseBlendRatio}% Costante', // CHANGED
            method: 'Costante', // CHANGED
            direct: 'Apprendimento', // CHANGED
            directCalculated: 'Calcolato Direttamente: K={kValue}, Phi={phiValue}°'
        },
        tailRotor: {
            backToHome: 'Torna alla Home',
            title: 'Rotore di Coda',
            step: 'Passo',
            rotorIsBalanced: 'Rotore bilanciato!',
            vibrationBelowThreshold: 'L\'ampiezza della vibrazione ({amplitude} IPS) è inferiore alla soglia di 0.2 IPS.',
            calculationMethod: 'Metodo di Calcolo',
            lookupTable: 'Costante 0 (K=2.2, Φ=305)', // CHANGED
            constant1: 'Costante 1 (K=2, Φ=310)',
            constant2: 'Costante 2 (K=2.8, Φ=302)',
            vibrationMeasurement: 'Misurazione Vibrazioni',
            amplitudeLabel: 'Ampiezza (IPS)',
            phaseLabelHHMM: 'Fase (hh:mm)',
            phaseLabelDegrees: 'Fase (gradi)',
            installedWeights: 'Pesi Installati',
            enterWashers: 'Inserisci le rondelle attualmente sul rotore.',
            fromPreviousStep: '(Dal passo precedente)',
            small: 'Piccola',
            large: 'Grande',
            recommendation: 'Raccomandazione',
            recommendationFinalSetup: 'Raccomandazione e Configurazione Finale',
            recommendedFinalWashers: 'Rondelle Finali Raccomandate',
            yourFinalWasherSetup: 'La Tua Configurazione Finale di Rondelle',
            goToNextStep: 'Passo Successivo',
            goToPreviousStep: 'Passo Precedente',
            generateReport: 'Genera Report PDF',
            interpolatedValues: 'K={kValue}, Phi={phiValue}°',
            plotTitle: 'Grafico di Bilanciamento',
            calculationBlend: 'Misto di Calcolo: {blendRatio}% Apprendimento / {inverseBlendRatio}% Costante', // CHANGED
            method: 'Costante', // CHANGED
            direct: 'Apprendimento', // CHANGED
            directCalculated: 'Calcolato Direttamente: K={kValue}, Phi={phiValue}°'
        }
    },
    zh: {
        home: {
            title: 'G-Tune',
            subtitle: 'Cabri G2 旋翼平衡助手',
            mainRotor: '主旋翼',
            tailRotor: '尾旋翼',
            language: '语言',
        },
        mainRotor: {
            backToHome: '返回首页',
            title: '主旋翼',
            step: '步骤',
            rotorIsBalanced: '旋翼已平衡！',
            vibrationBelowThreshold: '振动幅度 ({amplitude} IPS) 低于 0.2 IPS 阈值。',
            calculationMethod: '计算方法',
            lookupTable: '常数 0 (K=20, Φ=280)', // CHANGED
            constant1: '常数 1 (K=15, Φ=298)',
            constant2: '常数 2 (K=22, Φ=270)',
            vibrationMeasurement: '振动测量',
            amplitudeLabel: '幅度 (IPS)',
            phaseLabelHHMM: '相位 (hh:mm)',
            phaseLabelDegrees: '相位 (度)',
            currentlyInstalledWeights: '当前安装的配重',
            fromPreviousStep: '来自上一步。',
            yellowBlade: '黄桨叶',
            greenBlade: '绿桨叶',
            redBlade: '红桨叶',
            recommendationAction: '建议与操作',
            addToCurrentlyInstalled: '添加到当前安装的配重',
            recommended: '建议',
            yourAction: '您的操作',
            totalWeight: '总重量',
            goToNextStep: '下一步',
            goToPreviousStep: '上一步',
            generateReport: '生成PDF报告',
            interpolatedValues: 'K={kValue}, Phi={phiValue}°',
            plotTitle: '平衡图',
            calculationBlend: '计算混合: {blendRatio}% 学习 / {inverseBlendRatio}% 常数', // CHANGED
            method: '常数', // CHANGED
            direct: '学习', // CHANGED
            directCalculated: '直接计算: K={kValue}, Phi={phiValue}°'
        },
        tailRotor: {
            backToHome: '返回首页',
            title: '尾旋翼',
            step: '步骤',
            rotorIsBalanced: '旋翼已平衡！',
            vibrationBelowThreshold: '振动幅度 ({amplitude} IPS) 低于 0.2 IPS 阈值。',
            calculationMethod: '计算方法',
            lookupTable: '常数 0 (K=2.2, Φ=305)', // CHANGED
            constant1: '常数 1 (K=2, Φ=310)',
            constant2: '常数 2 (K=2.8, Φ=302)',
            vibrationMeasurement: '振动测量',
            amplitudeLabel: '幅度 (IPS)',
            phaseLabelHHMM: '相位 (hh:mm)',
            phaseLabelDegrees: '相位 (度)',
            installedWeights: '已安装的配重',
            enterWashers: '输入当前旋翼上的垫圈。',
            fromPreviousStep: '(来自上一步)',
            small: '小',
            large: '大',
            recommendation: '建议',
            recommendationFinalSetup: '建议与最终设置',
            recommendedFinalWashers: '建议的最终垫圈',
            yourFinalWasherSetup: '您的最终垫圈设置',
            goToNextStep: '下一步',
            goToPreviousStep: '上一步',
            generateReport: '生成PDF报告',
            interpolatedValues: 'K={kValue}, Phi={phiValue}°',
            plotTitle: '平衡图',
            calculationBlend: '计算混合: {blendRatio}% 学习 / {inverseBlendRatio}% 常数', // CHANGED
            method: '常数', // CHANGED
            direct: '学习', // CHANGED
            directCalculated: '直接计算: K={kValue}, Phi={phiValue}°'
        }
    },
    hy: {
        home: {
            title: 'G-Tune',
            subtitle: 'Cabri G2 ռոտորի հավասարակշռման օգնական',
            mainRotor: 'Հիմնական ռոտոր',
            tailRotor: 'Պոչի ռոտոր',
            language: 'Լեզու',
        },
        mainRotor: {
            backToHome: 'Վերադառնալ գլխավոր էջ',
            title: 'Հիմնական ռոտոր',
            step: 'Քայլ',
            rotorIsBalanced: 'Ռոտորը հավասարակշռված է։',
            vibrationBelowThreshold: 'Թրթռման ամպլիտուդը ({amplitude} IPS) 0.2 IPS շեմից ցածր է։',
            calculationMethod: 'Հաշվարկման մեթոդ',
            lookupTable: 'Հաստատուն 0 (K=20, Φ=280)', // CHANGED
            constant1: 'Հաստատուն 1 (K=15, Φ=298)',
            constant2: 'Հաստատուն 2 (K=22, Φ=270)',
            vibrationMeasurement: 'Թրթռման չափում',
            amplitudeLabel: 'Ամպլիտուդ (IPS)',
            phaseLabelHHMM: 'Ֆազ (ժժ:րր)',
            phaseLabelDegrees: 'Ֆազ (աստիճան)',
            currentlyInstalledWeights: 'Ներկայումս տեղադրված կշիռներ',
            fromPreviousStep: 'Նախորդ քայլից։',
            yellowBlade: 'Դեղին թիակ',
            greenBlade: 'Կանաչ թիակ',
            redBlade: 'Կարմիր թիակ',
            recommendationAction: 'Առաջարկություն և գործողություն',
            addToCurrentlyInstalled: 'Ավելացնել ընթացիկ կշիռներին',
            recommended: 'Առաջարկվող',
            yourAction: 'Ձեր գործողությունը',
            totalWeight: 'Ընդհանուր քաշ',
            goToNextStep: 'Հաջորդ քայլ',
            goToPreviousStep: 'Նախորդ քայլ',
            generateReport: 'Ստեղծել PDF հաշվետվություն',
            interpolatedValues: 'K={kValue}, Phi={phiValue}°',
            plotTitle: 'Հավասարակշռման գծապատկեր',
            calculationBlend: 'Հաշվարկի խառնուրդ՝ {blendRatio}% Սովորել / {inverseBlendRatio}% Հաստատուն', // CHANGED
            method: 'Հաստատուն', // CHANGED
            direct: 'Սովորել', // CHANGED
            directCalculated: 'Ուղղակիորեն հաշվարկված՝ K={kValue}, Phi={phiValue}°'
        },
        tailRotor: {
            backToHome: 'Վերադառնալ գլխավոր էջ',
            title: 'Պոչի ռոտոր',
            step: 'Քայլ',
            rotorIsBalanced: 'Ռոտորը հավասարակշռված է։',
            vibrationBelowThreshold: 'Թրթռման ամպլիտուդը ({amplitude} IPS) 0.2 IPS շեմից ցածր է։',
            calculationMethod: 'Հաշվարկման մեթոդ',
            lookupTable: 'Հաստատուն 0 (K=2.2, Φ=305)', // CHANGED
            constant1: 'Հաստատուն 1 (K=2, Φ=310)',
            constant2: 'Հաստատուն 2 (K=2.8, Φ=302)',
            vibrationMeasurement: 'Թրթռման չափում',
            amplitudeLabel: 'Ամպլիտուդ (IPS)',
            phaseLabelHHMM: 'Ֆազ (ժժ:րր)',
            phaseLabelDegrees: 'Ֆազ (աստիճան)',
            installedWeights: 'Տեղադրված կշիռներ',
            enterWashers: 'Մուտքագրեք ռոտորի վրա ներկայումս առկա լվացող մեքենաները։',
            fromPreviousStep: '(Նախորդ քայլից)',
            small: 'Փոքր',
            large: 'Մեծ',
            recommendation: 'Առաջարկություն',
            recommendationFinalSetup: 'Առաջարկություն և վերջնական կարգավորում',
            recommendedFinalWashers: 'Առաջարկվող վերջնական լվացող մեքենաներ',
            yourFinalWasherSetup: 'Ձեր վերջնական լվացող մեքենայի կարգավորումը',
            goToNextStep: 'Հաջորդ քայլ',
            goToPreviousStep: 'Նախորդ քայլ',
            generateReport: 'Ստեղծել PDF հաշվետվություն',
            interpolatedValues: 'K={kValue}, Phi={phiValue}°',
            plotTitle: 'Հավասարակշռման գծապատկեր',
            calculationBlend: 'Հաշվարկի խառնուրդ՝ {blendRatio}% Սովորել / {inverseBlendRatio}% Հաստատուն', // CHANGED
            method: 'Հաստատուն', // CHANGED
            direct: 'Սովորել', // CHANGED
            directCalculated: 'Ուղղակիորեն հաշվարկված՝ K={kValue}, Phi={phiValue}°'
        }
    },
    ms: {
        home: {
            title: 'G-Tune',
            subtitle: 'Pembantu Pengimbangan Rotor Cabri G2',
            mainRotor: 'Rotor Utama',
            tailRotor: 'Rotor Ekor',
            language: 'Bahasa',
        },
        mainRotor: {
            backToHome: 'Kembali ke Laman Utama',
            title: 'Rotor Utama',
            step: 'Langkah',
            rotorIsBalanced: 'Rotor Seimbang!',
            vibrationBelowThreshold: 'Amplitud getaran ({amplitude} IPS) di bawah ambang 0.2 IPS.',
            calculationMethod: 'Kaedah Pengiraan',
            lookupTable: 'Pemalar 0 (K=20, Φ=280)', // CHANGED
            constant1: 'Pemalar 1 (K=15, Φ=298)',
            constant2: 'Pemalar 2 (K=22, Φ=270)',
            vibrationMeasurement: 'Pengukuran Getaran',
            amplitudeLabel: 'Amplitud (IPS)',
            phaseLabelHHMM: 'Fasa (jj:mm)',
            phaseLabelDegrees: 'Fasa (darjah)',
            currentlyInstalledWeights: 'Pemberat yang Dipasang Sekarang',
            fromPreviousStep: 'Dari langkah sebelumnya.',
            yellowBlade: 'Bilah Kuning',
            greenBlade: 'Bilah Hijau',
            redBlade: 'Bilah Merah',
            recommendationAction: 'Syor & Tindakan',
            addToCurrentlyInstalled: 'Tambah pada yang dipasang sekarang',
            recommended: 'Disyorkan',
            yourAction: 'Tindakan Anda',
            totalWeight: 'Jumlah Berat',
            goToNextStep: 'Langkah Seterusnya',
            goToPreviousStep: 'Langkah Sebelumnya',
            generateReport: 'Jana Laporan PDF',
            interpolatedValues: 'K={kValue}, Phi={phiValue}°',
            plotTitle: 'Plot Pengimbangan',
            calculationBlend: 'Campuran Pengiraan: {blendRatio}% Belajar / {inverseBlendRatio}% Pemalar', // CHANGED
            method: 'Pemalar', // CHANGED
            direct: 'Belajar', // CHANGED
            directCalculated: 'Dikira Terus: K={kValue}, Phi={phiValue}°'
        },
        tailRotor: {
            backToHome: 'Kembali ke Laman Utama',
            title: 'Rotor Ekor',
            step: 'Langkah',
            rotorIsBalanced: 'Rotor Seimbang!',
            vibrationBelowThreshold: 'Amplitud getaran ({amplitude} IPS) di bawah ambang 0.2 IPS.',
            calculationMethod: 'Kaedah Pengiraan',
            lookupTable: 'Pemalar 0 (K=2.2, Φ=305)', // CHANGED
            constant1: 'Pemalar 1 (K=2, Φ=310)',
            constant2: 'Pemalar 2 (K=2.8, Φ=302)',
            vibrationMeasurement: 'Pengukuran Getaran',
            amplitudeLabel: 'Amplitud (IPS)',
            phaseLabelHHMM: 'Fasa (jj:mm)',
            phaseLabelDegrees: 'Fasa (darjah)',
            installedWeights: 'Pemberat yang Dipasang',
            enterWashers: 'Masukkan sesendal yang sedang ada di rotor.',
            fromPreviousStep: '(Dari langkah sebelumnya)',
            small: 'Kecil',
            large: 'Besar',
            recommendation: 'Syor',
            recommendationFinalSetup: 'Syor & Pemasangan Akhir',
            recommendedFinalWashers: 'Sesendal Akhir yang Disyorkan',
            yourFinalWasherSetup: 'Pemasangan Sesendal Akhir Anda',
            goToNextStep: 'Langkah Seterusnya',
            goToPreviousStep: 'Langkah Sebelumnya',
            generateReport: 'Jana Laporan PDF',
            interpolatedValues: 'K={kValue}, Phi={phiValue}°',
            plotTitle: 'Plot Pengimbangan',
            calculationBlend: 'Campuran Pengiraan: {blendRatio}% Belajar / {inverseBlendRatio}% Pemalar', // CHANGED
            method: 'Pemalar', // CHANGED
            direct: 'Belajar', // CHANGED
            directCalculated: 'Dikira Terus: K={kValue}, Phi={phiValue}°'
        }
    },
    pl: {
        home: {
            title: 'G-Tune',
            subtitle: 'Asystent wyważania wirnika Cabri G2',
            mainRotor: 'Wirnik główny',
            tailRotor: 'Wirnik ogonowy',
            language: 'Język',
        },
        mainRotor: {
            backToHome: 'Powrót do strony głównej',
            title: 'Wirnik główny',
            step: 'Krok',
            rotorIsBalanced: 'Wirnik jest wyważony!',
            vibrationBelowThreshold: 'Amplituda wibracji ({amplitude} IPS) jest poniżej progu 0.2 IPS.',
            calculationMethod: 'Metoda obliczeniowa',
            lookupTable: 'Stała 0 (K=20, Φ=280)', // CHANGED
            constant1: 'Stała 1 (K=15, Φ=298)',
            constant2: 'Stała 2 (K=22, Φ=270)',
            vibrationMeasurement: 'Pomiar wibracji',
            amplitudeLabel: 'Amplituda (IPS)',
            phaseLabelHHMM: 'Faza (gg:mm)',
            phaseLabelDegrees: 'Faza (stopnie)',
            currentlyInstalledWeights: 'Obecnie zainstalowane odważniki',
            fromPreviousStep: 'Z poprzedniego kroku.',
            yellowBlade: 'Łopata żółta',
            greenBlade: 'Łopata zielona',
            redBlade: 'Łopata czerwona',
            recommendationAction: 'Zalecenie i działanie',
            addToCurrentlyInstalled: 'Dodaj do obecnie zainstalowanych',
            recommended: 'Zalecane',
            yourAction: 'Twoje działanie',
            totalWeight: 'Waga całkowita',
            goToNextStep: 'Następny krok',
            goToPreviousStep: 'Poprzedni krok',
            generateReport: 'Generuj raport PDF',
            interpolatedValues: 'K={kValue}, Phi={phiValue}°',
            plotTitle: 'Wykres wyważania',
            calculationBlend: 'Mieszanka obliczeniowa: {blendRatio}% Uczenie się / {inverseBlendRatio}% Stała', // CHANGED
            method: 'Stała', // CHANGED
            direct: 'Uczenie się', // CHANGED
            directCalculated: 'Obliczone bezpośrednio: K={kValue}, Phi={phiValue}°'
        },
        tailRotor: {
            backToHome: 'Powrót do strony głównej',
            title: 'Wirnik ogonowy',
            step: 'Krok',
            rotorIsBalanced: 'Wirnik jest wyważony!',
            vibrationBelowThreshold: 'Amplituda wibracji ({amplitude} IPS) jest poniżej progu 0.2 IPS.',
            calculationMethod: 'Metoda obliczeniowa',
            lookupTable: 'Stała 0 (K=2.2, Φ=305)', // CHANGED
            constant1: 'Stała 1 (K=2, Φ=310)',
            constant2: 'Stała 2 (K=2.8, Φ=302)',
            vibrationMeasurement: 'Pomiar wibracji',
            amplitudeLabel: 'Amplituda (IPS)',
            phaseLabelHHMM: 'Faza (gg:mm)',
            phaseLabelDegrees: 'Faza (stopnie)',
            installedWeights: 'Zainstalowane odważniki',
            enterWashers: 'Wprowadź podkładki aktualnie na wirniku.',
            fromPreviousStep: '(Z poprzedniego kroku)',
            small: 'Mała',
            large: 'Duża',
            recommendation: 'Zalecenie',
            recommendationFinalSetup: 'Zalecenie i ostateczna konfiguracja',
            recommendedFinalWashers: 'Zalecane podkładki końcowe',
            yourFinalWasherSetup: 'Twoja ostateczna konfiguracja podkładek',
            goToNextStep: 'Następny krok',
            goToPreviousStep: 'Poprzedni krok',
            generateReport: 'Generuj raport PDF',
            interpolatedValues: 'K={kValue}, Phi={phiValue}°',
            plotTitle: 'Wykres wyważania',
            calculationBlend: 'Mieszanka obliczeniowa: {blendRatio}% Uczenie się / {inverseBlendRatio}% Stała', // CHANGED
            method: 'Stała', // CHANGED
            direct: 'Uczenie się', // CHANGED
            directCalculated: 'Obliczone bezpośrednio: K={kValue}, Phi={phiValue}°'
        }
    },
    cs: {
        home: {
            title: 'G-Tune',
            subtitle: 'Asistent vyvažování rotorů Cabri G2',
            mainRotor: 'Hlavní rotor',
            tailRotor: 'Ocasní rotor',
            language: 'Jazyk',
        },
        mainRotor: {
            backToHome: 'Zpět na domovskou stránku',
            title: 'Hlavní rotor',
            step: 'Krok',
            rotorIsBalanced: 'Rotor je vyvážený!',
            vibrationBelowThreshold: 'Amplituda vibrací ({amplitude} IPS) je pod prahem 0.2 IPS.',
            calculationMethod: 'Metoda výpočtu',
            lookupTable: 'Konstanta 0 (K=20, Φ=280)', // CHANGED
            constant1: 'Konstanta 1 (K=15, Φ=298)',
            constant2: 'Konstanta 2 (K=22, Φ=270)',
            vibrationMeasurement: 'Měření vibrací',
            amplitudeLabel: 'Amplituda (IPS)',
            phaseLabelHHMM: 'Fáze (hh:mm)',
            phaseLabelDegrees: 'Fáze (stupně)',
            currentlyInstalledWeights: 'Aktuálně nainstalovaná závaží',
            fromPreviousStep: 'Z předchozího kroku.',
            yellowBlade: 'Žlutý list',
            greenBlade: 'Zelený list',
            redBlade: 'Červený list',
            recommendationAction: 'Doporučení a akce',
            addToCurrentlyInstalled: 'Přidat k aktuálně nainstalovaným',
            recommended: 'Doporučeno',
            yourAction: 'Vaše akce',
            totalWeight: 'Celková hmotnost',
            goToNextStep: 'Další krok',
            goToPreviousStep: 'Předchozí krok',
            generateReport: 'Vytvořit PDF zprávu',
            interpolatedValues: 'K={kValue}, Phi={phiValue}°',
            plotTitle: 'Graf vyvažování',
            calculationBlend: 'Směs výpočtu: {blendRatio}% Učení / {inverseBlendRatio}% Konstanta', // CHANGED
            method: 'Konstanta', // CHANGED
            direct: 'Učení', // CHANGED
            directCalculated: 'Přímo vypočteno: K={kValue}, Phi={phiValue}°'
        },
        tailRotor: {
            backToHome: 'Zpět na domovskou stránku',
            title: 'Ocasní rotor',
            step: 'Krok',
            rotorIsBalanced: 'Rotor je vyvážený!',
            vibrationBelowThreshold: 'Amplituda vibrací ({amplitude} IPS) je pod prahem 0.2 IPS.',
            calculationMethod: 'Metoda výpočtu',
            lookupTable: 'Konstanta 0 (K=2.2, Φ=305)', // CHANGED
            constant1: 'Konstanta 1 (K=2, Φ=310)',
            constant2: 'Konstanta 2 (K=2.8, Φ=302)',
            vibrationMeasurement: 'Měření vibrací',
            amplitudeLabel: 'Amplituda (IPS)',
            phaseLabelHHMM: 'Fáze (hh:mm)',
            phaseLabelDegrees: 'Fáze (stupně)',
            installedWeights: 'Nainstalovaná závaží',
            enterWashers: 'Zadejte podložky aktuálně na rotoru.',
            fromPreviousStep: '(Z předchozího kroku)',
            small: 'Malá',
            large: 'Velká',
            recommendation: 'Doporučení',
            recommendationFinalSetup: 'Doporučení a konečné nastavení',
            recommendedFinalWashers: 'Doporučené konečné podložky',
            yourFinalWasherSetup: 'Vaše konečné nastavení podložek',
            goToNextStep: 'Další krok',
            goToPreviousStep: 'Předchozí krok',
            generateReport: 'Vytvořit PDF zprávu',
            interpolatedValues: 'K={kValue}, Phi={phiValue}°',
            plotTitle: 'Graf vyvažování',
            calculationBlend: 'Směs výpočtu: {blendRatio}% Učení / {inverseBlendRatio}% Konstanta', // CHANGED
            method: 'Konstanta', // CHANGED
            direct: 'Učení', // CHANGED
            directCalculated: 'Přímo vypočteno: K={kValue}, Phi={phiValue}°'
        }
    },
    ro: {
        home: {
            title: 'G-Tune',
            subtitle: 'Asistent de echilibrare a rotorului Cabri G2',
            mainRotor: 'Rotor principal',
            tailRotor: 'Rotor de coadă',
            language: 'Limbă',
        },
        mainRotor: {
            backToHome: 'Înapoi la Acasă',
            title: 'Rotor principal',
            step: 'Pas',
            rotorIsBalanced: 'Rotorul este echilibrat!',
            vibrationBelowThreshold: 'Amplitudinea vibrațiilor ({amplitude} IPS) este sub pragul de 0.2 IPS.',
            calculationMethod: 'Metoda de calcul',
            lookupTable: 'Constanta 0 (K=20, Φ=280)', // CHANGED
            constant1: 'Constanta 1 (K=15, Φ=298)',
            constant2: 'Constanta 2 (K=22, Φ=270)',
            vibrationMeasurement: 'Măsurarea vibrațiilor',
            amplitudeLabel: 'Amplitudine (IPS)',
            phaseLabelHHMM: 'Fază (hh:mm)',
            phaseLabelDegrees: 'Fază (grade)',
            currentlyInstalledWeights: 'Greutăți instalate în prezent',
            fromPreviousStep: 'Din pasul anterior.',
            yellowBlade: 'Pală galbenă',
            greenBlade: 'Pală verde',
            redBlade: 'Pală roșie',
            recommendationAction: 'Recomandare și acțiune',
            addToCurrentlyInstalled: 'Adăugați la greutățile instalate în prezent',
            recommended: 'Recomandat',
            yourAction: 'Acțiunea ta',
            totalWeight: 'Greutate totală',
            goToNextStep: 'Pasul următor',
            goToPreviousStep: 'Pasul anterior',
            generateReport: 'Generați raport PDF',
            interpolatedValues: 'K={kValue}, Phi={phiValue}°',
            plotTitle: 'Grafic de echilibrare',
            calculationBlend: 'Amestec de calcul: {blendRatio}% Învățare / {inverseBlendRatio}% Constantă', // CHANGED
            method: 'Constantă', // CHANGED
            direct: 'Învățare', // CHANGED
            directCalculated: 'Calculat direct: K={kValue}, Phi={phiValue}°'
        },
        tailRotor: {
            backToHome: 'Înapoi la Acasă',
            title: 'Rotor de coadă',
            step: 'Pas',
            rotorIsBalanced: 'Rotorul este echilibrat!',
            vibrationBelowThreshold: 'Amplitudinea vibrațiilor ({amplitude} IPS) este sub pragul de 0.2 IPS.',
            calculationMethod: 'Metoda de calcul',
            lookupTable: 'Constanta 0 (K=2.2, Φ=305)', // CHANGED
            constant1: 'Constanta 1 (K=2, Φ=310)',
            constant2: 'Constanta 2 (K=2.8, Φ=302)',
            vibrationMeasurement: 'Măsurarea vibrațiilor',
            amplitudeLabel: 'Amplitudine (IPS)',
            phaseLabelHHMM: 'Fază (hh:mm)',
            phaseLabelDegrees: 'Fază (grade)',
            installedWeights: 'Greutăți instalate',
            enterWashers: 'Introduceți șaibele de pe rotor.',
            fromPreviousStep: '(Din pasul anterior)',
            small: 'Mică',
            large: 'Mare',
            recommendation: 'Recomandare',
            recommendationFinalSetup: 'Recomandare și configurare finală',
            recommendedFinalWashers: 'Șaibe finale recomandate',
            yourFinalWasherSetup: 'Configurarea finală a șaibelor tale',
            goToNextStep: 'Pasul următor',
            goToPreviousStep: 'Pasul anterior',
            generateReport: 'Generați raport PDF',
            interpolatedValues: 'K={kValue}, Phi={phiValue}°',
            plotTitle: 'Grafic de echilibrare',
            calculationBlend: 'Amestec de calcul: {blendRatio}% Învățare / {inverseBlendRatio}% Constantă', // CHANGED
            method: 'Constantă', // CHANGED
            direct: 'Învățare', // CHANGED
            directCalculated: 'Calculat direct: K={kValue}, Phi={phiValue}°'
        }
    }
};

const langNames = {
    en: 'English',
    fr: 'Français',
    es: 'Español',
    de: 'Deutsch',
    it: 'Italiano',
    zh: '中文',
    hy: 'Հայերեն',
    ms: 'Bahasa Melayu',
    pl: 'Polski',
    cs: 'Čeština',
    ro: 'Română'
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
    // The vibration change (DeltaV) is caused by the weight change (DeltaW).
    // The effect of a weight is V_eff = (W.mag/K) @ (W.deg + Phi)
    // So, DeltaV = Effect(DeltaW), which means:
    // Mag(DeltaV) = Mag(DeltaW) / K  => K = Mag(DeltaW) / Mag(DeltaV)
    // Angle(DeltaV) = Angle(DeltaW) + Phi => Phi = Angle(DeltaV) - Angle(DeltaW)
    
    const K = deltaW.mag / deltaV.mag;

    // *** THIS IS THE CORRECTED LINE ***
    // We add 360 to ensure the modulo result is always positive (0-360)
    const Phi = (deltaV.deg - deltaW.deg + 360) % 360;

    return { K, Phi, isCalculable: true };
};


// New rounding function for main rotor weights
const roundToHalf = (num) => Math.round(num * 2) / 2;

// REMOVED bilinearInterpolate function

// REMOVED getCoefficientsFromLookup function

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
        plotAngle: (s.origAngle + Phi - 180 + 360) % 360,
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

const HomePage = ({ setPage, lang, setLang, t }) => {
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
        <div className="relative flex flex-col items-center justify-center min-h-screen p-4 text-white bg-gray-900">
            <img src={logo} alt="Guimbal" className="w-48 mb-4" />
            <h1 className="text-4xl font-bold text-cyan-400 mb-2 font-eurostile">{t.home.title}</h1>
            <p className="mb-8 text-gray-400">{t.home.subtitle}</p>
            <div className="w-full max-w-sm space-y-4">
                <button onClick={() => setPage('main')} className="w-full p-4 font-bold font-eurostile text-white transition bg-gray-800 rounded-lg shadow-lg hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50">{t.home.mainRotor}</button>
                <button onClick={() => setPage('tail')} className="w-full p-4 font-bold font-eurostile text-white transition bg-gray-800 rounded-lg shadow-lg hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50">{t.home.tailRotor}</button>
            </div>
            <div className="mt-8 relative w-full max-w-xs" ref={langPopupRef}>
                {isLangPopupOpen && (
                    <div className="absolute bottom-full mb-2 w-full bg-gray-700 rounded-md shadow-lg overflow-hidden z-10">
                        <div className="flex flex-col">
                            {Object.keys(translations).map(langCode => (
                                <button
                                    key={langCode}
                                    onClick={() => {
                                        setLang(langCode);
                                        setIsLangPopupOpen(false);
                                    }}
                                    className={`w-full text-left p-3 text-sm font-bold ${lang === langCode ? 'bg-cyan-600 text-white' : 'text-gray-200 hover:bg-cyan-700'}`}
                                >
                                    {langNames[langCode]}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                <button 
                    onClick={() => setIsLangPopupOpen(!isLangPopupOpen)} 
                    className="w-full p-3 text-sm font-bold text-white bg-gray-700 rounded-md hover:bg-cyan-700 flex justify-between items-center"
                >
                    <span>{t.home.language}: <span className="font-extrabold">{lang.toUpperCase()}</span></span>
                    <svg className={`w-4 h-4 transform transition-transform duration-200 ${isLangPopupOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                </button>
            </div>
            <footer className="absolute bottom-4 text-xs text-gray-600">
                &copy; {yearString} Hélicoptères Guimbal, SAS
            </footer>
        </div>
    );
};

const bladeConfig = { Yellow: 0, Green: 240, Red: 120};
// ADDED constant0
const mainRotorConstants = {
    constant0: { K: 20, Phi: 280 },
    constant1: { K: 15, Phi: 298 },
    constant2: { K: 22, Phi: 270 },
};

const MainRotorPage = ({ setPage, t }) => {
    const topRef = useRef(null);
    const bladeTextColors = { Yellow: 'text-yellow-400', Red: 'text-red-500', Green: 'text-green-500' };
    
    // CHANGED DEFAULT to 'lookup' (which is now Constant 0)
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

    const isBalanced = useMemo(() => amplitude < 0.2 && userInput, [amplitude, userInput]);

    const directCoeffs = useMemo(() => {
        return calculateDirectCoefficients(history, 'main');
    }, [history]);

    // UPDATED useMemo to use constant0 for 'lookup'
    const methodCoeffs = useMemo(() => {
        if (calculationMode === 'lookup') {
            // 'lookup' mode is now our 'constant0'
            return mainRotorConstants.constant0;
        } else {
            return mainRotorConstants[calculationMode];
        }
    }, [calculationMode]);

    const finalCoeffs = useMemo(() => {
        const ratio = blendRatio / 100;
        if (!userInput || !methodCoeffs) return { K: null, Phi: null };

        if (!directCoeffs.isCalculable || ratio === 0) {
            return methodCoeffs;
        }
        if (ratio === 100) { 
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


    // *** HELPER FUNCTIONS FOR CONSTRAINED SOLVER ***

    // General 2-blade solver: Solves w1*V1 + w2*V2 = V_target
    // V_target_cart is {x, y}, angles are in degrees. Returns { w1, w2 }
    const solveTwoBlade = (V_target_cart, angle1_deg, angle2_deg) => {
        const a1 = angle1_deg * Math.PI / 180;
        const a2 = angle2_deg * Math.PI / 180;
        const V_x = V_target_cart.x;
        const V_y = V_target_cart.y;

        // Determinant is sin(a2 - a1)
        const det = Math.cos(a1) * Math.sin(a2) - Math.sin(a1) * Math.cos(a2); 
        
        // Handle parallel blades (shouldn't happen in a 3-blade system)
        if (Math.abs(det) < 1e-9) {
            return null;
        }

        const w1 = (V_x * Math.sin(a2) - V_y * Math.cos(a2)) / det;
        const w2 = (V_y * Math.cos(a1) - V_x * Math.sin(a1)) / det;
        
        return { w1, w2 };
    };
    
    // General 1-blade solver: Solves w1*V1 = V_target (projects V_target onto V1)
    // Returns scalar weight w1
    const solveOneBlade = (V_target_cart, angle1_deg) => {
        const a1 = angle1_deg * Math.PI / 180;
        const V_mag = Math.sqrt(V_target_cart.x**2 + V_target_cart.y**2);
        if (V_mag < 1e-9) return 0;
        
        const V_angle = Math.atan2(V_target_cart.y, V_target_cart.x);
        
        // Project V_target onto the blade axis
        const w1 = V_mag * Math.cos(V_angle - a1);
        return w1;
    };


    // *** CONSTRAINED SOLVER LOGIC ***
    const calculateRecommendation = useCallback((K, Phi) => {
        if (K === null || K <= 0 || !userInput) {
            updateCurrentStep({
                calculatedCoeffs: { K, Phi },
                recommendedChange: { Yellow: 0, Green: 0, Red: 0 },
                actualChange: { Yellow: 0, Green: 0, Red: 0 }
            });
            return;
        }

        // 1. Define ideal correction vector (what we want to achieve)
        const correctionAngle = (phaseDeg + 180 - Phi + 360) % 360;
        const correctionMagnitude = amplitude * K;
        const V_correct_cart = toCartesian(correctionMagnitude, correctionAngle);

        // 2. Define blade constraints
        const MAX_BLADE_WEIGHT = 60.0;
        const constraints = {};
        Object.keys(bladeConfig).forEach(color => {
            const current = currentWeights[color] || 0;
            constraints[color] = {
                min: -current, // Min change is to remove all current weight
                max: MAX_BLADE_WEIGHT - current, // Max change is to add up to 60g
                angle: bladeConfig[color]
            };
        });

        // 3. Calculate initial ideal components (REMOVED 2/3 factor)
        // This is our "best guess" that distributes the load
        const idealChanges = {};
        Object.keys(bladeConfig).forEach(color => {
            const angleDiffRad = (correctionAngle - constraints[color].angle) * Math.PI / 180;
            const weightComponent = correctionMagnitude * Math.cos(angleDiffRad); // REMOVED * (2 / 3)
            idealChanges[color] = weightComponent;
        });

        // 4. Apply constraints to get "first-pass" solution
        const firstPassChanges = {};
        const availableBlades = [];
        let V_applied_x = 0;
        let V_applied_y = 0;

        Object.keys(bladeConfig).forEach(color => {
            const ideal = idealChanges[color];
            const { min, max, angle } = constraints[color];
            
            // Clamp the ideal change to what's physically possible
            let clampedChange = Math.max(min, Math.min(ideal, max));
            firstPassChanges[color] = clampedChange;
            
            // Check if blade is *not* at its limit (use epsilon for float safety)
            if (clampedChange > min + 1e-6 && clampedChange < max - 1e-6) {
                availableBlades.push(color);
            }
            
            // Sum the vector for this clamped change
            const v = toCartesian(clampedChange, angle);
            V_applied_x += v.x;
            V_applied_y += v.y;
        });

        // 5. Calculate the remaining error vector
        // This is the part of the correction that the clamped blades couldn't provide
        const V_error_cart = {
            x: V_correct_cart.x - V_applied_x,
            y: V_correct_cart.y - V_applied_y,
        };
        const V_error_polar = toPolar(V_error_cart.x, V_error_cart.y);

        // If error is negligible, our first pass was good enough
        if (V_error_polar.mag < 0.01) { 
            const finalRec = {};
            Object.keys(firstPassChanges).forEach(c => finalRec[c] = roundToHalf(firstPassChanges[c]));
            
            updateCurrentStep({
                calculatedCoeffs: { K, Phi },
                recommendedChange: finalRec,
                actualChange: actionManuallySet ? actualChange : finalRec
            });
            return;
        }

        // 6. Redistribute the error onto the available (non-clamped) blades
        let finalChanges = { ...firstPassChanges };

        if (availableBlades.length === 2) {
            // Solve the error using the two available blades
            const [b1, b2] = availableBlades;
            const { angle: a1 } = constraints[b1];
            const { angle: a2 } = constraints[b2];

            const solution = solveTwoBlade(V_error_cart, a1, a2);
            
            if (solution) {
                // Add the redistribution change to the first-pass change
                finalChanges[b1] += solution.w1;
                finalChanges[b2] += solution.w2;
            }

        } else if (availableBlades.length === 1) {
            // Project the entire error onto the one available blade
            const [b1] = availableBlades;
            const { angle: a1 } = constraints[b1];
            
            const solution_w1 = solveOneBlade(V_error_cart, a1);
            finalChanges[b1] += solution_w1;
        }
        // If 0 or 3 available blades (3 shouldn't happen if error > 0),
        // we can't redistribute. The first pass is the best we can do.

        // 7. Final clamp & round.
        // The redistribution might have pushed a blade to its limit *again*.
        // This final hard clamp is the "best effort" solution.
        const finalRecommendedChange = {};
        Object.keys(bladeConfig).forEach(color => {
            const { min, max } = constraints[color];
            let finalChange = Math.max(min, Math.min(finalChanges[color], max));
            finalRecommendedChange[color] = roundToHalf(finalChange);
        });

        // 8. Update state
        const newChanges = {
            calculatedCoeffs: { K, Phi },
            recommendedChange: finalRecommendedChange
        };
        if (!actionManuallySet) {
            newChanges.actualChange = finalRecommendedChange;
        }
        updateCurrentStep(newChanges);

    }, [amplitude, phaseDeg, userInput, actionManuallySet, updateCurrentStep, currentWeights, actualChange]);


    useEffect(() => {
        if (userInput && finalCoeffs.K !== null) {
            calculateRecommendation(finalCoeffs.K, finalCoeffs.Phi);
        }
    }, [userInput, finalCoeffs, calculateRecommendation]);


    const totalFinalWeights = useMemo(() => {
        const intermediateTotal = {};
        Object.keys(currentWeights).forEach(color => {
            const sum = currentWeights[color] + (actualChange[color] || 0);
            const final = roundToHalf(Math.max(0, sum));
            intermediateTotal[color] = Math.min(60, final);
        });

        // --- NEW LOGIC TO REMOVE SUPERFLUOUS WEIGHT ---
        // Find the minimum weight that is common to all three blades
        const { Yellow, Green, Red } = intermediateTotal;
        const minWeight = Math.min(Yellow, Green, Red);

        // Subtract this common weight from all blades.
        // This preserves the balance vector but minimizes total weight.
        // At least one blade will now be 0.
        const finalTotal = {
            Yellow: roundToHalf(Yellow - minWeight),
            Green: roundToHalf(Green - minWeight),
            Red: roundToHalf(Red - minWeight),
        };
        
        return finalTotal;
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
                        {/* REMOVED 2/3 factor from plotAmplitude */}
                        <MainRotorPlot plotAmplitude={amplitude} phaseDeg={phaseDeg} K={calculatedCoeffs.K} Phi={calculatedCoeffs.Phi}/>
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

// ADDED constant0
const tailRotorConstants = {
    constant0: { K: 2.2, Phi: 305 },
    constant1: { K: 2, Phi: 310 },
    constant2: { K: 2.8, Phi: 302 },
};

const TailRotorPage = ({ setPage, t }) => {
    const topRef = useRef(null);
    const screwCount = 7;
    const smallWasherWeight = 0.7;
    const largeWasherWeight = 2.0;

    // CHANGED DEFAULT to 'lookup' (which is now Constant 0)
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

    const screwAngles = useMemo(() => Array.from({length: screwCount}, (_, i) => (360 / screwCount) * i + (360 / (2 * screwCount))), [screwCount]);
    const isBalanced = useMemo(() => amplitude < 0.2 && userInput, [amplitude, userInput]);

    const directCoeffs = useMemo(() => {
        return calculateDirectCoefficients(history, 'tail');
    }, [history]);

    // UPDATED useMemo to use constant0 for 'lookup'
    const methodCoeffs = useMemo(() => {
        if (calculationMode === 'lookup') {
            // 'lookup' mode is now our 'constant0'
            return tailRotorConstants.constant0;
        } else {
            return tailRotorConstants[calculationMode];
        }
    }, [calculationMode]);

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

    // CORRECTION: The tail rotor calculation is now cumulative.
    const calculateMultiScrewRecommendation = useCallback((K, Phi) => {
        if (K === null || K <= 0 || !userInput) {
            updateCurrentStep({
                calculatedCoeffs: { K, Phi },
                recommendedWashers: Array(screwCount).fill({ small: 0, large: 0 }),
                actualWashers: Array(screwCount).fill({ small: 0, large: 0 }),
            });
            return;
        }

        // 1. Calculate the vector sum of the weights CURRENTLY installed.
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

        // 2. Calculate the CHANGE vector needed to cancel the current vibration.
        const correctionAngle = (phaseDeg + 180 - Phi + 360) % 360;
        const correctionWeight = amplitude * K;
        const changeVector = toCartesian(correctionWeight, correctionAngle);
        
        // 3. The new TOTAL target vector is the sum of what's there plus the required change.
        const targetVector = {
            x: currentWeightX + changeVector.x,
            y: currentWeightY + changeVector.y,
        };

        // --- The rest of the algorithm now works to find a washer set to match this new cumulative target ---

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

    }, [amplitude, phaseDeg, screwAngles, userInput, updateCurrentStep, currentWashers]);

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