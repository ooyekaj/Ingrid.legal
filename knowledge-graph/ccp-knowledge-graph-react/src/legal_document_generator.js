/**
 * Legal Document Generation System
 * Applies Knowledge Graph to Generate Custom Documents Based on Case Parameters
 * 
 * Input: Case Parameters (State, County, Court Division, Judge, Motion Type)
 * Output: Custom Document Requirements + Generated Document Templates
 */

const fs = require('fs');
const path = require('path');

class LegalDocumentGenerator {
    constructor() {
        this.knowledgeGraph = null;
        this.jurisdictionRules = null;
        this.judgePreferences = null;
        this.documentTemplates = null;
        this.loadData();
    }

    loadData() {
        try {
            // Load Knowledge Graph
            const kgPath = path.join(__dirname, 'data', 'ccp_knowledge_graph_cytoscape.json');
            this.knowledgeGraph = JSON.parse(fs.readFileSync(kgPath, 'utf8'));
            
            // Load Judge-Specific Requirements (from Search4.html data)
            this.loadJudgePreferences();
            
            // Load Document Templates
            this.loadDocumentTemplates();
            
            console.log('✅ Legal Document Generator initialized successfully');
            console.log(`📊 Loaded ${this.knowledgeGraph.nodes.length} CCP sections with ${this.knowledgeGraph.edges.length} relationships`);
        } catch (error) {
            console.error('❌ Error loading data:', error.message);
        }
    }

    loadJudgePreferences() {
        // Based on the Search4.html data we found
        this.judgePreferences = {
            "Santa Clara County": {
                "Complex Civil Litigation": {
                    "Charles F. Adams": {
                        "Motion for Summary Judgment": {
                            documents: [
                                { 
                                    item: "Notice of Motion and Motion", 
                                    rule: "[CCP § 437c(a), CRC Rule 3.1350(b)]", 
                                    link: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=437c",
                                    mandatory: true
                                },
                                { 
                                    item: "Memorandum of Points and Authorities", 
                                    rule: "Limit: 20 pages [CRC Rule 3.1113(d)]", 
                                    link: "https://www.courts.ca.gov/cms/rules/index.cfm?title=three&linkid=rule3_1113",
                                    mandatory: true,
                                    pageLimit: 20
                                },
                                { 
                                    item: "Separate Statement of Undisputed Material Facts", 
                                    rule: "MANDATORY [CCP § 437c(b)(1), CRC Rule 3.1350(d)]", 
                                    link: "https://www.courts.ca.gov/cms/rules/index.cfm?title=three&linkid=rule3_1350",
                                    mandatory: true,
                                    critical: true
                                },
                                { 
                                    item: "Supporting Declarations", 
                                    rule: "[CRC Rule 3.1350(c), Evidence Code §§ 1400-1402]", 
                                    link: "https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?lawCode=EVID",
                                    mandatory: true
                                },
                                { 
                                    item: "Supporting Evidence", 
                                    rule: "Attach as labeled exhibits [CRC Rule 3.1350(c), Evidence Code § 452]", 
                                    link: "https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?lawCode=EVID",
                                    mandatory: true
                                },
                                { 
                                    item: "Proposed Order", 
                                    rule: "Editable Word format required [Local Rule 6.H, CRC Rule 3.1312]", 
                                    link: "https://www.scscourt.org/general_info/rules/civil_rules.shtml#rule6",
                                    mandatory: true,
                                    format: "Word"
                                },
                                { 
                                    item: "Proof of Service", 
                                    rule: "[CCP § 1013, CRC Rule 2.251]", 
                                    link: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1013",
                                    mandatory: true
                                }
                            ],
                            conditional: [
                                { 
                                    item: "Request for Judicial Notice", 
                                    rule: "File if relying on judicially noticeable facts. [Evid. Code § 452]", 
                                    condition: "relying_on_judicial_notice",
                                    link: "https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?lawCode=EVID"
                                },
                                { 
                                    item: "Proposed Judgment", 
                                    rule: "File if the motion is dispositive of the entire action.", 
                                    condition: "dispositive_motion"
                                }
                            ],
                            deadlines: {
                                notice_period: 81, // days before hearing (CCP 437c(a)(2))
                                opposition_deadline: 20, // days before hearing
                                reply_deadline: 5, // days before hearing
                                hearing_before_trial: 30 // days before trial
                            },
                            procedural_requirements: [
                                {
                                    requirement: "81-Day Notice Period",
                                    description: "Motion must be served at least 81 days before hearing",
                                    statute: "CCP § 437c(a)(2)",
                                    critical: true
                                },
                                {
                                    requirement: "Separate Statement Format",
                                    description: "Two-column format with numbered facts and evidence citations",
                                    statute: "CRC Rule 3.1350(d)",
                                    critical: true
                                },
                                {
                                    requirement: "Evidence Authentication",
                                    description: "All evidence must be authenticated via declarations",
                                    statute: "CCP § 437c(b)(1)",
                                    critical: true
                                }
                            ]
                        }
                    }
                }
            }
        };
    }

