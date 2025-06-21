const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

/**
 * Dependency Discovery Engine - Automatically discovers filing-related CCP rules
 * through relationship analysis and pattern matching with temporal awareness
 */
class DependencyDiscoveryEngine {
  constructor(options = {}) {
    this.confidenceThreshold = options.confidenceThreshold || 0.75;
    this.maxDiscoveryDepth = options.maxDiscoveryDepth || 3;
    this.knowledgeGraph = null;
    this.discoveredRules = new Map();
    this.temporalPatterns = new Map(); // Track temporal criticality patterns
    this.criticalityEvents = new Map(); // Track events that make rules critical
    
    this.relationshipWeights = {
      'cross_reference': 0.3,
      'procedural_dependency': 0.8,
      'timing_relationship': 0.7,
      'motion_sequence': 0.9,
      'document_requirement': 0.8,
      'filing_procedure': 0.9,
      'deadline_extension': 0.8,
      'service_method': 0.7,
      'format_requirement': 0.6,
      'venue_jurisdiction': 0.7,
      'content_pattern': 0.4,
      'category_similarity': 0.3,
      // Temporal relationship weights
      'temporal_emergence': 0.8,
      'emergency_relevance': 0.9,
      'technology_adoption': 0.7,
      'legal_evolution': 0.8
    };
    
    // Filing question patterns for automatic categorization
    this.filingQuestionPatterns = {
      'WHEN': [
        /(?:within|before|after|deadline|time limit|days|calendar|court days)/gi,
        /(?:filing deadline|service deadline|notice deadline|cutoff)/gi,
        /(?:time computation|extension|late filing|holiday)/gi
      ],
      'HOW': [
        /(?:procedure|method|process|steps|requirements|filing procedure)/gi,
        /(?:service procedure|electronic filing|mail service|personal service)/gi,
        /(?:meet and confer|notice requirements|application procedure)/gi
      ],
      'WHERE': [
        /(?:venue|jurisdiction|proper court|county|district|court location)/gi,
        /(?:filing location|transfer|forum|proper forum)/gi
      ],
      'WHAT': [
        /(?:shall contain|must contain|shall include|must include|required contents)/gi,
        /(?:separate statement|points and authorities|supporting declaration)/gi,
        /(?:notice of motion|memorandum|brief|attachment)/gi
      ],
      'WHO': [
        /(?:capacity|authority|standing|who may file|attorney|party)/gi,
        /(?:verification|sworn|under penalty of perjury)/gi
      ],
      'FORMAT': [
        /(?:format|formatting|caption|title|heading|font|margins)/gi,
        /(?:document format|pleading format|form|template|typed)/gi
      ]
    };
    
    // Initialize temporal criticality patterns
    this.initializeTemporalPatterns();
  }

  /**
   * Initialize known temporal patterns for when rules become critical
   */
  initializeTemporalPatterns() {
    // Known criticality events and their impacts
    this.criticalityEvents.set('COVID_emergency_rules', {
      dateRange: ['2020-03-01', '2023-12-31'],
      impact: 0.8,
      affectedPatterns: [
        /electronic.*filing/gi,
        /remote.*hearing/gi,
        /telephonic.*appearance/gi,
        /video.*conference/gi,
        /emergency.*procedures/gi
      ],
      description: 'COVID-19 emergency procedures and remote filing requirements'
    });
    
    this.criticalityEvents.set('mandatory_e_filing_expansion', {
      dateRange: ['2022-01-01', null], // Ongoing
      impact: 0.7,
      affectedPatterns: [
        /electronic.*service/gi,
        /electronic.*filing/gi,
        /e-filing/gi,
        /digital.*signature/gi,
        /online.*submission/gi
      ],
      description: 'Statewide expansion of mandatory electronic filing'
    });
    
    this.criticalityEvents.set('discovery_reform_2019', {
      dateRange: ['2020-01-01', null], // Ongoing
      impact: 0.6,
      affectedPatterns: [
        /discovery.*deadline/gi,
        /discovery.*cutoff/gi,
        /motion.*to.*compel/gi,
        /discovery.*sanctions/gi
      ],
      description: 'Discovery reform legislation changes'
    });
    
    this.criticalityEvents.set('summary_judgment_reform', {
      dateRange: ['2021-01-01', null], // Ongoing
      impact: 0.7,
      affectedPatterns: [
        /summary.*judgment/gi,
        /separate.*statement/gi,
        /undisputed.*fact/gi,
        /material.*fact/gi
      ],
      description: 'Summary judgment procedure reforms'
    });
    
    this.criticalityEvents.set('venue_changes_2018', {
      dateRange: ['2018-01-01', null], // Ongoing
      impact: 0.5,
      affectedPatterns: [
        /venue/gi,
        /proper.*court/gi,
        /jurisdiction/gi,
        /forum/gi
      ],
      description: 'Venue and jurisdiction rule changes'
    });
    
    // Future anticipated events (for prediction)
    this.criticalityEvents.set('ai_filing_integration', {
      dateRange: ['2025-01-01', null], // Future prediction
      impact: 0.8,
      affectedPatterns: [
        /automated.*filing/gi,
        /artificial.*intelligence/gi,
        /machine.*readable/gi,
        /structured.*data/gi
      ],
      description: 'Anticipated AI integration in court filing systems'
    });
  }

  /**
   * Analyzes temporal patterns to determine current and emerging criticality
   * @param {Object} doc - Document to analyze
   * @param {Date} analysisDate - Date of analysis (default: now)
   * @returns {Object} - Temporal analysis results
   */
  analyzeTemporalCriticality(doc, analysisDate = new Date()) {
    const ruleNumber = doc.rule_info?.ruleNumber;
    const title = doc.rule_info?.title || '';
    const content = doc.content?.text || '';
    const combinedText = `${title} ${content}`.toLowerCase();
    
    const temporalAnalysis = {
      ruleNumber,
      currentCriticality: 0,
      emergingCriticality: 0,
      criticalityTimeline: [],
      affectedEvents: [],
      futureProjections: []
    };
    
    // Analyze against each criticality event
    for (const [eventName, eventData] of this.criticalityEvents.entries()) {
      const startDate = new Date(eventData.dateRange[0]);
      const endDate = eventData.dateRange[1] ? new Date(eventData.dateRange[1]) : null;
      
      // Check if event is currently active
      const isCurrentlyActive = analysisDate >= startDate && (!endDate || analysisDate <= endDate);
      
      // Check if rule content matches event patterns
      const patternMatches = eventData.affectedPatterns.filter(pattern => 
        pattern.test(combinedText)
      ).length;
      
      if (patternMatches > 0) {
        const eventImpact = eventData.impact * (patternMatches / eventData.affectedPatterns.length);
        
        if (isCurrentlyActive) {
          temporalAnalysis.currentCriticality += eventImpact;
          temporalAnalysis.affectedEvents.push({
            event: eventName,
            impact: eventImpact,
            description: eventData.description,
            patternMatches
          });
        }
        
        // Add to timeline
        temporalAnalysis.criticalityTimeline.push({
          date: eventData.dateRange[0],
          reason: eventName,
          impact: eventImpact,
          description: eventData.description,
          status: isCurrentlyActive ? 'active' : 'historical'
        });
        
        // Future projections
        if (startDate > analysisDate) {
          temporalAnalysis.emergingCriticality += eventImpact;
          temporalAnalysis.futureProjections.push({
            expectedDate: eventData.dateRange[0],
            reason: eventName,
            projectedImpact: eventImpact,
            description: eventData.description
          });
        }
      }
    }
    
    // Cap criticality scores at 1.0
    temporalAnalysis.currentCriticality = Math.min(temporalAnalysis.currentCriticality, 1.0);
    temporalAnalysis.emergingCriticality = Math.min(temporalAnalysis.emergingCriticality, 1.0);
    
    return temporalAnalysis;
  }

  /**
   * Enhanced discovery with temporal awareness
   */
  async discoverRelatedRules(criticalSections, extractedData) {
    console.log('🔍 Starting temporal-aware dependency discovery analysis...');
    console.log(`📊 Analyzing ${extractedData.extracted_documents.length} documents for dependencies`);
    
    // Initialize discovery
    this.discoveredRules.clear();
    const seedRules = new Set(criticalSections.map(s => s.ruleNumber));
    
    // Phase 1: Direct relationship discovery
    await this.discoverDirectRelationships(seedRules, extractedData);
    
    // Phase 2: Content pattern analysis  
    await this.discoverByContentPatterns(seedRules, extractedData);
    
    // Phase 3: Procedural sequence analysis
    await this.discoverProceduralSequences(seedRules, extractedData);
    
    // Phase 4: Cross-reference network analysis
    await this.discoverCrossReferenceNetwork(seedRules, extractedData);
    
    // NEW Phase 5: Temporal criticality analysis
    await this.discoverByTemporalPatterns(seedRules, extractedData);
    
    // Generate final recommendations with temporal scoring
    const recommendations = this.generateTemporalRecommendations();
    
    console.log(`✅ Temporal discovery complete: ${recommendations.length} rules recommended`);
    return recommendations;
  }

  /**
   * Phase 1: Discover rules that have direct relationships with critical sections
   */
  async discoverDirectRelationships(seedRules, extractedData) {
    console.log('📈 Phase 1: Analyzing direct relationships...');
    
    for (const doc of extractedData.extracted_documents) {
      if (doc.file_info?.status !== 'success') continue;
      
      const ruleNumber = doc.rule_info?.ruleNumber;
      if (!ruleNumber || seedRules.has(ruleNumber)) continue;
      
      const analysis = doc.ccp_analysis || {};
      let confidence = 0;
      const reasons = [];
      
      // Check cross-references to critical sections
      const crossRefs = analysis.cross_references || [];
      const criticalRefs = crossRefs.filter(ref => 
        seedRules.has(ref.toString()) || seedRules.has(ref.replace(/[^\d.]/g, ''))
      );
      
      if (criticalRefs.length > 0) {
        confidence += 0.4 * Math.min(criticalRefs.length / 3, 1);
        reasons.push(`References ${criticalRefs.length} critical sections: ${criticalRefs.join(', ')}`);
      }
      
      // Check enhanced cross-references
      const enhancedRefs = analysis.enhanced_cross_references || {};
      if (enhancedRefs.ccp_sections) {
        const criticalEnhancedRefs = enhancedRefs.ccp_sections.filter(ref => 
          seedRules.has(ref.section) || seedRules.has(ref.section?.replace(/[^\d.]/g, ''))
        );
        
        if (criticalEnhancedRefs.length > 0) {
          confidence += 0.3 * Math.min(criticalEnhancedRefs.length / 2, 1);
          reasons.push(`Enhanced references to ${criticalEnhancedRefs.length} critical sections`);
        }
      }
      
      // Check relationship analysis
      const relationships = analysis.relationship_analysis || {};
      if (relationships.depends_on) {
        const criticalDeps = relationships.depends_on.filter(dep => seedRules.has(dep));
        if (criticalDeps.length > 0) {
          confidence += 0.5 * Math.min(criticalDeps.length / 2, 1);
          reasons.push(`Depends on critical sections: ${criticalDeps.join(', ')}`);
        }
      }
      
      if (confidence > 0.3) {
        this.addDiscoveredRule(ruleNumber, confidence, 'direct_relationship', reasons, doc);
      }
    }
  }

  /**
   * Phase 2: Discover rules based on content patterns matching filing questions
   */
  async discoverByContentPatterns(seedRules, extractedData) {
    console.log('🔍 Phase 2: Analyzing content patterns...');
    
    for (const doc of extractedData.extracted_documents) {
      if (doc.file_info?.status !== 'success') continue;
      
      const ruleNumber = doc.rule_info?.ruleNumber;
      if (!ruleNumber || seedRules.has(ruleNumber)) continue;
      
      const title = doc.rule_info?.title || '';
      const content = doc.content?.text || '';
      const analysis = doc.ccp_analysis || {};
      
      let confidence = 0;
      const reasons = [];
      const questionsAnswered = [];
      
      // Analyze content against filing question patterns
      Object.entries(this.filingQuestionPatterns).forEach(([question, patterns]) => {
        let questionScore = 0;
        
        patterns.forEach(pattern => {
          const titleMatches = (title.match(pattern) || []).length;
          const contentMatches = (content.match(pattern) || []).length;
       
          if (titleMatches > 0) questionScore += titleMatches * 0.1;
          if (contentMatches > 0) questionScore += Math.min(contentMatches * 0.02, 0.3);
        });
        
        if (questionScore > 0.1) {
          confidence += questionScore;
          questionsAnswered.push(question);
          reasons.push(`Answers ${question} question (score: ${questionScore.toFixed(2)})`);
        }
      });
      
      // Bonus for answering multiple filing questions
      if (questionsAnswered.length > 1) {
        confidence += 0.2 * (questionsAnswered.length - 1);
        reasons.push(`Answers ${questionsAnswered.length} filing questions: ${questionsAnswered.join(', ')}`);
      }
      
      // Check for key filing-related terms
      const filingTerms = [
        'filing', 'deadline', 'service', 'motion', 'procedure', 'court',
        'document', 'pleading', 'notice', 'hearing', 'time', 'method'
      ];
      
      const filingTermCount = filingTerms.filter(term => 
        title.toLowerCase().includes(term) || 
        content.toLowerCase().includes(term)
      ).length;
      
      if (filingTermCount >= 3) {
        confidence += 0.1 * Math.min(filingTermCount / 5, 1);
        reasons.push(`Contains ${filingTermCount} filing-related terms`);
      }
      
      if (confidence > 0.4) {
        this.addDiscoveredRule(ruleNumber, confidence, 'content_pattern', reasons, doc);
      }
    }
  }

  /**
   * Phase 3: Discover rules that are part of procedural sequences
   */
  async discoverProceduralSequences(seedRules, extractedData) {
    console.log('⚡ Phase 3: Analyzing procedural sequences...');
    
    // Define known procedural sequences
    const proceduralSequences = [
      {
        name: 'Motion Practice Sequence',
        pattern: [430, 435, 437, 1005, 1013, 1014], // Demurrer → Strike → Summary → Timing → Service → Proof
        weight: 0.8
      },
      {
        name: 'Service and Filing Sequence', 
        pattern: [1010, 1010.5, 1010.6, 1013, 1013.1, 1014], // Service methods → Electronic → Extensions → Proof
        weight: 0.7
      },
      {
        name: 'Pleading Sequence',
        pattern: [425, 426, 430, 431, 472], // Complaint → Cross-complaint → Demurrer → Answer → Amendment
        weight: 0.7
      },
      {
        name: 'Post-Trial Sequence',
        pattern: [659, 659.1, 663, 664], // New trial → JNOV → Judgment
        weight: 0.8
      },
      {
        name: 'Discovery Sequence',
        pattern: [2025, 2030, 2031, 2033], // Depositions → Interrogatories → Documents → Admissions
        weight: 0.6
      }
    ];
    
    for (const sequence of proceduralSequences) {
      const criticalInSequence = sequence.pattern.filter(num => {
        return Array.from(seedRules).some(seed => {
          const seedNum = parseFloat(seed.replace(/[a-z]/g, ''));
          const seqNum = parseFloat(num.toString().replace(/[a-z]/g, ''));
          return Math.abs(seedNum - seqNum) < 0.1;
        });
      });
      
      if (criticalInSequence.length > 0) {
        // Find other rules in this sequence that aren't critical yet
        for (const seqNum of sequence.pattern) {
          const matchingDocs = extractedData.extracted_documents.filter(doc => {
            const ruleNum = parseFloat(doc.rule_info?.ruleNumber?.replace(/[a-z]/g, '') || 0);
            return Math.abs(ruleNum - seqNum) < 0.1;
          });
          
          for (const doc of matchingDocs) {
            const ruleNumber = doc.rule_info?.ruleNumber;
            if (ruleNumber && !seedRules.has(ruleNumber)) {
              const confidence = sequence.weight * (criticalInSequence.length / sequence.pattern.length);
              const reasons = [
                `Part of ${sequence.name}`,
                `Sequence has ${criticalInSequence.length} critical sections`
              ];
              
              this.addDiscoveredRule(ruleNumber, confidence, 'procedural_sequence', reasons, doc);
            }
          }
        }
      }
    }
  }

