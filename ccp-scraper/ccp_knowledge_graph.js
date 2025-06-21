const fs = require('fs').promises;
const path = require('path');

class CCPKnowledgeGraph {
  constructor(options = {}) {
    this.inputFile = options.inputFile || './ccp_results/ccp_filing_rules_extraction_results.json';
    this.outputDir = options.outputDir || './ccp_knowledge_graph';
    this.nodes = new Map();
    this.edges = [];
    this.categories = new Map();
  }

  async initialize() {
    await fs.mkdir(this.outputDir, { recursive: true });
    console.log(`📁 Knowledge graph output directory: ${this.outputDir}`);
  }

  async generateKnowledgeGraph() {
    console.log('🧠 Generating CCP Knowledge Graph...');
    console.log('='.repeat(60));

    try {
      // Load the extraction results
      const data = await this.loadExtractionResults();
      
      // Extract nodes and relationships
      await this.extractNodes(data);
      await this.extractRelationships(data);
      
      // Analyze interdependencies
      const analysis = await this.analyzeInterdependencies();
      
      // Generate different graph formats
      await this.generateGraphML();
      await this.generateCytoscape();
      await this.generateD3();
      await this.generateMermaid();
      
      // Generate analysis reports
      await this.generateAnalysisReport(analysis);
      await this.generateInteractiveHTML();
      
      console.log('\n🎉 Knowledge graph generation completed!');
      console.log(`📊 Generated ${this.nodes.size} nodes and ${this.edges.length} relationships`);
      
      return analysis;
      
    } catch (error) {
      console.error('❌ Error generating knowledge graph:', error);
      throw error;
    }
  }

  async loadExtractionResults() {
    console.log(`📖 Loading extraction results from: ${this.inputFile}`);
    
    const data = JSON.parse(await fs.readFile(this.inputFile, 'utf8'));
    
    if (!data.extracted_documents || !Array.isArray(data.extracted_documents)) {
      throw new Error('Invalid extraction results format');
    }
    
    console.log(`✅ Loaded ${data.extracted_documents.length} extracted documents`);
    return data;
  }

  async extractNodes(data) {
    console.log('\n🔍 Extracting nodes from CCP sections...');
    
    for (const doc of data.extracted_documents) {
      if (doc.file_info?.status !== 'success') continue;
      
      const ruleInfo = doc.rule_info || {};
      const analysis = doc.ccp_analysis || {};
      const content = doc.content || {};
      
      const sectionNumber = ruleInfo.ruleNumber || 'Unknown';
      const sectionTitle = ruleInfo.title || 'Unknown Title';
      
      // Determine category based on section number and content
      const category = this.categorizeSection(sectionNumber, sectionTitle, analysis);
      
      // Create node
      const node = {
        id: sectionNumber,
        label: `CCP ${sectionNumber}`,
        title: sectionTitle,
        category: category,
        type: 'ccp_section',
        properties: {
          wordCount: content.word_count || 0,
          pageCount: content.page_count || 0,
          proceduralRequirements: analysis.procedural_requirements?.length || 0,
          deadlinesAndTiming: analysis.deadlines_and_timing?.length || 0,
          crossReferences: analysis.cross_references?.length || 0,
          keyProvisions: analysis.key_provisions?.length || 0,
          filingRelevance: ruleInfo.filingRelevance?.score || 0,
          url: ruleInfo.url || '',
          source: ruleInfo.source || '',
          
          // Enhanced metadata properties
          ruleStatus: analysis.rule_status?.status || 'active',
          effectiveDate: analysis.rule_status?.effective_date || null,
          lastAmended: analysis.rule_status?.last_amended || null,
          proceduralCategory: analysis.relationship_analysis?.procedural_category || 'general',
          complexityLevel: analysis.relationship_analysis?.complexity_level || 'intermediate',
          filingQuestionsAnswered: this.countFilingQuestionsAnswered(analysis),
          enhancedCrossReferences: this.countEnhancedCrossReferences(analysis),
          courtApplicability: analysis.court_applicability?.applies_to?.join(', ') || 'superior_court',
          localVariationsAllowed: analysis.court_applicability?.local_variations_allowed || false
        },
        content: {
          proceduralRequirements: analysis.procedural_requirements || [],
          deadlinesAndTiming: analysis.deadlines_and_timing || [],
          crossReferences: analysis.cross_references || [],
          keyProvisions: analysis.key_provisions || []
        }
      };
      
      this.nodes.set(sectionNumber, node);
      
      // Track categories
      if (!this.categories.has(category)) {
        this.categories.set(category, []);
      }
      this.categories.get(category).push(sectionNumber);
    }
    
    console.log(`✅ Extracted ${this.nodes.size} section nodes`);
    console.log(`📊 Categories: ${Array.from(this.categories.keys()).join(', ')}`);
  }