    loadDocumentTemplates() {
        this.documentTemplates = {
            "Motion for Summary Judgment": {
                "Notice of Motion": {
                    template: `NOTICE OF MOTION AND MOTION FOR SUMMARY JUDGMENT

TO ALL PARTIES AND THEIR ATTORNEYS OF RECORD:

PLEASE TAKE NOTICE that on {{HEARING_DATE}}, at {{HEARING_TIME}} in Department {{DEPARTMENT}}, located at {{COURT_ADDRESS}}, {{MOVING_PARTY}} will and hereby does move this Court for an order granting summary judgment in favor of {{MOVING_PARTY}} and against {{OPPOSING_PARTY}} on the grounds that:

1. There is no triable issue of material fact as to {{CLAIM_DESCRIPTION}};
2. {{MOVING_PARTY}} is entitled to judgment as a matter of law;
3. {{ADDITIONAL_GROUNDS}}.

This motion is made on the grounds that {{LEGAL_GROUNDS}} and is based upon this Notice of Motion, the Memorandum of Points and Authorities filed herewith, the Separate Statement of Undisputed Material Facts filed herewith, the declarations of {{DECLARANTS}} filed herewith, the exhibits attached thereto, the pleadings and papers on file in this action, and such other evidence and argument as may be presented at the hearing of this motion.

{{SERVICE_NOTICE}}

DATED: {{DATE}}

{{ATTORNEY_SIGNATURE_BLOCK}}`,
                    variables: [
                        'HEARING_DATE', 'HEARING_TIME', 'DEPARTMENT', 'COURT_ADDRESS',
                        'MOVING_PARTY', 'OPPOSING_PARTY', 'CLAIM_DESCRIPTION', 
                        'ADDITIONAL_GROUNDS', 'LEGAL_GROUNDS', 'DECLARANTS', 
                        'SERVICE_NOTICE', 'DATE', 'ATTORNEY_SIGNATURE_BLOCK'
                    ]
                },
                "Separate Statement": {
                    template: `SEPARATE STATEMENT OF UNDISPUTED MATERIAL FACTS
IN SUPPORT OF MOTION FOR SUMMARY JUDGMENT

TO THE HONORABLE {{JUDGE_NAME}}, JUDGE OF THE ABOVE-ENTITLED COURT:

Pursuant to California Code of Civil Procedure section 437c(b)(1) and California Rules of Court, rule 3.1350, {{MOVING_PARTY}} hereby submits the following separate statement of undisputed material facts:

{{#FACTS}}
{{FACT_NUMBER}}. {{FACT_STATEMENT}}

Supporting Evidence: {{EVIDENCE_CITATION}}

{{/FACTS}}

DATED: {{DATE}}

{{ATTORNEY_SIGNATURE_BLOCK}}`,
                    variables: [
                        'JUDGE_NAME', 'MOVING_PARTY', 'FACTS', 'DATE', 'ATTORNEY_SIGNATURE_BLOCK'
                    ]
                },
                "Memorandum of Points and Authorities": {
                    template: `MEMORANDUM OF POINTS AND AUTHORITIES
IN SUPPORT OF MOTION FOR SUMMARY JUDGMENT

TO THE HONORABLE {{JUDGE_NAME}}, JUDGE OF THE ABOVE-ENTITLED COURT:

I. INTRODUCTION

{{MOVING_PARTY}} respectfully moves this Court for summary judgment against {{OPPOSING_PARTY}} on the grounds that there is no triable issue of material fact and {{MOVING_PARTY}} is entitled to judgment as a matter of law.

II. STATEMENT OF FACTS

{{FACTUAL_BACKGROUND}}

III. LEGAL STANDARD

{{LEGAL_STANDARD_SECTION}}

IV. ARGUMENT

{{LEGAL_ARGUMENTS}}

V. CONCLUSION

For the foregoing reasons, {{MOVING_PARTY}} respectfully requests that this Court grant the motion for summary judgment.

DATED: {{DATE}}

{{ATTORNEY_SIGNATURE_BLOCK}}`,
                    variables: [
                        'JUDGE_NAME', 'MOVING_PARTY', 'OPPOSING_PARTY', 
                        'FACTUAL_BACKGROUND', 'LEGAL_STANDARD_SECTION', 
                        'LEGAL_ARGUMENTS', 'DATE', 'ATTORNEY_SIGNATURE_BLOCK'
                    ]
                }
            }
        };
    }

