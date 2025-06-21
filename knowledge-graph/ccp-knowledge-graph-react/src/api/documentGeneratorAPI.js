const express = require('express');
const cors = require('cors');
const LegalDocumentGenerator = require('../legal_document_generator');

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize the document generator
const documentGenerator = new LegalDocumentGenerator();

// API Routes

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

/**
 * POST /api/generate-documents
 * Generate document package based on case parameters
 */
app.post('/api/generate-documents', (req, res) => {
    try {
        const caseParameters = req.body;
        
        // Validate required fields
        const requiredFields = ['state', 'county', 'division', 'judge', 'motionType'];
        const missingFields = requiredFields.filter(field => !caseParameters[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                error: 'Missing required fields',
                missingFields,
                message: `Please provide: ${missingFields.join(', ')}`
            });
        }

        console.log('📥 Received document generation request:', {
            county: caseParameters.county,
            judge: caseParameters.judge,
            motionType: caseParameters.motionType
        });

        // Generate document package
        const documentPackage = documentGenerator.generateDocumentPackage(caseParameters);
        
        // Save to file system
        const filename = `${caseParameters.motionType.replace(/\s+/g, '_')}_${caseParameters.judge.replace(/\s+/g, '_')}_${Date.now()}`;
        const savedPath = documentGenerator.saveDocumentPackage(documentPackage, filename);

        // Return the complete package with metadata
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            savedPath,
            documentPackage: {
                ...documentPackage,
                metadata: {
                    generatedAt: new Date().toISOString(),
                    requestId: filename,
                    totalDocuments: documentPackage.documentRequirements.mandatory.length,
                    criticalDeadlines: documentPackage.deadlines.filter(d => d.critical).length,
                    checklistItems: documentPackage.procedureChecklist.reduce((acc, phase) => acc + phase.tasks.length, 0)
                }
            }
        });

    } catch (error) {
        console.error('❌ Error generating documents:', error);
        res.status(500).json({
            error: 'Document generation failed',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/templates/:motionType
 * Get available templates for a specific motion type
 */
app.get('/api/templates/:motionType', (req, res) => {
    try {
        const { motionType } = req.params;
        const templates = documentGenerator.documentTemplates[motionType] || {};
        
        res.json({
            success: true,
            motionType,
            templates: Object.keys(templates),
            templatesData: templates
        });
    } catch (error) {
        console.error('❌ Error fetching templates:', error);
        res.status(500).json({
            error: 'Failed to fetch templates',
            message: error.message
        });
    }
});

/**
 * GET /api/judges/:county/:division
 * Get judges for a specific county and division
 */
app.get('/api/judges/:county/:division', (req, res) => {
    try {
        const { county, division } = req.params;
        
        const judgeData = documentGenerator.judgePreferences[county]?.[division] || {};
        const judges = Object.keys(judgeData);
        
        res.json({
            success: true,
            county: decodeURIComponent(county),
            division: decodeURIComponent(division),
            judges,
            judgeDetails: judges.map(judge => ({
                name: judge,
                availableMotions: Object.keys(judgeData[judge] || {}),
                hasSpecificRequirements: Object.keys(judgeData[judge] || {}).length > 0
            }))
        });
    } catch (error) {
        console.error('❌ Error fetching judges:', error);
        res.status(500).json({
            error: 'Failed to fetch judges',
            message: error.message
        });
    }
});

/**
 * GET /api/requirements/:county/:division/:judge/:motionType
 * Get specific requirements for a judge and motion type
 */
app.get('/api/requirements/:county/:division/:judge/:motionType', (req, res) => {
    try {
        const { county, division, judge, motionType } = req.params;
        
        const requirements = documentGenerator.getJudgeRequirements(
            decodeURIComponent(county),
            decodeURIComponent(division), 
            decodeURIComponent(judge),
            decodeURIComponent(motionType)
        );
        
        res.json({
            success: true,
            jurisdiction: {
                county: decodeURIComponent(county),
                division: decodeURIComponent(division),
                judge: decodeURIComponent(judge),
                motionType: decodeURIComponent(motionType)
            },
            requirements,
            hasRequirements: Object.keys(requirements).length > 0
        });
    } catch (error) {
        console.error('❌ Error fetching requirements:', error);
        res.status(500).json({
            error: 'Failed to fetch requirements',
            message: error.message
        });
    }
});

/**
 * GET /api/knowledge-graph/sections
 * Get CCP sections from knowledge graph
 */
app.get('/api/knowledge-graph/sections', (req, res) => {
    try {
        const { category, minRelevance = 5 } = req.query;
        
        let sections = documentGenerator.knowledgeGraph?.nodes || [];
        
        // Filter by category if provided
        if (category) {
            sections = sections.filter(node => 
                node.data.category.toLowerCase().includes(category.toLowerCase())
            );
        }
        
        // Filter by relevance
        sections = sections.filter(node => 
            node.data.filingRelevance >= parseInt(minRelevance)
        );
        
        // Sort by relevance
        sections.sort((a, b) => b.data.filingRelevance - a.data.filingRelevance);
        
        res.json({
            success: true,
            totalSections: sections.length,
            filters: { category, minRelevance },
            sections: sections.map(node => ({
                section: node.data.id,
                title: node.data.title,
                category: node.data.category,
                relevance: node.data.filingRelevance,
                wordCount: node.data.wordCount,
                crossReferences: node.data.crossReferences
            }))
        });
    } catch (error) {
        console.error('❌ Error fetching knowledge graph sections:', error);
        res.status(500).json({
            error: 'Failed to fetch knowledge graph sections',
            message: error.message
        });
    }
});

/**
 * POST /api/download-package/:requestId
 * Download generated document package
 */
app.get('/api/download-package/:requestId', (req, res) => {
    try {
        const { requestId } = req.params;
        const filePath = require('path').join(__dirname, '..', 'generated_documents', `${requestId}.json`);
        
        if (require('fs').existsSync(filePath)) {
            res.download(filePath, `${requestId}.json`);
        } else {
            res.status(404).json({
                error: 'Package not found',
                message: `Document package ${requestId} not found or expired`
            });
        }
    } catch (error) {
        console.error('❌ Error downloading package:', error);
        res.status(500).json({
            error: 'Download failed',
            message: error.message
        });
    }
});

/**
 * POST /api/validate-case-params
 * Validate case parameters before generation
 */
app.post('/api/validate-case-params', (req, res) => {
    try {
        const caseParams = req.body;
        const validation = {
            valid: true,
            errors: [],
            warnings: [],
            suggestions: []
        };

        // Check required fields
        const requiredFields = [
            'state', 'county', 'division', 'judge', 'motionType',
            'caseDetails.movingParty', 'caseDetails.opposingParty', 
            'caseDetails.hearingDate'
        ];

        requiredFields.forEach(field => {
            const fieldValue = field.includes('.') 
                ? field.split('.').reduce((obj, key) => obj?.[key], caseParams)
                : caseParams[field];
                
            if (!fieldValue) {
                validation.errors.push(`Missing required field: ${field}`);
                validation.valid = false;
            }
        });

        // Check hearing date is in future
        if (caseParams.caseDetails?.hearingDate) {
            const hearingDate = new Date(caseParams.caseDetails.hearingDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (hearingDate <= today) {
                validation.warnings.push('Hearing date should be in the future');
            }
            
            // Check if enough time for 81-day notice (for summary judgment)
            if (caseParams.motionType === 'Motion for Summary Judgment') {
                const minDate = new Date();
                minDate.setDate(minDate.getDate() + 81);
                
                if (hearingDate < minDate) {
                    validation.errors.push('Hearing date must be at least 81 days from today for Motion for Summary Judgment');
                    validation.valid = false;
                }
            }
        }

        // Provide suggestions
        if (caseParams.judge && caseParams.motionType) {
            const hasSpecificRequirements = documentGenerator.getJudgeRequirements(
                caseParams.county, 
                caseParams.division, 
                caseParams.judge, 
                caseParams.motionType
            );
            
            if (Object.keys(hasSpecificRequirements).length > 0) {
                validation.suggestions.push(`Judge ${caseParams.judge} has specific requirements for ${caseParams.motionType}`);
            }
        }

        res.json({
            success: true,
            validation
        });
    } catch (error) {
        console.error('❌ Error validating case parameters:', error);
        res.status(500).json({
            error: 'Validation failed',
            message: error.message
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('💥 Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        message: `${req.method} ${req.path} is not a valid endpoint`,
        availableEndpoints: [
            'GET /api/health',
            'POST /api/generate-documents',
            'GET /api/templates/:motionType',
            'GET /api/judges/:county/:division',
            'GET /api/requirements/:county/:division/:judge/:motionType',
            'GET /api/knowledge-graph/sections',
            'GET /api/download-package/:requestId',
            'POST /api/validate-case-params'
        ]
    });
});

// Start server
app.listen(port, () => {
    console.log('🚀 Legal Document Generator API Server Started');
    console.log('═══════════════════════════════════════════════');
    console.log(`📡 Server running on http://localhost:${port}`);
    console.log(`🏥 Health check: http://localhost:${port}/api/health`);
    console.log(`📚 API Documentation available at endpoints above`);
    console.log('═══════════════════════════════════════════════');
    
    // Test the document generator initialization
    if (documentGenerator.knowledgeGraph) {
        console.log(`✅ Knowledge Graph loaded: ${documentGenerator.knowledgeGraph.nodes.length} sections`);
    } else {
        console.log('⚠️  Knowledge Graph not loaded - check file paths');
    }
});

module.exports = app; 