  categorizeSection(sectionNumber, title, analysis) {
    const num = parseFloat(sectionNumber.replace(/[a-z]/g, ''));
    const titleLower = title.toLowerCase();
    
    // ENHANCED: Specific motion types with granular categorization (but preserve broader categories)
    if (num >= 430 && num <= 430.41) return 'Demurrer (Motion to Dismiss)';
    if (num >= 435 && num <= 437 && !titleLower.includes('summary')) return 'Motion to Strike';
    if (num >= 437 && num <= 437.9 && titleLower.includes('summary')) return 'Summary Judgment Motion';
    if (num >= 425.10 && num <= 425.13) return 'Complaint Requirements';
    if (num >= 431.30 && num <= 431.40) return 'Answer Requirements';
    if (num >= 472 && num <= 472.9) return 'Pleading Amendments';
    if (num >= 426.10 && num <= 426.50) return 'Cross-Complaint Requirements';
    
    // EXPANDED: Broader range-based categorization to capture more sections
    if (num >= 36 && num <= 44) return 'Case Management';
    if (num >= 12 && num <= 35) return 'General Procedures';
    if (num >= 128 && num <= 130) return 'General Procedures';
    if (num >= 410 && num <= 418) return 'Jurisdiction & Service';
    if (num >= 392 && num <= 401) return 'Venue & Jurisdiction';
    if (num >= 420 && num <= 475) return 'Pleadings';
    if (num >= 583 && num <= 583.5) return 'Dismissal Procedures';
    if (num >= 664 && num <= 670) return 'Judgment Entry';
    if (num >= 683 && num <= 724) return 'Judgment Enforcement';
    if (num >= 901 && num <= 996) return 'Writs';
    if (num >= 1000 && num <= 1020) return 'Service & Notice';
    if (num >= 1032 && num <= 1038) return 'Costs & Fees';
    if (num >= 1085 && num <= 1097) return 'Mandates';
    
    // EXPANDED: Discovery categories with broader ranges
    if (num >= 2016 && num <= 2019) return 'Discovery Scope';
    if (num >= 2023 && num <= 2024.5) return 'Discovery Sanctions';
    if (num >= 2025 && num <= 2025.9) return 'Depositions';
    if (num >= 2030 && num <= 2030.9) return 'Interrogatories';
    if (num >= 2031 && num <= 2031.9) return 'Document Production';
    if (num >= 2032 && num <= 2032.9) return 'Physical Examinations';
    if (num >= 2033 && num <= 2033.9) return 'Requests for Admission';
    
    // Motion-specific content detection (for sections that don't fall in ranges)
    if (titleLower.includes('demurrer')) return 'Demurrer (Motion to Dismiss)';
    if (titleLower.includes('motion to strike')) return 'Motion to Strike';
    if (titleLower.includes('summary judgment')) return 'Summary Judgment Motion';
    if (titleLower.includes('meet and confer')) return 'Motion Practice';
    if (titleLower.includes('amendment') || titleLower.includes('amend')) return 'Pleading Amendments';
    if (titleLower.includes('cross-complaint') || titleLower.includes('cross complaint')) return 'Cross-Complaint Requirements';
    if (titleLower.includes('answer format') || titleLower.includes('answer requirements')) return 'Answer Requirements';
    if (titleLower.includes('complaint format') || titleLower.includes('complaint requirements')) return 'Complaint Requirements';
    
    // EXPANDED: Content-based categorization with more comprehensive detection
    if (titleLower.includes('filing') || titleLower.includes('service')) return 'Filing & Service';
    if (titleLower.includes('motion') || titleLower.includes('ex parte')) return 'Motion Practice';
    if (titleLower.includes('discovery')) return 'Discovery';
    if (titleLower.includes('judgment')) return 'Judgment Procedures';
    if (titleLower.includes('deadline') || titleLower.includes('time')) return 'Timing Rules';
    if (titleLower.includes('venue') || titleLower.includes('jurisdiction')) return 'Venue & Jurisdiction';
    if (titleLower.includes('cost') || titleLower.includes('fee')) return 'Costs & Fees';
    if (titleLower.includes('writ')) return 'Writs';
    if (titleLower.includes('mandate') || titleLower.includes('mandamus')) return 'Mandates';
    if (titleLower.includes('case management') || titleLower.includes('scheduling')) return 'Case Management';
    if (titleLower.includes('dismissal') || titleLower.includes('dismiss')) return 'Dismissal Procedures';
    if (titleLower.includes('enforcement') || titleLower.includes('execution')) return 'Judgment Enforcement';
    
    return 'General Procedures';
  }

