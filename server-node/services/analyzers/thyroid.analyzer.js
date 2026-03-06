const LabReference = require("../../models/labReference.model");
const { evaluate } = require("../../utils/evaluator");

/**
 * Extracts Thyroid Function Test (TFT) metrics from raw PDF text.
 */
module.exports = async function analyzeThyroid(text, patientMeta) {
    const metrics = [];

    // 1. Define Regex patterns for Thyroid markers
    const patterns = {
        TSH: /(?:TSH|Thyroid Stimulating Hormone|Thyroid-Stimulating Hormone)\s*[:\-]?\s*(\d+\.?\d*)/i,
        T3: /(?:T3|Triiodothyronine|Free T3|FT3)\s*[:\-]?\s*(\d+\.?\d*)/i,
        T4: /(?:T4|Thyroxine|Free T4|FT4)\s*[:\-]?\s*(\d+\.?\d*)/i,
        TPO: /(?:TPO|Anti-TPO|Thyroid Peroxidase)\s*[:\-]?\s*(\d+\.?\d*)/i
    };

    // 2. Fetch all Thyroid reference ranges from the database at once
    const references = await LabReference.find({ panel: "Thyroid" });

    // Helper function to process each metric safely
    const processMetric = (testCode, matchResult) => {
        if (matchResult && matchResult[1]) {
            const value = parseFloat(matchResult[1]);
            const referenceDoc = references.find(r => r.testCode === testCode);

            const status = referenceDoc ? evaluate(value, referenceDoc, patientMeta) : "Reference Missing";

            metrics.push({
                testCode,
                testName: referenceDoc ? referenceDoc.testName : testCode,
                value,
                unit: referenceDoc ? referenceDoc.unit : "Unknown",
                status
            });
        }
    };

    // 3. Execute extractions
    processMetric("TSH", text.match(patterns.TSH));
    processMetric("T3", text.match(patterns.T3));
    processMetric("T4", text.match(patterns.T4));
    processMetric("TPO", text.match(patterns.TPO));

    // 4. Return the structured panel
    return {
        panel: "Thyroid",
        metrics
    };
};
