const { PDFParse } = require("pdf-parse"); // 🟢 Import the new specific class
const orchestrator = require("../services/orchestrator.service");
const { generateSummary } = require("../services/summary.service"); // 🟢 IMPORT SUMMARY ENGINE

const uploadAndAnalyzePDF = async (req, res) => {
    try {
        const file = req.file;
        if (!file) return res.status(400).json({ message: "No PDF uploaded." });

        console.log(`📁 File Received: ${file.originalname} (${file.size} bytes)`);

        
        const parser = new PDFParse({ data: file.buffer });
        const result = await parser.getText();
        const rawText = result.text;

        const testIndex = rawText.indexOf("Total Cholesterol");
        if (testIndex !== -1) {
            console.log("🕵️ RAW TEXT SCRAMBLE AROUND CHOLESTEROL:");
            console.log(JSON.stringify(rawText.substring(testIndex, testIndex + 150))); 
        }

        console.log("📄 Extracted Text Preview:", rawText.substring(0, 100));

        const patientMeta = { age: 30, gender: "Male" };
        const analysisResults = await orchestrator(rawText, patientMeta);
        const summary = generateSummary(analysisResults);
        res.status(200).json({
            message: "PDF Analyzed Successfully",
            data: {
                panels: analysisResults,
                summary: summary
            }
        });

    } catch (error) {
        console.error("PDF Parsing Error:", error);
        res.status(500).json({ message: "Failed to process PDF document.", error: error.message });
    }
};

module.exports = { uploadAndAnalyzePDF };