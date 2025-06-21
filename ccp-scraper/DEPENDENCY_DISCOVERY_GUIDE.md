# 🔬 Dependency Discovery Engine Guide

## Overview

The **Dependency Discovery Engine** is a future-proof enhancement to the CCP scraper that automatically discovers filing-related rules through relationship analysis and pattern matching. It combines expert-curated critical sections with AI-powered discovery for comprehensive coverage.

## 🎯 Problem Solved

### **Before: Manual Critical Sections Only**
- ❌ Requires manual updates when new rules become important
- ❌ Misses emerging filing procedures
- ❌ Static list that doesn't adapt to changing legal landscape
- ❌ Expert dependency for maintenance

### **After: Hybrid Approach (Manual + Auto-Discovery)**
- ✅ **Expert foundation** with auto-discovery expansion
- ✅ **Adaptive learning** that catches new filing procedures
- ✅ **Self-improving** system that becomes smarter over time
- ✅ **Future-proof** architecture ready for new CCP rules

## 🔧 How It Works

### **Phase 1: Direct Relationship Discovery**
Analyzes cross-references and dependencies to find rules that directly relate to critical sections.

```javascript
// Example: Discovers CCP 659a because it's referenced by CCP 659 (critical section)
{
  ruleNumber: '659a',
  confidence: 0.85,
  discoveryMethod: 'direct_relationship',
  reasons: ['References 2 critical sections: 659, 12a']
}
```

### **Phase 2: Content Pattern Analysis**
Uses AI pattern matching to find rules that answer the 6 filing questions (WHEN/HOW/WHERE/WHAT/WHO/FORMAT).

```javascript
// Example: Discovers filing-related rule through content analysis
{
  ruleNumber: '1010.5',
  confidence: 0.78,
  discoveryMethod: 'content_pattern',
  reasons: ['Answers HOW question (score: 0.45)', 'Contains 4 filing-related terms']
}
```

### **Phase 3: Procedural Sequence Analysis**
Identifies rules that are part of known procedural sequences with critical sections.

```javascript
// Example: Discovers rule in motion practice sequence
{
  ruleNumber: '430.41',
  confidence: 0.80,
  discoveryMethod: 'procedural_sequence',
  reasons: ['Part of Motion Practice Sequence', 'Sequence has 3 critical sections']
}
```

### **Phase 4: Cross-Reference Network Analysis**
Analyzes the network of cross-references to find highly connected rules.

```javascript
// Example: Discovers rule through network centrality
{
  ruleNumber: '473',
  confidence: 0.82,
  discoveryMethod: 'network_analysis',
  reasons: ['Referenced by 3 critical sections', 'High network centrality (12 connections)']
}
```

## 🚀 Usage Examples

### **Basic Usage**
```javascript
const scraper = new HierarchicalPDFScraper({
  enableDependencyDiscovery: true,  // Enable auto-discovery
  discoveryConfidenceThreshold: 0.75,  // Minimum confidence for inclusion
  maxDiscoveryDepth: 3  // Maximum analysis depth
});

// Get hybrid critical sections (manual + discovered)
const extractedData = await loadExtractionResults();
const hybridSections = await scraper.getHybridCriticalSections(extractedData);

console.log(`Total sections: ${hybridSections.length}`);
console.log(`Discovered: ${hybridSections.filter(s => s.source.startsWith('auto_discovered_')).length}`);
```

### **Testing the Discovery System**
```bash
# Run the dependency discovery test
node test_dependency_discovery.js
```

### **Confidence Threshold Tuning**
```javascript
// Conservative (fewer discoveries, higher confidence)
const conservativeScraper = new HierarchicalPDFScraper({
  discoveryConfidenceThreshold: 0.85
});

// Aggressive (more discoveries, lower confidence)
const aggressiveScraper = new HierarchicalPDFScraper({
  discoveryConfidenceThreshold: 0.65
});
```

## 📊 Discovery Metrics

### **Confidence Scoring**
Each discovered rule gets a confidence score (0.0 - 1.0):

- **0.85-1.0**: High confidence (auto-include in critical sections)
- **0.75-0.84**: Medium confidence (review recommended)
- **0.65-0.74**: Low confidence (investigation needed)
- **<0.65**: Very low confidence (likely false positive)

### **Discovery Methods**
- **direct_relationship**: Found through direct cross-references
- **content_pattern**: Found through filing question pattern matching
- **procedural_sequence**: Found as part of known procedural sequences
- **network_analysis**: Found through cross-reference network analysis

## 🔍 Example Discovery Results

```
🎯 DEPENDENCY DISCOVERY RESULTS:
============================================================

1. CCP 659a - New Trial Motion Requirements (format/content)
   Confidence: 87.5%
   Method: direct_relationship
   Filing Questions: WHAT, FORMAT
   Reasons: Referenced by critical section 659; Contains new trial format requirements

2. CCP 473 - Relief from Default/Dismissal
   Confidence: 82.3%
   Method: network_analysis
   Filing Questions: HOW, WHEN
   Reasons: Referenced by 3 critical sections; High network centrality (15 connections)

3. CCP 1010.5 - Overnight Delivery Service
   Confidence: 78.1%
   Method: content_pattern
   Filing Questions: HOW
   Reasons: Answers HOW question (score: 0.45); Part of Service and Filing Sequence
```

## 📈 Filing Question Coverage Analysis

The system analyzes how discovery improves coverage of the 6 filing questions:

```
Filing Question | Manual | Discovered | Total | Improvement
------------------------------------------------------------
WHEN           |     12 |          3 |    15 |          +3
HOW            |     15 |          5 |    20 |          +5
WHERE          |      6 |          1 |     7 |          +1
WHAT           |     11 |          2 |    13 |          +2
WHO            |      4 |          0 |     4 |           -
FORMAT         |      2 |          1 |     3 |          +1
------------------------------------------------------------
TOTAL          |     50 |         12 |    62 |         +12

🎯 Discovery improved coverage by 24.0%
```

## ⚙️ Configuration Options

### **HierarchicalPDFScraper Options**
```javascript
{
  enableDependencyDiscovery: true,        // Enable/disable discovery
  discoveryConfidenceThreshold: 0.75,     // Minimum confidence for inclusion
  maxDiscoveryDepth: 3                    // Maximum analysis depth
}
```

### **DependencyDiscoveryEngine Options**
```javascript
{
  confidenceThreshold: 0.75,              // Minimum confidence threshold
  maxDiscoveryDepth: 3,                   // Maximum discovery depth
  relationshipWeights: {                  // Custom relationship weights
    'cross_reference': 0.3,
    'procedural_dependency': 0.8,
    'timing_relationship': 0.7,
    // ... more weights
  }
}
```

## 🛠️ Advanced Features

### **Custom Pattern Definitions**
Add your own filing question patterns:

```javascript
const customPatterns = {
  'CUSTOM_QUESTION': [
    /(?:custom|pattern|regex)/gi,
    /(?:another|pattern)/gi
  ]
};

// Extend the discovery engine with custom patterns
discoveryEngine.filingQuestionPatterns.CUSTOM_QUESTION = customPatterns.CUSTOM_QUESTION;
```

### **Procedural Sequence Definitions**
Define custom procedural sequences:

```javascript
const customSequences = [
  {
    name: 'Custom Filing Sequence',
    pattern: [100, 101, 102, 103],  // CCP sections in sequence
    weight: 0.8                     // Confidence weight
  }
];
```

### **Integration with Knowledge Graph**
The discovery system is designed to integrate with the knowledge graph for enhanced relationship analysis:

```javascript
// Future enhancement: Knowledge graph integration
const knowledgeGraph = new CCPKnowledgeGraph();
await knowledgeGraph.generateKnowledgeGraph();

discoveryEngine.knowledgeGraph = knowledgeGraph;
// Now discovery can use graph centrality metrics
```

## 🎯 Best Practices

### **1. Start Conservative**
Begin with high confidence thresholds (0.85+) and gradually lower as you validate results.

### **2. Review Discovered Rules**
Always review auto-discovered rules before adding them to production critical sections.

### **3. Monitor Performance**
Track discovery metrics over time to identify patterns and optimize thresholds.

### **4. Validate Against Legal Expertise**
Have legal experts review high-confidence discoveries before permanent inclusion.

### **5. Regular Updates**
Re-run discovery analysis after major CCP updates or when new rules are added.

## 🔮 Future Enhancements

### **Planned Features**
- **Knowledge Graph Integration**: Enhanced relationship analysis using graph metrics
- **Machine Learning**: Train models on validated discoveries to improve accuracy
- **Temporal Analysis**: Track how rule relationships change over time
- **Cross-Code Discovery**: Expand to discover relationships with CRC, Evidence Code, etc.
- **Expert Feedback Loop**: Allow legal experts to rate discoveries to improve the system

### **Integration Roadmap**
1. **Phase 1**: Current implementation (relationship + pattern analysis)
2. **Phase 2**: Knowledge graph integration for enhanced discovery
3. **Phase 3**: Machine learning models trained on expert feedback
4. **Phase 4**: Cross-code discovery (CRC, Evidence, Federal Rules)
5. **Phase 5**: Real-time discovery as new rules are published

## 🤖 Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Hybrid Critical Sections                │
├─────────────────────────────────────────────────────────────┤
│  Manual Critical Sections     │    Auto-Discovered Rules    │
│  (Expert Curated)            │    (AI Discovered)          │
│  ✅ High Precision            │    ✅ High Recall          │
│  ✅ Legal Expertise          │    ✅ Pattern Recognition   │
│  ❌ Manual Maintenance       │    ❌ Requires Validation   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Dependency Discovery Engine                   │
├─────────────────────────────────────────────────────────────┤
│  Phase 1: Direct Relationships                             │
│  Phase 2: Content Pattern Analysis                         │
│  Phase 3: Procedural Sequence Analysis                     │
│  Phase 4: Cross-Reference Network Analysis                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Confidence Scoring & Validation               │
├─────────────────────────────────────────────────────────────┤
│  • Multi-factor confidence calculation                     │
│  • Filing question categorization                          │
│  • Relationship strength analysis                          │
│  • False positive filtering                                │
└─────────────────────────────────────────────────────────────┘
```

## 📝 Summary

The Dependency Discovery Engine provides a **future-proof solution** that combines the best of manual curation and automated discovery:

- 🎯 **Maintains expert precision** with manual critical sections
- 🤖 **Adds AI-powered discovery** for comprehensive coverage  
- 📈 **Improves over time** as more data becomes available
- 🔮 **Ready for future** CCP rule additions and changes

This hybrid approach ensures that the scraper remains comprehensive and up-to-date without requiring constant manual maintenance. 