    /**
     * Main method to generate custom document requirements and templates
     * @param {Object} caseParams - Case parameters
     * @returns {Object} Generated document package
     */
    generateDocumentPackage(caseParams) {
        const {
            state,
            county,
            division,
            department,
            judge,
            motionType,
            caseDetails
        } = caseParams;

        console.log(`\n🎯 Generating document package for:`);
        console.log(`   State: ${state}`);
        console.log(`   County: ${county}`);
        console.log(`   Division: ${division}`);
        console.log(`   Department: ${department}`);
        console.log(`   Judge: ${judge}`);
        console.log(`   Motion Type: ${motionType}`);

        // Get applicable CCP sections from knowledge graph
        const applicableSections = this.getApplicableSections(motionType);
        
        // Get judge-specific requirements
        const judgeRequirements = this.getJudgeRequirements(county, division, judge, motionType);
        
        // Generate document requirements
        const documentRequirements = this.generateDocumentRequirements(judgeRequirements, applicableSections);
        
        // Generate custom templates
        const customTemplates = this.generateCustomTemplates(motionType, caseDetails, judgeRequirements);
        
        // Calculate deadlines
        const deadlines = this.calculateDeadlines(judgeRequirements, caseDetails);
        
        // Generate checklist
        const procedureChecklist = this.generateProcedureChecklist(judgeRequirements, applicableSections);

        return {
            caseParameters: caseParams,
            applicableSections,
            documentRequirements,
            customTemplates,
            deadlines,
            procedureChecklist,
            knowledgeGraphInsights: this.getKnowledgeGraphInsights(motionType)
        };
    }

    getApplicableSections(motionType) {
        if (!this.knowledgeGraph) return [];

        // Map motion types to relevant CCP sections
        const motionSectionMap = {
            "Motion for Summary Judgment": ["437c", "437", "438", "1005", "1010", "1013"],
            "Motion to Strike": ["435", "435.5", "436", "1005", "1010"],
            "Motion to Compel": ["2031.310", "2030.300", "2016.040", "2023.030"],
            "Demurrer": ["430.10", "430.30", "430.41", "472d"]
        };

        const relevantSectionIds = motionSectionMap[motionType] || [];
        
        return this.knowledgeGraph.nodes
            .filter(node => relevantSectionIds.some(id => node.data.id.includes(id)))
            .map(node => ({
                section: node.data.id,
                title: node.data.title,
                category: node.data.category,
                filingRelevance: node.data.filingRelevance,
                wordCount: node.data.wordCount,
                crossReferences: node.data.crossReferences
            }));
    }