  async extractRelationships(data) {
    console.log('\n🔗 Extracting relationships between sections...');
    
    const relationshipTypes = {
      'cross_reference': { weight: 3, label: 'References' },
      'procedural_dependency': { weight: 5, label: 'Procedural Dependency' },
      'timing_relationship': { weight: 4, label: 'Timing Relationship' },
      'motion_sequence': { weight: 6, label: 'Motion Sequence' },
      'document_requirement': { weight: 5, label: 'Required Document' },
      'alternative_motion': { weight: 3, label: 'Alternative Motion' },
      'meet_and_confer': { weight: 4, label: 'Meet and Confer Required' },
      'category_similarity': { weight: 2, label: 'Category Similarity' },
      'content_similarity': { weight: 1, label: 'Content Similarity' }
    };
    
    const nodes = Array.from(this.nodes.values());
    
    for (let i = 0; i < nodes.length; i++) {
      const sourceNode = nodes[i];
      
      // Extract cross-references
      for (const crossRef of sourceNode.content.crossReferences) {
        const targetNode = this.nodes.get(crossRef);
        if (targetNode && targetNode.id !== sourceNode.id) {
          this.addEdge(sourceNode.id, targetNode.id, 'cross_reference', {
            description: `Section ${sourceNode.id} references Section ${targetNode.id}`
          });
        }
      }
      
      // Check for procedural dependencies in content
      for (const requirement of sourceNode.content.proceduralRequirements) {
        const referencedSections = this.extractSectionReferences(requirement);
        for (const refSection of referencedSections) {
          const targetNode = this.nodes.get(refSection);
          if (targetNode && targetNode.id !== sourceNode.id) {
            this.addEdge(sourceNode.id, targetNode.id, 'procedural_dependency', {
              description: `Procedural dependency: "${requirement.substring(0, 100)}..."`
            });
          }
        }
      }
      
      // Check for timing relationships
      for (const timing of sourceNode.content.deadlinesAndTiming) {
        const referencedSections = this.extractSectionReferences(timing);
        for (const refSection of referencedSections) {
          const targetNode = this.nodes.get(refSection);
          if (targetNode && targetNode.id !== sourceNode.id) {
            this.addEdge(sourceNode.id, targetNode.id, 'timing_relationship', {
              description: `Timing relationship: "${timing.substring(0, 100)}..."`
            });
          }
        }
      }
      
      // Category-based relationships (only for closely related categories)
      for (let j = i + 1; j < nodes.length; j++) {
        const targetNode = nodes[j];
        
        if (sourceNode.category === targetNode.category) {
          this.addEdge(sourceNode.id, targetNode.id, 'category_similarity', {
            description: `Both sections belong to category: ${sourceNode.category}`
          });
        }
      }
    }
    
    // ENHANCED: Add motion-specific relationships
    await this.addMotionSpecificRelationships(nodes);
    
    console.log(`✅ Extracted ${this.edges.length} relationships`);
    
    // Log relationship type distribution
    const typeCount = {};
    this.edges.forEach(edge => {
      typeCount[edge.type] = (typeCount[edge.type] || 0) + 1;
    });
    
    console.log('📊 Relationship types:');
    Object.entries(typeCount).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} relationships`);
    });
  }

  addEdge(source, target, type, properties = {}) {
    // Avoid duplicate edges
    const existingEdge = this.edges.find(e => 
      e.source === source && e.target === target && e.type === type
    );
    
    if (!existingEdge) {
      this.edges.push({
        source,
        target,
        type,
        weight: this.getRelationshipWeight(type),
        label: this.getRelationshipLabel(type),
        ...properties
      });
    }
  }

  getRelationshipWeight(type) {
    const weights = {
      'cross_reference': 3,
      'procedural_dependency': 5,
      'timing_relationship': 4,
      'motion_sequence': 6,
      'document_requirement': 5,
      'alternative_motion': 3,
      'meet_and_confer': 4,
      'category_similarity': 2,
      'content_similarity': 1,
      'timing_requirement': 6,
      'procedural_foundation': 7,
      'evidence_requirement': 6,
      'mandatory_document': 8,
      'scheduling_coordination': 6,
      'related_procedure': 7,
      'optional_document': 4,
      'format_requirement': 4
    };
    return weights[type] || 1;
  }

  getRelationshipLabel(type) {
    const labels = {
      'cross_reference': 'References',
      'procedural_dependency': 'Depends On',
      'timing_relationship': 'Timing Relation',
      'motion_sequence': 'Motion Sequence',
      'document_requirement': 'Required Document',
      'alternative_motion': 'Alternative Motion',
      'meet_and_confer': 'Meet and Confer Required',
      'category_similarity': 'Similar Category',
      'content_similarity': 'Similar Content',
      'timing_requirement': 'Timing Requirement',
      'procedural_foundation': 'Procedural Foundation',
      'evidence_requirement': 'Evidence Required',
      'mandatory_document': 'Mandatory Document',
      'scheduling_coordination': 'Schedule Coordination',
      'related_procedure': 'Related Procedure',
      'optional_document': 'Optional Document',
      'format_requirement': 'Format Requirement'
    };
    return labels[type] || type;
  }

  extractSectionReferences(text) {
    const references = [];
    const patterns = [
      /(?:Section|Rule|CCP)\s+(\d+(?:\.\d+)?[a-z]?)/gi,
      /(\d+(?:\.\d+)?[a-z]?)\s*(?:of\s+(?:this\s+)?(?:Code|Chapter|Title))/gi,
      /Code\s+of\s+Civil\s+Procedure\s+[Ss]ection\s+(\d+(?:\.\d+)?[a-z]?)/gi
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const sectionNum = match[1];
        if (this.nodes.has(sectionNum)) {
          references.push(sectionNum);
        }
      }
    });
    
    return [...new Set(references)]; // Remove duplicates
  }

  async addMotionSpecificRelationships(nodes) {
    console.log('🎯 Adding motion-specific relationships...');
    
    // 1. Demurrer + Motion to Strike (often filed together)
    const demurrers = nodes.filter(n => n.category === 'Demurrer (Motion to Dismiss)');
    const motionsToStrike = nodes.filter(n => n.category === 'Motion to Strike');
    
    demurrers.forEach(demurrer => {
      motionsToStrike.forEach(strike => {
        this.addEdge(demurrer.id, strike.id, 'alternative_motion', {
          description: 'Demurrer and Motion to Strike are often filed together as alternative challenges'
        });
      });
    });
    
    // 2. Motion sequences: Demurrer → Amendment → Answer
    const pleadingAmendments = nodes.filter(n => n.category === 'Pleading Amendments');
    const answerRequirements = nodes.filter(n => n.category === 'Answer Requirements');
    
    demurrers.forEach(demurrer => {
      pleadingAmendments.forEach(amendment => {
        this.addEdge(demurrer.id, amendment.id, 'motion_sequence', {
          description: 'If demurrer is sustained with leave to amend, pleading amendment follows'
        });
      });
    });
    
    pleadingAmendments.forEach(amendment => {
      answerRequirements.forEach(answer => {
        this.addEdge(amendment.id, answer.id, 'motion_sequence', {
          description: 'After amendment, defendant must file answer or further motion'
        });
      });
    });
    
    // 3. Summary Judgment → Comprehensive relationships (CCP 437c)
    const summaryJudgment = nodes.filter(n => n.category === 'Summary Judgment Motion');
    const discoveryRules = nodes.filter(n => 
      n.category.includes('Discovery') || 
      n.category === 'Depositions' ||
      n.category === 'Interrogatories' ||
      n.category === 'Document Production'
    );
    
    summaryJudgment.forEach(sj => {
      // Discovery timing requirements
      discoveryRules.forEach(disc => {
        this.addEdge(disc.id, sj.id, 'timing_relationship', {
          description: 'Discovery must be substantially completed before summary judgment motion'
        });
      });
      
      // Enhanced CCP 437c specific relationships
      if (sj.id === '437c') {
        // Timing requirements - 81-day notice period
        const serviceRules = nodes.filter(n => 
          n.id === '1010' || n.id === '1013' || n.id === '1011' || n.id === '1012'
        );
        serviceRules.forEach(service => {
          this.addEdge(service.id, sj.id, 'timing_requirement', {
            description: 'Service method affects 81-day notice period calculation for summary judgment',
            weight: 6
          });
        });
        
        // Motion practice foundation
        const motionPracticeFoundation = nodes.filter(n => 
          n.id === '1005' || n.id === '1003'
        );
        motionPracticeFoundation.forEach(foundation => {
          this.addEdge(foundation.id, sj.id, 'procedural_foundation', {
            description: 'Fundamental motion practice rules apply to summary judgment',
            weight: 7
          });
        });
        
        // Evidence and authentication requirements
        const evidenceRules = nodes.filter(n => 
          n.id.includes('2016') || // Authentication
          n.title.toLowerCase().includes('evidence') ||
          n.title.toLowerCase().includes('declaration') ||
          n.title.toLowerCase().includes('affidavit')
        );
        evidenceRules.forEach(evidence => {
          this.addEdge(evidence.id, sj.id, 'evidence_requirement', {
            description: 'Evidence must be properly authenticated for summary judgment motion',
            weight: 6
          });
        });
        
        // Separate statement requirement (mandatory)
        const separateStatementRules = nodes.filter(n => 
          n.title.toLowerCase().includes('separate statement') ||
          (n.content && n.content.proceduralRequirements && n.content.proceduralRequirements.some(req => 
            req.toLowerCase().includes('separate statement')
          ))
        );
        separateStatementRules.forEach(statement => {
          this.addEdge(statement.id, sj.id, 'mandatory_document', {
            description: 'Separate statement is mandatory for summary judgment motion',
            weight: 8
          });
        });
        
        // Opposition and reply timing
        const oppositionRules = nodes.filter(n => 
          (n.content && n.content.deadlinesAndTiming && n.content.deadlinesAndTiming.some(timing => 
            timing.includes('20 days') || timing.includes('opposition')
          )) ||
          (n.content && n.content.proceduralRequirements && n.content.proceduralRequirements.some(req => 
            req.toLowerCase().includes('opposition') || req.toLowerCase().includes('reply')
          ))
        );
        oppositionRules.forEach(opp => {
          this.addEdge(opp.id, sj.id, 'timing_requirement', {
            description: 'Opposition and reply timing rules apply to summary judgment',
            weight: 5
          });
        });
        
        // Trial timing coordination (must be heard 30 days before trial)
        const trialRules = nodes.filter(n => 
          n.title.toLowerCase().includes('trial') ||
          (n.content && n.content.deadlinesAndTiming && n.content.deadlinesAndTiming.some(timing => 
            timing.includes('trial') || timing.includes('30 days')
          ))
        );
        trialRules.forEach(trial => {
          this.addEdge(sj.id, trial.id, 'scheduling_coordination', {
            description: 'Summary judgment must be heard at least 30 days before trial',
            weight: 6
          });
        });
        
        // Related to summary adjudication (CCP 437)
        const summaryAdjudication = nodes.filter(n => n.id === '437');
        summaryAdjudication.forEach(adj => {
          this.addEdge(sj.id, adj.id, 'related_procedure', {
            description: 'Summary judgment and summary adjudication are related procedures',
            weight: 7
          });
        });
        
        // Judicial notice connections
        const judicialNoticeRules = nodes.filter(n => 
          n.title.toLowerCase().includes('judicial notice') ||
          (n.content && n.content.proceduralRequirements && n.content.proceduralRequirements.some(req => 
            req.toLowerCase().includes('judicial notice')
          ))
        );
        judicialNoticeRules.forEach(notice => {
          this.addEdge(notice.id, sj.id, 'optional_document', {
            description: 'Request for judicial notice may be filed with summary judgment motion',
            weight: 4
          });
        });
        
        // Page limit and formatting requirements
        const formattingRules = nodes.filter(n => 
          (n.content && n.content.formatSpecifications && n.content.formatSpecifications.length > 0) ||
          n.title.toLowerCase().includes('format') ||
          n.title.toLowerCase().includes('page')
        );
        formattingRules.forEach(format => {
          this.addEdge(format.id, sj.id, 'format_requirement', {
            description: 'Formatting and page limit requirements apply to summary judgment papers',
            weight: 4
          });
        });
      }
    });
    
    // 4. Meet and confer requirements
    const allNodes = Array.from(this.nodes.values());
    const meetConferSections = allNodes.filter(n => 
      (n.content && n.content.proceduralRequirements && n.content.proceduralRequirements.some(req => 
        req.toLowerCase().includes('meet and confer') ||
        req.toLowerCase().includes('good faith')
      )) ||
      n.title.toLowerCase().includes('meet and confer')
    );
    
    meetConferSections.forEach(mc => {
      // Connect meet and confer to demurrers
      demurrers.forEach(demurrer => {
        if (demurrer.id !== mc.id) {
          this.addEdge(mc.id, demurrer.id, 'meet_and_confer', {
            description: 'Meet and confer required before filing demurrer'
          });
        }
      });
      
      // Connect meet and confer to motions to strike
      motionsToStrike.forEach(strike => {
        if (strike.id !== mc.id) {
          this.addEdge(mc.id, strike.id, 'meet_and_confer', {
            description: 'Meet and confer required before filing motion to strike'
          });
        }
      });
    });
    
    // 5. Document filing requirements
    const serviceNoticeRules = nodes.filter(n => n.category === 'Service & Notice');
    const motionPracticeRules = nodes.filter(n => n.category === 'Motion Practice');
    
    serviceNoticeRules.forEach(service => {
      motionPracticeRules.forEach(motion => {
        this.addEdge(service.id, motion.id, 'document_requirement', {
          description: 'Proper service and notice required for all motions'
        });
      });
      
      // Connect to specific motion types
      [...demurrers, ...motionsToStrike, ...summaryJudgment].forEach(specificMotion => {
        this.addEdge(service.id, specificMotion.id, 'document_requirement', {
          description: 'Service and notice requirements apply to this motion type'
        });
      });
    });
    
    // 6. Complaint → Response sequence
    const complaintRequirements = nodes.filter(n => n.category === 'Complaint Requirements');
    
    complaintRequirements.forEach(complaint => {
      // Complaint can be challenged by demurrer
      demurrers.forEach(demurrer => {
        this.addEdge(complaint.id, demurrer.id, 'motion_sequence', {
          description: 'Demurrer challenges the legal sufficiency of the complaint'
        });
      });
      
      // Complaint can be challenged by motion to strike
      motionsToStrike.forEach(strike => {
        this.addEdge(complaint.id, strike.id, 'motion_sequence', {
          description: 'Motion to strike challenges improper matter in complaint'
        });
      });
      
      // Or answered directly
      answerRequirements.forEach(answer => {
        this.addEdge(complaint.id, answer.id, 'motion_sequence', {
          description: 'Defendant may answer complaint directly instead of filing motion'
        });
      });
    });
    
    console.log(`✅ Added motion-specific relationships`);
  }

  async analyzeInterdependencies() {
    console.log('\n📊 Analyzing interdependencies...');
    
    const analysis = {
      totalNodes: this.nodes.size,
      totalEdges: this.edges.length,
      categories: {},
      centralNodes: [],
      clusters: [],
      networkMetrics: {}
    };
    
    // Category analysis
    for (const [category, sections] of this.categories) {
      const categoryEdges = this.edges.filter(edge => 
        this.nodes.get(edge.source)?.category === category ||
        this.nodes.get(edge.target)?.category === category
      );
      
      analysis.categories[category] = {
        nodeCount: sections.length,
        internalEdges: categoryEdges.filter(edge => 
          this.nodes.get(edge.source)?.category === category &&
          this.nodes.get(edge.target)?.category === category
        ).length,
        externalEdges: categoryEdges.filter(edge => 
          this.nodes.get(edge.source)?.category !== this.nodes.get(edge.target)?.category
        ).length,
        sections: sections
      };
    }
    
    // Calculate centrality (degree centrality)
    const nodeDegrees = new Map();
    this.edges.forEach(edge => {
      nodeDegrees.set(edge.source, (nodeDegrees.get(edge.source) || 0) + 1);
      nodeDegrees.set(edge.target, (nodeDegrees.get(edge.target) || 0) + 1);
    });
    
    // Find most central nodes
    analysis.centralNodes = Array.from(nodeDegrees.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([nodeId, degree]) => ({
        section: nodeId,
        degree,
        title: this.nodes.get(nodeId)?.title || 'Unknown',
        category: this.nodes.get(nodeId)?.category || 'Unknown'
      }));
    
    // Network density
    const maxPossibleEdges = (this.nodes.size * (this.nodes.size - 1)) / 2;
    analysis.networkMetrics.density = this.edges.length / maxPossibleEdges;
    analysis.networkMetrics.averageDegree = (this.edges.length * 2) / this.nodes.size;
    
    console.log(`✅ Analysis completed`);
    console.log(`📊 Network density: ${(analysis.networkMetrics.density * 100).toFixed(2)}%`);
    console.log(`📊 Average degree: ${analysis.networkMetrics.averageDegree.toFixed(2)}`);
    
    return analysis;
  }

  async generateGraphML() {
    console.log('\n💾 Generating GraphML format...');
    
    let graphml = `<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://graphml.graphdrawing.org/xmlns
         http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd">
  