  /**
   * Phase 4: Discover rules through cross-reference network analysis
   */
  async discoverCrossReferenceNetwork(seedRules, extractedData) {
    console.log('🕸️ Phase 4: Analyzing cross-reference networks...');
    
    // Build cross-reference network
    const network = new Map();
    
    for (const doc of extractedData.extracted_documents) {
      if (doc.file_info?.status !== 'success') continue;
      
      const ruleNumber = doc.rule_info?.ruleNumber;
      if (!ruleNumber) continue;
      
      const analysis = doc.ccp_analysis || {};
      const crossRefs = analysis.cross_references || [];
      
      if (!network.has(ruleNumber)) {
        network.set(ruleNumber, { outgoing: new Set(), incoming: new Set() });
      }
      
      crossRefs.forEach(ref => {
        const refStr = ref.toString();
        network.get(ruleNumber).outgoing.add(refStr);
        
        if (!network.has(refStr)) {
          network.set(refStr, { outgoing: new Set(), incoming: new Set() });
        }
        network.get(refStr).incoming.add(ruleNumber);
      });
    }
    
    // Analyze network centrality for non-critical rules
    for (const [ruleNumber, connections] of network.entries()) {
      if (seedRules.has(ruleNumber)) continue;
      
      let confidence = 0;
      const reasons = [];
      
      // Check incoming connections from critical sections
      const criticalIncoming = Array.from(connections.incoming).filter(rule => seedRules.has(rule));
      if (criticalIncoming.length > 0) {
        confidence += 0.3 * Math.min(criticalIncoming.length / 2, 1);
        reasons.push(`Referenced by ${criticalIncoming.length} critical sections`);
      }
      
      // Check outgoing connections to critical sections
      const criticalOutgoing = Array.from(connections.outgoing).filter(rule => seedRules.has(rule));
      if (criticalOutgoing.length > 0) {
        confidence += 0.4 * Math.min(criticalOutgoing.length / 3, 1);
        reasons.push(`References ${criticalOutgoing.length} critical sections`);
      }
      
      // Network centrality bonus (highly connected nodes)
      const totalConnections = connections.incoming.size + connections.outgoing.size;
      if (totalConnections > 5) {
        confidence += 0.2 * Math.min(totalConnections / 10, 1);
        reasons.push(`High network centrality (${totalConnections} connections)`);
      }
      
      if (confidence > 0.4) {
        // Find the document for this rule
        const doc = extractedData.extracted_documents.find(d => 
          d.rule_info?.ruleNumber === ruleNumber
        );
        
        if (doc) {
          this.addDiscoveredRule(ruleNumber, confidence, 'network_analysis', reasons, doc);
        }
      }
    }
  }

  /**
   * NEW Phase 5: Discover rules based on temporal criticality patterns
   */
  async discoverByTemporalPatterns(seedRules, extractedData) {
    console.log('⏰ Phase 5: Analyzing temporal criticality patterns...');
    
    const analysisDate = new Date();
    
    for (const doc of extractedData.extracted_documents) {
      if (doc.file_info?.status !== 'success') continue;
      
      const ruleNumber = doc.rule_info?.ruleNumber;
      if (!ruleNumber || seedRules.has(ruleNumber)) continue;
      
      // Perform temporal analysis
      const temporalAnalysis = this.analyzeTemporalCriticality(doc, analysisDate);
      
      let confidence = 0;
      const reasons = [];
      
      // Current temporal criticality
      if (temporalAnalysis.currentCriticality > 0.3) {
        confidence += temporalAnalysis.currentCriticality * 0.8;
        reasons.push(`Current temporal criticality: ${(temporalAnalysis.currentCriticality * 100).toFixed(1)}%`);
        
        if (temporalAnalysis.affectedEvents.length > 0) {
          const events = temporalAnalysis.affectedEvents.map(e => e.event).join(', ');
          reasons.push(`Affected by current events: ${events}`);
        }
      }
      
      // Emerging temporal criticality
      if (temporalAnalysis.emergingCriticality > 0.3) {
        confidence += temporalAnalysis.emergingCriticality * 0.6;
        reasons.push(`Emerging temporal criticality: ${(temporalAnalysis.emergingCriticality * 100).toFixed(1)}%`);
        
        if (temporalAnalysis.futureProjections.length > 0) {
          const projections = temporalAnalysis.futureProjections.map(p => p.reason).join(', ');
          reasons.push(`Future relevance: ${projections}`);
        }
      }
      
      // Historical pattern significance
      if (temporalAnalysis.criticalityTimeline.length > 1) {
        confidence += 0.2;
        reasons.push(`Historical criticality evolution: ${temporalAnalysis.criticalityTimeline.length} events`);
      }
      
      if (confidence > 0.4) {
        // Enhance the discovered rule with temporal data
        const enhancedDoc = {
          ...doc,
          temporal_analysis: temporalAnalysis
        };
        
        this.addDiscoveredRule(ruleNumber, confidence, 'temporal_analysis', reasons, enhancedDoc);
      }
    }
  }

  /**
   * Enhanced rule addition with temporal data
   */
  addDiscoveredRule(ruleNumber, confidence, discoveryMethod, reasons, doc) {
    const existing = this.discoveredRules.get(ruleNumber);
    
    if (!existing || confidence > existing.confidence) {
      const rule = {
        ruleNumber,
        confidence: Math.min(confidence, 1.0), // Cap at 1.0
        discoveryMethod,
        reasons,
        title: doc.rule_info?.title || 'Unknown Title',
        url: doc.rule_info?.url || '',
        filingQuestions: this.analyzeFilingQuestions(doc),
        proceduralCategory: doc.ccp_analysis?.relationship_analysis?.procedural_category || 'general',
        doc: doc
      };
      
      // Add temporal data if available
      if (doc.temporal_analysis) {
        rule.temporalData = {
          currentCriticality: doc.temporal_analysis.currentCriticality,
          emergingCriticality: doc.temporal_analysis.emergingCriticality,
          criticalityTimeline: doc.temporal_analysis.criticalityTimeline,
          affectedEvents: doc.temporal_analysis.affectedEvents,
          futureProjections: doc.temporal_analysis.futureProjections
        };
      }
      
      this.discoveredRules.set(ruleNumber, rule);
    }
  }

  /**
   * Analyze which filing questions a document answers
   */
  analyzeFilingQuestions(doc) {
    const title = doc.rule_info?.title || '';
    const content = doc.content?.text || '';
    const questionsAnswered = [];
    
    Object.entries(this.filingQuestionPatterns).forEach(([question, patterns]) => {
      const hasPatterns = patterns.some(pattern => 
        pattern.test(title) || pattern.test(content)
      );
      
      if (hasPatterns) {
        questionsAnswered.push(question);
      }
    });
    
    return questionsAnswered;
  }

  /**
   * Generate recommendations with temporal awareness
   */
  generateTemporalRecommendations() {
    const recommendations = Array.from(this.discoveredRules.values())
      .filter(rule => rule.confidence >= this.confidenceThreshold)
      .sort((a, b) => {
        // Sort by temporal criticality first, then by overall confidence
        const aTemporalScore = (a.temporalData?.currentCriticality || 0) + (a.temporalData?.emergingCriticality || 0);
        const bTemporalScore = (b.temporalData?.currentCriticality || 0) + (b.temporalData?.emergingCriticality || 0);
        
        if (aTemporalScore !== bTemporalScore) {
          return bTemporalScore - aTemporalScore;
        }
        
        return b.confidence - a.confidence;
      });
    
    console.log('\n🎯 TEMPORAL-AWARE DEPENDENCY DISCOVERY RESULTS:');
    console.log('='.repeat(60));
    
    recommendations.forEach((rule, index) => {
      console.log(`${index + 1}. CCP ${rule.ruleNumber} - ${rule.title}`);
      console.log(`   Confidence: ${(rule.confidence * 100).toFixed(1)}%`);
      console.log(`   Method: ${rule.discoveryMethod}`);
      console.log(`   Filing Questions: ${rule.filingQuestions.join(', ') || 'None detected'}`);
      
      if (rule.temporalData) {
        if (rule.temporalData.currentCriticality > 0) {
          console.log(`   Current Criticality: ${(rule.temporalData.currentCriticality * 100).toFixed(1)}%`);
        }
        if (rule.temporalData.emergingCriticality > 0) {
          console.log(`   Emerging Criticality: ${(rule.temporalData.emergingCriticality * 100).toFixed(1)}%`);
        }
        if (rule.temporalData.affectedEvents.length > 0) {
          const events = rule.temporalData.affectedEvents.map(e => e.event).join(', ');
          console.log(`   Current Events: ${events}`);
        }
        if (rule.temporalData.futureProjections.length > 0) {
          const projections = rule.temporalData.futureProjections.map(p => `${p.reason} (${p.expectedDate})`).join(', ');
          console.log(`   Future Relevance: ${projections}`);
        }
      }
      
      console.log(`   Reasons: ${rule.reasons.join('; ')}`);
      console.log('');
    });
    
    return recommendations;
  }

  /**
   * Generate final recommendations based on discovery analysis (legacy method)
   */
  generateRecommendations() {
    return this.generateTemporalRecommendations();
  }

  /**
   * Generate enhanced hybrid critical sections with temporal data
   */
  generateHybridCriticalSections(manualCriticalSections, discoveredRules) {
    const hybrid = [...manualCriticalSections];
    
    // Add high-confidence discovered rules
    const highConfidenceRules = discoveredRules.filter(rule => rule.confidence >= 0.85);
    
    highConfidenceRules.forEach(rule => {
      const section = {
        ruleNumber: rule.ruleNumber,
        title: `CCP Section ${rule.ruleNumber} - ${rule.title}`,
        url: rule.url,
        source: `auto_discovered_${rule.discoveryMethod}`,
        confidence: rule.confidence,
        filingQuestions: rule.filingQuestions,
        discoveryReasons: rule.reasons
      };
      
      // Add temporal awareness data
      if (rule.temporalData) {
        section.temporalAwareness = {
          currentCriticality: rule.temporalData.currentCriticality,
          emergingCriticality: rule.temporalData.emergingCriticality,
          criticalityTimeline: rule.temporalData.criticalityTimeline.map(event => ({
            date: event.date,
            reason: event.reason,
            description: event.description,
            impact: event.impact
          })),
          lastAnalyzed: new Date().toISOString()
        };
      }
      
      hybrid.push(section);
    });
    
    return hybrid;
  }
}

class HierarchicalPDFScraper {
  constructor(options = {}) {
    this.downloadDir = options.downloadDir || './downloaded_pdfs';
    this.outputDir = options.outputDir || './extracted_content';
    this.maxConcurrent = options.maxConcurrent || 3;
    this.delay = options.delay || 2000;
    this.forceRefresh = options.forceRefresh || false; // New option to bypass age checking
    this.baseUrl = 'https://leginfo.legislature.ca.gov';
    this.ccpTocUrl = 'https://leginfo.legislature.ca.gov/faces/codedisplayexpand.xhtml?tocCode=CCP';
    this.tocPdfPath = null;
    this.downloadMethodCache = new Map(); // Cache for successful download methods
    this.downloadMethodCacheFile = path.join(this.outputDir, 'download_method_cache.json');
    
    // Initialize dependency discovery engine for future-proof rule discovery
    this.dependencyDiscovery = new DependencyDiscoveryEngine({
      confidenceThreshold: options.discoveryConfidenceThreshold || 0.75,
      maxDiscoveryDepth: options.maxDiscoveryDepth || 3
    });
    this.enableDependencyDiscovery = options.enableDependencyDiscovery !== false; // Default to true
  }

  async initialize() {
    await fs.mkdir(this.downloadDir, { recursive: true });
    await fs.mkdir(this.outputDir, { recursive: true });
    
    // Load download method preferences from cache
    await this.loadDownloadMethodCache();
    
    console.log(`📁 Download directory: ${this.downloadDir}`);
    console.log(`📁 Output directory: ${this.outputDir}`);
    console.log(`📊 Download method cache: ${this.downloadMethodCache.size} entries loaded`);
  }

  async loadDownloadMethodCache() {
    /**
     * Load download method preferences from cache file
     */
    try {
      if (await this.fileExists(this.downloadMethodCacheFile)) {
        const cacheContent = await fs.readFile(this.downloadMethodCacheFile, 'utf8');
        const cacheData = JSON.parse(cacheContent);
        
        // Convert object back to Map
        for (const [key, value] of Object.entries(cacheData)) {
          this.downloadMethodCache.set(key, value);
        }
        
        console.log(`📋 Loaded ${this.downloadMethodCache.size} download method preferences from cache`);
      }
    } catch (error) {
      console.log(`⚠️  Failed to load download method cache: ${error.message}`);
      // Initialize with empty cache
      this.downloadMethodCache = new Map();
    }
  }

  async saveDownloadMethodCache() {
    /**
     * Save download method preferences to cache file
     */
    try {
      // Convert Map to object for JSON serialization
      const cacheData = Object.fromEntries(this.downloadMethodCache);
      await fs.writeFile(this.downloadMethodCacheFile, JSON.stringify(cacheData, null, 2));
      console.log(`💾 Saved ${this.downloadMethodCache.size} download method preferences to cache`);
    } catch (error) {
      console.log(`⚠️  Failed to save download method cache: ${error.message}`);
    }
  }

  updateDownloadMethodCache(sectionNumber, method, success) {
    /**
     * Update download method cache with success/failure information
     */
    const key = `CCP_${sectionNumber}`;
    const existing = this.downloadMethodCache.get(key) || {
      preferredMethod: null,
      attempts: {},
      lastUpdated: null
    };

    // Update attempt statistics
    if (!existing.attempts[method]) {
      existing.attempts[method] = { successes: 0, failures: 0 };
    }

    if (success) {
      existing.attempts[method].successes++;
      existing.preferredMethod = method;
      console.log(`📈 Updated cache: CCP ${sectionNumber} → preferred method: ${method}`);
    } else {
      existing.attempts[method].failures++;
      console.log(`📉 Updated cache: CCP ${sectionNumber} → method ${method} failed`);
    }

    existing.lastUpdated = new Date().toISOString();
    this.downloadMethodCache.set(key, existing);
  }

  getPreferredDownloadMethod(sectionNumber) {
    /**
     * Get preferred download method for a section based on cache
     */
    const key = `CCP_${sectionNumber}`;
    const cached = this.downloadMethodCache.get(key);
    
    if (cached && cached.preferredMethod) {
      console.log(`🎯 Using cached preferred method for CCP ${sectionNumber}: ${cached.preferredMethod}`);
      return cached.preferredMethod;
    }
    
    return null;
  }

  async getExistingProcessedRules() {
    /**
     * Check for existing processed rules from previous runs
     * Returns array of rule numbers that are less than 24 hours old
     */
    try {
      // If forceRefresh is enabled, ignore existing results and process all rules
      if (this.forceRefresh) {
        console.log('🔄 Force refresh enabled. Will process all rules regardless of existing results.');
        return [];
      }

      const resultsPath = path.join(this.outputDir, 'ccp_filing_rules_extraction_results.json');
      
      // Check if results file exists
      try {
        await fs.access(resultsPath);
      } catch {
        console.log('📋 No existing results file found. Will process all rules.');
        return [];
      }

      // Read existing results
      const resultsContent = await fs.readFile(resultsPath, 'utf8');
      const existingResults = JSON.parse(resultsContent);
      
      // Check if results are recent (less than 24 hours old)
      if (!existingResults.filtering_summary?.processed_at) {
        console.log('📋 Existing results file has no timestamp. Will process all rules.');
        return [];
      }
      
      const processedTime = new Date(existingResults.filtering_summary.processed_at);
      const hoursOld = (Date.now() - processedTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursOld > 24) {
        console.log(`📋 Existing results are ${hoursOld.toFixed(1)} hours old (> 24h). Will process all rules.`);
        return [];
      }
      
      // Extract rule numbers from existing results
      const existingRuleNumbers = [];
      if (existingResults.extracted_documents && Array.isArray(existingResults.extracted_documents)) {
        for (const doc of existingResults.extracted_documents) {
          if (doc.rule_info?.ruleNumber) {
            existingRuleNumbers.push(doc.rule_info.ruleNumber);
          }
        }
      }
      
      console.log(`📋 Found ${existingRuleNumbers.length} already-processed rules from ${hoursOld.toFixed(1)} hours ago.`);
      console.log(`📋 Will skip these rules and only process new/missing ones.`);
      
      return existingRuleNumbers;
      
    } catch (error) {
      console.log(`⚠️  Error reading existing results: ${error.message}. Will process all rules.`);
      return [];
    }
  }