    getJudgeRequirements(county, division, judge, motionType) {
        try {
            return this.judgePreferences[county]?.[division]?.[judge]?.[motionType] || {};
        } catch (error) {
            console.warn(`⚠️  No specific requirements found for Judge ${judge}`);
            return {};
        }
    }

    generateDocumentRequirements(judgeRequirements, applicableSections) {
        const requirements = {
            mandatory: [],
            conditional: [],
            formatting: [],
            procedural: []
        };

        // Add judge-specific mandatory documents
        if (judgeRequirements.documents) {
            requirements.mandatory = judgeRequirements.documents.map(doc => ({
                document: doc.item,
                rule: doc.rule,
                link: doc.link,
                pageLimit: doc.pageLimit,
                format: doc.format,
                critical: doc.critical || false
            }));
        }

        // Add conditional documents
        if (judgeRequirements.conditional) {
            requirements.conditional = judgeRequirements.conditional.map(doc => ({
                document: doc.item,
                rule: doc.rule,
                condition: doc.condition,
                link: doc.link
            }));
        }

        // Add procedural requirements
        if (judgeRequirements.procedural_requirements) {
            requirements.procedural = judgeRequirements.procedural_requirements;
        }

        // Add CCP-based requirements from knowledge graph
        applicableSections.forEach(section => {
            if (section.filingRelevance >= 8) {
                requirements.formatting.push({
                    requirement: `CCP ${section.section} Compliance`,
                    description: `Ensure compliance with ${section.title}`,
                    category: section.category,
                    importance: section.filingRelevance
                });
            }
        });

        return requirements;
    }

    generateCustomTemplates(motionType, caseDetails, judgeRequirements) {
        if (!this.documentTemplates) {
            console.warn('⚠️  Document templates not loaded, returning empty templates');
            return {};
        }
        
        const baseTemplates = this.documentTemplates[motionType] || {};
        const customTemplates = {};

        Object.keys(baseTemplates).forEach(templateName => {
            const template = baseTemplates[templateName];
            customTemplates[templateName] = {
                content: this.populateTemplate(template.template, caseDetails, judgeRequirements),
                variables: template.variables,
                originalTemplate: template.template
            };
        });

        return customTemplates;
    }

    populateTemplate(template, caseDetails, judgeRequirements) {
        let populatedTemplate = template;

        // Replace common variables
        const replacements = {
            '{{JUDGE_NAME}}': caseDetails.judge || 'HONORABLE [JUDGE NAME]',
            '{{MOVING_PARTY}}': caseDetails.movingParty || '[MOVING PARTY]',
            '{{OPPOSING_PARTY}}': caseDetails.opposingParty || '[OPPOSING PARTY]',
            '{{DEPARTMENT}}': caseDetails.department || '[DEPARTMENT]',
            '{{DATE}}': new Date().toLocaleDateString(),
            '{{HEARING_DATE}}': caseDetails.hearingDate || '[HEARING DATE]',
            '{{HEARING_TIME}}': caseDetails.hearingTime || '[HEARING TIME]',
            '{{COURT_ADDRESS}}': caseDetails.courtAddress || '[COURT ADDRESS]'
        };

        Object.keys(replacements).forEach(placeholder => {
            populatedTemplate = populatedTemplate.replace(
                new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), 
                replacements[placeholder]
            );
        });