  <!-- Node attributes -->
  <key id="label" for="node" attr.name="label" attr.type="string"/>
  <key id="title" for="node" attr.name="title" attr.type="string"/>
  <key id="category" for="node" attr.name="category" attr.type="string"/>
  <key id="wordCount" for="node" attr.name="wordCount" attr.type="int"/>
  <key id="filingRelevance" for="node" attr.name="filingRelevance" attr.type="double"/>
  
  <!-- Edge attributes -->
  <key id="type" for="edge" attr.name="type" attr.type="string"/>
  <key id="weight" for="edge" attr.name="weight" attr.type="double"/>
  <key id="description" for="edge" attr.name="description" attr.type="string"/>
  
  <graph id="CCP_Knowledge_Graph" edgedefault="undirected">
`;
    
    // Add nodes
    for (const node of this.nodes.values()) {
      graphml += `    <node id="${node.id}">
      <data key="label">${this.escapeXML(node.label)}</data>
      <data key="title">${this.escapeXML(node.title)}</data>
      <data key="category">${this.escapeXML(node.category)}</data>
      <data key="wordCount">${node.properties.wordCount}</data>
      <data key="filingRelevance">${node.properties.filingRelevance}</data>
    </node>
`;
    }
    
    // Add edges
    for (let i = 0; i < this.edges.length; i++) {
      const edge = this.edges[i];
      graphml += `    <edge id="e${i}" source="${edge.source}" target="${edge.target}">
      <data key="type">${edge.type}</data>
      <data key="weight">${edge.weight}</data>
      <data key="description">${this.escapeXML(edge.description || '')}</data>
    </edge>
`;
    }
    
    graphml += `  </graph>
</graphml>`;
    
    await fs.writeFile(path.join(this.outputDir, 'ccp_knowledge_graph.graphml'), graphml);
    console.log('✅ GraphML file generated');
  }

  async generateCytoscape() {
    console.log('\n💾 Generating Cytoscape.js format...');
    
    const cytoscapeData = {
      nodes: Array.from(this.nodes.values()).map(node => ({
        data: {
          id: node.id,
          label: node.label,
          title: node.title,
          category: node.category,
          wordCount: node.properties.wordCount,
          filingRelevance: node.properties.filingRelevance,
          proceduralRequirements: node.properties.proceduralRequirements,
          crossReferences: node.properties.crossReferences
        }
      })),
      edges: this.edges.map((edge, index) => ({
        data: {
          id: `e${index}`,
          source: edge.source,
          target: edge.target,
          type: edge.type,
          weight: edge.weight,
          label: edge.label,
          description: edge.description || ''
        }
      }))
    };
    
    await fs.writeFile(
      path.join(this.outputDir, 'ccp_knowledge_graph_cytoscape.json'),
      JSON.stringify(cytoscapeData, null, 2)
    );
    console.log('✅ Cytoscape.js file generated');
  }

  async generateD3() {
    console.log('\n💾 Generating D3.js format...');
    
    const d3Data = {
      nodes: Array.from(this.nodes.values()).map(node => ({
        id: node.id,
        label: node.label,
        title: node.title,
        category: node.category,
        group: this.getCategoryIndex(node.category),
        size: Math.max(5, node.properties.wordCount / 100),
        filingRelevance: node.properties.filingRelevance,
        properties: node.properties
      })),
      links: this.edges.map(edge => ({
        source: edge.source,
        target: edge.target,
        type: edge.type,
        weight: edge.weight,
        label: edge.label,
        description: edge.description || ''
      }))
    };
    
    await fs.writeFile(
      path.join(this.outputDir, 'ccp_knowledge_graph_d3.json'),
      JSON.stringify(d3Data, null, 2)
    );
    console.log('✅ D3.js file generated');
  }

  async generateMermaid() {
    console.log('\n💾 Generating Mermaid diagram...');
    
    let mermaid = 'graph TD\n';
    
    // Add nodes with categories as colors
    const categoryColors = {
      'Jurisdiction & Service': 'fill:#ff9999',
      'Pleadings': 'fill:#99ff99',
      'Summary Judgment': 'fill:#9999ff',
      'Service & Notice': 'fill:#ffff99',
      'Discovery': 'fill:#ff99ff',
      'Motion Practice': 'fill:#99ffff',
      'Case Management': 'fill:#ffcc99',
      'Judgment Procedures': 'fill:#ccff99'
    };
    
    // Add key relationships only (to avoid cluttered diagram)
    const importantEdges = this.edges
      .filter(edge => edge.type === 'cross_reference' || edge.type === 'procedural_dependency')
      .slice(0, 50); // Limit for readability
    
    for (const edge of importantEdges) {
      const sourceLabel = edge.source.replace(/\./g, '_');
      const targetLabel = edge.target.replace(/\./g, '_');
      mermaid += `    ${sourceLabel}["CCP ${edge.source}"] --> ${targetLabel}["CCP ${edge.target}"]\n`;
    }
    
    // Add styling
    mermaid += '\n';
    for (const [category, color] of Object.entries(categoryColors)) {
      const sections = this.categories.get(category) || [];
      for (const section of sections.slice(0, 10)) { // Limit for performance
        const sectionLabel = section.replace(/\./g, '_');
        mermaid += `    classDef ${category.replace(/\s+/g, '')} ${color}\n`;
        mermaid += `    class ${sectionLabel} ${category.replace(/\s+/g, '')}\n`;
      }
    }
    
    await fs.writeFile(path.join(this.outputDir, 'ccp_knowledge_graph.mermaid'), mermaid);
    console.log('✅ Mermaid diagram generated');
  }

  getCategoryIndex(category) {
    const categories = Array.from(this.categories.keys());
    return categories.indexOf(category) + 1;
  }

  escapeXML(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  countFilingQuestionsAnswered(analysis) {
    if (!analysis.filing_question_analysis) return 0;
    
    let count = 0;
    const questions = analysis.filing_question_analysis;
    
    if (questions.when_timing?.answers_question) count++;
    if (questions.how_procedure?.answers_question) count++;
    if (questions.what_documents?.answers_question) count++;
    if (questions.where_venue?.answers_question) count++;
    if (questions.who_capacity?.answers_question) count++;
    if (questions.format_requirements?.answers_question) count++;
    
    return count;
  }

  countEnhancedCrossReferences(analysis) {
    if (!analysis.enhanced_cross_references) return 0;
    
    const refs = analysis.enhanced_cross_references;
    return (refs.ccp_sections?.length || 0) +
           (refs.crc_rules?.length || 0) +
           (refs.evidence_code?.length || 0) +
           (refs.local_rules?.length || 0) +
           (refs.federal_rules?.length || 0);
  }

  async generateAnalysisReport(analysis) {
    console.log('\n📋 Generating analysis report...');
    
    let report = `# CCP Knowledge Graph Analysis Report
Generated: ${new Date().toISOString()}

## Network Overview
- **Total Sections**: ${analysis.totalNodes}
- **Total Relationships**: ${analysis.totalEdges}
- **Network Density**: ${(analysis.networkMetrics.density * 100).toFixed(2)}%
- **Average Connections per Section**: ${analysis.networkMetrics.averageDegree.toFixed(2)}

## Most Connected Sections (Central Nodes)
`;

    analysis.centralNodes.forEach((node, index) => {
      report += `${index + 1}. **CCP ${node.section}** (${node.degree} connections)
   - Title: ${node.title}
   - Category: ${node.category}

`;
    });

    report += `## Category Analysis
`;

    for (const [category, data] of Object.entries(analysis.categories)) {
      const connectivity = data.internalEdges + data.externalEdges;
      const internalRatio = data.internalEdges / (connectivity || 1) * 100;
      
      report += `### ${category}
- **Sections**: ${data.nodeCount}
- **Internal Connections**: ${data.internalEdges}
- **External Connections**: ${data.externalEdges}
- **Internal Connectivity**: ${internalRatio.toFixed(1)}%
- **Key Sections**: ${data.sections.slice(0, 5).join(', ')}${data.sections.length > 5 ? '...' : ''}

`;
    }

    report += `## Key Insights

### Highly Interconnected Areas
The sections with the most connections likely represent core procedural requirements that other rules depend on.

### Category Cohesion
Categories with high internal connectivity suggest well-defined procedural areas, while those with high external connectivity indicate cross-cutting requirements.

### Network Structure
- **Dense areas** indicate tightly coupled procedural requirements
- **Bridge sections** connect different procedural areas
- **Isolated sections** may represent specialized or standalone procedures

## Files Generated
- \`ccp_knowledge_graph.graphml\` - For Gephi, yEd, or other graph analysis tools
- \`ccp_knowledge_graph_cytoscape.json\` - For Cytoscape.js web visualization
- \`ccp_knowledge_graph_d3.json\` - For D3.js custom visualizations
- \`ccp_knowledge_graph.mermaid\` - For Mermaid diagram rendering
- \`ccp_knowledge_graph.html\` - Interactive web visualization
`;

