/**
 * Universal evaluator for medical test results.
 * @param {Number} value - The extracted numerical value from the PDF.
 * @param {Object} referenceDoc - The Mongoose LabReference document.
 * @param {Object} patientMeta - { age: Number, gender: String }
 * @returns {String} "Normal", "High", "Low", "Critical High", "Critical Low"
 */
function evaluate(value, referenceDoc, patientMeta = { age: 30, gender: "All" }) {
    if (!referenceDoc) return "Unknown";

    // If the value is text (e.g., "Positive" or "1.5:1"), skip the math checks
    if (typeof value === 'string') {
        const textLower = value.toLowerCase();
        if (textLower.includes("reactive") || textLower.includes("positive") || textLower.includes("abnormal")) {
            return "Critical High"; // Turns the chip red!
        }
        return "Normal"; // For "Negative", "Clear", "Pale Yellow", etc.
    }

    if (isNaN(value)) return "Unknown";

    // 1. Check Critical Levels First
    if (referenceDoc.criticalLow !== undefined && value <= referenceDoc.criticalLow) return "Critical Low";
    if (referenceDoc.criticalHigh !== undefined && value >= referenceDoc.criticalHigh) return "Critical High";

    // 2. Find the correct demographic range
    const targetRange = referenceDoc.ageGroups.find(group => {
        const ageMatches = patientMeta.age >= group.minAge && patientMeta.age <= group.maxAge;
        const genderMatches = group.gender === "All" || group.gender === patientMeta.gender;
        return ageMatches && genderMatches;
    }) || referenceDoc.ageGroups[0]; // Fallback to first range if no exact demographic match

    if (!targetRange) return "Review Required";

    // 3. Evaluate Status
    if (value < targetRange.minNormal) return "Low";
    if (value > targetRange.maxNormal) return "High";

    return "Normal";
}

module.exports = { evaluate };