        return populatedTemplate;
    }

    calculateDeadlines(judgeRequirements, caseDetails) {
        const deadlines = [];
        const hearingDate = caseDetails.hearingDate ? new Date(caseDetails.hearingDate) : null;

        if (judgeRequirements.deadlines && hearingDate) {
            const { notice_period, opposition_deadline, reply_deadline } = judgeRequirements.deadlines;

            // Calculate service deadline
            const serviceDeadline = new Date(hearingDate);
            serviceDeadline.setDate(serviceDeadline.getDate() - notice_period);
            
            deadlines.push({
                task: 'Serve Motion and Supporting Papers',
                deadline: serviceDeadline.toLocaleDateString(),
                daysFromHearing: notice_period,
                critical: true,
                statute: 'CCP § 437c(a)(2)'
            });

            // Calculate opposition deadline
            const oppositionDeadline = new Date(hearingDate);
            oppositionDeadline.setDate(oppositionDeadline.getDate() - opposition_deadline);
            
            deadlines.push({
                task: 'Opposition Due',
                deadline: oppositionDeadline.toLocaleDateString(),
                daysFromHearing: opposition_deadline,
                critical: false,
                statute: 'CCP § 437c(b)(2)'
            });

            // Calculate reply deadline
            const replyDeadline = new Date(hearingDate);
            replyDeadline.setDate(replyDeadline.getDate() - reply_deadline);
            
            deadlines.push({
                task: 'Reply Brief Due',
                deadline: replyDeadline.toLocaleDateString(),
                daysFromHearing: reply_deadline,
                critical: false,
                statute: 'CCP § 437c(b)(2)'
            });
        }

        return deadlines;
    }

    generateProcedureChecklist(judgeRequirements, applicableSections) {
        const checklist = [];

        // Phase 1: Pre-Filing
        checklist.push({
            phase: 'Phase 1: Pre-Filing Requirements',
            tasks: [
                {
                    task: 'Assess Legal Viability',
                    description: 'Confirm no triable issue of material fact exists',
                    statute: 'CCP § 437c',
                    completed: false
                },
                {
                    task: 'Calendar Critical Deadlines',
                    description: 'Calculate 81-day notice period and other deadlines',
                    statute: 'CCP § 437c(a)(2)',
                    completed: false
                },
                {
                    task: 'Gather Supporting Evidence',
                    description: 'Collect declarations, exhibits, and other evidence',
                    statute: 'CCP § 437c(b)(1)',
                    completed: false
                }
            ]
        });

        // Phase 2: Document Preparation
        checklist.push({
            phase: 'Phase 2: Document Preparation',
            tasks: [
                {
                    task: 'Draft Notice of Motion',
                    description: 'Include all required elements and proper notice language',
                    statute: 'CCP § 437c(a)',
                    completed: false
                },
                {
                    task: 'Prepare Separate Statement',
                    description: 'Use two-column format with numbered facts and evidence citations',
                    statute: 'CRC Rule 3.1350(d)',
                    completed: false,
                    critical: true
                },
                {
                    task: 'Draft Memorandum of Points and Authorities',
                    description: 'Limit to 20 pages unless court permission obtained',
                    statute: 'CRC Rule 3.1113(d)',
                    completed: false
                },
                {
                    task: 'Prepare Supporting Declarations',
                    description: 'Authenticate all exhibits and evidence',
                    statute: 'Evidence Code §§ 1400-1402',
                    completed: false
                }
            ]
        });

        // Phase 3: Filing and Service
        checklist.push({
            phase: 'Phase 3: Filing and Service',
            tasks: [
                {
                    task: 'File Motion with Court',
                    description: 'Ensure all documents are properly formatted and complete',
                    statute: 'CRC Rule 2.100 et seq.',
                    completed: false
                },
                {
                    task: 'Serve All Parties',
                    description: 'Serve at least 81 days before hearing date',
                    statute: 'CCP § 437c(a)(2)',
                    completed: false,
                    critical: true
                },
                {
                    task: 'File Proof of Service',
                    description: 'File proof of service with the court',
                    statute: 'CCP § 1013',
                    completed: false
                }
            ]
        });

        return checklist;
    }

    getKnowledgeGraphInsights(motionType) {
        if (!this.knowledgeGraph) return {};

        // Analyze relationships for the motion type
        const relevantNodes = this.knowledgeGraph.nodes.filter(node => 
            node.data.category.includes('Motion') || 
            node.data.filingRelevance >= 8
        );

        const insights = {
            totalRelevantSections: relevantNodes.length,
            highImportanceSections: relevantNodes.filter(n => n.data.filingRelevance >= 9).length,
            categoryCoverage: {},
            crossReferenceAnalysis: {}
        };

        // Category analysis
        relevantNodes.forEach(node => {
            const category = node.data.category;
            insights.categoryCoverage[category] = (insights.categoryCoverage[category] || 0) + 1;
        });

        return insights;
    }

    // Utility method to save generated package
    saveDocumentPackage(packageData, filename) {
        const outputPath = path.join(__dirname, 'generated_documents', `${filename}.json`);
        
        // Ensure directory exists
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(outputPath, JSON.stringify(packageData, null, 2));
        console.log(`📄 Document package saved to: ${outputPath}`);
        
        return outputPath;
    }
}