    await fs.writeFile(path.join(this.outputDir, 'analysis_report.md'), report);
    console.log('✅ Analysis report generated');
  }

  async generateInteractiveHTML() {
    console.log('\n🌐 Generating interactive HTML visualization...');
    
    // Read the cytoscape data that was just generated
    const cytoscapeDataPath = path.join(this.outputDir, 'ccp_knowledge_graph_cytoscape.json');
    const cytoscapeData = JSON.parse(await fs.readFile(cytoscapeDataPath, 'utf8'));
    
    const html = `<!DOCTYPE html>
<html>
<head>
    <title>CCP Knowledge Graph</title>
    <script src="https://unpkg.com/cytoscape@3.21.0/dist/cytoscape.min.js"></script>
    <script src="https://unpkg.com/cytoscape-cose-bilkent@4.1.0/cytoscape-cose-bilkent.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        #cy { width: 100%; height: 600px; border: 1px solid #ccc; }
        .controls { margin: 20px 0; }
        .info-panel { margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 5px; }
        .category-legend { display: flex; flex-wrap: wrap; gap: 10px; margin: 10px 0; }
        .category-item { padding: 5px 10px; border-radius: 3px; font-size: 12px; }
    </style>
</head>
<body>
    <h1>CCP Knowledge Graph - Rule Interdependencies</h1>
    
    <div class="controls">
        <label>Layout: 
            <select id="layout-select">
                <option value="cose-bilkent">Force-directed (recommended)</option>
                <option value="circle">Circle</option>
                <option value="grid">Grid</option>
                <option value="breadthfirst">Hierarchical</option>
            </select>
        </label>
        <label style="margin-left: 20px;">Filter by category: 
            <select id="category-filter">
                <option value="">All categories</option>
            </select>
        </label>
        <button onclick="resetView()" style="margin-left: 20px;">Reset View</button>
    </div>
    
    <div class="category-legend" id="legend"></div>
    
    <div id="cy"></div>
    
    <div class="info-panel">
        <h3>Instructions:</h3>
        <ul>
            <li><strong>Click</strong> on a node to see section details</li>
            <li><strong>Hover</strong> over edges to see relationship types</li>
            <li><strong>Drag</strong> to pan, <strong>scroll</strong> to zoom</li>
            <li><strong>Filter</strong> by category to focus on specific areas</li>
        </ul>
        <div id="node-info"></div>
    </div>

    <script>
        // Embedded graph data (avoids CORS issues when opening locally)
        const graphData = ${JSON.stringify(cytoscapeData, null, 8)};
        
        // Initialize the graph with embedded data
        let cy;
        let originalData;
        
        // Start initialization when page loads
        document.addEventListener('DOMContentLoaded', function() {
            initializeGraph(graphData);
        });

        function initializeGraph(data) {
            originalData = data;
            
            // Set up category colors
            const categories = [...new Set(data.nodes.map(n => n.data.category))];
            const colors = ['#ff9999', '#99ff99', '#9999ff', '#ffff99', '#ff99ff', '#99ffff', '#ffcc99', '#ccff99', '#ff6666', '#66ff66'];
            
            // Populate category filter
            const categoryFilter = document.getElementById('category-filter');
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categoryFilter.appendChild(option);
            });
            
            // Create legend
            const legend = document.getElementById('legend');
            categories.forEach((category, index) => {
                const item = document.createElement('div');
                item.className = 'category-item';
                item.style.backgroundColor = colors[index % colors.length];
                item.textContent = category;
                legend.appendChild(item);
            });

            cy = cytoscape({
                container: document.getElementById('cy'),
                elements: data,
                style: [
                    {
                        selector: 'node',
                        style: {
                            'background-color': function(ele) {
                                const categoryIndex = categories.indexOf(ele.data('category'));
                                return colors[categoryIndex % colors.length];
                            },
                            'label': 'data(id)',
                            'width': function(ele) { return Math.max(20, ele.data('wordCount') / 50); },
                            'height': function(ele) { return Math.max(20, ele.data('wordCount') / 50); },
                            'font-size': '10px',
                            'text-valign': 'center',
                            'text-halign': 'center'
                        }
                    },
                    {
                        selector: 'edge',
                        style: {
                            'width': 'data(weight)',
                            'line-color': function(ele) {
                                const type = ele.data('type');
                                if (type === 'cross_reference') return '#666';
                                if (type === 'procedural_dependency') return '#ff6b6b';
                                if (type === 'timing_relationship') return '#4ecdc4';
                                if (type === 'motion_sequence') return '#e74c3c';
                                if (type === 'document_requirement') return '#9b59b6';
                                if (type === 'alternative_motion') return '#f39c12';
                                if (type === 'meet_and_confer') return '#2ecc71';
                                return '#ccc';
                            },
                            'target-arrow-color': '#666',
                            'target-arrow-shape': 'triangle',
                            'curve-style': 'bezier'
                        }
                    }
                ],
                layout: {
                    name: 'cose-bilkent',
                    animate: true,
                    animationDuration: 1000
                }
            });

            // Event handlers
            cy.on('tap', 'node', function(evt) {
                const node = evt.target;
                const info = document.getElementById('node-info');
                info.innerHTML = \`
                    <h4>CCP Section \${node.data('id')}</h4>
                    <p><strong>Title:</strong> \${node.data('title')}</p>
                    <p><strong>Category:</strong> \${node.data('category')}</p>
                    <p><strong>Word Count:</strong> \${node.data('wordCount')}</p>
                    <p><strong>Filing Relevance:</strong> \${node.data('filingRelevance')}</p>
                    <p><strong>Procedural Requirements:</strong> \${node.data('proceduralRequirements')}</p>
                    <p><strong>Cross References:</strong> \${node.data('crossReferences')}</p>
                \`;
            });

            // Layout change handler
            document.getElementById('layout-select').addEventListener('change', function(e) {
                cy.layout({name: e.target.value, animate: true}).run();
            });

            // Category filter handler
            document.getElementById('category-filter').addEventListener('change', function(e) {
                const selectedCategory = e.target.value;
                if (selectedCategory) {
                    const filteredNodes = originalData.nodes.filter(n => n.data.category === selectedCategory);
                    const nodeIds = new Set(filteredNodes.map(n => n.data.id));
                    const filteredEdges = originalData.edges.filter(e => 
                        nodeIds.has(e.data.source) && nodeIds.has(e.data.target)
                    );
                    cy.elements().remove();
                    cy.add([...filteredNodes, ...filteredEdges]);
                } else {
                    cy.elements().remove();
                    cy.add(originalData);
                }
                cy.layout({name: 'cose-bilkent', animate: true}).run();
            });
        }

        function resetView() {
            if (cy) {
                cy.fit();
                cy.center();
            }
        }
    </script>
</body>
</html>`;

    await fs.writeFile(path.join(this.outputDir, 'ccp_knowledge_graph.html'), html);
    console.log('✅ Interactive HTML visualization generated (with embedded data)');
    
    // Also create a fetch-based version for server environments
    const fetchHtml = html.replace(
      /const graphData = .*?;[\s\S]*?document\.addEventListener\('DOMContentLoaded', function\(\) \{\s*initializeGraph\(graphData\);\s*\}\);/,
      `// Load the graph data from JSON file (requires local server)
        fetch('./ccp_knowledge_graph_cytoscape.json')
            .then(response => response.json())
            .then(data => initializeGraph(data))
            .catch(error => {
                console.error('Error loading graph data:', error);
                document.getElementById('cy').innerHTML = '<p>Error loading graph data. Start a local server (e.g., python -m http.server) and make sure ccp_knowledge_graph_cytoscape.json is accessible.</p>';
            });`
    );
    
    await fs.writeFile(path.join(this.outputDir, 'ccp_knowledge_graph_server.html'), fetchHtml);
    console.log('✅ Server-based HTML visualization also generated');
    
    // Create a simple Python server starter script
    const serverScript = `#!/usr/bin/env python3
"""
Simple HTTP server for CCP Knowledge Graph visualization
Run this script to serve the knowledge graph locally and avoid CORS issues.
"""
import http.server
import socketserver
import webbrowser
import os

PORT = 8000
directory = os.path.dirname(os.path.abspath(__file__))

os.chdir(directory)

Handler = http.server.SimpleHTTPRequestHandler
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"🌐 Serving CCP Knowledge Graph at http://localhost:{PORT}")
    print(f"📁 Directory: {directory}")
    print(f"🔗 Open: http://localhost:{PORT}/ccp_knowledge_graph_server.html")
    print("Press Ctrl+C to stop")
    
    # Automatically open browser
    webbrowser.open(f"http://localhost:{PORT}/ccp_knowledge_graph_server.html")
    
    httpd.serve_forever()
`;
    
    await fs.writeFile(path.join(this.outputDir, 'serve_graph.py'), serverScript);
    console.log('✅ Python server script generated');
  }
}

