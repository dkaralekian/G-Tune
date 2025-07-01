# G-Tune: Cabri G2 Rotor Balancing Assistant

G-Tune is a web-based application designed to assist with the balancing of the main and tail rotors of the Guimbal Cabri G2 helicopter. It provides a step-by-step guided process with calculations based on lookup tables and direct coefficient calculations.

## Features

* **Main and Tail Rotor Balancing:** Separate, dedicated workflows for each rotor system.
* **Multiple Calculation Methods:**
    * Decision Trees (Lookup Tables) for initial balancing steps.
    * Directly Calculated Coefficients based on user input from previous steps.
    * Standard constants for reference.
* **Interactive Balancing Plots:** Visual representation of the vibration and required corrections.
* **Multi-language Support:** Available in English and French.
* **PDF Report Generation:** Export a complete history of the balancing process for record-keeping.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### `npm run build`

Builds the app for production to the `build` folder. It correctly bundles React in production mode and optimizes the build for the best performance. Your app is ready to be deployed from the `build` directory.

### `npm test`

Launches the test runner in the interactive watch mode.

## Deployment

This project is configured for easy deployment to static site hosting services like Netlify or Vercel. Every push to the `main` branch will trigger an automatic redeployment.