// Example Usage
function demonstrateSystem() {
    const generator = new LegalDocumentGenerator();

    const caseParameters = {
        state: 'California',
        county: 'Santa Clara County',
        division: 'Complex Civil Litigation',
        department: 'Dept 7',
        judge: 'Charles F. Adams',
        motionType: 'Motion for Summary Judgment',
        caseDetails: {
            movingParty: 'PLAINTIFF ACME CORPORATION',
            opposingParty: 'DEFENDANT JOHN DOE',
            judge: 'Hon. Charles F. Adams',
            department: '7',
            hearingDate: '2024-03-15',
            hearingTime: '9:00 AM',
            courtAddress: 'Superior Court of California, County of Santa Clara\n191 N. First Street\nSan Jose, CA 95113',
            caseNumber: '23CV123456',
            claimDescription: 'breach of contract claim'
        }
    };

    console.log('🚀 Generating Custom Legal Document Package...\n');
    
    const documentPackage = generator.generateDocumentPackage(caseParameters);
    
    // Save the package
    const filename = `${caseParameters.motionType.replace(/\s+/g, '_')}_${caseParameters.judge.replace(/\s+/g, '_')}_${Date.now()}`;
    generator.saveDocumentPackage(documentPackage, filename);
    
    // Display summary
    console.log('\n📋 DOCUMENT PACKAGE SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log(`🏛️  Court: ${caseParameters.county}, ${caseParameters.division}`);
    console.log(`👨‍⚖️  Judge: ${caseParameters.judge}`);
    console.log(`📝 Motion Type: ${caseParameters.motionType}`);
    console.log(`📊 Applicable CCP Sections: ${documentPackage.applicableSections.length}`);
    console.log(`📄 Mandatory Documents: ${documentPackage.documentRequirements.mandatory.length}`);
    console.log(`⚠️  Conditional Documents: ${documentPackage.documentRequirements.conditional.length}`);
    console.log(`📅 Critical Deadlines: ${documentPackage.deadlines.filter(d => d.critical).length}`);
    console.log(`✅ Checklist Items: ${documentPackage.procedureChecklist.reduce((acc, phase) => acc + phase.tasks.length, 0)}`);
    
    console.log('\n🎯 CRITICAL REQUIREMENTS:');
    documentPackage.documentRequirements.mandatory
        .filter(req => req.critical)
        .forEach(req => {
            console.log(`   • ${req.document} - ${req.rule}`);
        });
    
    console.log('\n📅 KEY DEADLINES:');
    documentPackage.deadlines
        .filter(deadline => deadline.critical)
        .forEach(deadline => {
            console.log(`   • ${deadline.task}: ${deadline.deadline} (${deadline.daysFromHearing} days before hearing)`);
        });

    return documentPackage;
}

// Export for use
module.exports = LegalDocumentGenerator;

// Run demonstration if called directly
if (require.main === module) {
    demonstrateSystem();
}