// Usage example
async function main() {
  const knowledgeGraph = new CCPKnowledgeGraph({
    inputFile: './ccp_results/ccp_filing_rules_extraction_results.json',
    outputDir: './ccp_knowledge_graph'
  });

  try {
    await knowledgeGraph.initialize();
    const analysis = await knowledgeGraph.generateKnowledgeGraph();
    
    console.log('\n🎉 Knowledge graph generation completed successfully!');
    console.log('\n📊 Quick Stats:');
    console.log(`   • ${analysis.totalNodes} CCP sections analyzed`);
    console.log(`   • ${analysis.totalEdges} relationships discovered`);
    console.log(`   • ${Object.keys(analysis.categories).length} categories identified`);
    console.log(`   • Top connected section: CCP ${analysis.centralNodes[0]?.section} (${analysis.centralNodes[0]?.degree} connections)`);
    
    console.log('\n📁 Generated files:');
    console.log('   • ccp_knowledge_graph.html - Interactive web visualization');
    console.log('   • ccp_knowledge_graph.graphml - For Gephi/yEd analysis');
    console.log('   • ccp_knowledge_graph_cytoscape.json - For web development');
    console.log('   • ccp_knowledge_graph_d3.json - For D3.js visualizations');
    console.log('   • analysis_report.md - Detailed analysis report');
    
  } catch (error) {
    console.error('❌ Knowledge graph generation failed:', error);
  }
}

// Export for use as module
module.exports = { CCPKnowledgeGraph };

// Run if executed directly
if (require.main === module) {
  main();
} 