  async mergeWithExistingResults(newExtractedData, existingProcessedRules) {
    /**
     * Merge new extraction results with existing results from previous runs
     */
    try {
      if (existingProcessedRules.length === 0) {
        // No existing results to merge with
        return newExtractedData;
      }

      const resultsPath = path.join(this.outputDir, 'ccp_filing_rules_extraction_results.json');
      
      // Read existing results
      const resultsContent = await fs.readFile(resultsPath, 'utf8');
      const existingResults = JSON.parse(resultsContent);
      
      // Combine existing and new extracted documents
      const combinedDocuments = [...(existingResults.extracted_documents || [])];
      
      // Add new documents
      if (newExtractedData && Array.isArray(newExtractedData)) {
        combinedDocuments.push(...newExtractedData);
      }
      
      console.log(`📋 Merged ${newExtractedData?.length || 0} new results with ${existingResults.extracted_documents?.length || 0} existing results`);
      console.log(`📋 Total combined results: ${combinedDocuments.length} documents`);
      
      return combinedDocuments;
      
    } catch (error) {
      console.log(`⚠️  Error merging with existing results: ${error.message}. Using new results only.`);
      return newExtractedData || [];
    }
  }

    async scrapeHierarchicalPDFs() {
    await this.initialize();
    
    try {
      // Check if we need to download PDFs or just parse existing ones
      let shouldDownload = await this.shouldDownloadPDFs();
      let extractedData;
      
      if (shouldDownload) {
        console.log('\n🔍 Step 1: Downloading CCP Table of Contents PDF...');
        
        // Step 1: Download the main TOC PDF
        this.tocPdfPath = await this.downloadTocPDF();
        if (!this.tocPdfPath) {
          throw new Error('Failed to download Table of Contents PDF');
        }
        
        console.log('\n🔍 Step 2: Extracting section links from TOC PDF...');
        
        // Step 2: Extract all section links from the TOC PDF
        const allSectionLinks = await this.extractSectionLinksFromTocPDF(this.tocPdfPath);
        console.log(`✅ Extracted ${allSectionLinks.length} section links from TOC PDF`);
        
        console.log('\n🔍 Step 3: Checking for existing processed rules...');
        
        // Step 3a: Get already processed rules (if any)
        const existingProcessedRules = await this.getExistingProcessedRules();
        
        console.log('\n🔍 Step 3b: Filtering for filing-related sections...');
        
        // Step 3b: Filter for filing-related sections
        const filingRelatedLinks = this.filterFilingRelatedSections(allSectionLinks);
        console.log(`✅ Filtered to ${filingRelatedLinks.length} filing-related sections`);
        
        // Step 3c: Remove already processed rules from the list
        const newRulesToProcess = filingRelatedLinks.filter(section => {
          return !existingProcessedRules.includes(section.ruleNumber);
        });
        
        const skippedCount = filingRelatedLinks.length - newRulesToProcess.length;
        console.log(`📋 Skipping ${skippedCount} already-processed rules`);
        console.log(`🔍 Processing ${newRulesToProcess.length} new/missing rules`);
        
        console.log('\n🔍 Step 4: Downloading individual rule PDFs...');
        
        // Step 4: Download PDFs for new/missing sections only
        const downloadedFiles = [];
        const allRuleData = [];
        
        if (newRulesToProcess.length === 0) {
          console.log('✅ No new rules to process. All rules are up to date.');
        }
        
        for (let i = 0; i < newRulesToProcess.length; i++) {
          const section = newRulesToProcess[i];
          console.log(`\n  📋 Processing section ${i + 1}/${newRulesToProcess.length}: ${section.ruleNumber} - ${section.title}`);
          
          try {
            const result = await this.downloadIndividualRulePDF(section, i);
                if (result) {
              downloadedFiles.push(result.filePath);
                  allRuleData.push(result.ruleData);
              console.log(`    ✅ Downloaded content for section ${section.ruleNumber}`);
                }
                
            // Add delay between downloads
            if (i < newRulesToProcess.length - 1) {
                await this.sleep(this.delay);
            }
            
          } catch (error) {
            console.error(`    ❌ Error processing section ${section.ruleNumber}:`, error.message);
            continue;
          }
        }
        
        console.log(`\n🔍 Step 5: Processing ${downloadedFiles.length} downloaded files with enhanced processor...`);
        
        if (downloadedFiles.length === 0) {
          console.log('⚠️  No files downloaded to process');
          return [];
        }
        
        // Process new files if any were downloaded
        let newExtractedData = [];
        if (downloadedFiles.length > 0) {
          newExtractedData = await this.processFilesWithEnhancedProcessor(downloadedFiles, allRuleData);
        }
        
        // Merge with existing results
        extractedData = await this.mergeWithExistingResults(newExtractedData, existingProcessedRules);
      } else {
        console.log('\n📋 CCP section PDFs are recent (< 24 hours old). Skipping download and processing existing PDFs...');
        
        // Get existing PDFs and their metadata
        const existingPDFData = await this.getExistingPDFData();
        console.log(`\n🔍 Processing ${existingPDFData.pdfPaths.length} existing PDFs with PyMuPDF...`);
        
        if (existingPDFData.pdfPaths.length === 0) {
          console.log('⚠️  No existing CCP section PDFs found. Forcing fresh download...');
          // Force fresh download instead of recursive call to avoid infinite loop
          shouldDownload = true;
          console.log('\n🔍 Step 1: Downloading CCP Table of Contents PDF...');
          
          // Step 1: Download the main TOC PDF
          this.tocPdfPath = await this.downloadTocPDF();
          if (!this.tocPdfPath) {
            throw new Error('Failed to download Table of Contents PDF');
          }
          
          console.log('\n🔍 Step 2: Extracting section links from TOC PDF...');
          
          // Step 2: Extract all section links from the TOC PDF
          const allSectionLinks = await this.extractSectionLinksFromTocPDF(this.tocPdfPath);
          console.log(`✅ Extracted ${allSectionLinks.length} section links from TOC PDF`);
          
          console.log('\n🔍 Step 3: Checking for existing processed rules...');
          
          // Step 3a: Get already processed rules (if any) - force fresh when no existing PDFs
          const existingProcessedRules = [];  // Force fresh download when no existing PDFs
          
          console.log('\n🔍 Step 3b: Filtering for filing-related sections...');
          
          // Step 3b: Filter for filing-related sections
          const filingRelatedLinks = this.filterFilingRelatedSections(allSectionLinks);
          console.log(`✅ Filtered to ${filingRelatedLinks.length} filing-related sections`);
          
          console.log('\n🔍 Step 4: Downloading individual rule PDFs...');
          
          // Step 4: Download PDFs for filing-related sections (all of them since forcing fresh)
          const downloadedFiles = [];
          const allRuleData = [];
          
          for (let i = 0; i < filingRelatedLinks.length; i++) {
            const section = filingRelatedLinks[i];
            console.log(`\n  📋 Processing section ${i + 1}/${filingRelatedLinks.length}: ${section.ruleNumber} - ${section.title}`);
            
            try {
              const result = await this.downloadIndividualRulePDF(section, i);
              if (result) {
                downloadedFiles.push(result.filePath);
                allRuleData.push(result.ruleData);
                console.log(`    ✅ Downloaded content for section ${section.ruleNumber}`);
              }
              
              // Add delay between downloads
              if (i < filingRelatedLinks.length - 1) {
                await this.sleep(this.delay);
              }
              
            } catch (error) {
              console.error(`    ❌ Error processing section ${section.ruleNumber}:`, error.message);
              continue;
            }
          }
          
          console.log(`\n🔍 Step 5: Processing ${downloadedFiles.length} downloaded files with enhanced processor...`);
          
          if (downloadedFiles.length === 0) {
            console.log('⚠️  No files downloaded to process');
            return [];
          }
          
          // Process all files (forcing fresh download)
          extractedData = await this.processFilesWithEnhancedProcessor(downloadedFiles, allRuleData);
        }
        
        // Check for missing critical sections even when using existing PDFs
        console.log('\n🔍 Checking for missing critical sections...');
        const criticalSections = this.getCriticalSections();
        const existingRuleNumbers = existingPDFData.ruleData.map(rule => rule.ruleNumber);
        const missingSections = criticalSections.filter(section => 
          !existingRuleNumbers.includes(section.ruleNumber)
        );
        
        if (missingSections.length > 0) {
          console.log(`🔥 Found ${missingSections.length} missing critical sections. Downloading them...`);
          
          const downloadedFiles = [];
          const allRuleData = [...existingPDFData.ruleData];
          
          for (let i = 0; i < missingSections.length; i++) {
            const section = missingSections[i];
            console.log(`\n  📋 Downloading missing section ${i + 1}/${missingSections.length}: ${section.ruleNumber} - ${section.title}`);
            
            try {
              const result = await this.downloadIndividualRulePDF(section, existingPDFData.ruleData.length + i);
              if (result) {
                downloadedFiles.push(result.filePath);
                allRuleData.push(result.ruleData);
                console.log(`    ✅ Downloaded content for section ${section.ruleNumber}`);
              }
              
              // Add delay between downloads
              if (i < missingSections.length - 1) {
                await this.sleep(this.delay);
              }
              
            } catch (error) {
              console.error(`    ❌ Error processing section ${section.ruleNumber}:`, error.message);
              continue;
            }
          }
          
          // Process all files (existing + newly downloaded)
          const allPdfPaths = [...existingPDFData.pdfPaths, ...downloadedFiles];
          extractedData = await this.processFilesWithEnhancedProcessor(allPdfPaths, allRuleData);
          
          console.log(`✅ Processed ${existingPDFData.pdfPaths.length} existing + ${downloadedFiles.length} newly downloaded = ${allPdfPaths.length} total PDFs`);
        } else {
          console.log('✅ All critical sections already present in existing PDFs');
                  // Check for missing critical sections even when using existing PDFs
        console.log('\n🔍 Checking for missing critical sections...');
        const criticalSections = this.getCriticalSections();
        const existingRuleNumbers = existingPDFData.ruleData.map(rule => rule.ruleNumber);
        const missingSections = criticalSections.filter(section => 
          !existingRuleNumbers.includes(section.ruleNumber)
        );
        
        if (missingSections.length > 0) {
          console.log(`🔥 Found ${missingSections.length} missing critical sections. Downloading them...`);
          
          const downloadedFiles = [];
          const allRuleData = [...existingPDFData.ruleData];
          
          for (let i = 0; i < missingSections.length; i++) {
            const section = missingSections[i];
            console.log(`\n  📋 Downloading missing section ${i + 1}/${missingSections.length}: ${section.ruleNumber} - ${section.title}`);
            
            try {
              const result = await this.downloadIndividualRulePDF(section, existingPDFData.ruleData.length + i);
              if (result) {
                downloadedFiles.push(result.filePath);
                allRuleData.push(result.ruleData);
                console.log(`    ✅ Downloaded content for section ${section.ruleNumber}`);
              }
              
              // Add delay between downloads
              if (i < missingSections.length - 1) {
                await this.sleep(this.delay);
              }
              
            } catch (error) {
              console.error(`    ❌ Error processing section ${section.ruleNumber}:`, error.message);
              continue;
            }
          }
          
          // Process all files (existing + newly downloaded)
          const allPdfPaths = [...existingPDFData.pdfPaths, ...downloadedFiles];
          extractedData = await this.processFilesWithEnhancedProcessor(allPdfPaths, allRuleData);
          
          console.log(`✅ Processed ${existingPDFData.pdfPaths.length} existing + ${downloadedFiles.length} newly downloaded = ${allPdfPaths.length} total PDFs`);
        } else {
          console.log('✅ All critical sections already present in existing PDFs');
          extractedData = await this.processFilesWithEnhancedProcessor(existingPDFData.pdfPaths, existingPDFData.ruleData);
        }
      }
      }
      
      // Step 6: Save comprehensive results
      const filteringSummary = {
        total_sections_found: shouldDownload ? (typeof allSectionLinks !== 'undefined' ? allSectionLinks.length : 'N/A') : 'N/A (used existing PDFs)',
        filing_related_sections: shouldDownload ? (typeof filingRelatedLinks !== 'undefined' ? filingRelatedLinks.length : 'N/A') : (extractedData ? extractedData.length : 0),
        successfully_downloaded: shouldDownload ? (typeof downloadedFiles !== 'undefined' ? downloadedFiles.length : 'N/A') : 'N/A (used existing PDFs)',
        skipped_existing_rules: shouldDownload ? (typeof existingProcessedRules !== 'undefined' ? existingProcessedRules.length : 0) : 0,
        new_rules_processed: shouldDownload ? (typeof newRulesToProcess !== 'undefined' ? newRulesToProcess.length : 'N/A') : 0,
        filtering_criteria: {
          focus: '6 Core Document Filing Questions',
          questions_addressed: [
            'WHEN must documents be filed? (deadlines/timing)',
            'HOW must documents be filed? (format/procedure)', 
            'WHERE must documents be filed? (venue/jurisdiction)',
            'WHAT must be included in document filings? (required components)',
            'WHO can file documents? (capacity/authority)',
            'WHAT format must documents follow? (formatting rules)'
          ],
          exclusions: [
            'Property exemptions (699.700-699.730)',
            'Substantive legal rights and outcomes',
            'Judgment enforcement procedures (unless filing-related)',
            'Trial procedures and jury management',
            'Evidence rules and witness examination'
          ],
          key_sections_included: [
            '12: Time computation for filing deadlines',
            '392-411: Venue and jurisdiction requirements',
            '425-431: Complaint and answer filing requirements',
            '430-438: Demurrer and summary judgment procedures',
            '1005-1014: Motion filing deadlines and service procedures',
            '2024-2033: Discovery filing requirements and deadlines'
          ],
          minimum_relevance_score: 8,
          requires_question_match: true
        },
        processed_at: new Date().toISOString(),
        processing_mode: shouldDownload ? 'fresh_download' : 'existing_pdfs'
      };
      
      const comprehensiveResults = {
        filtering_summary: filteringSummary,
        extracted_documents: extractedData || []
      };
      
      const resultsPath = path.join(this.outputDir, 'ccp_filing_rules_extraction_results.json');
      await fs.writeFile(resultsPath, JSON.stringify(comprehensiveResults, null, 2));
      console.log(`\n💾 CCP filing-focused results saved to: ${resultsPath}`);
      
      // Save download method preferences cache
      await this.saveDownloadMethodCache();
      
      return comprehensiveResults;
      
    } catch (error) {
      console.error('Error in hierarchical scraping process:', error);
      throw error;
    }
  }

  async downloadTocPDF() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      console.log(`    🔗 Accessing TOC page: ${this.ccpTocUrl}`);
      
