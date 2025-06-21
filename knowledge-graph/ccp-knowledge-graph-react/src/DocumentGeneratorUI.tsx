import React, { useState, useEffect } from 'react';

// Simple icon components as alternatives to heroicons
const DocumentTextIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ExclamationTriangleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

interface CaseParameters {
  state: string;
  county: string;
  division: string;
  department: string;
  judge: string;
  motionType: string;
  caseDetails: {
    movingParty: string;
    opposingParty: string;
    judge: string;
    department: string;
    hearingDate: string;
    hearingTime: string;
    courtAddress: string;
    caseNumber: string;
    claimDescription: string;
  };
}

interface DocumentPackage {
  caseParameters: CaseParameters;
  applicableSections: any[];
  documentRequirements: {
    mandatory: any[];
    conditional: any[];
    formatting: any[];
    procedural: any[];
  };
  customTemplates: any;
  deadlines: any[];
  procedureChecklist: any[];
  knowledgeGraphInsights: any;
}

const DocumentGeneratorUI: React.FC = () => {
  const [caseParams, setCaseParams] = useState<CaseParameters>({
    state: 'California',
    county: 'Santa Clara County',
    division: 'Complex Civil Litigation',
    department: 'Dept 7',
    judge: 'Charles F. Adams',
    motionType: 'Motion for Summary Judgment',
    caseDetails: {
      movingParty: '',
      opposingParty: '',
      judge: 'Hon. Charles F. Adams',
      department: '7',
      hearingDate: '',
      hearingTime: '9:00 AM',
      courtAddress: 'Superior Court of California, County of Santa Clara\n191 N. First Street\nSan Jose, CA 95113',
      caseNumber: '',
      claimDescription: ''
    }
  });

  const [documentPackage, setDocumentPackage] = useState<DocumentPackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('requirements');

  const counties = [
    'Santa Clara County',
    'Los Angeles County',
    'San Francisco County',
    'Orange County',
    'Alameda County'
  ];

  const divisions = [
    'Complex Civil Litigation',
    'General Civil',
    'Probate',
    'Family Law',
    'Criminal'
  ];

  const motionTypes = [
    'Motion for Summary Judgment',
    'Motion to Strike',
    'Motion to Compel',
    'Demurrer',
    'Motion for Summary Adjudication'
  ];

  const judges = [
    'Charles F. Adams',
    'Hon. Patricia Lucas',
    'Hon. Michael Martinez',
    'Hon. Sarah Chen',
    'Hon. Robert Johnson'
  ];

  const generateDocuments = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would call your Node.js API
      // For now, we'll simulate the response
      setTimeout(() => {
        const mockResponse: DocumentPackage = {
          caseParameters: caseParams,
          applicableSections: [
            {
              section: "437c",
              title: "Motion for Summary Judgment",
              category: "Civil Procedure",
              filingRelevance: 10,
              wordCount: 4500,
              crossReferences: 12
            }
          ],
          documentRequirements: {
            mandatory: [
              {
                document: "Notice of Motion and Motion",
                rule: "[CCP § 437c(a), CRC Rule 3.1350(b)]",
                link: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=437c",
                critical: false
              },
              {
                document: "Separate Statement of Undisputed Material Facts",
                rule: "MANDATORY [CCP § 437c(b)(1), CRC Rule 3.1350(d)]",
                link: "https://www.courts.ca.gov/cms/rules/index.cfm?title=three&linkid=rule3_1350",
                critical: true
              }
            ],
            conditional: [],
            formatting: [],
            procedural: [
              {
                requirement: "81-Day Notice Period",
                description: "Motion must be served at least 81 days before hearing",
                statute: "CCP § 437c(a)(2)",
                critical: true
              }
            ]
          },
          customTemplates: {},
          deadlines: [
            {
              task: "Serve Motion and Supporting Papers",
              deadline: calculateDeadline(caseParams.caseDetails.hearingDate, 81),
              daysFromHearing: 81,
              critical: true,
              statute: "CCP § 437c(a)(2)"
            }
          ],
          procedureChecklist: [],
          knowledgeGraphInsights: {}
        };
        
        setDocumentPackage(mockResponse);
        setLoading(false);
      }, 2000);
    } catch (error) {
      console.error('Error generating documents:', error);
      setLoading(false);
    }
  };

  const calculateDeadline = (hearingDate: string, daysBack: number): string => {
    if (!hearingDate) return 'TBD';
    const hearing = new Date(hearingDate);
    const deadline = new Date(hearing);
    deadline.setDate(deadline.getDate() - daysBack);
    return deadline.toLocaleDateString();
  };

  const updateCaseDetails = (field: string, value: string) => {
    setCaseParams(prev => ({
      ...prev,
      caseDetails: {
        ...prev.caseDetails,
        [field]: value
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white flex items-center">
              <DocumentTextIcon className="w-8 h-8 mr-3" />
              Legal Document Generator
            </h1>
            <p className="text-blue-100 mt-1">
              AI-Powered Document Generation Using California Code of Civil Procedure Knowledge Graph
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Input Form */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Case Parameters</h2>
                
                {/* Jurisdiction Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      County
                    </label>
                    <select
                      value={caseParams.county}
                      onChange={(e) => setCaseParams(prev => ({ ...prev, county: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {counties.map(county => (
                        <option key={county} value={county}>{county}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Division
                    </label>
                    <select
                      value={caseParams.division}
                      onChange={(e) => setCaseParams(prev => ({ ...prev, division: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {divisions.map(division => (
                        <option key={division} value={division}>{division}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Judge and Motion Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Judge
                    </label>
                    <select
                      value={caseParams.judge}
                      onChange={(e) => setCaseParams(prev => ({ ...prev, judge: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {judges.map(judge => (
                        <option key={judge} value={judge}>{judge}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motion Type
                    </label>
                    <select
                      value={caseParams.motionType}
                      onChange={(e) => setCaseParams(prev => ({ ...prev, motionType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {motionTypes.map(motion => (
                        <option key={motion} value={motion}>{motion}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Case Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Case Details</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Moving Party
                      </label>
                      <input
                        type="text"
                        value={caseParams.caseDetails.movingParty}
                        onChange={(e) => updateCaseDetails('movingParty', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., PLAINTIFF ACME CORP"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Opposing Party
                      </label>
                      <input
                        type="text"
                        value={caseParams.caseDetails.opposingParty}
                        onChange={(e) => updateCaseDetails('opposingParty', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., DEFENDANT JOHN DOE"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Case Number
                      </label>
                      <input
                        type="text"
                        value={caseParams.caseDetails.caseNumber}
                        onChange={(e) => updateCaseDetails('caseNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 23CV123456"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hearing Date
                      </label>
                      <input
                        type="date"
                        value={caseParams.caseDetails.hearingDate}
                        onChange={(e) => updateCaseDetails('hearingDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Claim Description
                    </label>
                    <input
                      type="text"
                      value={caseParams.caseDetails.claimDescription}
                      onChange={(e) => updateCaseDetails('claimDescription', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., breach of contract claim"
                    />
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={generateDocuments}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-6 rounded-md transition duration-200 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Generating Documents...
                    </>
                  ) : (
                    <>
                      <DocumentTextIcon className="w-5 h-5 mr-2" />
                      Generate Document Package
                    </>
                  )}
                </button>
              </div>

              {/* Results Panel */}
              <div className="space-y-6">
                {documentPackage && (
                  <>
                    <h2 className="text-xl font-semibold text-gray-900">Generated Document Package</h2>
                    
                    {/* Tab Navigation */}
                    <div className="border-b border-gray-200">
                      <nav className="-mb-px flex space-x-8">
                        {[
                          { id: 'requirements', name: 'Requirements', icon: ExclamationTriangleIcon },
                          { id: 'deadlines', name: 'Deadlines', icon: CalendarIcon },
                          { id: 'templates', name: 'Templates', icon: DocumentTextIcon }
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                              activeTab === tab.id
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            <tab.icon className="w-4 h-4 mr-2" />
                            {tab.name}
                          </button>
                        ))}
                      </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      {activeTab === 'requirements' && (
                        <div className="space-y-4">
                          <h3 className="font-semibold text-gray-900">Mandatory Documents</h3>
                          {documentPackage.documentRequirements.mandatory.map((req, index) => (
                            <div key={index} className="bg-white p-3 rounded border-l-4 border-red-400">
                              <div className="flex items-center">
                                {req.critical && <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />}
                                <span className="font-medium">{req.document}</span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{req.rule}</p>
                              {req.link && (
                                <a href={req.link} target="_blank" rel="noopener noreferrer" 
                                   className="text-blue-600 hover:underline text-sm">
                                  View Statute →
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {activeTab === 'deadlines' && (
                        <div className="space-y-4">
                          <h3 className="font-semibold text-gray-900">Critical Deadlines</h3>
                          {documentPackage.deadlines.map((deadline, index) => (
                            <div key={index} className={`bg-white p-3 rounded border-l-4 ${
                              deadline.critical ? 'border-red-400' : 'border-yellow-400'
                            }`}>
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{deadline.task}</span>
                                <span className={`px-2 py-1 rounded text-sm ${
                                  deadline.critical ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {deadline.deadline}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {deadline.daysFromHearing} days before hearing • {deadline.statute}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {activeTab === 'templates' && (
                        <div className="space-y-4">
                          <h3 className="font-semibold text-gray-900">Document Templates</h3>
                          <div className="text-sm text-gray-600">
                            Templates are generated based on case parameters and judge preferences.
                            Download the complete package to access all templates.
                          </div>
                          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm">
                            Download Complete Package
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {!documentPackage && !loading && (
                  <div className="text-center py-12 text-gray-500">
                    <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>Enter case parameters and click "Generate Document Package" to begin.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentGeneratorUI; 