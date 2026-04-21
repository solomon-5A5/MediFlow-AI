const LabReference = require("../models/labReference.model"); 
const { evaluate } = require("../utils/evaluator");           

module.exports = async function orchestrator(text, patientMeta) {
    const allReferences = await LabReference.find({});
    const resultsByPanel = {};
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    for (const ref of allReferences) {
        const aliasList = ref.aliases.map(escapeRegExp).join('|');

        // 🟢 THE GOD-MODE REGEX 🟢
        // 1. Matches the Alias
        // 2. Absorbs leader dots and noise: [\s\.:\-*_]*
        // 3. Ignores H/L/* flags
        // 4. THE CAPTURE GROUP NOW GRABS:
        //    - Numbers with < or > signs (e.g., "< 0.5")
        //    - Ratios (e.g., "1.5:1" or "0.8/1")
        //    - Standard Medical Text (Positive, Negative, Reactive, Clear, etc.)
        const medicalText = "Positive|Negative|Reactive|Non-Reactive|Clear|Pale Yellow|Yellow|Trace|Absent|Present|Normal|Abnormal";
        const regex = new RegExp(`(?:${aliasList})[\\s\\.:\\-*_]*(?:[HL]\\s*|\\*\\s*)?([<>]?\\s*[\\d,]+\\.?\\d*(?:\\s*[:\\/]\\s*[\\d\\.]+)?|${medicalText})`, 'i');

        const match = text.match(regex);

        if (match && match[1]) {
            let rawValue = match[1].trim();
            let finalValue;

            // 🧠 SMART PARSING LOGIC
            // If the value is strictly a number (like "15.2" or "5,100"), convert it to a Float
            if (/^[\d,\.]+$/.test(rawValue)) {
                finalValue = parseFloat(rawValue.replace(/,/g, ''));
            } else {
                // If it is a Ratio ("1.5:1"), a Limit ("<0.5"), or Text ("Positive"), keep it as a String!
                finalValue = rawValue;
            }

            // Evaluate the status (Normal/High/Low)
            const status = evaluate(finalValue, ref, patientMeta);

            if (!resultsByPanel[ref.panel]) {
                resultsByPanel[ref.panel] = [];
            }

            resultsByPanel[ref.panel].push({
                testCode: ref.testCode,
                testName: ref.testName,
                value: finalValue,
                unit: ref.unit || "", // Some text tests don't have units
                status
            });
        }
    }

    const unifiedPayload = Object.keys(resultsByPanel).map(panelName => ({
        panel: panelName,
        metrics: resultsByPanel[panelName]
    }));

    const totalFound = unifiedPayload.reduce((acc, p) => acc + p.metrics.length, 0);
    console.log(`🧠 Universal Engine detected ${totalFound} parameters across ${unifiedPayload.length} panels.`);

    return unifiedPayload;
};