      await page.goto(this.ccpTocUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 15000 
      });
      
      console.log(`    ✅ Page loaded successfully`);
      await page.waitForTimeout(2000);
      
      // Look for print/PDF button or link
      const pdfPath = path.join(this.downloadDir, 'ccp_toc.pdf');
      
      // Strategy 1: Look for the specific print button based on your HTML code
      console.log(`    🔍 Looking for print button...`);
      
      // Try multiple selectors for the print button
      const printSelectors = [
        '#codes_print a',  // Based on your HTML: <div id="codes_print">
        'a[title*="Print"]',
        'a[onclick*="window.print"]',
        'img[alt="print page"]',  // The print icon
        'button:has-text("print"), a:has-text("print"), button:has-text("PDF"), a:has-text("PDF")',
        '[title*="print"], [title*="PDF"]'
      ];
      
      let printButton = null;
      for (const selector of printSelectors) {
        try {
          const buttons = await page.$$(selector);
          if (buttons.length > 0) {
            printButton = buttons[0];
            console.log(`    🖨️  Found print button with selector: ${selector}`);
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (printButton) {
        console.log(`    🖨️  Attempting to trigger print dialog...`);
        
        try {
          // Set up download listener before clicking
          const downloadPromise = page.waitForDownload({ timeout: 30000 }).catch(() => null);
          
          // Click the print button to trigger window.print()
          await printButton.click();
          
          // Wait a bit for the print dialog
          await page.waitForTimeout(2000);
          
          const download = await downloadPromise;
          if (download) {
            await download.saveAs(pdfPath);
            console.log(`    ✅ Downloaded TOC PDF via print button to: ${pdfPath}`);
            await browser.close();
            return pdfPath;
          }
        } catch (error) {
          console.log(`    ⚠️  Print button click failed: ${error.message}`);
        }
      }
      
      // Strategy 2: Use browser's print-to-PDF functionality
      console.log(`    📄 Using print-to-PDF fallback...`);
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
      });
      
      console.log(`    ✅ Generated TOC PDF to: ${pdfPath}`);
      await browser.close();
      return pdfPath;
      
    } catch (error) {
      await browser.close();
      throw new Error(`Failed to download TOC PDF: ${error.message}`);
    }
  }

  async extractSectionLinksFromTocPDF(tocPdfPath) {
    console.log(`DEBUG: extractSectionLinksFromTocPDF called with tocPdfPath = ${tocPdfPath}`);
    return new Promise((resolve, reject) => {
      const pythonScript = this.generateTocExtractionScript(tocPdfPath);
      const scriptPath = path.join(this.outputDir, 'extract_toc_links.py');
      
      fs.writeFile(scriptPath, pythonScript)
        .then(() => {
          console.log('🐍 Running TOC link extraction script...');
          
          const pythonProcess = spawn('python3', [scriptPath], {
            stdio: ['inherit', 'pipe', 'pipe']
          });
          
          let output = '';
          let error = '';
          
          pythonProcess.stdout.on('data', (data) => {
            const text = data.toString();
            output += text;
            console.log(text.trim());
          });
          
          pythonProcess.stderr.on('data', (data) => {
            const text = data.toString();
            error += text;
            console.error(text.trim());
          });
          
          pythonProcess.on('close', (code) => {
            if (code === 0) {
              try {
                const resultsPath = path.join(this.outputDir, 'toc_links.json');
                fs.readFile(resultsPath, 'utf8')
                  .then(data => resolve(JSON.parse(data)))
                  .catch(err => reject(new Error(`Failed to read TOC links: ${err.message}`)));
              } catch (parseError) {
                reject(new Error(`Failed to parse TOC links: ${parseError.message}`));
              }
            } else {
              reject(new Error(`TOC extraction script failed with code ${code}: ${error}`));
            }
          });
        })
        .catch(reject);
    });
  }

  generateTocExtractionScript(tocPdfPath) {
    return `
import fitz
import json
import os
import re
from urllib.parse import urljoin

def extract_toc_links(pdf_path):
    """Extract section links from the CCP Table of Contents PDF"""
    try:
        doc = fitz.open(pdf_path)
        links = []
        
        print(f"Processing TOC PDF: {pdf_path}")
        print(f"Total pages: {len(doc)}")
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            page_text = page.get_text()
            
            # Extract hyperlinks from the page
            page_links = page.get_links()
            
            for link in page_links:
                if link.get('uri'):
                    uri = link['uri']
                    # Look for CCP section links
                    if 'codes_displaySection' in uri and 'CCP' in uri:
                        # Extract section number from URI (including lettered subsections)
                        section_match = re.search(r'sectionNum=([\\d\\.a-z]+)', uri)
                        if section_match:
                            section_num = section_match.group(1)
                            
                            # Get the text content around this link for context
                            rect = link['from']
                            # Get text in the vicinity of the link
                            text_area = page.get_text("text", clip=rect)
                            
                            # Try to find the section title in the surrounding text
                            lines = page_text.split('\\n')
                            section_title = f"CCP Section {section_num}"
                            
                            # Look for lines containing the section number
                            for line in lines:
                                if section_num in line and len(line.strip()) > len(section_num):
                                    # This line likely contains the section title
                                    clean_line = line.strip()
                                    if clean_line and not clean_line.isdigit():
                                        section_title = clean_line[:200]  # Limit length
                                        break
                            
                            links.append({
                                'ruleNumber': section_num,
                                'title': section_title,
                                'url': uri if uri.startswith('http') else f"https://leginfo.legislature.ca.gov{uri}",
                                'page': page_num + 1,
                                'source': 'toc_pdf_hyperlink'
                            })
            
            # Also extract section numbers from text patterns
            # Look for section number patterns in the text (including lettered subsections)
            section_patterns = [
                r'(\\d+[a-z]?\\.\\d+[a-z]?)\\s+[A-Z][^\\n]{10,}',  # "415.10 SOME TITLE" or "437c.10 TITLE"
                r'(\\d+[a-z]?)\\s+[A-Z][^\\n]{10,}',               # "415 SOME TITLE" or "437c TITLE"
                r'Section\\s+(\\d+[a-z]?\\.?\\d*[a-z]?)\\s+[A-Z][^\\n]{10,}',  # "Section 415.10 SOME TITLE" or "Section 437c TITLE"
                r'(\\d+[a-z])\\.\\s+[A-Z][^\\n]{10,}',             # "437c. SOME TITLE"
            ]
            
            for pattern in section_patterns:
                matches = re.finditer(pattern, page_text, re.MULTILINE)
                for match in matches:
                    section_num = match.group(1)
                    full_match = match.group(0).strip()
                    
                    # Check if we already have this section from hyperlinks
                    existing = any(link['ruleNumber'] == section_num for link in links)
                    if not existing:
                        # Generate the URL for this section
                        section_url = f"https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum={section_num}"
                        
                        links.append({
                            'ruleNumber': section_num,
                            'title': full_match[:200],  # Limit title length
                            'url': section_url,
                            'page': page_num + 1,
                            'source': 'toc_pdf_text_pattern'
                        })
        
        doc.close()
        
        # Remove duplicates and sort
        unique_links = {}
        for link in links:
            key = link['ruleNumber']
            if key not in unique_links:
                unique_links[key] = link
        
        final_links = list(unique_links.values())
        
        # Sort by section number
        def sort_key(link):
            try:
                return float(link['ruleNumber'])
            except:
                return 0
        
        final_links.sort(key=sort_key)
        
        print(f"\\nExtracted {len(final_links)} unique section links")
        
        # Show sample of extracted links
        print("\\nSample sections found:")
        for i, link in enumerate(final_links[:10]):
            print(f"  {i+1}. Section {link['ruleNumber']}: {link['title'][:60]}...")
        
        if len(final_links) > 10:
            print(f"  ... and {len(final_links) - 10} more sections")
        
        return final_links
        
    except Exception as e:
        print(f"Error extracting TOC links: {e}")
        return []

def main():
    pdf_path = "${tocPdfPath}"
    
    if not os.path.exists(pdf_path):
        print(f"Error: TOC PDF not found at {pdf_path}")
        return
    
    links = extract_toc_links(pdf_path)
    
    # Save results
    output_path = "${path.join(this.outputDir, 'toc_links.json').replace(/\\/g, '/')}"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(links, f, indent=2, ensure_ascii=False)
    
    print(f"\\n💾 TOC links saved to: {output_path}")
    print(f"✅ Successfully extracted {len(links)} section links from TOC PDF")

if __name__ == "__main__":
    main()
`;
  }

  filterFilingRelatedSections(allSectionLinks) {
    const filingRelatedSections = [];
    
    for (const section of allSectionLinks) {
      if (this.isFilingRelatedSection(section)) {
        filingRelatedSections.push(section);
      }
    }
    
    // Add critical sections that are often missing from TOC
    const criticalSubsections = [
      // Summary Judgment Rules
      {
        ruleNumber: '437c',
        title: 'CCP Section 437c - Summary Judgment Motions',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=437c',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '438',
        title: 'CCP Section 438 - Summary Judgment Procedure',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=438',
        source: 'manual_critical_addition'
      },
      
      // 1. Service and Filing Rules (CCP 1000-1020)
      {
        ruleNumber: '1005',
        title: 'CCP Section 1005 - Motion Deadlines and Notice Requirements (16 court days notice, 9 days for opposition, 5 days for reply)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1005',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '1010',
        title: 'CCP Section 1010 - Service Methods and Requirements',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1010',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '1010.6',
        title: 'CCP Section 1010.6 - Electronic Service Procedures',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1010.6',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '1011',
        title: 'CCP Section 1011 - Personal Service Requirements',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1011',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '1012',
        title: 'CCP Section 1012 - Service by Mail Timing and Extensions',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1012',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '1013',
        title: 'CCP Section 1013 - Time Extensions for Mail Service (+5 days in CA, +10 out of state, +2 court days for fax/overnight)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1013',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '1019.5',
        title: 'CCP Section 1019.5 - Notice of Court Orders and Decisions',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1019.5',
        source: 'manual_critical_addition'
      },
      
      // Filing Requirements
      {
        ruleNumber: '1014',
        title: 'CCP Section 1014 - Proof of Service Requirements',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1014',
        source: 'manual_critical_addition'
      },
      
      // 2. Motion Practice and Format Requirements
      {
        ruleNumber: '473',
        title: 'CCP Section 473 - Relief from Default Judgments and Procedural Errors',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=473',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '128.7',
        title: 'CCP Section 128.7 - Sanctions for Frivolous Filings',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=128.7',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '170',
        title: 'CCP Section 170 - Judge Disqualification Procedures',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=170',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '170.1',
        title: 'CCP Section 170.1 - Judge Disqualification Grounds',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=170.1',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '170.3',
        title: 'CCP Section 170.3 - Judge Disqualification Procedure',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=170.3',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '170.6',
        title: 'CCP Section 170.6 - Peremptory Challenge to Judge',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=170.6',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '594',
        title: 'CCP Section 594 - Notice of Trial Requirements',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=594',
        source: 'manual_critical_addition'
      },
      
      // Motion Practice
      {
        ruleNumber: '1003',
        title: 'CCP Section 1003 - Ex Parte Applications',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1003',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '1006',
        title: 'CCP Section 1006 - Extensions of Time',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1006',
        source: 'manual_critical_addition'
      },
      
      // 3. Case Management and Scheduling
      {
        ruleNumber: '583.210',
        title: 'CCP Section 583.210 - Dismissal for Delay in Prosecution (2-year rule)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=583.210',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '583.220',
        title: 'CCP Section 583.220 - Dismissal for Delay - Service Requirements',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=583.220',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '583.230',
        title: 'CCP Section 583.230 - Dismissal for Delay - Bringing to Trial',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=583.230',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '583.250',
        title: 'CCP Section 583.250 - Dismissal for Delay - New Trial',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=583.250',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '12',
        title: 'CCP Section 12 - Time Computation Rules',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=12',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '12a',
        title: 'CCP Section 12a - Time Computation for Service',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=12a',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '12c',
        title: 'CCP Section 12c - Time Computation for Court Days',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=12c',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '2024.020',
        title: 'CCP Section 2024.020 - Discovery Cutoff Deadlines (30 days before trial)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=2024.020',
        source: 'manual_critical_addition'
      },
      
      // 4. Specific Motion Requirements
      {
        ruleNumber: '1287',
        title: 'CCP Section 1287 - Arbitration Petition Procedures',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1287',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '1288',
        title: 'CCP Section 1288 - Arbitration Award Confirmation',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1288',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '1290',
        title: 'CCP Section 1290 - Arbitration Award Correction',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1290',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '1294',
        title: 'CCP Section 1294 - Arbitration Award Vacation',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1294',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '1086',
        title: 'CCP Section 1086 - Writ of Mandate Procedures',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1086',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '1094.5',
        title: 'CCP Section 1094.5 - Administrative Mandate Procedures',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1094.5',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '1094.6',
        title: 'CCP Section 1094.6 - Administrative Record Procedures',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1094.6',
        source: 'manual_critical_addition'
      },
      
      // Enhanced Entry of Judgment (664-670)
      {
        ruleNumber: '664',
        title: 'CCP Section 664 - Entry of Judgment Requirements',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=664',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '664.5',
        title: 'CCP Section 664.5 - Entry of Judgment on Jury Verdict',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=664.5',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '664.6',
        title: 'CCP Section 664.6 - Settlement Agreement Enforcement',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=664.6',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '667',
        title: 'CCP Section 667 - Default Judgment Entry',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=667',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '670',
        title: 'CCP Section 670 - Judgment Roll Contents',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=670',
        source: 'manual_critical_addition'
      },
      
      // 5. DEMURRER AND DOCUMENT FILING REQUIREMENTS
      {
        ruleNumber: '430.10',
        title: 'CCP Section 430.10 - Demurrer Grounds and Requirements (Motion to Dismiss)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=430.10',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '430.20',
        title: 'CCP Section 430.20 - Demurrer Procedure and Format Requirements',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=430.20',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '430.30',
        title: 'CCP Section 430.30 - Time for Filing Demurrer',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=430.30',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '430.40',
        title: 'CCP Section 430.40 - Demurrer to Answer Requirements',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=430.40',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '430.41',
        title: 'CCP Section 430.41 - Meet and Confer Requirements for Demurrer',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=430.41',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '431.30',
        title: 'CCP Section 431.30 - Answer Format and Requirements',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=431.30',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '431.40',
        title: 'CCP Section 431.40 - Cross-Complaint Requirements',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=431.40',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '472',
        title: 'CCP Section 472 - Amendment of Pleadings',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=472',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '472a',
        title: 'CCP Section 472a - Leave to Amend Pleadings',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=472a',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '472c',
        title: 'CCP Section 472c - Amendment to Conform to Proof',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=472c',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '472d',
        title: 'CCP Section 472d - Time for Amendment After Demurrer',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=472d',
        source: 'manual_critical_addition'
      },
      
      // 6. MOTION PRACTICE AND DOCUMENT REQUIREMENTS
      {
        ruleNumber: '435',
        title: 'CCP Section 435 - Motion to Strike Requirements',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=435',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '436',
        title: 'CCP Section 436 - Grounds for Motion to Strike',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=436',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '437',
        title: 'CCP Section 437 - Time for Motion to Strike',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=437',
        source: 'manual_critical_addition'
      },
      
      // 7. COMPLAINT AND INITIAL PLEADING REQUIREMENTS  
      {
        ruleNumber: '425.10',
        title: 'CCP Section 425.10 - Complaint Format and Content Requirements',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=425.10',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '425.11',
        title: 'CCP Section 425.11 - Complaint Caption Requirements',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=425.11',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '425.12',
        title: 'CCP Section 425.12 - Verification Requirements for Pleadings',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=425.12',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '425.13',
        title: 'CCP Section 425.13 - Doe Defendants in Complaints',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=425.13',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '426.10',
        title: 'CCP Section 426.10 - Compulsory Cross-Complaints',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=426.10',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '426.30',
        title: 'CCP Section 426.30 - Permissive Cross-Complaints',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=426.30',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '426.50',
        title: 'CCP Section 426.50 - Cross-Complaint Filing Requirements',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=426.50',
        source: 'manual_critical_addition'
      },
      
      // 8. DOCUMENT FORMATTING AND PRESENTATION REQUIREMENTS
      {
        ruleNumber: '367',
        title: 'CCP Section 367 - Capacity to Sue and Document Requirements',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=367',
        source: 'manual_critical_addition'
      },
      
      // 9. Discovery Motion Deadlines
      {
        ruleNumber: '2030.300',
        title: 'CCP Section 2030.300 - Motion to Compel Interrogatory Responses (45-day deadline)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=2030.300',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '2031.310',
        title: 'CCP Section 2031.310 - Motion to Compel Document Production',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=2031.310',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '2025.480',
        title: 'CCP Section 2025.480 - Motion to Compel Deposition Attendance',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=2025.480',
        source: 'manual_critical_addition'
      },
      
      // 6. Ex Parte Procedures and TRO
      {
        ruleNumber: '527',
        title: 'CCP Section 527 - Temporary Restraining Orders',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=527',
        source: 'manual_critical_addition'
      },
      
      // Discovery Rules
      {
        ruleNumber: '2016.010',
        title: 'CCP Section 2016.010 - Discovery Act General Provisions',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=2016.010',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '2023.010',
        title: 'CCP Section 2023.010 - Discovery Sanctions',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=2023.010',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '2025.010',
        title: 'CCP Section 2025.010 - Deposition Procedures',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=2025.010',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '2030.010',
        title: 'CCP Section 2030.010 - Interrogatory Procedures',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=2030.010',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '2031.010',
        title: 'CCP Section 2031.010 - Document Production',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=2031.010',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '2033.010',
        title: 'CCP Section 2033.010 - Requests for Admission',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=2033.010',
        source: 'manual_critical_addition'
      },
      {
        ruleNumber: '527',
        title: 'CCP Section 527 - TRO Filing Requirements (WHAT/HOW: Emergency relief filing requirements)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=527',
        source: 'critical_filing_question_WHAT_HOW'
      },
      
      // POST-TRIAL FILING PROCEDURES (Critical timing and format requirements)
      {
        ruleNumber: '659',
        title: 'CCP Section 659 - Motion for New Trial (WHEN: 30-day post-trial deadline)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=659',
        source: 'critical_filing_question_WHEN'
      },
      {
        ruleNumber: '659a',
        title: 'CCP Section 659a - New Trial Motion Requirements (WHAT: Required format and contents for new trial motion)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=659a',
        source: 'critical_filing_question_WHAT'
      },
      {
        ruleNumber: '663',
        title: 'CCP Section 663 - Motion for Judgment Notwithstanding Verdict (WHEN/WHAT: Post-trial JNOV filing requirements)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=663',
        source: 'critical_filing_question_WHEN_WHAT'
      },
      
      // ENHANCED ELECTRONIC FILING AND SERVICE
      {
        ruleNumber: '1013a',
        title: 'CCP Section 1013a - Electronic Service Time Extensions (WHEN: Additional time for electronic service)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1013a',
        source: 'critical_filing_question_WHEN'
      },
      {
        ruleNumber: '1010.5',
        title: 'CCP Section 1010.5 - Overnight Delivery Service (HOW: Overnight delivery filing procedures)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1010.5',
        source: 'critical_filing_question_HOW'
      },
      
      // CASE MANAGEMENT AND SCHEDULING (Critical for filing deadlines)
      {
        ruleNumber: '36',
        title: 'CCP Section 36 - Calendar Preferences (WHERE/WHEN: Court scheduling affecting filing deadlines)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=36',
        source: 'critical_filing_question_WHERE_WHEN'
      },
      {
        ruleNumber: '1048',
        title: 'CCP Section 1048 - Consolidation of Actions (HOW: Affects filing procedures in multiple cases)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1048',
        source: 'critical_filing_question_HOW'
      }
    ];
    
    // Check if these critical sections are already included
    for (const critical of criticalSubsections) {
      const exists = filingRelatedSections.some(section => section.ruleNumber === critical.ruleNumber);
      if (!exists) {
        console.log(`      🔥 Adding critical missing section: ${critical.ruleNumber}`);
        filingRelatedSections.push(critical);
      }
    }
    
    return filingRelatedSections;
  }

  /**
   * Perform hybrid critical section discovery combining manual sections with auto-discovery
   * @param {Object} extractedData - Optional extracted data for dependency analysis
   * @returns {Array} - Combined list of critical and discovered sections
   */
  async getHybridCriticalSections(extractedData = null) {
    console.log('🔬 Performing hybrid critical section discovery...');
    
    // Get manually curated critical sections
    const manualCriticalSections = this.getCriticalSections();
    console.log(`📋 Manual critical sections: ${manualCriticalSections.length}`);
    
    // If dependency discovery is disabled, return manual sections only
    if (!this.enableDependencyDiscovery) {
      console.log('⚠️  Dependency discovery disabled. Using manual critical sections only.');
      return manualCriticalSections;
    }
    
    // If no extracted data provided, return manual sections only
    if (!extractedData) {
      console.log('⚠️  No extracted data available for dependency discovery. Using manual critical sections only.');
      return manualCriticalSections;
    }
    
    try {
      // Perform dependency discovery
      const discoveredRules = await this.dependencyDiscovery.discoverRelatedRules(
        manualCriticalSections,
        extractedData
      );
      
      // Generate hybrid list
      const hybridSections = this.dependencyDiscovery.generateHybridCriticalSections(
        manualCriticalSections,
        discoveredRules
      );
      
      console.log(`🎯 Hybrid discovery complete:`);
      console.log(`   Manual sections: ${manualCriticalSections.length}`);
      console.log(`   Discovered rules: ${discoveredRules.length}`);
      console.log(`   High-confidence additions: ${hybridSections.length - manualCriticalSections.length}`);
      console.log(`   Total hybrid sections: ${hybridSections.length}`);
      
      return hybridSections;
      
    } catch (error) {
      console.error('❌ Error during dependency discovery:', error);
      console.log('⚠️  Falling back to manual critical sections only.');
      return manualCriticalSections;
    }
  }

  getCriticalSections() {
    /**
     * Returns the list of critical sections that answer the 6 filing questions:
     * WHEN, HOW, WHERE, WHAT, WHO, FORMAT for document filing procedures
     * 
     * Updated to match actual extraction results - removed rules that weren't successfully extracted:
     * - CCP 392 (venue), 411.10 (commencing actions), 372 (minors) - not extracted
     * 
     * Added successfully extracted filing-related rules:
     * - CCP 12a, 12c (time computation extensions)
     * - Various amendment, service, and procedural rules
     */
    const criticalSubsections = [
      // CRITICAL SUMMARY JUDGMENT FILING REQUIREMENTS (WHAT must be included)
      {
        ruleNumber: '437c',
        title: 'CCP Section 437c - Summary Judgment Motion Requirements (WHAT: Notice, Separate Statement, Points & Authorities, Evidence)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=437c',
        source: 'critical_filing_question_WHAT'
      },
      
      // WHEN - Critical Filing Deadlines and Timing Rules
      {
        ruleNumber: '1005',
        title: 'CCP Section 1005 - Motion Filing Deadlines (WHEN: 16 court days notice, 9 days opposition, 5 days reply)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1005',
        source: 'critical_filing_question_WHEN'
      },
      {
        ruleNumber: '1013',
        title: 'CCP Section 1013 - Service Time Extensions (WHEN: +5 days CA, +10 out-of-state, +2 court days fax)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1013',
        source: 'critical_filing_question_WHEN'
      },
      {
        ruleNumber: '1013a',
        title: 'CCP Section 1013a - Additional Service Time Extensions (WHEN: Extended deadlines)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1013a',
        source: 'critical_filing_question_WHEN'
      },
      {
        ruleNumber: '12',
        title: 'CCP Section 12 - Time Computation Rules (WHEN: How to calculate filing deadlines)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=12',
        source: 'critical_filing_question_WHEN'
      },
      {
        ruleNumber: '12a',
        title: 'CCP Section 12a - Holiday Extensions (WHEN: Holiday deadline extensions)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=12a',
        source: 'critical_filing_question_WHEN'
      },
      {
        ruleNumber: '12c',
        title: 'CCP Section 12c - Weekend and Holiday Computations (WHEN: Weekend/holiday deadline rules)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=12c',
        source: 'critical_filing_question_WHEN'
      },
      {
        ruleNumber: '430.30',
        title: 'CCP Section 430.30 - Demurrer Filing Deadline (WHEN: 30 days after service)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=430.30',
        source: 'critical_filing_question_WHEN'
      },
      {
        ruleNumber: '2024.020',
        title: 'CCP Section 2024.020 - Discovery Cutoff (WHEN: 30 days before trial)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=2024.020',
        source: 'critical_filing_question_WHEN'
      },
      {
        ruleNumber: '2030.300',
        title: 'CCP Section 2030.300 - Motion to Compel Interrogatories (WHEN: 45-day deadline)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=2030.300',
        source: 'critical_filing_question_WHEN'
      },
      {
        ruleNumber: '2031.310',
        title: 'CCP Section 2031.310 - Motion to Compel Documents (WHEN: 45-day deadline)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=2031.310',
        source: 'critical_filing_question_WHEN'
      },
      {
        ruleNumber: '2025.480',
        title: 'CCP Section 2025.480 - Motion to Compel Deposition (WHEN: 60-day deadline)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=2025.480',
        source: 'critical_filing_question_WHEN'
      },
      
      // HOW - Critical Filing Procedures and Methods
      {
        ruleNumber: '1010',
        title: 'CCP Section 1010 - Service Methods (HOW: Mail, personal, electronic service procedures)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1010',
        source: 'critical_filing_question_HOW'
      },
      {
        ruleNumber: '1010.5',
        title: 'CCP Section 1010.5 - Additional Service Methods (HOW: Alternative service procedures)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1010.5',
        source: 'critical_filing_question_HOW'
      },
      {
        ruleNumber: '1010.6',
        title: 'CCP Section 1010.6 - Electronic Filing Procedures (HOW: Electronic service requirements)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1010.6',
        source: 'critical_filing_question_HOW'
      },
      {
        ruleNumber: '430.10',
        title: 'CCP Section 430.10 - Demurrer Grounds (HOW: Proper grounds for demurrer)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=430.10',
        source: 'critical_filing_question_HOW'
      },
      {
        ruleNumber: '430.20',
        title: 'CCP Section 430.20 - Demurrer Procedure (HOW: Filing procedure for demurrer)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=430.20',
        source: 'critical_filing_question_HOW'
      },
      {
        ruleNumber: '430.40',
        title: 'CCP Section 430.40 - Demurrer Hearing Procedures (HOW: Court hearing procedures)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=430.40',
        source: 'critical_filing_question_HOW'
      },
      {
        ruleNumber: '430.41',
        title: 'CCP Section 430.41 - Meet and Confer for Demurrer (HOW: Required meet and confer procedure)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=430.41',
        source: 'critical_filing_question_HOW'
      },
      {
        ruleNumber: '435',
        title: 'CCP Section 435 - Motion to Strike Procedure (HOW: Filing motion to strike)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=435',
        source: 'critical_filing_question_HOW'
      },
      {
        ruleNumber: '436',
        title: 'CCP Section 436 - Grounds for Motion to Strike (HOW: Proper strike motion grounds)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=436',
        source: 'critical_filing_question_HOW'
      },
      {
        ruleNumber: '472',
        title: 'CCP Section 472 - Amendment Procedure (HOW: How to amend pleadings)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=472',
        source: 'critical_filing_question_HOW'
      },
      {
        ruleNumber: '472a',
        title: 'CCP Section 472a - Amendment by Right (HOW: Automatic amendment procedures)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=472a',
        source: 'critical_filing_question_HOW'
      },
      {
        ruleNumber: '472c',
        title: 'CCP Section 472c - Amendment by Leave (HOW: Court permission for amendments)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=472c',
        source: 'critical_filing_question_HOW'
      },
      {
        ruleNumber: '472d',
        title: 'CCP Section 472d - Amendment Requirements (HOW: Amendment format requirements)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=472d',
        source: 'critical_filing_question_HOW'
      },
      {
        ruleNumber: '1003',
        title: 'CCP Section 1003 - Ex Parte Application Procedure (HOW: Emergency filing procedures)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1003',
        source: 'critical_filing_question_HOW'
      },
      {
        ruleNumber: '473',
        title: 'CCP Section 473 - Relief from Default (HOW: Procedure to fix filing errors)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=473',
        source: 'critical_filing_question_HOW'
      },
      
      // WHERE - Venue and Jurisdiction for Filing (NOTE: CCP 392, 411.10 not successfully extracted)
      {
        ruleNumber: '410.10',
        title: 'CCP Section 410.10 - Jurisdiction (WHERE: Proper court for filing)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=410.10',
        source: 'critical_filing_question_WHERE'
      },
      
      // WHAT - Required Document Contents and Components
      {
        ruleNumber: '425.10',
        title: 'CCP Section 425.10 - Complaint Contents (WHAT: Required complaint elements)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=425.10',
        source: 'critical_filing_question_WHAT'
      },
      {
        ruleNumber: '425.11',
        title: 'CCP Section 425.11 - Complaint Caption (WHAT: Caption format requirements)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=425.11',
        source: 'critical_filing_question_WHAT'
      },
      {
        ruleNumber: '425.12',
        title: 'CCP Section 425.12 - Verification Requirements (WHAT: When verification required)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=425.12',
        source: 'critical_filing_question_WHAT'
      },
      {
        ruleNumber: '425.13',
        title: 'CCP Section 425.13 - Additional Complaint Requirements (WHAT: Special complaint elements)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=425.13',
        source: 'critical_filing_question_WHAT'
      },
      {
        ruleNumber: '431.30',
        title: 'CCP Section 431.30 - Answer Contents (WHAT: Required answer elements)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=431.30',
        source: 'critical_filing_question_WHAT'
      },
      {
        ruleNumber: '431.40',
        title: 'CCP Section 431.40 - Answer Requirements (WHAT: Additional answer requirements)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=431.40',
        source: 'critical_filing_question_WHAT'
      },
      {
        ruleNumber: '426.10',
        title: 'CCP Section 426.10 - Cross-Complaint Requirements (WHAT: Required cross-complaint elements)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=426.10',
        source: 'critical_filing_question_WHAT'
      },
      {
        ruleNumber: '426.30',
        title: 'CCP Section 426.30 - Cross-Complaint Procedures (WHAT: Cross-complaint filing requirements)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=426.30',
        source: 'critical_filing_question_WHAT'
      },
      {
        ruleNumber: '426.50',
        title: 'CCP Section 426.50 - Related Cross-Complaint Rules (WHAT: Additional cross-complaint requirements)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=426.50',
        source: 'critical_filing_question_WHAT'
      },
      {
        ruleNumber: '1014',
        title: 'CCP Section 1014 - Proof of Service (WHAT: Required proof of service contents)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1014',
        source: 'critical_filing_question_WHAT'
      },
      {
        ruleNumber: '2025.010',
        title: 'CCP Section 2025.010 - Deposition Notice (WHAT: Required deposition notice contents)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=2025.010',
        source: 'critical_filing_question_WHAT'
      },
      {
        ruleNumber: '2030.010',
        title: 'CCP Section 2030.010 - Interrogatory Requirements (WHAT: Required interrogatory format)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=2030.010',
        source: 'critical_filing_question_WHAT'
      },
      {
        ruleNumber: '2031.010',
        title: 'CCP Section 2031.010 - Document Request Requirements (WHAT: Required document request format)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=2031.010',
        source: 'critical_filing_question_WHAT'
      },
      {
        ruleNumber: '2033.010',
        title: 'CCP Section 2033.010 - Request for Admissions (WHAT: Required admission request format)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=2033.010',
        source: 'critical_filing_question_WHAT'
      },
      {
        ruleNumber: '664',
        title: 'CCP Section 664 - Judgment Filing Requirements (WHAT: Required judgment contents)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=664',
        source: 'critical_filing_question_WHAT'
      },
      {
        ruleNumber: '664.5',
        title: 'CCP Section 664.5 - Additional Judgment Requirements (WHAT: Supplemental judgment contents)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=664.5',
        source: 'critical_filing_question_WHAT'
      },
      {
        ruleNumber: '664.6',
        title: 'CCP Section 664.6 - Judgment Format Requirements (WHAT: Judgment formatting rules)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=664.6',
        source: 'critical_filing_question_WHAT'
      },
      {
        ruleNumber: '667',
        title: 'CCP Section 667 - Judgment Entry Requirements (WHAT: Judgment entry procedures)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=667',
        source: 'critical_filing_question_WHAT'
      },
      {
        ruleNumber: '670',
        title: 'CCP Section 670 - Judgment Filing Procedures (WHAT: Judgment filing requirements)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=670',
        source: 'critical_filing_question_WHAT'
      },
      
      // WHO - Capacity and Authority to File (NOTE: CCP 372 not successfully extracted)
      {
        ruleNumber: '367',
        title: 'CCP Section 367 - Capacity to Sue (WHO: Who has authority to file)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=367',
        source: 'critical_filing_question_WHO'
      },
      
      // FORMAT - Document Formatting Requirements
      {
        ruleNumber: '128.7',
        title: 'CCP Section 128.7 - Document Format Standards (FORMAT: Required document formatting)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=128.7',
        source: 'critical_filing_question_FORMAT'
      },
      
      // POST-TRIAL PROCEDURES
      {
        ruleNumber: '659',
        title: 'CCP Section 659 - New Trial Motion (WHEN/HOW: Post-trial motion procedures)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=659',
        source: 'critical_filing_question_WHEN_HOW'
      },
      {
        ruleNumber: '659a',
        title: 'CCP Section 659a - New Trial Motion Requirements (WHAT: Required new trial motion contents)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=659a',
        source: 'critical_filing_question_WHAT'
      },
      {
        ruleNumber: '663',
        title: 'CCP Section 663 - JNOV Motion (WHEN/HOW: Judgment notwithstanding verdict procedures)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=663',
        source: 'critical_filing_question_WHEN_HOW'
      },
      
      // DISCOVERY PROCEDURES
      {
        ruleNumber: '2016.010',
        title: 'CCP Section 2016.010 - Discovery Definitions (WHAT: Discovery procedure definitions)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=2016.010',
        source: 'critical_filing_question_WHAT'
      },
      {
        ruleNumber: '2023.010',
        title: 'CCP Section 2023.010 - Discovery Sanctions (HOW: Discovery violation procedures)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=2023.010',
        source: 'critical_filing_question_HOW'
      },
      
      // CRITICAL WRIT AND SPECIAL PROCEDURE FILING REQUIREMENTS
      {
        ruleNumber: '1086',
        title: 'CCP Section 1086 - Writ of Mandate Filing (WHAT/HOW: Required petition contents and procedure)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1086',
        source: 'critical_filing_question_WHAT_HOW'
      },
      {
        ruleNumber: '1094.5',
        title: 'CCP Section 1094.5 - Administrative Mandate Filing (WHAT/HOW: Required administrative petition contents)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1094.5',
        source: 'critical_filing_question_WHAT_HOW'
      },
      {
        ruleNumber: '1094.6',
        title: 'CCP Section 1094.6 - Administrative Mandate Procedures (HOW: Administrative petition procedures)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1094.6',
        source: 'critical_filing_question_HOW'
      },
      {
        ruleNumber: '527',
        title: 'CCP Section 527 - TRO Filing Requirements (WHAT/HOW: Emergency relief filing requirements)',
        url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=527',
        source: 'critical_filing_question_WHAT_HOW'
      }
    ];
    
    return criticalSubsections;
  }

  isFilingRelatedSection(section) {
    // Handle malformed input
    if (!section || !section.ruleNumber) {
      return false;
    }
    
    // Handle lettered subsections (like 437c) by extracting the numeric part
    const ruleNumber = section.ruleNumber;
    const numericPart = parseFloat(ruleNumber.replace(/[a-z]/g, ''));
    
    // EXCLUSION CRITERIA - Remove sections that don't answer the 6 filing questions
    const exclusionRanges = [
      // COMPREHENSIVE POST-JUDGMENT ENFORCEMENT EXCLUSIONS (AFTER lawsuit is won)
      
      // Judgment enforcement and collection procedures (680-724 range)
      { range: [680, 699.5], reason: 'Post-judgment enforcement procedures - not document filing during litigation' },
      
      // Property exemptions - ALL of them (what creditors cannot seize)
      { range: [699.5, 699.799], reason: 'Property exemptions - not filing procedures during litigation' },
      
      // Execution, levy, and asset seizure procedures (700-724 range)  
      { range: [700, 724.999], reason: 'Post-judgment execution and levy procedures - not filing procedures during litigation' },
      
      // Extended judgment enforcement procedures (726-799 range)
      { range: [726, 799], reason: 'Post-judgment asset seizure procedures - not document filing during litigation' },
      
      // Substantive legal rights and outcomes (not filing procedures)
      { range: [340, 366], reason: 'Limitation periods - substantive law, not filing procedures' },
      { range: [377, 391], reason: 'Statute of limitations - substantive law, not filing procedures' },
      { range: [631, 658], reason: 'Trial procedures - not document filing procedures' },
      { range: [664, 679], reason: 'Trial outcomes (excluding post-trial motions) - not document filing procedures' },
      { range: [1000.1, 1000.5], reason: 'Evidence presentation - not document filing procedures' },
      
      // Jury and trial procedures (not filing)
      { range: [190, 237], reason: 'Jury selection and trial - not document filing procedures' },
      { range: [607, 630], reason: 'Trial management - not document filing procedures' }
    ];
    
    // Check if section should be excluded
    const shouldExclude = exclusionRanges.some(exclusion => 
      numericPart >= exclusion.range[0] && numericPart <= exclusion.range[1]
    );
    
    if (shouldExclude) {
      console.log(`      ❌ Section ${section.ruleNumber} excluded - not about document filing procedures`);
      return false;
    }
    
    // INCLUSION CRITERIA - Keep only sections that answer the 6 filing questions
    const documentFilingSections = [
      // WHEN must documents be filed? (Deadlines/Timing)
      { range: [12, 12], category: 'Time Computation Rules - WHEN to file', question: 'WHEN' },
      { range: [12, 12.5], category: 'Calendar and Court Days - WHEN to file', question: 'WHEN' },
      { range: [1005, 1005], category: 'Motion Filing Deadlines - WHEN to file', question: 'WHEN' },
      { range: [1012, 1013], category: 'Service Timing Extensions - WHEN to file', question: 'WHEN' },
      { range: [430.30, 430.30], category: 'Demurrer Filing Deadlines - WHEN to file', question: 'WHEN' },
      { range: [2024.020, 2024.020], category: 'Discovery Cutoff Deadlines - WHEN to file', question: 'WHEN' },
      { range: [2025.480, 2025.480], category: 'Deposition Motion Deadlines - WHEN to file', question: 'WHEN' },
      { range: [2030.300, 2030.300], category: 'Interrogatory Motion Deadlines - WHEN to file', question: 'WHEN' },
      { range: [2031.310, 2031.310], category: 'Document Production Deadlines - WHEN to file', question: 'WHEN' },
      { range: [659, 663], category: 'Post-Trial Motion Deadlines - WHEN to file', question: 'WHEN' },
      { range: [1013, 1013], category: 'Electronic Service Extensions - WHEN to file', question: 'WHEN' },
      { range: [36, 36], category: 'Court Calendar Preferences - WHEN/WHERE to file', question: 'WHEN' },
      
      // HOW must documents be filed? (Format/Procedure)
      { range: [430.10, 430.41], category: 'Demurrer Procedures - HOW to file', question: 'HOW' },
      { range: [425.10, 425.13], category: 'Complaint Format - HOW to file', question: 'HOW' },
      { range: [431.30, 431.40], category: 'Answer Format - HOW to file', question: 'HOW' },
      { range: [435, 437], category: 'Motion to Strike Procedures - HOW to file', question: 'HOW' },
      { range: [437, 438], category: 'Summary Judgment Procedures - HOW to file', question: 'HOW' },
      { range: [1010, 1014], category: 'Service Procedures - HOW to serve/file', question: 'HOW' },
      { range: [1010.6, 1010.6], category: 'Electronic Filing Procedures - HOW to file', question: 'HOW' },
      { range: [1010.5, 1010.5], category: 'Overnight Delivery Service - HOW to serve', question: 'HOW' },
      { range: [472, 472], category: 'Amendment Procedures - HOW to amend', question: 'HOW' },
      { range: [1003, 1003], category: 'Ex Parte Application Procedures - HOW to file', question: 'HOW' },
      { range: [1048, 1048], category: 'Case Consolidation Procedures - HOW to file', question: 'HOW' },
      
      // WHERE must documents be filed? (Venue/Jurisdiction)
      { range: [392, 401], category: 'Venue Requirements - WHERE to file', question: 'WHERE' },
      { range: [410.10, 418.11], category: 'Jurisdiction for Filing - WHERE to file', question: 'WHERE' },
      { range: [411.10, 411.35], category: 'Proper Court for Filing - WHERE to file', question: 'WHERE' },
      
      // WHAT must be part of certain document filings? (Required components)
      { range: [425.10, 425.13], category: 'Complaint Required Contents - WHAT to include', question: 'WHAT' },
      { range: [426.10, 426.50], category: 'Cross-Complaint Requirements - WHAT to include', question: 'WHAT' },
      { range: [430.20, 430.20], category: 'Demurrer Required Contents - WHAT to include', question: 'WHAT' },
      { range: [437, 438], category: 'Summary Judgment Required Docs - WHAT to include', question: 'WHAT' },
      { range: [1014, 1014], category: 'Proof of Service Requirements - WHAT to include', question: 'WHAT' },
      { range: [2025.010, 2025.020], category: 'Deposition Notice Requirements - WHAT to include', question: 'WHAT' },
      { range: [2030.010, 2030.030], category: 'Interrogatory Requirements - WHAT to include', question: 'WHAT' },
      { range: [2031.010, 2031.030], category: 'Document Request Requirements - WHAT to include', question: 'WHAT' },
      
      // WHO can file documents? (Capacity/Authority)
      { range: [367, 367], category: 'Capacity to Sue - WHO can file', question: 'WHO' },
      { range: [372, 373], category: 'Attorney Authority - WHO can file', question: 'WHO' },
      { range: [425.12, 425.12], category: 'Verification Authority - WHO can verify', question: 'WHO' },
      
      // WHAT format must documents follow? (Formatting rules)
      { range: [425.11, 425.11], category: 'Caption Format - WHAT format', question: 'FORMAT' },
      { range: [128.7, 128.7], category: 'Document Format Standards - WHAT format', question: 'FORMAT' },
      
      // Additional critical filing procedure sections
      { range: [412.10, 412.30], category: 'Summons Filing - Critical filing document', question: 'HOW/WHAT' },
      { range: [473, 473], category: 'Relief from Filing Errors - Critical procedure', question: 'HOW' },
      { range: [664, 670], category: 'Judgment Filing Requirements - Critical filing', question: 'HOW/WHAT' },
      { range: [1086, 1086], category: 'Writ Filing Procedures - Critical filing', question: 'HOW/WHAT' },
      { range: [1094.5, 1094.6], category: 'Administrative Mandate Filing - Critical filing', question: 'HOW/WHAT' }
    ];
    
    // Check if section answers any of the 6 filing questions
    const answersFilingQuestions = documentFilingSections.some(sectionRange => 
      numericPart >= sectionRange.range[0] && numericPart <= sectionRange.range[1]
    );
    
    if (answersFilingQuestions) {
      const matchingCategory = documentFilingSections.find(sectionRange => 
        numericPart >= sectionRange.range[0] && numericPart <= sectionRange.range[1]
      );
      console.log(`      ✅ Section ${section.ruleNumber} answers filing question: ${matchingCategory.question} - ${matchingCategory.category}`);
      return true;
    }
    
    // Apply enhanced keyword-based filtering focused on the 6 questions
    const filingQuestionKeywords = {
      // WHEN - Deadlines and timing
      when: [
        'deadline', 'within', 'days', 'time limit', 'before', 'after',
        'calendar days', 'court days', 'business days',
        'filing deadline', 'service deadline', 'notice deadline',
        'cutoff', 'time computation', 'extension', 'late filing'
      ],
      
      // HOW - Procedures and methods  
      how: [
        'procedure', 'method', 'process', 'steps', 'requirements',
        'filing procedure', 'service procedure', 'electronic filing',
        'mail service', 'personal service', 'proof of service',
        'meet and confer', 'notice requirements', 'application procedure'
      ],
      
      // WHERE - Venue and jurisdiction
      where: [
        'venue', 'jurisdiction', 'proper court', 'county', 'district',
        'where to file', 'court location', 'filing location',
        'transfer', 'forum', 'proper forum'
      ],
      
      // WHAT - Required document contents
      what: [
        'shall contain', 'must contain', 'shall include', 'must include',
        'required contents', 'required elements', 'separate statement',
        'points and authorities', 'supporting declaration', 'exhibits',
        'notice of motion', 'memorandum', 'brief', 'attachment'
      ],
      
      // WHO - Capacity and authority  
      who: [
        'capacity', 'authority', 'standing', 'who may file',
        'attorney', 'party', 'representative', 'agent',
        'verification', 'sworn', 'under penalty of perjury'
      ],
      
      // FORMAT - Document formatting
      format: [
        'format', 'formatting', 'caption', 'title', 'heading',
        'font', 'margins', 'spacing', 'numbering', 'page limits',
        'document format', 'pleading format', 'form', 'template',
        'typed', 'written', 'legible', 'paper size'
      ]
    };
    
    // Strict exclusion terms for non-filing content
    const strictExclusionTerms = [
      // POST-JUDGMENT ENFORCEMENT TERMS (procedures that happen AFTER lawsuit is won)
      'property exemption', 'homestead exemption', 'wage exemption', 'personal property exemption',
      'exempt property', 'exempt assets', 'exemption from execution',
      'wage garnishment', 'earnings withholding', 'garnishment procedure',
      'writ of execution', 'execution procedures', 'levy', 'seizure',
      'judgment debtor examination', 'debtor examination', 'asset examination',
      'third-party claim', 'claim of exemption', 'claim procedures',
      'real property sale', 'execution sale', 'property auction',
      'distribution of proceeds', 'sale proceeds', 'sheriff sale',
      'lien on real property', 'real property lien', 'property liens',
      'attachment of property', 'property attachment', 'asset seizure',
      
      // Substantive legal outcomes (not filing procedures)
      'damages', 'liability', 'breach', 'tort', 'contract',
      'negligence', 'fraud', 'defamation',
      
      // Trial procedures and outcomes (not filing procedures)
      'jury verdict', 'trial outcome', 'evidence rules',
      'witness examination', 'closing arguments', 'trial testimony',
      
      // Criminal law
      'criminal', 'felony', 'misdemeanor', 'sentence', 'punishment'
    ];

    const combinedText = (section.title || '').toLowerCase();
    
    // Check for strict exclusion terms
    if (strictExclusionTerms.some(term => combinedText.includes(term.toLowerCase()))) {
      console.log(`      ❌ Section ${section.ruleNumber} excluded - contains non-filing content`);
      return false;
    }

    // Calculate relevance score based on the 6 filing questions
    let relevanceScore = 0;
    const foundTerms = [];
    const questionsAnswered = [];

    // Check each question category (higher weight for exact matches)
    Object.entries(filingQuestionKeywords).forEach(([question, keywords]) => {
      keywords.forEach(keyword => {
        if (combinedText.includes(keyword.toLowerCase())) {
          relevanceScore += 4; // Higher weight for question-specific terms
          foundTerms.push(keyword);
          if (!questionsAnswered.includes(question)) {
            questionsAnswered.push(question);
          }
        }
      });
    });

    // Require higher threshold and must answer at least one of the 6 questions
    const isRelevant = relevanceScore >= 8 && questionsAnswered.length > 0;

    if (isRelevant) {
      console.log(`      📋 Section ${section.ruleNumber} answers filing questions: ${questionsAnswered.join(', ')} - Score: ${relevanceScore}`);
    }

    return isRelevant;
  }

  async downloadIndividualRulePDF(section, index) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      console.log(`      🔗 Visiting section page: ${section.url}`);
      
      await page.goto(section.url, { 
        waitUntil: 'domcontentloaded',
        timeout: 15000 
      });
      
      await page.waitForTimeout(1000);
      
      const filename = this.generateRuleFilename(section, index);
      const filePath = path.join(this.downloadDir, filename);
      
      // Try to find and trigger PDF download
      const downloadSuccess = await this.downloadPDF(page, section.url, filePath, section.ruleNumber);
      
      await browser.close();
      
      if (downloadSuccess) {
        return {
          filePath: typeof downloadSuccess === 'string' ? downloadSuccess : filePath, // Handle JSON files from web scraping
          ruleData: {
            ruleNumber: section.ruleNumber,
            title: section.title,
            url: section.url,
            filename: filename,
            source: section.source,
            filingRelevance: { score: 8, isRelevant: true, source: 'pre_filtered' },
            contentType: typeof downloadSuccess === 'string' && downloadSuccess.endsWith('.json') ? 'web_scraped' : 'pdf'
          }
        };
      }
      
      return null;
      
    } catch (error) {
      await browser.close();
      throw error;
    }
  }

    async downloadPDF(page, pdfUrl, filePath, sectionNumber) {
    console.log(`        🔍 Looking for PDF download options...`);
    
    // Get preferred method from cache
    const preferredMethod = this.getPreferredDownloadMethod(sectionNumber);
    const allMethods = ['pdf_link', 'print_button', 'jsf_form', 'browser_print', 'web_scraping'];
    
    // Reorder methods to try preferred method first
    let methodsToTry = [...allMethods];
    if (preferredMethod && allMethods.includes(preferredMethod)) {
      methodsToTry = [preferredMethod, ...allMethods.filter(m => m !== preferredMethod)];
      console.log(`        🎯 Trying preferred method first: ${preferredMethod}`);
    }
    
    for (const method of methodsToTry) {
      let success = false;
      
      try {
        switch (method) {
          case 'pdf_link':
            success = await this.tryPdfLinkDownload(page, filePath);
            break;
          case 'print_button':
            success = await this.tryPrintButtonDownload(page, filePath);
            break;
          case 'jsf_form':
            success = await this.tryJsfFormDownload(page, filePath);
            break;
          case 'browser_print':
            success = await this.tryBrowserPrintDownload(page, filePath);
            break;
          case 'web_scraping':
            success = await this.tryWebScrapingDownload(page, filePath);
            break;
        }
        
        // Update cache with success/failure
        this.updateDownloadMethodCache(sectionNumber, method, success);
        
        if (success) {
          console.log(`        ✅ Successfully downloaded using method: ${method}`);
          // Save cache after successful download
          await this.saveDownloadMethodCache();
          return true;
        }
        
      } catch (error) {
        console.log(`        ⚠️  Method ${method} failed: ${error.message}`);
        this.updateDownloadMethodCache(sectionNumber, method, false);
      }
    }
    
    console.log(`        ❌ All download methods failed for section ${sectionNumber}`);
    await this.saveDownloadMethodCache();
    return false;
  }

  async tryPdfLinkDownload(page, filePath) {
    console.log(`        🔗 Trying PDF link download...`);
    
    const pdfLinkSelectors = [
      '#displayCodeSection\\:pdf_link',  // Specific PDF link ID from the HTML
      'a[id*="pdf_link"]',               // More general PDF link selector
      'a:has-text("PDF")',               // Generic PDF link text
    ];
    
    let pdfLink = null;
    for (const selector of pdfLinkSelectors) {
      try {
        const links = await page.$$(selector);
        if (links.length > 0) {
          pdfLink = links[0];
          console.log(`        🔗 Found PDF link with selector: ${selector}`);
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (!pdfLink) {
      return false;
    }
    
    try {
      // Set up download event listener
      const downloadPromise = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
      
      // Click the PDF link
      await pdfLink.click();
      
      // Wait for download
      const download = await downloadPromise;
      if (download) {
        await download.saveAs(filePath);
        
        // Verify the downloaded file is a valid PDF
        const isValidPDF = await this.verifyPDFContent(filePath);
        if (isValidPDF) {
          return true;
        } else {
          // Delete the invalid file
          await fs.unlink(filePath).catch(() => {});
          return false;
        }
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  async tryPrintButtonDownload(page, filePath) {
    console.log(`        🖨️  Trying print button download...`);
    
    const printButtonSelectors = [
      'button[onclick*="printPopup"]',     // Specific print button from HTML
      'button:has-text("print")',         // Generic print button
      'a:has-text("print")',              // Print link
    ];
    
    let printButton = null;
    for (const selector of printButtonSelectors) {
      try {
        const buttons = await page.$$(selector);
        if (buttons.length > 0) {
          printButton = buttons[0];
          console.log(`        🖨️  Found print button with selector: ${selector}`);
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (!printButton) {
      return false;
    }
    
    try {
      // Set up download event listener for print
      const downloadPromise = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
      
      // Click the print button
      await printButton.click();
      
      // Wait a bit for print dialog
      await page.waitForTimeout(2000);
    
      const download = await downloadPromise;
      if (download) {
        await download.saveAs(filePath);
        
        // Verify the downloaded file is a valid PDF
        const isValidPDF = await this.verifyPDFContent(filePath);
        if (isValidPDF) {
          return true;
        } else {
          // Delete the invalid file
          await fs.unlink(filePath).catch(() => {});
          return false;
        }
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  async tryJsfFormDownload(page, filePath) {
    console.log(`        📋 Trying JSF form download...`);
    
    try {
      // Look for the form and try to submit it with PDF parameters
      const form = await page.$('#displayCodeSection');
      if (!form) {
        return false;
      }
      
      // Try to trigger PDF generation via JavaScript
      const result = await page.evaluate(() => {
        // Check if there's a PDF link we can trigger programmatically
        const pdfLink = document.querySelector('#displayCodeSection\\:pdf_link');
        if (pdfLink && pdfLink.onclick) {
          pdfLink.click();
          return true;
        }
        return false;
      });
      
      if (!result) {
        return false;
      }
      
      // Wait for potential download
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
      const download = await downloadPromise;
      
      if (download) {
        await download.saveAs(filePath);
        
        // Verify the downloaded file is a valid PDF
        const isValidPDF = await this.verifyPDFContent(filePath);
        if (isValidPDF) {
          return true;
        } else {
          // Delete the invalid file
          await fs.unlink(filePath).catch(() => {});
          return false;
        }
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  async tryBrowserPrintDownload(page, filePath) {
    console.log(`        📄 Trying browser print-to-PDF...`);
    
    try {
      await page.pdf({
        path: filePath,
        format: 'A4',
        printBackground: true,
        margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
      });
      
      const exists = await this.fileExists(filePath);
      if (exists) {
        // Verify the PDF contains actual legal content, not error messages
        const isValidPDF = await this.verifyPDFContent(filePath);
        if (isValidPDF) {
          return true;
        } else {
          // Delete the invalid PDF
          await fs.unlink(filePath).catch(() => {});
          return false;
        }
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  async tryWebScrapingDownload(page, filePath) {
    console.log(`        🌐 Trying web scraping fallback...`);
    
    try {
      return await this.scrapeWebPageContent(page, filePath);
    } catch (error) {
      return false;
    }
  }

  async processFilesWithEnhancedProcessor(filePaths, ruleData) {
    // Separate PDFs and JSON files
    const pdfPaths = filePaths.filter(path => path.endsWith('.pdf'));
    const jsonPaths = filePaths.filter(path => path.endsWith('.json'));
    
    console.log(`📊 Processing ${pdfPaths.length} PDFs and ${jsonPaths.length} web-scraped JSON files...`);
    
    const results = [];
    
    // Process PDFs with PyMuPDF
    if (pdfPaths.length > 0) {
      const pdfResults = await this.processPDFsWithPyMuPDF(pdfPaths, ruleData.filter(r => r.contentType !== 'web_scraped'));
      results.push(...pdfResults);
    }
    
    // Process JSON files directly
    if (jsonPaths.length > 0) {
      const jsonResults = await this.processWebScrapedJSON(jsonPaths, ruleData.filter(r => r.contentType === 'web_scraped'));
      results.push(...jsonResults);
    }
    
    return results;
  }

  async processPDFsWithPyMuPDF(pdfPaths, ruleData) {
    return new Promise((resolve, reject) => {
      const pythonScript = this.generateEnhancedPyMuPDFScript(pdfPaths, ruleData);
      const scriptPath = path.join(this.outputDir, 'process_ccp_pdfs.py');
      
      fs.writeFile(scriptPath, pythonScript)
        .then(() => {
          console.log('🐍 Running enhanced PyMuPDF processing script...');
          
          const pythonProcess = spawn('python3', [scriptPath], {
            stdio: ['inherit', 'pipe', 'pipe']
          });
          
          let output = '';
          let error = '';
          
          pythonProcess.stdout.on('data', (data) => {
            const text = data.toString();
            output += text;
            console.log(text.trim());
          });
          
          pythonProcess.stderr.on('data', (data) => {
            const text = data.toString();
            error += text;
            console.error(text.trim());
          });
          
          pythonProcess.on('close', (code) => {
            if (code === 0) {
              try {
                const resultsPath = path.join(this.outputDir, 'ccp_pymupdf_results.json');
                fs.readFile(resultsPath, 'utf8')
                  .then(data => resolve(JSON.parse(data)))
                  .catch(err => reject(new Error(`Failed to read results: ${err.message}`)));
              } catch (parseError) {
                reject(new Error(`Failed to parse results: ${parseError.message}`));
              }
            } else {
              reject(new Error(`Python script failed with code ${code}: ${error}`));
            }
          });
        })
        .catch(reject);
    });
  }

  generateEnhancedPyMuPDFScript(pdfPaths, ruleData) {
    // Convert JavaScript boolean values to Python boolean values
    const pythonCompatibleRuleData = JSON.stringify(ruleData)
      .replace(/\btrue\b/g, 'True')
      .replace(/\bfalse\b/g, 'False')
      .replace(/\bnull\b/g, 'None');
    
    return `
import fitz
import json
import os
import sys
import re
from datetime import datetime

def extract_ccp_content(pdf_path, rule_info):
    """Extract content from a CCP PDF with rule-specific parsing"""
    try:
        # Check if file exists and has content
        if not os.path.exists(pdf_path):
            raise Exception(f"File not found: {pdf_path}")
        
        file_size = os.path.getsize(pdf_path)
        if file_size < 100:  # Less than 100 bytes is likely empty/corrupted
            raise Exception(f"File appears to be empty or corrupted (size: {file_size} bytes)")
        
        doc = fitz.open(pdf_path)
        
        # Check if document opened successfully
        if doc.is_closed:
            raise Exception("Document failed to open properly")
        
        if len(doc) == 0:
            doc.close()
            raise Exception("Document has no pages")
        
        # Extract metadata
        metadata = doc.metadata
        
        # Extract text content
        full_text = ""
        pages_content = []
        
        for page_num in range(len(doc)):
            try:
                page = doc[page_num]
                page_text = page.get_text()
                pages_content.append({
                    "page": page_num + 1,
                    "text": page_text.strip()
                })
                full_text += page_text + "\\n"
            except Exception as page_error:
                print(f"Warning: Error reading page {page_num + 1}: {page_error}")
                pages_content.append({
                    "page": page_num + 1,
                    "text": f"[Error reading page: {page_error}]"
                })
        
        # CCP-specific content analysis
        ccp_analysis = analyze_ccp_content(full_text, rule_info)
        
        # Store page count before closing document
        page_count = len(doc)
        doc.close()
        
        return {
            "rule_info": rule_info,
            "file_info": {
                "file_path": pdf_path,
                "file_name": os.path.basename(pdf_path),
                "status": "success"
            },
            "metadata": {
                "title": metadata.get("title", ""),
                "author": metadata.get("author", ""),
                "subject": metadata.get("subject", ""),
                "creator": metadata.get("creator", ""),
                "producer": metadata.get("producer", ""),
                "creation_date": metadata.get("creationDate", ""),
                "modification_date": metadata.get("modDate", "")
            },
            "content": {
                "full_text": full_text.strip(),
                "page_count": page_count,
                "pages": pages_content,
                "character_count": len(full_text.strip()),
                "word_count": len(full_text.strip().split())
            },
            "ccp_analysis": ccp_analysis,
            "extracted_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            "rule_info": rule_info,
            "file_info": {
                "file_path": pdf_path,
                "file_name": os.path.basename(pdf_path),
                "status": "error",
                "error": str(e)
            },
            "extracted_at": datetime.now().isoformat()
        }

def analyze_ccp_content(text, rule_info):
    """Analyze CCP content specifically for filing and procedural patterns"""
    analysis = {
        "section_number": rule_info.get("ruleNumber", ""),
        "section_title": rule_info.get("title", ""),
        "filing_relevance": rule_info.get("filingRelevance", {}),
        "procedural_requirements": [],
        "filing_procedures": [],
        "service_requirements": [],
        "deadlines_and_timing": [],
        "format_specifications": [],
        "cross_references": [],
        "key_provisions": []
    }
    
    # Extract procedural requirements
    proc_patterns = [
        r'shall\\s+(?:be\\s+)?(?:file[d]?|serve[d]?)\\s+([^.]{10,100})',
        r'must\\s+(?:be\\s+)?(?:file[d]?|serve[d]?)\\s+([^.]{10,100})',
        r'(?:filing|service)\\s+(?:shall|must)\\s+([^.]{10,100})',
        r'(?:document|paper|pleading)\\s+(?:shall|must)\\s+([^.]{10,100})'
    ]
    
    for pattern in proc_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            if len(match.strip()) > 15:
                analysis["procedural_requirements"].append(match.strip()[:200])
    
    # Extract timing requirements
    timing_patterns = [
        r'within\\s+(\\d+)\\s+(calendar\\s+days?|court\\s+days?|business\\s+days?|days?)',
        r'(\\d+)\\s+(calendar\\s+days?|court\\s+days?|business\\s+days?)\\s+(?:before|after|from)',
        r'(?:no\\s+later\\s+than|not\\s+later\\s+than)\\s+([^.]{5,50})',
        r'(?:deadline|due\\s+date|time\\s+limit)\\s+(?:is|shall\\s+be)\\s+([^.]{5,50})'
    ]
    
    for pattern in timing_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            if isinstance(match, tuple):
                timing_text = ' '.join(match)
            else:
                timing_text = match
            if len(timing_text.strip()) > 3:
                analysis["deadlines_and_timing"].append(timing_text.strip()[:150])
    
    # Extract cross-references
    ref_patterns = [
        r'(?:Section|Rule|Code)\\s+(\\d+\\.?\\d*(?:\\.\\d+)?)',
        r'Code\\s+of\\s+Civil\\s+Procedure\\s+[Ss]ection\\s+(\\d+\\.?\\d*)',
        r'California\\s+Rules\\s+of\\s+Court\\s+[Rr]ule\\s+(\\d+\\.?\\d*)',
    ]
    
    for pattern in ref_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            if match not in analysis["cross_references"]:
                analysis["cross_references"].append(match)
    
    # Extract key provisions (paragraphs with filing-related content)
    paragraphs = text.split('\\n\\n')
    filing_terms = ['filing', 'service', 'pleading', 'summons', 'complaint', 'procedure', 'deadline', 'format']
    
    for para in paragraphs:
        para = para.strip()
        if len(para) > 50 and any(term in para.lower() for term in filing_terms):
            analysis["key_provisions"].append(para[:300])
            if len(analysis["key_provisions"]) >= 5:  # Limit to top 5
                break
    
    return analysis

def main():
    pdf_paths = ${JSON.stringify(pdfPaths)}
    rule_data = ${pythonCompatibleRuleData}
    
    # Create mapping of PDF paths to rule data
    path_to_rule = {}
    for i, pdf_path in enumerate(pdf_paths):
        if i < len(rule_data):
            path_to_rule[pdf_path] = rule_data[i]
        else:
            path_to_rule[pdf_path] = {"ruleNumber": "Unknown", "title": "Unknown"}
    
    results = []
    
    print(f"Processing {len(pdf_paths)} CCP PDF files...")
    
    for i, pdf_path in enumerate(pdf_paths, 1):
        rule_info = path_to_rule.get(pdf_path, {})
        section_num = rule_info.get("ruleNumber", "Unknown")
        
        print(f"\\nProcessing {i}/{len(pdf_paths)}: CCP Section {section_num}")
        print(f"File: {os.path.basename(pdf_path)}")
        
        if not os.path.exists(pdf_path):
            print(f"❌ File not found: {pdf_path}")
            results.append({
                "rule_info": rule_info,
                "file_info": {
                    "file_path": pdf_path,
                    "status": "error",
                    "error": "File not found"
                }
            })
            continue
        
        result = extract_ccp_content(pdf_path, rule_info)
        results.append(result)
        
        if result["file_info"]["status"] == "success":
            content = result["content"]
            analysis = result["ccp_analysis"]
            print(f"✅ Success: {content['page_count']} pages, {content['word_count']} words")
            print(f"   📋 Procedural requirements: {len(analysis['procedural_requirements'])}")
            print(f"   ⏰ Timing requirements: {len(analysis['deadlines_and_timing'])}")
            print(f"   🔗 Cross-references: {len(analysis['cross_references'])}")
            print(f"   📄 Key provisions: {len(analysis['key_provisions'])}")
        else:
            print(f"❌ Error: {result['file_info'].get('error', 'Unknown error')}")
    
    # Save results
    output_path = "${path.join(this.outputDir, 'ccp_pymupdf_results.json').replace(/\\/g, '/')}"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\\n💾 CCP analysis results saved to: {output_path}")
    print(f"✅ Processed {len(results)} CCP section documents")
    
    # Generate summary
    successful = [r for r in results if r.get('file_info', {}).get('status') == 'success']
    total_procedures = sum(len(r.get('ccp_analysis', {}).get('procedural_requirements', [])) for r in successful)
    total_timing = sum(len(r.get('ccp_analysis', {}).get('deadlines_and_timing', [])) for r in successful)
    
    print(f"\\n📊 CCP Analysis Summary:")
    print(f"   • Successful extractions: {len(successful)}/{len(results)} documents")
    print(f"   • Total procedural requirements: {total_procedures}")
    print(f"   • Total timing requirements: {total_timing}")

if __name__ == "__main__":
    main()
`;
  }

  generateRuleFilename(section, index) {
    // CRITICAL FIX: Don't strip letters from section numbers (12a, 12c, 437c, etc.)
    const sectionNum = section.ruleNumber.replace(/[^0-9a-z.]/gi, '');
    const timestamp = new Date().toISOString().slice(0, 10);
    return `ccp_section_${sectionNum}_${timestamp}_${index}.pdf`;
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async verifyPDFContent(filePath) {
    try {
      // Check if file exists and has reasonable size
      const stats = await fs.stat(filePath);
      if (stats.size < 1000) { // Less than 1KB is likely not a real PDF
        return false;
      }

      // Read first few bytes to check PDF header
      const fileHandle = await fs.open(filePath, 'r');
      const buffer = Buffer.alloc(10);
      await fileHandle.read(buffer, 0, 10, 0);
      await fileHandle.close();
      
      const header = buffer.toString('ascii', 0, 4);
      if (header !== '%PDF') {
        return false;
      }

      // Quick content check using PyMuPDF to see if it contains error messages
      return new Promise((resolve) => {
        const { spawn } = require('child_process');
        const pythonScript = `
import fitz
import sys
import os

try:
    doc = fitz.open("${filePath}")
    if len(doc) == 0:
        print("INVALID")
        sys.exit(1)
    
    # Get first page text
    page_text = doc[0].get_text().lower()
    doc.close()
    
    # Check for error indicators
    error_indicators = [
        "required pdf file not available",
        "please try again sometime later",
        "code: select code",
        "search phrase:",
        "bill information",
        "california law",
        "publications",
        "other resources"
    ]
    
    if any(indicator in page_text for indicator in error_indicators):
        print("ERROR_PAGE")
    else:
        print("VALID")
        
except Exception as e:
    print("INVALID")
`;
        
        const pythonProcess = spawn('python3', ['-c', pythonScript]);
        let output = '';
        
        pythonProcess.stdout.on('data', (data) => {
          output += data.toString().trim();
        });
        
        pythonProcess.on('close', (code) => {
          resolve(output === 'VALID');
        });
        
        // Timeout after 5 seconds
        setTimeout(() => {
          pythonProcess.kill();
          resolve(false);
        }, 5000);
      });
      
    } catch (error) {
      console.log(`        ⚠️  PDF verification error: ${error.message}`);
      return false;
    }
  }

  async scrapeWebPageContent(page, filePath) {
    try {
      console.log(`        🌐 Scraping web page content as fallback...`);
      
      // Wait for page to be fully loaded
      await page.waitForTimeout(2000);
      
      // Extract the main content from the page
      const content = await page.evaluate(() => {
        // Look for the main content area
        const contentSelectors = [
          '#displayCodeSection',
          '.main-content',
          '.content',
          '.law-content',
          '.section-content',
          'main',
          'article'
        ];
        
        let mainContent = '';
        
        for (const selector of contentSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            // Remove navigation and non-content elements
            const clonedElement = element.cloneNode(true);
            
            // Remove unwanted elements
            const unwantedSelectors = [
              'nav', '.nav', '.navigation',
              'header', '.header',
              'footer', '.footer',
              '.breadcrumb', '.breadcrumbs',
              '.sidebar', '.side-nav',
              'script', 'style',
              '.search', '.search-box',
              '.print-button', '.pdf-button',
              '.social-media', '.share-buttons'
            ];
            
            unwantedSelectors.forEach(unwantedSelector => {
              const unwantedElements = clonedElement.querySelectorAll(unwantedSelector);
              unwantedElements.forEach(el => el.remove());
            });
            
            mainContent = clonedElement.innerText || clonedElement.textContent || '';
            if (mainContent.trim().length > 100) {
              break;
            }
          }
        }
        
        // If no specific content area found, get body text but filter out navigation
        if (!mainContent || mainContent.trim().length < 100) {
          const bodyText = document.body.innerText || document.body.textContent || '';
          
          // Filter out common navigation and error text
          const lines = bodyText.split('\n');
          const filteredLines = lines.filter(line => {
            const lowerLine = line.toLowerCase().trim();
            return lowerLine.length > 10 && 
                   !lowerLine.includes('search phrase') &&
                   !lowerLine.includes('bill information') &&
                   !lowerLine.includes('california law') &&
                   !lowerLine.includes('publications') &&
                   !lowerLine.includes('other resources') &&
                   !lowerLine.includes('my subscriptions') &&
                   !lowerLine.includes('my favorites') &&
                   !lowerLine.includes('add to my favorites') &&
                   !lowerLine.includes('cross-reference') &&
                   !lowerLine.includes('previous') &&
                   !lowerLine.includes('next') &&
                   !lowerLine.includes('home') &&
                   !lowerLine.includes('search') &&
                   !lowerLine.includes('highlight');
          });
          
          mainContent = filteredLines.join('\n');
        }
        
        return {
          title: document.title,
          url: window.location.href,
          content: mainContent.trim(),
          timestamp: new Date().toISOString()
        };
      });
      
      // Verify we got meaningful content
      if (!content.content || content.content.length < 50) {
        console.log(`        ❌ Insufficient content extracted from web page`);
        return false;
      }
      
      // Check if content contains error messages
      const lowerContent = content.content.toLowerCase();
      const errorIndicators = [
        'required pdf file not available',
        'please try again sometime later',
        'code: select code'
      ];
      
      if (errorIndicators.some(indicator => lowerContent.includes(indicator))) {
        console.log(`        ❌ Web page contains error messages`);
        return false;
      }
      
      // Create a "fake" PDF containing the web content for processing
      const webContentData = {
        source: 'web_scraping',
        title: content.title,
        url: content.url,
        content: content.content,
        timestamp: content.timestamp,
        note: 'This content was scraped from the web page because PDF was not available'
      };
      
      // Save as JSON file instead of PDF (we'll handle this in the processing script)
      const jsonPath = filePath.replace('.pdf', '.json');
      await fs.writeFile(jsonPath, JSON.stringify(webContentData, null, 2));
      
      console.log(`        ✅ Web content scraped and saved as JSON`);
      console.log(`        📄 Content length: ${content.content.length} characters`);
      
      // Return the JSON path so the processing script knows to handle it differently
      return jsonPath;
      
    } catch (error) {
      console.error(`        ❌ Web scraping error: ${error.message}`);
      return false;
    }
  }

  async shouldDownloadPDFs() {
    try {
      // If forceRefresh is enabled, always download regardless of age
      if (this.forceRefresh) {
        console.log('🔄 Force refresh enabled. Will download fresh copies regardless of PDF age.');
        return true;
      }

      // Check if download directory exists and has CCP section PDFs (not just any PDFs)
      const files = await fs.readdir(this.downloadDir).catch(() => []);
      const ccpSectionPdfFiles = files.filter(file => file.endsWith('.pdf') && file.startsWith('ccp_section_'));
      
      if (ccpSectionPdfFiles.length === 0) {
        console.log('📥 No existing CCP section PDFs found. Will download fresh copies.');
        return true;
      }
      
      // Check the age of the newest CCP section PDF file
      let newestTime = 0;
      for (const file of ccpSectionPdfFiles) {
        const filePath = path.join(this.downloadDir, file);
        const stats = await fs.stat(filePath);
        if (stats.mtime.getTime() > newestTime) {
          newestTime = stats.mtime.getTime();
        }
      }
      
      const hoursOld = (Date.now() - newestTime) / (1000 * 60 * 60);
      console.log(`📅 Newest CCP section PDF is ${hoursOld.toFixed(1)} hours old`);
      
      if (hoursOld > 24) {
        console.log('🔄 CCP section PDFs are older than 24 hours. Will download fresh copies.');
        return true;
      } else {
        console.log('✨ CCP section PDFs are recent. Will use existing files.');
        return false;
      }
      
    } catch (error) {
      console.log('⚠️  Error checking PDF age. Will download fresh copies.');
      return true;
    }
  }

  async getExistingPDFData() {
    try {
      const files = await fs.readdir(this.downloadDir);
      const pdfFiles = files.filter(file => file.endsWith('.pdf') && file.startsWith('ccp_section_'));
      
      const allRuleData = [];
      
      // Extract rule information from filenames
      for (const file of pdfFiles) {
        // Expected format: ccp_section_XXX_YYYY-MM-DD_N.pdf
        const match = file.match(/ccp_section_([0-9]+[a-z]?(?:\.[0-9]+)?)_(\d{4}-\d{2}-\d{2})_(\d+)\.pdf/);
        if (match) {
          const [, sectionNum, date, index] = match;
          allRuleData.push({
            ruleNumber: sectionNum,
            title: `CCP Section ${sectionNum}`,
            url: `https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=${sectionNum}`,
            filename: file,
            source: 'existing_pdf',
            filingRelevance: { score: 8, isRelevant: true, source: 'pre_filtered' }
          });
        }
      }
      
      console.log(`📁 Found ${pdfFiles.length} existing PDF files`);
      
      // Apply exclusion logic to existing PDFs to remove post-judgment enforcement sections
      console.log(`🔍 Applying exclusion logic to existing PDFs...`);
      const filteredRuleData = [];
      const filteredPdfPaths = [];
      
      for (let i = 0; i < allRuleData.length; i++) {
        const ruleData = allRuleData[i];
        const isFilingRelated = this.isFilingRelatedSection(ruleData);
        
        if (isFilingRelated) {
          filteredRuleData.push(ruleData);
          filteredPdfPaths.push(path.join(this.downloadDir, ruleData.filename));
        } else {
          console.log(`    🗑️  Excluding existing PDF: CCP ${ruleData.ruleNumber} (post-judgment enforcement)`);
        }
      }
      
      const excludedCount = allRuleData.length - filteredRuleData.length;
      console.log(`✅ Filtered existing PDFs: ${filteredRuleData.length} included, ${excludedCount} excluded`);
      
      return {
        pdfPaths: filteredPdfPaths,
        ruleData: filteredRuleData
      };
      
    } catch (error) {
      console.error('Error getting existing PDF data:', error);
      return { pdfPaths: [], ruleData: [] };
    }
  }

  async processWebScrapedJSON(jsonPaths, ruleData) {
    const results = [];
    
    console.log(`🌐 Processing ${jsonPaths.length} web-scraped JSON files...`);
    
    for (let i = 0; i < jsonPaths.length; i++) {
      const jsonPath = jsonPaths[i];
      const ruleInfo = ruleData[i] || {};
      
      try {
        console.log(`\n📄 Processing ${i + 1}/${jsonPaths.length}: ${path.basename(jsonPath)}`);
        
        // Read the JSON file
        const jsonContent = await fs.readFile(jsonPath, 'utf8');
        const webData = JSON.parse(jsonContent);
        
        // Analyze the web content
        const analysis = this.analyzeWebScrapedContent(webData.content, ruleInfo);
        
        const result = {
          rule_info: ruleInfo,
          file_info: {
            file_path: jsonPath,
            file_name: path.basename(jsonPath),
            status: "success",
            content_type: "web_scraped"
          },
          metadata: {
            title: webData.title || "",
            url: webData.url || "",
            scraped_at: webData.timestamp || "",
            source: "web_scraping_fallback",
            note: webData.note || ""
          },
          content: {
            full_text: webData.content,
            page_count: 1, // Web pages are considered single "page"
            pages: [{
              page: 1,
              text: webData.content
            }],
            character_count: webData.content.length,
            word_count: webData.content.split(/\s+/).length
          },
          ccp_analysis: analysis,
          extracted_at: new Date().toISOString()
        };
        
        results.push(result);
        
        console.log(`✅ Success: ${result.content.word_count} words extracted`);
        console.log(`   📋 Procedural requirements: ${analysis.procedural_requirements.length}`);
        console.log(`   ⏰ Timing requirements: ${analysis.deadlines_and_timing.length}`);
        console.log(`   🔗 Cross-references: ${analysis.cross_references.length}`);
        
      } catch (error) {
        console.error(`❌ Error processing ${jsonPath}: ${error.message}`);
        
        results.push({
          rule_info: ruleInfo,
          file_info: {
            file_path: jsonPath,
            file_name: path.basename(jsonPath),
            status: "error",
            error: error.message,
            content_type: "web_scraped"
          },
          extracted_at: new Date().toISOString()
        });
      }
    }
    
    return results;
  }

  analyzeWebScrapedContent(text, ruleInfo) {
    // Similar analysis to PDF content but adapted for web-scraped text
    const analysis = {
      section_number: ruleInfo.ruleNumber || "",
      section_title: ruleInfo.title || "",
      filing_relevance: ruleInfo.filingRelevance || {},
      procedural_requirements: [],
      filing_procedures: [],
      service_requirements: [],
      deadlines_and_timing: [],
      format_specifications: [],
      cross_references: [],
      key_provisions: []
    };
    
    if (!text || text.length < 50) {
      return analysis;
    }
    
    // Extract procedural requirements
    const procPatterns = [
      /shall\s+(?:be\s+)?(?:file[d]?|serve[d]?)\s+([^.]{10,100})/gi,
      /must\s+(?:be\s+)?(?:file[d]?|serve[d]?)\s+([^.]{10,100})/gi,
      /(?:filing|service)\s+(?:shall|must)\s+([^.]{10,100})/gi,
      /(?:document|paper|pleading)\s+(?:shall|must)\s+([^.]{10,100})/gi
    ];
    
    procPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => {
        if (match.length > 15) {
          analysis.procedural_requirements.push(match.substring(0, 200));
        }
      });
    });
    
    // Extract timing requirements
    const timingPatterns = [
      /within\s+(\d+)\s+(calendar\s+days?|court\s+days?|business\s+days?|days?)/gi,
      /(\d+)\s+(calendar\s+days?|court\s+days?|business\s+days?)\s+(?:before|after|from)/gi,
      /(?:no\s+later\s+than|not\s+later\s+than)\s+([^.]{5,50})/gi,
      /(?:deadline|due\s+date|time\s+limit)\s+(?:is|shall\s+be)\s+([^.]{5,50})/gi
    ];
    
    timingPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => {
        if (match.length > 3) {
          analysis.deadlines_and_timing.push(match.substring(0, 150));
        }
      });
    });
    
    // Extract cross-references
    const refPatterns = [
      /(?:Section|Rule|Code)\s+(\d+\.?\d*(?:\.\d+)?)/gi,
      /Code\s+of\s+Civil\s+Procedure\s+[Ss]ection\s+(\d+\.?\d*)/gi,
      /California\s+Rules\s+of\s+Court\s+[Rr]ule\s+(\d+\.?\d*)/gi,
    ];
    
    refPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => {
        const sectionMatch = match.match(/(\d+\.?\d*(?:\.\d+)?)/);
        if (sectionMatch && !analysis.cross_references.includes(sectionMatch[1])) {
          analysis.cross_references.push(sectionMatch[1]);
        }
      });
    });
    
    // Extract key provisions (paragraphs with filing-related content)
    const paragraphs = text.split(/\n\s*\n/);
    const filingTerms = ['filing', 'service', 'pleading', 'summons', 'complaint', 'procedure', 'deadline', 'format'];
    
    paragraphs.forEach(para => {
      para = para.trim();
      if (para.length > 50 && filingTerms.some(term => para.toLowerCase().includes(term))) {
        analysis.key_provisions.push(para.substring(0, 300));
        if (analysis.key_provisions.length >= 5) { // Limit to top 5
          return;
        }
      }
    });
    
    return analysis;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage example for the new PDF-first approach
async function main() {
  // Check for command line arguments to enable force refresh
  const args = process.argv.slice(2);
  const forceRefresh = args.includes('--force') || args.includes('-f') || args.includes('--refresh');
  
  if (forceRefresh) {
    console.log('🔄 Force refresh mode enabled via command line argument');
  }

  const scraper = new HierarchicalPDFScraper({
    downloadDir: './ccp_pdfs',
    outputDir: './ccp_results',
    delay: 2000,
    maxConcurrent: 2,
    forceRefresh: forceRefresh // Pass the force refresh flag
  });

  try {
    console.log('🚀 Starting CCP PDF-first scraping...');
    const results = await scraper.scrapeHierarchicalPDFs();
    
    console.log('\n🎉 CCP scraping completed successfully!');
    console.log(`📊 Total documents processed: ${results.extracted_documents?.length || 0}`);
    
    const successful = results.extracted_documents?.filter(d => d.file_info?.status === 'success') || [];
    console.log(`✅ Successful extractions: ${successful.length}`);
    
    // Auto-run knowledge graph generation after successful scraping
    if (successful.length > 0) {
      console.log('\n🧠 Starting knowledge graph generation...');
      console.log('='.repeat(60));
      
      try {
        // Import and run the knowledge graph script
        const { CCPKnowledgeGraph } = require('./ccp_knowledge_graph.js');
        
        const knowledgeGraph = new CCPKnowledgeGraph({
          inputFile: './ccp_results/ccp_filing_rules_extraction_results.json',
          outputDir: './ccp_knowledge_graph'
        });

        await knowledgeGraph.initialize();
        const analysis = await knowledgeGraph.generateKnowledgeGraph();
        
        console.log('\n🎉 Knowledge graph generation completed successfully!');
        console.log('\n📊 Knowledge Graph Stats:');
        console.log(`   • ${analysis.totalNodes} CCP sections analyzed`);
        console.log(`   • ${analysis.totalEdges} relationships discovered`);
        console.log(`   • ${Object.keys(analysis.categories).length} categories identified`);
        console.log(`   • Top connected section: CCP ${analysis.centralNodes[0]?.section} (${analysis.centralNodes[0]?.degree} connections)`);
        
        console.log('\n📁 Generated knowledge graph files:');
        console.log('   • ./ccp_knowledge_graph/ccp_knowledge_graph.html - Interactive visualization');
        console.log('   • ./ccp_knowledge_graph/ccp_knowledge_graph.graphml - For Gephi/yEd analysis');
        console.log('   • ./ccp_knowledge_graph/ccp_knowledge_graph_cytoscape.json - For web development');
        console.log('   • ./ccp_knowledge_graph/ccp_knowledge_graph_d3.json - For D3.js visualizations');
        console.log('   • ./ccp_knowledge_graph/analysis_report.md - Detailed analysis report');
        
        console.log('\n🌐 Open ./ccp_knowledge_graph/ccp_knowledge_graph.html in your browser to explore the interactive knowledge graph!');
        
      } catch (graphError) {
        console.error('❌ Knowledge graph generation failed:', graphError.message);
        console.log('⚠️  CCP scraping completed successfully, but knowledge graph generation failed.');
        console.log('💡 You can manually run the knowledge graph script later with: node ccp_knowledge_graph.js');
      }
    } else {
      console.log('\n⚠️  No successful extractions found. Skipping knowledge graph generation.');
    }
    
  } catch (error) {
    console.error('❌ CCP scraping failed:', error);
  }
}

// Export for use as module
module.exports = { HierarchicalPDFScraper };

// Run if executed directly
if (require.main === module) {
  main();
}